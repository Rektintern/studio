
'use server';
/**
 * @fileOverview This file implements a Genkit flow that suggests relevant location tags
 * for a reminder based on its content using AI. It prioritizes real-world POI categories.
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
      "An array of suggested location tags. Tags must correspond to real-world business categories (e.g. 'supermarket', 'cafe', 'dry cleaning')."
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
  prompt: `You are an AI assistant that extracts relevant real-world business categories from reminder content.
Analyze the following reminder content and identify potential search terms for a map API.
These tags should be specific POI (Point of Interest) categories. 

CRITICAL: Do not use vague terms like "store" or "place". Use specific categories that a map search engine would understand.

Example:
Input: "Pick up dry cleaning on the way home"
Output: { "tags": ["dry cleaning", "laundry"] }

Input: "Buy groceries for dinner"
Output: { "tags": ["supermarket", "grocery store", "food shop"] }

Input: "Meeting with John at the coffee shop"
Output: { "tags": ["cafe", "coffee shop", "restaurant"] }

Input: "Get some chocolate from the store"
Output: { "tags": ["candy shop", "supermarket", "grocery store"] }

Input: "Buy a hammer"
Output: { "tags": ["hardware store", "diy shop"] }

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
