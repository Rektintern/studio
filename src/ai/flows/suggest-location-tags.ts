'use server';
/**
 * @fileOverview This file implements a Genkit flow that suggests relevant location tags
 * for a reminder based on its content using AI.
 *
 * - suggestLocationTags - A function that triggers the AI to suggest location tags.
 * - SuggestLocationTagsInput - The input type for the suggestLocationTags function.
 * - SuggestLocationTagsOutput - The return type for the suggestLocationTags function.
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
      "An array of suggested location tags derived from the reminder content."
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
  prompt: `You are an AI assistant that extracts relevant location tags from reminder content.
Analyze the following reminder content and identify potential location tags.
These tags should be short, descriptive, and directly related to places or types of locations mentioned or implied in the reminder.
If no explicit location is mentioned, suggest general location types that might be relevant based on the reminder's intent.

Reminder Content: "{{{reminderContent}}}"

Please provide the output as a JSON object with a single field, 'tags', which is an array of strings.

Example:
Input: "Pick up dry cleaning on the way home"
Output: { "tags": ["dry cleaning", "home", "laundry"]
}

Input: "Buy groceries for dinner"
Output: { "tags": ["grocery store", "supermarket", "home"]
}

Input: "Meeting with John at the coffee shop"
Output: { "tags": ["coffee shop", "cafe", "meeting place"]
}
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
