/**
 * Question generation module using LLM to create human-like follow-up questions.
 */

import { ChatOpenAI } from "@langchain/openai";
import { nanoid } from "nanoid";
import type { FieldScore, NudgeQuestion } from "./types";
import type { Customer } from "../types";

/**
 * Generate human-like follow-up questions for selected fields.
 *
 * Uses an LLM with slight temperature (0.3) to create natural,
 * conversational questions with context about why each field matters.
 *
 * @param fields - Top-scored fields to generate questions for
 * @param customer - Customer profile for context
 * @param extractedContext - Summary of what was already extracted from input
 * @returns Array of NudgeQuestion objects
 */
export async function generateQuestions(
  fields: FieldScore[],
  customer: Customer,
  extractedContext: string
): Promise<NudgeQuestion[]> {
  if (fields.length === 0) return [];

  const llm = new ChatOpenAI({
    model: "gpt-4o",
    apiKey: process.env.OPENAI_API_KEY,
    temperature: 0.3, // Slight creativity for natural questions
  });

  const fieldsList = fields
    .map(
      (f, i) =>
        `${i + 1}. fieldKey: "${f.fieldKey}"
   label: "${f.fieldLabel}"
   section: "${f.sectionLabel}"
   priority: ${f.priority}
   sectionCompleteness: ${f.sectionCompleteness}%`
    )
    .join("\n\n");

  const prompt = `You are generating follow-up questions for a Relationship Manager (RM) to enrich a customer profile at a wealth management firm.

## Customer
Name: ${customer.fullName || "Unknown"}

## Context from recent conversation
${extractedContext || "No additional context available."}

## Fields to ask about
${fieldsList}

## Instructions
For EACH field listed above, generate:
1. **question**: A natural, conversational question to ask the RM (not the client directly)
   - Address the RM as "you"
   - Reference the customer by name when natural
   - Keep under 20 words
   - Be specific, not generic

2. **description**: Optional brief context or example (under 15 words)
   - Skip if the question is self-explanatory
   - Use examples like "e.g., 50L-1Cr, retirement in 10 years"

3. **why**: One sentence explaining why this field matters
   - Start with "Helps us..." or similar
   - Focus on benefit to the customer/advisory relationship
   - Keep under 20 words

## Output Format
Return a JSON array with one object per field:
[
  {
    "fieldKey": "exact_field_key_from_input",
    "question": "...",
    "description": "..." or null,
    "why": "..."
  }
]

Generate questions for ALL ${fields.length} fields listed above.`;

  try {
    const response = await llm.invoke([
      { role: "system", content: prompt },
      { role: "user", content: "Generate the questions now." },
    ]);

    const responseText =
      typeof response.content === "string"
        ? response.content
        : JSON.stringify(response.content);

    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch =
      responseText.match(/```json\n?([\s\S]*?)\n?```/) ||
      responseText.match(/\[[\s\S]*\]/);

    if (!jsonMatch) {
      console.error("[Nudges] Failed to parse question generation response");
      return generateFallbackQuestions(fields);
    }

    const jsonStr = jsonMatch[1] || jsonMatch[0];
    const questions: Array<{
      fieldKey: string;
      question: string;
      description?: string | null;
      why: string;
    }> = JSON.parse(jsonStr);

    // Map to NudgeQuestion with metadata from FieldScore
    return questions.map((q) => {
      const field = fields.find((f) => f.fieldKey === q.fieldKey);
      return {
        id: nanoid(),
        fieldKey: q.fieldKey,
        fieldLabel: field?.fieldLabel || q.fieldKey,
        section: field?.section || "unknown",
        sectionLabel: field?.sectionLabel || "Unknown",
        question: q.question,
        description: q.description || undefined,
        why: q.why,
      };
    });
  } catch (error) {
    console.error("[Nudges] Question generation failed:", error);
    return generateFallbackQuestions(fields);
  }
}

/**
 * Generate fallback questions when LLM fails.
 * Uses simple templates based on field labels.
 */
function generateFallbackQuestions(fields: FieldScore[]): NudgeQuestion[] {
  return fields.map((field) => ({
    id: nanoid(),
    fieldKey: field.fieldKey as string,
    fieldLabel: field.fieldLabel,
    section: field.section,
    sectionLabel: field.sectionLabel,
    question: `What is the customer's ${field.fieldLabel.toLowerCase()}?`,
    description: undefined,
    why: `Helps build a more complete ${field.sectionLabel.toLowerCase()} profile.`,
  }));
}
