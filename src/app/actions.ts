'use server';

import { z } from 'zod';
import { format } from 'date-fns';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import { User, Setting } from '@/lib/models';
import type { FilterFormValues, SmsRecord, UserProfile, ProxySettings } from '@/lib/types';
import { extractInfo } from '@/ai/flows/extract-info-from-sms';
import { redirect } from 'next/navigation';
import { HttpsProxyAgent } from 'https-proxy-agent';

const filterSchema = z.object({
  startDate: z.date(),
  endDate: z.date(),
  senderId: z.string().optional(),
  phone: z.string().optional(),
});

async function getApiKey(): Promise<string> {
  await connectDB();
  const apiKeySetting = await Setting.findOne({ key: 'apiKey' });
  return apiKeySetting?.value ?? '';
}

async function getProxyAgent(): Promise<HttpsProxyAgent<string> | undefined> {
    await connectDB();
    const proxySetting = await Setting.findOne({ key: 'proxySettings' });
    if (!proxySetting || !proxySetting.value || !proxySetting.value.ip || !proxySetting.value.port) {
        return undefined;
    }
    const proxy = proxySetting.value as ProxySettings;
    const auth = proxy.username && proxy.password ? `${proxy.username}:${proxy.password}@` : '';
    const proxyUrl = `http://${auth}${proxy.ip}:${proxy.port}`;
    return new HttpsProxyAgent(proxyUrl);
}

async function getErrorMappings(): Promise<Record<string, string>> {
    try {
        await connectDB();
        const mappingsSetting = await Setting.findOne({ key: 'errorMappings' });
        if (!mappingsSetting || !Array.isArray(mappingsSetting.value)) {
            return {};
        }
        return mappingsSetting.value.reduce((acc, mapping) => {
            if (mapping.reasonCode && mapping.customMessage) {
                acc[mapping.reasonCode] = mapping.customMessage;
            }
            return acc;
        }, {});
    } catch (error) {
        console.error('Error fetching error mappings:', error);
        return {};
    }
}


