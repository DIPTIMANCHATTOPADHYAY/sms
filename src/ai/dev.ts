import { config } from 'dotenv';
config();

import '@/ai/flows/summarize-sms.ts';
import '@/ai/flows/extract-info-from-sms.ts';