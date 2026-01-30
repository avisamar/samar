/**
 * Interest extraction agents implemented as LangChain tools.
 * These are called by the main profile agent to extract interests from RM notes.
 */

import { tool } from "@langchain/core/tools";
import { ChatOpenAI } from "@langchain/openai";
import { z } from "zod";
import { nanoid } from "nanoid";
import type { ExtractedInterest } from "./interest-types";
import { INTEREST_CATEGORIES } from "./interest-types";

// =============================================================================
// Tool Name Constants
// =============================================================================

export const EXTRACT_PERSONAL_INTERESTS_TOOL_NAME = "extract_personal_interests";
export const EXTRACT_FINANCIAL_INTERESTS_TOOL_NAME = "extract_financial_interests";

// =============================================================================
// Personal Interests Extraction Tool
// =============================================================================

/**
 * Creates the extract_personal_interests tool.
 * Extracts hobbies, lifestyle preferences, and personal interests from RM notes.
 */
export function createExtractPersonalInterestsTool() {
  return tool(
    async ({ content, customerName }) => {
      console.log("[InterestAgents] extract_personal_interests called");

      const extractionModel = new ChatOpenAI({
        model: "gpt-4o",
        apiKey: process.env.OPENAI_API_KEY,
        temperature: 0,
      });

      const prompt = `You are extracting personal interests from an RM's notes about a customer.

## Customer
${customerName || "Unknown"}

## What to Extract
Personal interests include:
- **Hobbies & Recreation**: Golf, tennis, reading, gardening, cooking, etc.
- **Sports**: Playing or following sports, fitness activities
- **Travel**: Travel preferences, favorite destinations, travel style
- **Entertainment**: Movies, music, theater, gaming, etc.
- **Food & Wine**: Culinary interests, dining preferences, wine collecting
- **Art & Culture**: Art collecting, museum visits, cultural events
- **Health & Wellness**: Yoga, meditation, wellness retreats
- **Social**: Club memberships, social activities, networking
- **Family**: Family activities, events, priorities
- **Philanthropy**: Charitable causes, volunteer work
- **Education**: Learning interests, courses, certifications

## Instructions
1. Extract ONLY personal interests (not financial goals or investment preferences)
2. Be specific - "golf" not just "sports", "French wines" not just "wine"
3. Include relevant context in the description
4. Assign confidence levels:
   - "high": Explicitly stated ("loves playing golf", "passionate about travel")
   - "medium": Clearly implied ("mentioned their golf handicap", "talked about their recent trip")
   - "low": Loosely inferred ("works long hours" might imply limited hobby time)
5. Only extract interests you're confident about - it's better to miss one than to guess

## Input
${content}

## Output Format
Return a JSON array:
[
  {
    "label": "Short name (e.g., 'Golf', 'French Wine', 'Travel to Europe')",
    "description": "Brief context or detail about this interest",
    "sourceText": "Quote from the input that supports this extraction",
    "confidence": "high" | "medium" | "low"
  }
]

If no personal interests are found, return an empty array: []`;

      try {
        const response = await extractionModel.invoke([
          { role: "system", content: prompt },
          { role: "user", content: `Extract personal interests from: ${content}` },
        ]);

        const responseText = typeof response.content === "string"
          ? response.content
          : JSON.stringify(response.content);

        // Parse JSON from response
        const jsonMatch = responseText.match(/```json\n?([\s\S]*?)\n?```/) ||
          responseText.match(/\[[\s\S]*\]/);

        let rawInterests: Array<{
          label: string;
          description?: string;
          sourceText: string;
          confidence: "high" | "medium" | "low";
        }> = [];

        if (jsonMatch) {
          const jsonStr = jsonMatch[1] || jsonMatch[0];
          rawInterests = JSON.parse(jsonStr);
        }

        // Convert to ExtractedInterest format
        const interests: ExtractedInterest[] = rawInterests.map((raw) => ({
          id: nanoid(),
          category: INTEREST_CATEGORIES.PERSONAL,
          label: raw.label,
          description: raw.description,
          sourceText: raw.sourceText,
          confidence: raw.confidence,
        }));

        console.log("[InterestAgents] Extracted personal interests:", interests.length);
        return JSON.stringify(interests);
      } catch (error) {
        console.error("[InterestAgents] Failed to extract personal interests:", error);
        return JSON.stringify([]);
      }
    },
    {
      name: EXTRACT_PERSONAL_INTERESTS_TOOL_NAME,
      description: `Extract personal interests from RM notes.

Personal interests include hobbies, sports, travel, entertainment, food & wine,
art & culture, health & wellness, social activities, family priorities, and philanthropy.

Use this tool in parallel with extract_financial_interests when processing RM notes
to capture a complete picture of the customer's interests.`,
      schema: z.object({
        content: z.string().describe("The RM notes or meeting content to analyze"),
        customerName: z.string().optional().describe("The customer's name for context"),
      }),
    }
  );
}

// =============================================================================
// Financial Interests Extraction Tool
// =============================================================================

