'use server';

import { z } from 'zod';
import { formatISO } from 'date-fns';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import { User, Setting } from '@/lib/models';
import type { FilterFormValues, SmsRecord, UserProfile } from '@/lib/types';
import { extractInfo } from '@/ai/flows/extract-info-from-sms';

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

  const API_URL = 'https://api.premiumy.net/v1.0/csv';
  const body = {
    id: null,
    jsonrpc: '2.0',
    method: 'sms.mdr_full:get_list',
    params: {
      filter: {
        start_date: formatISO(filter.startDate!, { representation: 'date' }) + ' 00:00:00',
        end_date: formatISO(filter.endDate!, { representation: 'date' }) + ' 23:59:59',
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
    });

    if (!response.ok) {
       const errorText = await response.text();
      return { error: `API Error: ${response.status} ${response.statusText}. ${errorText}` };
    }

    const csvText = await response.text();
    if (!csvText || csvText.trim() === '') {
        return { data: [] };
    }
    
    // The API might return an error in JSON format
    if (csvText.trim().startsWith('{')) {
        try {
            const jsonError = JSON.parse(csvText);
            if (jsonError.error) {
                return { error: `API returned an error: ${jsonError.error.message}` };
            }
        } catch (e) {
            // Not a JSON error, proceed assuming it's CSV
        }
    }

    const lines = csvText.trim().split(/\r?\n/);
    if (lines.length < 2) {
      return { data: [] }; // No data rows
    }

    const headers = lines[0].split(';').map(h => h.trim().toLowerCase());
    const records: SmsRecord[] = [];

    const columnMap: { [key in keyof SmsRecord]?: number } = {
        dateTime: headers.indexOf('datetime'),
        senderId: headers.indexOf('senderid'),
        phone: headers.indexOf('phone'),
        mccMnc: headers.indexOf('mcc_mnc'),
        destination: headers.indexOf('phone_sde_name'),
        range: headers.indexOf('range_name'),
        rate: headers.indexOf('dialer_rate'),
        currency: headers.indexOf('dialer_cur_name'),
        message: headers.indexOf('message'),
    };
    
    // Check for essential columns
    if (columnMap.dateTime === -1 || columnMap.message === -1) {
        return { error: "CSV response is missing required columns ('datetime', 'message')." };
    }

    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(';');
        if (values.length >= headers.length) {
            records.push({
                dateTime: values[columnMap.dateTime!],
                senderId: values[columnMap.senderId!],
                phone: values[columnMap.phone!],
                mccMnc: values[columnMap.mccMnc!],
                destination: values[columnMap.destination!],
                range: values[columnMap.range!],
                rate: values[columnMap.rate!],
                currency: values[columnMap.currency!],
                message: values[columnMap.message!],
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

const signupSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
});

export async function signup(values: z.infer<typeof signupSchema>) {
    try {
        await connectDB();
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
        };
    } catch (error) {
        return null;
    }
}


// --- Admin Actions ---
export async function getAdminSettings() {
    try {
        await connectDB();
        const apiKeySetting = await Setting.findOne({ key: 'apiKey' });
        const ipSetting = await Setting.findOne({ key: 'ipRestrictions' });
        
        return {
            apiKey: apiKeySetting ? apiKeySetting.value : '',
            ipRestrictions: ipSetting && Array.isArray(ipSetting.value) ? ipSetting.value.join(', ') : '',
        }
    } catch (error) {
        return { error: (error as Error).message };
    }
}

export async function updateAdminSettings(settings: { apiKey?: string; ipRestrictions?: string }) {
    try {
        await connectDB();
        if (settings.apiKey !== undefined) {
             await Setting.findOneAndUpdate(
                { key: 'apiKey' },
                { value: settings.apiKey },
                { upsert: true, new: true }
            );
        }
        if (settings.ipRestrictions !== undefined) {
            const ips = settings.ipRestrictions.split(',').map(ip => ip.trim()).filter(Boolean);
            await Setting.findOneAndUpdate(
                { key: 'ipRestrictions' },
                { value: ips },
                { upsert: true, new: true }
            );
        }
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
            isAdmin: user.isAdmin
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
