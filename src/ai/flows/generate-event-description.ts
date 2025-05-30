// src/ai/flows/generate-event-description.ts
'use server';
/**
 * @fileOverview Generates event descriptions using AI based on provided keywords and details.
 *
 * - generateEventDescription - A function that generates event descriptions.
 * - GenerateEventDescriptionInput - The input type for the generateEventDescription function.
 * - GenerateEventDescriptionOutput - The return type for the generateEventDescription function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateEventDescriptionInputSchema = z.object({
  keywords: z.string().describe('Keywords describing the event.'),
  details: z.string().describe('Additional details about the event.'),
});
export type GenerateEventDescriptionInput = z.infer<
  typeof GenerateEventDescriptionInputSchema
>;

const GenerateEventDescriptionOutputSchema = z.object({
  description: z.string().describe('The generated event description in Indonesian language.'),
});
export type GenerateEventDescriptionOutput = z.infer<
  typeof GenerateEventDescriptionOutputSchema
>;

export async function generateEventDescription(
  input: GenerateEventDescriptionInput
): Promise<GenerateEventDescriptionOutput> {
  return generateEventDescriptionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateEventDescriptionPrompt',
  input: {schema: GenerateEventDescriptionInputSchema},
  output: {schema: GenerateEventDescriptionOutputSchema},
  prompt: `Anda adalah seorang copywriter ahli yang berspesialisasi dalam membuat deskripsi acara yang menarik.

  Berdasarkan kata kunci dan detail berikut, hasilkan deskripsi acara yang menarik dalam **Bahasa Indonesia**.

  Kata Kunci: {{{keywords}}}
  Detail: {{{details}}}

  Deskripsi Acara (dalam Bahasa Indonesia):`,
});

const generateEventDescriptionFlow = ai.defineFlow(
  {
    name: 'generateEventDescriptionFlow',
    inputSchema: GenerateEventDescriptionInputSchema,
    outputSchema: GenerateEventDescriptionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
