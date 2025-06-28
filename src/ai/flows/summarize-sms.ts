'use server';

/**
 * @fileOverview Summarizes the content of an SMS message using AI.
 *
 * - summarizeSms - A function that summarizes SMS message content.
 * - SummarizeSmsInput - The input type for the summarizeSms function.
 * - SummarizeSmsOutput - The return type for the summarizeSms function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeSmsInputSchema = z.object({
  message: z.string().describe('The SMS message content to summarize.'),
});
export type SummarizeSmsInput = z.infer<typeof SummarizeSmsInputSchema>;

const SummarizeSmsOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the SMS message content.'),
});
export type SummarizeSmsOutput = z.infer<typeof SummarizeSmsOutputSchema>;

export async function summarizeSms(input: SummarizeSmsInput): Promise<SummarizeSmsOutput> {
  return summarizeSmsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeSmsPrompt',
  input: {schema: SummarizeSmsInputSchema},
  output: {schema: SummarizeSmsOutputSchema},
  prompt: `Summarize the following SMS message in a concise manner:\n\n{{{message}}}`,
});

const summarizeSmsFlow = ai.defineFlow(
  {
    name: 'summarizeSmsFlow',
    inputSchema: SummarizeSmsInputSchema,
    outputSchema: SummarizeSmsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