export async function fetchSmsData(
  filter: FilterFormValues
): Promise<{ data?: SmsRecord[]; error?: string }> {
  const apiKey = await getApiKey();

  if (!apiKey) {
    return { error: 'API key is not configured. Please set it in the admin panel.' };
  }
  
  const validation = filterSchema.safeParse(filter);
  if (!validation.success) {
    return { error: 'Invalid filter data.' };
  }
  
  const agent = await getProxyAgent();

  const API_URL = 'https://api.premiumy.net/v1.0/csv';
  const body = {
    id: null,
    jsonrpc: '2.0',
    method: 'sms.mdr_full:get_list',
    params: {
      filter: {
        start_date: format(filter.startDate!, 'yyyy-MM-dd HH:mm:ss'),
        end_date: format(filter.endDate!, 'yyyy-MM-dd HH:mm:ss'),
        senderid: filter.senderId,
        phone: filter.phone,
      },
      page: 1,
      per_page: 100,
    },
  };

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Api-Key': apiKey,
      },
      body: JSON.stringify(body),
      agent,
    });

    if (!response.ok) {
       const errorText = await response.text();
        try {
            const jsonError = JSON.parse(errorText);
            if (jsonError.error) {
                const reasonCode = jsonError.error.reason_code;
                if (reasonCode) {
                    const errorMap = await getErrorMappings();
                    const customMessage = errorMap[reasonCode];
                    if (customMessage) {
                        return { error: customMessage };
                    }
                }
                return { error: `API Error: ${jsonError.error.message}` };
            }
        } catch (e) {
        }
      return { error: `API Error: ${response.status} ${response.statusText}. ${errorText}` };
    }

    const csvText = await response.text();
    if (!csvText || csvText.trim() === '') {
        return { data: [] };
    }
    
    if (csvText.trim().startsWith('{')) {
        try {
            const jsonError = JSON.parse(csvText);
            if (jsonError.error) {
                const reasonCode = jsonError.error.reason_code;
                 if (reasonCode) {
                    const errorMap = await getErrorMappings();
                    const customMessage = errorMap[reasonCode];
                    if (customMessage) {
                        return { error: customMessage };
                    }
                }
                return { error: `API returned an error: ${jsonError.error.message}` };
            }
        } catch (e) {
        }
    }

    const lines = csvText.trim().split(/\r?\n/);
    if (lines.length < 2) {
      return { data: [] };
    }

    const headers = lines[0].split(';').map(h => h.trim().toLowerCase());
    const records: SmsRecord[] = [];

    const columnMap: { [key in keyof SmsRecord]?: number } = {
        dateTime: headers.indexOf('datetime'),
        senderId: headers.indexOf('senderid'),
        phone: headers.indexOf('b-number'),
        mccMnc: headers.indexOf('mcc/mnc'),
        destination: headers.indexOf('destination'),
        range: headers.indexOf('range'),
        rate: headers.indexOf('rate'),
        currency: headers.indexOf('currency'),
        message: headers.indexOf('message'),
    };
    
    if (columnMap.dateTime === -1 || columnMap.message === -1) {
        return { error: "CSV response is missing required columns ('datetime', 'message')." };
    }

    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(';');
        if (values.length >= headers.length) {
            let message = values[columnMap.message!];
            if (message && message.startsWith('"') && message.endsWith('"')) {
              message = message.substring(1, message.length - 1);
            }
            records.push({
                dateTime: values[columnMap.dateTime!],
                senderId: values[columnMap.senderId!],
                phone: values[columnMap.phone!],
                mccMnc: values[columnMap.mccMnc!],
                destination: values[columnMap.destination!],
                range: values[columnMap.range!],
                rate: values[columnMap.rate!],
                currency: values[columnMap.currency!],
                message: message,
            });
        }
    }
    
    return { data: records };
  } catch (err) {
    const error = err as Error;
    console.error('Failed to fetch SMS data:', error);
    return { error: error.message || 'An unknown error occurred.' };
  }
}

export async function analyzeMessage(message: string) {
  try {
    const result = await extractInfo({ message });
    return { data: result };
  } catch (err) {
    const error = err as Error;
    console.error('Failed to analyze message:', error);
    return { error: error.message || 'An unknown error occurred during analysis.' };
  }
}

// --- Auth Actions ---

export async function getSignupStatus() {
    try {
        await connectDB();
        const signupSetting = await Setting.findOne({ key: 'signupEnabled' });
        return { signupEnabled: signupSetting?.value ?? true };
    } catch (error) {
        return { signupEnabled: true };
    }
}

const signupSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
});

export async function signup(values: z.infer<typeof signupSchema>) {
    try {
        await connectDB();
        
        const { signupEnabled } = await getSignupStatus();
        if (!signupEnabled) {
            return { error: 'User registration is currently disabled by the administrator.' };
        }

        const existingUser = await User.findOne({ email: values.email });
        if (existingUser) {
            return { error: 'User with this email already exists.' };
        }
        
        const hashedPassword = await bcrypt.hash(values.password, 10);

        await User.create({
            name: values.name,
            email: values.email,
            password: hashedPassword,
            status: 'active',
            isAdmin: false,
        });

        return { success: true };
    } catch (error) {
        console.error("Signup error:", error);
        return { error: 'An unexpected error occurred.' };
    }
}


const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function login(values: z.infer<typeof loginSchema>) {
  try {
    await connectDB();
    const user = await User.findOne({ email: values.email });

    if (!user || !user.password) {
      return { error: 'Invalid email or password.' };
    }

    const isPasswordValid = await bcrypt.compare(values.password, user.password);
    if (!isPasswordValid) {
      return { error: 'Invalid email or password.' };
    }

    const token = jwt.sign(
      { userId: user._id, isAdmin: user.isAdmin, status: user.status },
      process.env.JWT_SECRET!,
      { expiresIn: '1d' }
    );
    
    cookies().set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24, // 1 day
      path: '/',
    });

    return { success: true };
  } catch (error) {
    console.error("Login error:", error);
    return { error: 'An unexpected error occurred.' };
  }
}

