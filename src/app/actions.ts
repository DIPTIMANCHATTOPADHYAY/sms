'use server';

import { z } from 'zod';
import { formatISO } from 'date-fns';
import { doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/lib/firebase';
import type { FilterFormValues, SmsRecord, UserProfile } from '@/lib/types';
import { extractInfo } from '@/ai/flows/extract-info-from-sms';

const filterSchema = z.object({
  startDate: z.date(),
  endDate: z.date(),
  senderId: z.string().optional(),
  phone: z.string().optional(),
});

async function getApiKey(): Promise<string> {
    if (!isFirebaseConfigured || !db) {
        console.warn("Firestore not configured, falling back to environment variable for API key.");
        return process.env.PREMIUMY_API_KEY || '';
    }
    try {
        const settingsRef = doc(db, 'settings', 'api');
        const docSnap = await getDoc(settingsRef);
        if (docSnap.exists() && docSnap.data().key) {
            return docSnap.data().key;
        }
    } catch (error) {
        console.error("Could not fetch API key from Firestore, falling back to environment variable.", error);
    }
    // Fallback to environment variable if Firestore fails or key doesn't exist
    return process.env.PREMIUMY_API_KEY || '';
}

export async function fetchSmsData(
  filter: FilterFormValues
): Promise<{ data?: SmsRecord[]; error?: string }> {
  const apiKey = await getApiKey();

  if (!apiKey) {
    return { error: 'API key is not configured. Please contact an administrator.' };
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

    const jsonResponse = await response.json();
    
    if (jsonResponse.error) {
      return { error: `API returned an error: ${jsonResponse.error.message}` };
    }
    
    const rawRecords: any[] = jsonResponse.result?.list || [];

    const data: SmsRecord[] = rawRecords.map(raw => ({
        dateTime: raw.datetime,
        senderId: raw.senderid,
        phone: raw.phone,
        mccMnc: raw.mcc_mnc,
        destination: raw.phone_sde_name,
        range: raw.range_name,
        rate: raw.dialer_rate,
        currency: raw.dialer_cur_name,
        message: raw.message,
    }));
    
    return { data };
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


// Admin Actions
export async function getAdminSettings() {
    if (!isFirebaseConfigured || !db) {
        return { error: "Firebase is not configured. Please check your .env file." };
    }
    try {
        const apiDoc = await getDoc(doc(db, 'settings', 'api'));
        const ipDoc = await getDoc(doc(db, 'settings', 'ip'));
        return {
            apiKey: apiDoc.exists() ? apiDoc.data().key : '',
            ipRestrictions: ipDoc.exists() ? ipDoc.data().allowed.join(', ') : '',
        }
    } catch (error) {
        console.error("Error fetching admin settings:", error);
        return { error: (error as Error).message };
    }
}

export async function updateAdminSettings(settings: { apiKey?: string; ipRestrictions?: string }) {
    if (!isFirebaseConfigured || !db) {
        return { error: "Firebase is not configured. Please check your .env file." };
    }
    try {
        if (settings.apiKey !== undefined) {
            await setDoc(doc(db, 'settings', 'api'), { key: settings.apiKey });
        }
        if (settings.ipRestrictions !== undefined) {
            const ips = settings.ipRestrictions.split(',').map(ip => ip.trim()).filter(Boolean);
            await setDoc(doc(db, 'settings', 'ip'), { allowed: ips });
        }
        return { success: true };
    } catch (error) {
        console.error("Error updating admin settings:", error);
        return { error: (error as Error).message };
    }
}

export async function getAllUsers(): Promise<{ users?: Omit<UserProfile, 'providerId' | 'uid'>[], error?: string }> {
    if (!isFirebaseConfigured || !db) {
        return { error: "Firebase is not configured. Please check your .env file." };
    }
    try {
        const usersRef = collection(db, 'users');
        const querySnapshot = await getDocs(usersRef);
        const users = querySnapshot.docs.map(doc => doc.data() as UserProfile);
        return { users };
    } catch (error) {
        console.error("Error fetching users:", error);
        return { error: (error as Error).message };
    }
}


export async function toggleUserStatus(uid: string, status: 'active' | 'blocked') {
    if (!isFirebaseConfigured || !db) {
        return { error: "Firebase is not configured. Please check your .env file." };
    }
    try {
        const userRef = doc(db, 'users', uid);
        await setDoc(userRef, { status }, { merge: true });
        return { success: true };
    } catch (error) {
        console.error("Error toggling user status:", error);
        return { error: (error as Error).message };
    }
}
