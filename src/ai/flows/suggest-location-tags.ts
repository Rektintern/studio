'use server';
/**
 * @fileOverview This file implements a Genkit flow that suggests relevant location tags
 * for a reminder based on its content using AI. It prioritizes real-world POI categories
 * compatible with OpenStreetMap/Nominatim search.
 *
 * - suggestLocationTags - A function that triggers the AI to suggest location tags.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestLocationTagsInputSchema = z.object({
  reminderContent: z
    .string()
    .describe("The content of the reminder for which to suggest location tags."),
});
export type SuggestLocationTagsInput = z.infer<
  typeof SuggestLocationTagsInputSchema
>;

const SuggestLocationTagsOutputSchema = z.object({
  tags: z
    .array(z.string())
    .describe(
      "An array of suggested location tags. Tags must correspond to specific real-world business categories (e.g. 'supermarket', 'cafe', 'pharmacy', 'atm', 'gas station')."
    ),
});
export type SuggestLocationTagsOutput = z.infer<
  typeof SuggestLocationTagsOutputSchema
>;

export async function suggestLocationTags(
  input: SuggestLocationTagsInput
): Promise<SuggestLocationTagsOutput> {
  return suggestLocationTagsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestLocationTagsPrompt',
  input: {schema: SuggestLocationTagsInputSchema},
  output: {schema: SuggestLocationTagsOutputSchema},
  prompt: `You are an expert at mapping user intent to OpenStreetMap-compatible search categories.
Analyze the reminder content and provide a list of 2-3 specific business or POI categories that a user would visit to fulfill this task.

CRITICAL RULES:
- Use specific categories: 'pharmacy' instead of 'medicine', 'supermarket' instead of 'food', 'hardware store' instead of 'tools'.
- Output ONLY the category names.
- Prioritize categories that exist as physical locations on a map.

Examples:
- "Buy milk": ["supermarket", "grocery store"]
- "Pick up meds": ["pharmacy", "chemist"]
- "Get cash": ["atm", "bank"]
- "Fix car": ["car repair", "mechanic"]
- "Coffee with Sam": ["cafe", "coffee shop"]

Reminder Content: "{{{reminderContent}}}"
`,
});

const suggestLocationTagsFlow = ai.defineFlow(
  {
    name: 'suggestLocationTagsFlow',
    inputSchema: SuggestLocationTagsInputSchema,
    outputSchema: SuggestLocationTagsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
