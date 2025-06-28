import type { extractInfo } from '@/ai/flows/extract-info-from-sms';
import { z } from 'zod';

export interface SmsRecord {
  dateTime: string;
  senderId: string;
  bNumber: string;
  mccMnc: string;
  destination: string;
  range: string;
  rate: string;
  currency: string;
  message: string;
}

const filterFormSchema = z.object({
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  senderId: z.string().optional(),
  phone: z.string().optional(),
});

export type FilterFormValues = z.infer<typeof filterFormSchema>;


export type ExtractedInfo = Awaited<ReturnType<typeof extractInfo>>;