export async function logout() {
    cookies().delete('token');
    cookies().delete('admin_session');
}

export async function getCurrentUser(): Promise<UserProfile | null> {
    const token = cookies().get('token')?.value;
    if (!token) return null;

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
        await connectDB();
        const user = await User.findById(decoded.userId).select('-password');
        if (!user) return null;

        return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            photoURL: user.photoURL,
            status: user.status,
            isAdmin: user.isAdmin,
            canAddNumbers: user.canAddNumbers,
        };
    } catch (error) {
        return null;
    }
}


// --- User Profile Actions ---
const userProfileSchema = z.object({
    name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
    email: z.string().email({ message: 'Please enter a valid email address.' }),
});

export async function updateUserProfile(userId: string, values: z.infer<typeof userProfileSchema>) {
    try {
        const validation = userProfileSchema.safeParse(values);
        if (!validation.success) {
            return { error: 'Invalid data provided.' };
        }

        await connectDB();
        const user = await User.findById(userId);
        if (!user) {
            return { error: 'User not found.' };
        }

        const emailChangeEnabledSetting = await Setting.findOne({ key: 'emailChangeEnabled' });
        const emailChangeEnabled = emailChangeEnabledSetting?.value ?? true;

        if (user.email !== values.email && !emailChangeEnabled) {
            return { error: 'Email address cannot be changed at this time.' };
        }
        
        if (user.email !== values.email) {
            const existingUserWithEmail = await User.findOne({ email: values.email, _id: { $ne: userId } });
            if (existingUserWithEmail) {
                return { error: 'This email is already in use by another account.' };
            }
        }

        const updatedUser = await User.findByIdAndUpdate(userId, { name: values.name, email: values.email }, { new: true });
        
        if (!updatedUser) {
            return { error: 'User not found.' };
        }

        // Re-issue a new token with updated information
        const token = jwt.sign(
          { userId: updatedUser._id, isAdmin: updatedUser.isAdmin, status: updatedUser.status },
          process.env.JWT_SECRET!,
          { expiresIn: '1d' }
        );

        cookies().set('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 60 * 60 * 24, // 1 day
            path: '/',
        });

        return { success: true };
    } catch (error) {
        console.error('Update profile error:', error);
        return { error: 'An unexpected error occurred while updating your profile.' };
    }
}


// --- Public Site Settings ---
export async function getPublicSettings() {
    try {
        await connectDB();
        const siteNameSetting = await Setting.findOne({ key: 'siteName' });
        const primaryColorSetting = await Setting.findOne({ key: 'primaryColor' });
        const emailChangeEnabledSetting = await Setting.findOne({ key: 'emailChangeEnabled' });
        const signupEnabledSetting = await Setting.findOne({ key: 'signupEnabled' });
        
        return {
            siteName: siteNameSetting?.value ?? 'SMS Inspector 2.0',
            primaryColor: primaryColorSetting?.value ?? '217.2 91.2% 59.8%',
            emailChangeEnabled: emailChangeEnabledSetting?.value ?? true,
            signupEnabled: signupEnabledSetting?.value ?? true,
        }
    } catch (error) {
        return { 
            siteName: 'SMS Inspector 2.0',
            primaryColor: '217.2 91.2% 59.8%',
            emailChangeEnabled: true,
            signupEnabled: true,
        };
    }
}


// --- Admin Actions ---
async function testProxy(proxy: ProxySettings): Promise<boolean> {
  if (!proxy.ip || !proxy.port) {
    return true; // No proxy to test, so we can save this "empty" configuration.
  }
  try {
    const auth = proxy.username && proxy.password ? `${proxy.username}:${proxy.password}@` : '';
    const proxyUrl = `http://${auth}${proxy.ip}:${proxy.port}`;
    const agent = new HttpsProxyAgent(proxyUrl);
    
    const response = await fetch('https://httpbin.org/get', { 
        agent, 
        signal: AbortSignal.timeout(10000) // 10 second timeout
    });
    
    return response.ok;
  } catch (error) {
    console.error('Proxy test failed:', error);
    return false;
  }
}

