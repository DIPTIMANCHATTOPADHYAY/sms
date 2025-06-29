import { z } from 'zod';

export interface ExtractedInfo {
  confirmationCode?: string;
  link?: string;
}

export interface SmsRecord {
  dateTime: string;
  senderId: string;
  phone: string;
  mccMnc: string;
  destination: string;
  range: string;
  rate: number | string;
  currency: string;
  message: string;
  extractedInfo: ExtractedInfo;
}

const filterFormSchema = z.object({
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  senderId: z.string().optional(),
  phone: z.string().optional(),
});

export type FilterFormValues = z.infer<typeof filterFormSchema>;

export interface UserProfile {
  id: string;
  email?: string | null;
  name?: string | null;
  photoURL?: string | null;
  status?: 'active' | 'blocked';
  isAdmin?: boolean;
  canAddNumbers?: boolean;
}

export interface ProxySettings {
  ip?: string;
  port?: string;
  username?: string;
  password?: string;
}