/**
 * Creates the extract_financial_interests tool.
 * Extracts financial goals, concerns, and investment curiosities from RM notes.
 */
export function createExtractFinancialInterestsTool() {
  return tool(
    async ({ content, customerName }) => {
      console.log("[InterestAgents] extract_financial_interests called");

      const extractionModel = new ChatOpenAI({
        model: "gpt-4o",
        apiKey: process.env.OPENAI_API_KEY,
        temperature: 0,
      });

      const prompt = `You are extracting financial interests from an RM's notes about a customer.

## Customer
${customerName || "Unknown"}

## What to Extract
Financial interests include:
- **Retirement Planning**: Retirement timeline, lifestyle expectations, pension concerns
- **Education Funding**: Children's education, specific schools or programs
- **Wealth Preservation**: Capital protection, inheritance, generational wealth
- **Wealth Growth**: Aggressive growth goals, wealth multiplication targets
- **Real Estate**: Property investment interest, rental income, second homes
- **Business**: Business investment, startup funding, acquisition interests
- **Tax Planning**: Tax optimization, offshore structures, tax-efficient investing
- **Estate Planning**: Wills, trusts, succession planning
- **Insurance**: Life insurance, health coverage, asset protection
- **Philanthropy**: Charitable giving, foundation setup, impact investing
- **Passive Income**: Dividend focus, rental income, royalty streams
- **Market Curiosity**: Specific sectors, asset classes, or strategies they're curious about

## Instructions
1. Extract ONLY financial interests and goals (not personal hobbies)
2. Be specific - "children's US university education" not just "education"
3. Include relevant context like timelines, amounts, or priorities in the description
4. Assign confidence levels:
   - "high": Explicitly stated goal ("wants to retire at 55", "planning for MBA at Harvard")
   - "medium": Clearly implied ("worried about market volatility" implies risk concerns)
   - "low": Loosely inferred ("has two young children" might imply education planning)
5. Only extract interests you're confident about - it's better to miss one than to guess

## Input
${content}

## Output Format
Return a JSON array:
[
  {
    "label": "Short name (e.g., 'Early Retirement', 'Children's Education', 'Real Estate Investment')",
    "description": "Brief context - timeline, amount, priority, or relevant detail",
    "sourceText": "Quote from the input that supports this extraction",
    "confidence": "high" | "medium" | "low"
  }
]

If no financial interests are found, return an empty array: []`;

      try {
        const response = await extractionModel.invoke([
          { role: "system", content: prompt },
          { role: "user", content: `Extract financial interests from: ${content}` },
        ]);

        const responseText = typeof response.content === "string"
          ? response.content
          : JSON.stringify(response.content);

        // Parse JSON from response
        const jsonMatch = responseText.match(/```json\n?([\s\S]*?)\n?```/) ||
          responseText.match(/\[[\s\S]*\]/);

        let rawInterests: Array<{
          label: string;
          description?: string;
          sourceText: string;
          confidence: "high" | "medium" | "low";
        }> = [];

        if (jsonMatch) {
          const jsonStr = jsonMatch[1] || jsonMatch[0];
          rawInterests = JSON.parse(jsonStr);
        }

        // Convert to ExtractedInterest format
        const interests: ExtractedInterest[] = rawInterests.map((raw) => ({
          id: nanoid(),
          category: INTEREST_CATEGORIES.FINANCIAL,
          label: raw.label,
          description: raw.description,
          sourceText: raw.sourceText,
          confidence: raw.confidence,
        }));

        console.log("[InterestAgents] Extracted financial interests:", interests.length);
        return JSON.stringify(interests);
      } catch (error) {
        console.error("[InterestAgents] Failed to extract financial interests:", error);
        return JSON.stringify([]);
      }
    },
    {
      name: EXTRACT_FINANCIAL_INTERESTS_TOOL_NAME,
      description: `Extract financial interests and goals from RM notes.

Financial interests include retirement planning, education funding, wealth preservation/growth,
real estate, business investment, tax planning, estate planning, insurance needs,
philanthropy goals, passive income interests, and market curiosities.

Use this tool in parallel with extract_personal_interests when processing RM notes
to capture a complete picture of the customer's interests.`,
      schema: z.object({
        content: z.string().describe("The RM notes or meeting content to analyze"),
        customerName: z.string().optional().describe("The customer's name for context"),
      }),
    }
  );
}

// =============================================================================
// Helper: Merge Interest Results
// =============================================================================

/**
 * Merges results from both interest extraction tools.
 * Deduplicates based on similar labels.
 */
export function mergeInterestResults(
  personalInterests: ExtractedInterest[],
  financialInterests: ExtractedInterest[]
): ExtractedInterest[] {
  const all = [...personalInterests, ...financialInterests];

  // Simple deduplication by normalized label
  const seen = new Set<string>();
  return all.filter((interest) => {
    const normalizedLabel = interest.label.toLowerCase().trim();
    if (seen.has(normalizedLabel)) {
      return false;
    }
    seen.add(normalizedLabel);
    return true;
  });
}
