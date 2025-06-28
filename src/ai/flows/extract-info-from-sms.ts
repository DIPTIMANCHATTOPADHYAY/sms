// This file is machine-generated - edit with care!

'use server';

/**
 * @fileOverview Extracts key information (e.g., confirmation codes, links) from SMS message content.
 *
 * - extractInfo - A function that handles the information extraction process.
 * - ExtractInfoInput - The input type for the extractInfo function.
 * - ExtractInfoOutput - The return type for the extractInfo function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExtractInfoInputSchema = z.object({
  message: z.string().describe('The SMS message content.'),
});
export type ExtractInfoInput = z.infer<typeof ExtractInfoInputSchema>;

const ExtractInfoOutputSchema = z.object({
  confirmationCode: z.string().optional().describe('The confirmation code found in the message, if any.'),
  link: z.string().optional().describe('The link found in the message, if any.'),
  other: z.string().optional().describe('Other important information found in the message.'),
});
export type ExtractInfoOutput = z.infer<typeof ExtractInfoOutputSchema>;

export async function extractInfo(input: ExtractInfoInput): Promise<ExtractInfoOutput> {
  return extractInfoFlow(input);
}

const prompt = ai.definePrompt({
  name: 'extractInfoPrompt',
  input: {schema: ExtractInfoInputSchema},
  output: {schema: ExtractInfoOutputSchema},
  prompt: `You are an expert at extracting key information from SMS messages.

  Given the following SMS message, extract any confirmation codes, links, and other important information.

  SMS Message:
  {{message}}
  
  Confirmation Code:
  {{confirmationCode}}

  Link:
  {{link}}

  Other:
  {{other}}`,
});

const extractInfoFlow = ai.defineFlow(
  {
    name: 'extractInfoFlow',
    inputSchema: ExtractInfoInputSchema,
    outputSchema: ExtractInfoOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
