'use server';

import { z } from 'zod';
import { formatISO } from 'date-fns';
import type { FilterFormValues, SmsRecord } from '@/lib/types';
import { extractInfo } from '@/ai/flows/extract-info-from-sms';

const API_URL = 'https://api.premiumy.net/v1.0/csv';

const filterSchema = z.object({
  startDate: z.date(),
  endDate: z.date(),
  senderId: z.string().optional(),
  phone: z.string().optional(),
});

function parseSmsCsv(csvText: string): SmsRecord[] {
  const records: SmsRecord[] = [];
  const lines = csvText.trim().split('\n');
  
  if (lines.length < 2) {
    return []; // No data rows
  }

  // Datetime;SenderID;B-Number;MCC/MNC;Destination;Range;Rate;Currency;Message
  const header = lines.shift()!.split(';');
  const messageIndex = header.indexOf('Message');

  for (const line of lines) {
    if (!line.trim()) continue;

    const parts = line.split(';');
    // Handle cases where the message itself contains semicolons
    const message = parts.slice(messageIndex).join(';').replace(/^"|"$/g, '').trim();

    records.push({
      dateTime: parts[0] || '',
      senderId: parts[1] || '',
      bNumber: parts[2] || '',
      mccMnc: parts[3] || '',
      destination: parts[4] || '',
      range: parts[5] || '',
      rate: parts[6] || '',
      currency: parts[7] || '',
      message: message,
    });
  }
  return records;
}

export async function fetchSmsData(
  filter: FilterFormValues
): Promise<{ data?: SmsRecord[]; error?: string }> {
  const apiKey = process.env.PREMIUMY_API_KEY;

  if (!apiKey) {
    return { error: 'API key is not configured on the server. Please contact an administrator.' };
  }
  
  const validation = filterSchema.safeParse(filter);
  if (!validation.success) {
    return { error: 'Invalid filter data.' };
  }

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
    if (csvText.includes('"error":')) {
      const errorJson = JSON.parse(csvText);
      return { error: `API returned an error: ${errorJson.error.message}` };
    }
    
    const data = parseSmsCsv(csvText);
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