export async function getAdminSettings() {
    try {
        await connectDB();
        const apiKeySetting = await Setting.findOne({ key: 'apiKey' });
        const proxySettingsSetting = await Setting.findOne({ key: 'proxySettings' });
        const signupSetting = await Setting.findOne({ key: 'signupEnabled' });
        const siteNameSetting = await Setting.findOne({ key: 'siteName' });
        const primaryColorSetting = await Setting.findOne({ key: 'primaryColor' });
        const emailChangeEnabledSetting = await Setting.findOne({ key: 'emailChangeEnabled' });
        const numberListSetting = await Setting.findOne({ key: 'numberList' });
        const errorMappingsSetting = await Setting.findOne({ key: 'errorMappings' });

        const rawProxy = proxySettingsSetting ? proxySettingsSetting.value : {};
        // Ensure proxySettings is always a valid object, even if DB data is malformed
        const safeProxySettings = (typeof rawProxy === 'object' && rawProxy !== null && !Array.isArray(rawProxy))
            ? rawProxy
            : {};
        
        return {
            apiKey: apiKeySetting ? apiKeySetting.value : '',
            proxySettings: {
                ip: safeProxySettings.ip || '',
                port: safeProxySettings.port || '',
                username: safeProxySettings.username || '',
                password: safeProxySettings.password || '',
            },
            signupEnabled: signupSetting?.value ?? true,
            siteName: siteNameSetting?.value ?? 'SMS Inspector 2.0',
            primaryColor: primaryColorSetting?.value ?? '217.2 91.2% 59.8%',
            emailChangeEnabled: emailChangeEnabledSetting?.value ?? true,
            numberList: numberListSetting ? numberListSetting.value : [],
            errorMappings: errorMappingsSetting ? errorMappingsSetting.value : [],
        }
    } catch (error) {
        return { error: (error as Error).message };
    }
}

export async function updateAdminSettings(settings: { 
    apiKey?: string; 
    proxySettings?: ProxySettings; 
    signupEnabled?: boolean;
    siteName?: string;
    primaryColor?: string;
    emailChangeEnabled?: boolean;
    numberList?: string[];
    errorMappings?: { reasonCode: string, customMessage: string }[];
}) {
    try {
        await connectDB();
        const operations = [];

        if (settings.apiKey !== undefined) {
             operations.push(Setting.findOneAndUpdate(
                { key: 'apiKey' },
                { value: settings.apiKey },
                { upsert: true, new: true }
            ));
        }
        if (settings.proxySettings !== undefined) {
            const isProxyValid = await testProxy(settings.proxySettings);
            if (!isProxyValid) {
                return { error: 'Proxy test failed. Please check the details and ensure the proxy is active.' };
            }
            operations.push(Setting.findOneAndUpdate(
                { key: 'proxySettings' },
                { value: settings.proxySettings },
                { upsert: true, new: true }
            ));
        }
        if (settings.signupEnabled !== undefined) {
            operations.push(Setting.findOneAndUpdate(
                { key: 'signupEnabled' },
                { value: settings.signupEnabled },
                { upsert: true, new: true }
            ));
        }
        if (settings.siteName !== undefined) {
            operations.push(Setting.findOneAndUpdate(
                { key: 'siteName' },
                { value: settings.siteName },
                { upsert: true, new: true }
            ));
        }
        if (settings.primaryColor !== undefined) {
            operations.push(Setting.findOneAndUpdate(
                { key: 'primaryColor' },
                { value: settings.primaryColor },
                { upsert: true, new: true }
            ));
        }
        if (settings.emailChangeEnabled !== undefined) {
            operations.push(Setting.findOneAndUpdate(
                { key: 'emailChangeEnabled' },
                { value: settings.emailChangeEnabled },
                { upsert: true, new: true }
            ));
        }
        if (settings.numberList !== undefined) {
            operations.push(Setting.findOneAndUpdate(
                { key: 'numberList' },
                { value: settings.numberList },
                { upsert: true, new: true }
            ));
        }
         if (settings.errorMappings !== undefined) {
            operations.push(Setting.findOneAndUpdate(
                { key: 'errorMappings' },
                { value: settings.errorMappings },
                { upsert: true, new: true }
            ));
        }

        await Promise.all(operations);
        return { success: true };
    } catch (error) {
        return { error: (error as Error).message };
    }
}

