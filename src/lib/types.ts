import type { extractInfo } from '@/ai/flows/extract-info-from-sms';

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

export interface FilterFormValues {
  startDate: Date;
  endDate: Date;
  senderId: string;
  phone: string;
}

export type ExtractedInfo = Awaited<ReturnType<typeof extractInfo>>;