export async function getAllUsers(): Promise<{ users?: UserProfile[], error?: string }> {
    try {
        await connectDB();
        const users = await User.find({}).select('-password');
        const formattedUsers: UserProfile[] = users.map(user => ({
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            photoURL: user.photoURL,
            status: user.status,
            isAdmin: user.isAdmin,
            canAddNumbers: user.canAddNumbers,
        }));
        return { users: formattedUsers };
    } catch (error) {
        return { error: (error as Error).message };
    }
}


export async function toggleUserStatus(id: string, status: 'active' | 'blocked') {
    try {
        await connectDB();
        await User.findByIdAndUpdate(id, { status });
        return { success: true };
    } catch (error) {
        return { error: (error as Error).message };
    }
}

export async function toggleUserAddNumberPermission(id: string, canAddNumbers: boolean) {
    try {
        await connectDB();
        const updatedUser = await User.findByIdAndUpdate(id, { canAddNumbers: canAddNumbers }, { new: true });
        if (!updatedUser) {
            return { error: 'User not found.' };
        }
        return { success: true };
    } catch (error) {
        return { error: (error as Error).message };
    }
}

// --- Admin Auth Actions ---

const adminLoginSchema = z.object({
  username: z.string(),
  password: z.string(),
});

export async function adminLogin(values: z.infer<typeof adminLoginSchema>) {
  if (values.username === 'admin' && values.password === 'admin') {
    cookies().set('admin_session', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60, // 1 hour
      path: '/',
    });
    return { success: true };
  }
  return { error: 'Invalid admin credentials.' };
}

export async function adminLogout() {
  cookies().delete('admin_session');
  cookies().delete('token');
  redirect('/admin/login');
}

export async function getNumberList(): Promise<string[]> {
    try {
        await connectDB();
        const numberListSetting = await Setting.findOne({ key: 'numberList' });
        return numberListSetting?.value ?? [];
    } catch (error) {
        console.error('Error fetching number list:', error);
        return [];
    }
}
    
export async function addNumbersToList(numbers: string): Promise<{ success?: boolean; error?: string; newList?: string[]; addedCount?: number }> {
    try {
        const user = await getCurrentUser();
        if (!user?.canAddNumbers) {
            return { error: 'You do not have permission to add numbers.' };
        }

        await connectDB();
        
        const numbersToAdd = numbers
            .split('\n')
            .map(n => n.trim())
            .filter(n => n); // Filter out empty strings

        if (numbersToAdd.length === 0) {
            return { error: 'Please provide at least one number.' };
        }

        const numberListSetting = await Setting.findOne({ key: 'numberList' });
        const currentList: string[] = numberListSetting?.value ?? [];
        const currentListSet = new Set(currentList);

        const uniqueNewNumbers = [...new Set(numbersToAdd)].filter(num => !currentListSet.has(num));

        if (uniqueNewNumbers.length === 0) {
            return { error: 'All provided numbers are already in the list.' };
        }

        const newList = [...currentList, ...uniqueNewNumbers];

        await Setting.findOneAndUpdate(
            { key: 'numberList' },
            { value: newList },
            { upsert: true, new: true }
        );

        return { success: true, newList, addedCount: uniqueNewNumbers.length };
    } catch (error) {
        return { error: (error as Error).message };
    }
}
