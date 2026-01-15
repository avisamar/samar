import { createAgent, type BaseMessage } from "langchain";
import { ChatOpenAI } from "@langchain/openai";
import { MemorySaver } from "@langchain/langgraph";
import type { LangGraphRunnableConfig } from "@langchain/langgraph";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { nanoid } from "nanoid";
import type { CustomerWithNotes, CustomerNote, Customer } from "./types";
import { PROFILE_SECTIONS } from "./sections";
import {
  getFieldDefinition,
  getFieldValue,
  isFieldEmpty,
  getExtractionSchema,
} from "./field-mapping";
import {
  scoreEmptyFields,
  selectTopFields,
  deduplicateFields,
  generateQuestions,
  type ExtractionWithNudges,
  type Extraction,
  type NudgeAnswer,
  type NudgeQuestion,
  EXTRACT_AND_NUDGES_TOOL_NAME,
  FINALIZE_PROPOSAL_TOOL_NAME,
} from "./nudges";
import {
  type ProfileUpdateProposal,
  type ProposedFieldUpdate,
  type ProposedNote,
  type ProposedAdditionalData,
} from "./extraction-types";
import { crmRepository } from "./repository";

const checkpointer = new MemorySaver();

interface ProfileAgentOptions {
  input: { messages: BaseMessage[] };
  config: LangGraphRunnableConfig;
  customer: CustomerWithNotes;
}

/**
 * Create the get_customer_profile tool that fetches profile data by section.
 * Fetches fresh data from the database on each call to ensure up-to-date information.
 */
function createGetCustomerProfileTool(customerId: string) {
  const sectionIds = PROFILE_SECTIONS.map((s) => s.id);

  return tool(
    async ({ section }) => {
      // Always fetch fresh data from the database
      const customer = await crmRepository.getCustomerWithNotes(customerId);
      if (!customer) {
        return JSON.stringify({
          error: `Customer with ID "${customerId}" not found.`,
        });
      }

      console.log("[ProfileAgent] Fetched fresh customer profile for:", customer.fullName);

      // If no section specified or "all", return full profile summary
      if (!section || section === "all") {
        const profileData = formatProfileForPrompt(customer);
        const notes = formatNotesForPrompt(customer.notes);
        const missingFields = getMissingHighPriorityFields(customer);

        return JSON.stringify({
          customerId: customer.id,
          fullName: customer.fullName,
          profile: profileData,
          recentNotes: notes,
          missingHighPriorityFields: missingFields,
        });
      }

      // Find the requested section
      const sectionDef = PROFILE_SECTIONS.find((s) => s.id === section);
      if (!sectionDef) {
        return JSON.stringify({
          error: `Section "${section}" not found. Available sections: ${sectionIds.join(", ")}`,
        });
      }

      // Extract fields for this section
      const sectionData: Record<string, unknown> = {};
      const missingFields: string[] = [];

      for (const field of sectionDef.fields) {
        const value = customer[field.key as keyof Customer];
        if (value !== null && value !== undefined && value !== "") {
          sectionData[field.label] = formatFieldValue(value);
        } else if (field.priority === "high") {
          missingFields.push(field.label);
        }
      }

      return JSON.stringify({
        customerId: customer.id,
        fullName: customer.fullName,
        section: sectionDef.label,
        data: sectionData,
        missingHighPriorityFields: missingFields,
      });
    },
    {
      name: "get_customer_profile",
      description: `Fetch the latest customer profile data from the database. Use this tool to retrieve specific information about the customer's profile. You can fetch a specific section or the entire profile.

IMPORTANT: Always call this tool BEFORE calling propose_profile_updates to ensure you have the most up-to-date customer data.

Available sections:
${PROFILE_SECTIONS.map((s) => `- "${s.id}": ${s.label}`).join("\n")}
- "all": Get the complete profile summary

Call this tool:
1. ALWAYS before proposing profile updates (to ensure fresh data)
2. When you need to look up specific customer information to answer RM questions`,
      schema: z.object({
        section: z
          .enum(["all", ...sectionIds] as [string, ...string[]])
          .optional()
          .describe(
            'The section of the profile to fetch. Use "all" for complete profile or omit for full summary.'
          ),
      }),
    }
  );
}

/**
 * Create the extract_and_generate_nudges tool.
 * Phase 1 of two-phase workflow: extract data + generate follow-up questions.
 */
function createExtractAndGenerateNudgesTool(customer: CustomerWithNotes) {
  return tool(
    async ({ content, source }) => {
      console.log("[ProfileAgent] extract_and_generate_nudges called");

      // Step 1: Extract data using LLM (same pattern as propose_profile_updates)
      const extractionModel = new ChatOpenAI({
        model: "gpt-4o",
        apiKey: process.env.OPENAI_API_KEY,
        temperature: 0,
      });

      const extractionPrompt = `You are extracting structured customer profile data from an RM's notes.

Current customer: ${customer.fullName || "Unknown"}

## Available Profile Fields
${getExtractionSchema()}

## Instructions
1. Extract information that matches the profile schema fields above
2. ALSO extract relevant customer information that does NOT fit the schema fields above
3. For non-schema data, create descriptive keys in snake_case and human-readable labels
4. For each extracted item, include a brief quote from the source text
5. Assign confidence levels:
   - "high": Directly stated (e.g., "earns 60L per year")
   - "medium": Strongly implied (e.g., "senior position" implies high income)
   - "low": Inferred with uncertainty
6. Generate a concise note summarizing the key points
7. Generate relevant tags for the note

## Input (${source})
${content}

## Output Format
Return a JSON object:
{
  "extractedFields": [
    { "field": "field_key", "value": "extracted value", "confidence": "high|medium|low", "source": "quote" }
  ],
  "additionalData": [
    { "key": "snake_case_key", "label": "Human Label", "value": "value", "confidence": "high|medium|low", "source": "quote", "category": "optional" }
  ],
  "noteSummary": "Concise summary",
  "noteTags": ["tag1", "tag2"]
}`;

      const response = await extractionModel.invoke([
        { role: "system", content: extractionPrompt },
        { role: "user", content: `Extract profile data from this ${source}: ${content}` },
      ]);

      // Parse extraction response
      let extraction: Extraction;
      try {
        const responseText = typeof response.content === "string"
          ? response.content
          : JSON.stringify(response.content);

        const jsonMatch = responseText.match(/```json\n?([\s\S]*?)\n?```/) ||
          responseText.match(/\{[\s\S]*\}/);

        if (jsonMatch) {
          const jsonStr = jsonMatch[1] || jsonMatch[0];
          extraction = JSON.parse(jsonStr);
          if (!extraction.additionalData) extraction.additionalData = [];
        } else {
          extraction = {
            extractedFields: [],
            additionalData: [],
            noteSummary: content.slice(0, 200),
            noteTags: [],
          };
        }
      } catch (e) {
        console.error("[ProfileAgent] Failed to parse extraction:", e);
        extraction = {
          extractedFields: [],
          additionalData: [],
          noteSummary: content.slice(0, 200),
          noteTags: [],
        };
      }

      console.log("[ProfileAgent] Extracted fields:", extraction.extractedFields.length);

      // Step 2: Score empty fields
      const allScoredFields = scoreEmptyFields(customer);
      console.log("[ProfileAgent] Total empty fields:", allScoredFields.length);

      // Step 3: Deduplicate (remove fields covered in extraction)
      const extractedKeys = extraction.extractedFields.map((f) => f.field);
      const dedupedFields = deduplicateFields(allScoredFields, extractedKeys);

      // Step 4: Select top fields
      const topFields = selectTopFields(dedupedFields, 10);
      console.log("[ProfileAgent] Top fields for nudges:", topFields.length);

      // Step 5: Generate questions (if any top fields)
      let nudges: NudgeQuestion[] = [];
      if (topFields.length > 0) {
        const contextSummary = extraction.noteSummary || content.slice(0, 300);
        nudges = await generateQuestions(topFields, customer, contextSummary);
        console.log("[ProfileAgent] Generated nudge questions:", nudges.length);
      }

      // Build result
      const result: ExtractionWithNudges = {
        proposalId: nanoid(),
        customerId: customer.id,
        extraction,
        nudges,
        rawInput: content,
        source: source as "meeting" | "call" | "email" | "voice_note",
        createdAt: new Date().toISOString(),
      };

      return JSON.stringify(result);
    },
    {
      name: EXTRACT_AND_NUDGES_TOOL_NAME,
      description: `Extract profile data from RM input and generate follow-up questions.

This is Phase 1 of the two-phase workflow:
1. Extract structured profile data from the input
2. Identify high-value empty fields using intelligent scoring
3. Generate conversational follow-up questions for the RM

Call this tool when the RM shares meeting notes, call notes, or observations.
The RM will see:
- A card with follow-up questions to answer or skip
- After answering, call finalize_proposal to show the complete proposal`,
      schema: z.object({
        content: z.string().describe("The meeting note or observation from the RM"),
        source: z
          .enum(["meeting", "call", "email", "voice_note"])
          .default("meeting")
          .describe("The source type"),
      }),
    }
  );
}

/**
 * Create the finalize_proposal tool.
 * Phase 2: Merge extraction + nudge answers → ProfileUpdateProposal.
 */
function createFinalizeProposalTool(customer: CustomerWithNotes) {
  return tool(
    async ({ proposalId, extractionData, answers, rawInput, source }) => {
      console.log("[ProfileAgent] finalize_proposal called");

      // Parse extraction data
      const extraction: Extraction = extractionData;

      // Process answers through extraction LLM to map to fields
      const processedAnswers: Array<{
        field: string;
        value: unknown;
        confidence: "high" | "medium" | "low";
        source: string;
      }> = [];

      // Filter to non-skipped answers
      const validAnswers = answers.filter((a: NudgeAnswer) => !a.skipped && a.answer);

      if (validAnswers.length > 0) {
        const extractionModel = new ChatOpenAI({
          model: "gpt-4o",
          apiKey: process.env.OPENAI_API_KEY,
          temperature: 0,
        });

        const answersText = validAnswers
          .map((a: NudgeAnswer) => `${a.fieldKey}: "${a.answer}"`)
          .join("\n");

        const answerExtractionPrompt = `Extract structured values from these RM answers about a customer profile.

## Answers
${answersText}

## Instructions
For each answer, extract the value and map it to the field key.
Return a JSON array:
[
  { "field": "fieldKey", "value": "extracted_value", "confidence": "high", "source": "RM provided" }
]

Be intelligent about parsing:
- "50L-1Cr" for income → use as-is
- "3 kids" for dependents → extract number 3
- Dates should be in ISO format if possible`;

        try {
          const response = await extractionModel.invoke([
            { role: "system", content: answerExtractionPrompt },
            { role: "user", content: "Extract values from the answers." },
          ]);

          const responseText = typeof response.content === "string"
            ? response.content
            : JSON.stringify(response.content);

          const jsonMatch = responseText.match(/```json\n?([\s\S]*?)\n?```/) ||
            responseText.match(/\[[\s\S]*\]/);

          if (jsonMatch) {
            const jsonStr = jsonMatch[1] || jsonMatch[0];
            const parsed = JSON.parse(jsonStr);
            processedAnswers.push(...parsed);
          }
        } catch (e) {
          console.error("[ProfileAgent] Failed to process answers:", e);
          // Fallback: use raw answers
          for (const a of validAnswers) {
            processedAnswers.push({
              field: a.fieldKey,
              value: a.answer,
              confidence: "high",
              source: "RM provided in follow-up",
            });
          }
        }
      }

      console.log("[ProfileAgent] Processed answer fields:", processedAnswers.length);

      // Combine extraction fields with processed answers
      const allExtractedFields = [
        ...extraction.extractedFields,
        ...processedAnswers,
      ];

      // Build field updates
      const fieldUpdates: ProposedFieldUpdate[] = allExtractedFields
        .filter((ef) => {
          const fieldDef = getFieldDefinition(ef.field);
          return fieldDef !== undefined;
        })
        .map((ef) => {
          const fieldDef = getFieldDefinition(ef.field)!;
          const currentValue = getFieldValue(customer, ef.field);

          return {
            id: nanoid(),
            field: ef.field,
            label: fieldDef.label,
            currentValue: isFieldEmpty(currentValue) ? null : currentValue,
            proposedValue: ef.value,
            confidence: ef.confidence,
            source: ef.source,
          };
        });

      // Build additional data
      const additionalData: ProposedAdditionalData[] = (extraction.additionalData || [])
        .map((ad) => ({
          id: nanoid(),
          key: ad.key,
          label: ad.label,
          value: ad.value,
          confidence: ad.confidence,
          source: ad.source,
          category: ad.category,
        }));

      // Build note
      const note: ProposedNote = {
        id: nanoid(),
        content: extraction.noteSummary || rawInput.slice(0, 200),
        source: source as "meeting" | "call" | "email" | "voice_note",
        tags: extraction.noteTags || [],
      };

      const proposal: ProfileUpdateProposal = {
        proposalId,
        customerId: customer.id,
        fieldUpdates,
        additionalData,
        note,
        rawInput,
        createdAt: new Date().toISOString(),
      };

      console.log("[ProfileAgent] Final proposal - fields:", fieldUpdates.length);

      return JSON.stringify(proposal);
    },
    {
      name: FINALIZE_PROPOSAL_TOOL_NAME,
      description: `Finalize the profile update proposal after RM has answered follow-up questions.

This is Phase 2 of the two-phase workflow:
- Merge initial extraction with nudge answers
- Create a complete ProfileUpdateProposal for RM approval

Call this tool after the RM has reviewed the follow-up questions.`,
      schema: z.object({
        proposalId: z.string().describe("The proposal ID from Phase 1"),
        extractionData: z.object({
          extractedFields: z.array(z.object({
            field: z.string(),
            value: z.unknown(),
            confidence: z.enum(["high", "medium", "low"]),
            source: z.string(),
          })),
          additionalData: z.array(z.object({
            key: z.string(),
            label: z.string(),
            value: z.unknown(),
            confidence: z.enum(["high", "medium", "low"]),
            source: z.string(),
            category: z.string().optional(),
          })),
          noteSummary: z.string(),
          noteTags: z.array(z.string()),
        }).describe("The extraction data from Phase 1"),
        answers: z.array(
          z.object({
            questionId: z.string(),
            fieldKey: z.string(),
            answer: z.string().nullable(),
            skipped: z.boolean(),
          })
        ).describe("RM's answers to nudge questions"),
        rawInput: z.string().describe("Original raw input from RM"),
        source: z.enum(["meeting", "call", "email", "voice_note"]).describe("Source type"),
      }),
    }
  );
}

/**
 * Run the profile agent with customer context.
 * Returns a streaming SSE response.
 */
export async function runProfileAgent(options: ProfileAgentOptions) {
  console.log("[ProfileAgent] Starting with customer:", options.customer.id);
  console.log("[ProfileAgent] Input messages:", JSON.stringify(options.input.messages));
  console.log("[ProfileAgent] Config:", JSON.stringify(options.config));

  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY environment variable is not set");
  }

  console.log("[ProfileAgent] Creating ChatOpenAI model...");
  const model = new ChatOpenAI({
    model: "gpt-4o",
    apiKey: process.env.OPENAI_API_KEY,
  });

  const systemPrompt = buildSystemPrompt(options.customer);
  console.log("[ProfileAgent] System prompt length:", systemPrompt.length);

  // Create tools with customer context
  // Note: get_customer_profile fetches fresh data from DB each time
  const getCustomerProfileTool = createGetCustomerProfileTool(options.customer.id);
  const extractAndNudgesTool = createExtractAndGenerateNudgesTool(options.customer);
  const finalizeProposalTool = createFinalizeProposalTool(options.customer);

  console.log("[ProfileAgent] Creating agent with tools...");
  const agent = createAgent({
    model,
    tools: [getCustomerProfileTool, extractAndNudgesTool, finalizeProposalTool],
    checkpointer,
    systemPrompt,
  });

  console.log("[ProfileAgent] Starting stream...");
  const stream = await agent.stream(options.input, {
    encoding: "text/event-stream",
    streamMode: ["values", "updates", "messages"],
    configurable: options.config.configurable,
    recursionLimit: 10,
  });

  console.log("[ProfileAgent] Returning stream response");
  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream" },
  });
}

/**
 * Build the system prompt with customer profile context.
 */
function buildSystemPrompt(customer: CustomerWithNotes): string {
  const notesSummary = formatNotesForPrompt(customer.notes);
  const missingFields = getMissingHighPriorityFields(customer);

  return `You are a Profile Agent for Samar Capital, a wealth management firm. You help Relationship Managers (RMs) capture and manage customer profiles through natural conversation.

## Your Primary Role
When an RM shares meeting notes, call notes, or observations about a customer, use the TWO-PHASE workflow:

### Phase 1: Extract and Generate Follow-ups
1. FIRST call \`get_customer_profile\` to fetch the latest customer data
2. THEN call \`extract_and_generate_nudges\` to:
   - Extract structured data from the input
   - Generate follow-up questions for high-value missing fields
3. The RM will see a card with follow-up questions to answer or skip

### Phase 2: Finalize Proposal
4. After the RM answers/skips questions, they will submit answers
5. Call \`finalize_proposal\` with the extraction data and answers
6. The RM will see the complete ProfileUpdateProposal to approve/reject
7. NEVER auto-save data - always propose changes for RM confirmation

## Tools Available

### \`get_customer_profile\`
Fetch the latest customer data from the database. Use it:
- ALWAYS before processing RM notes (to ensure fresh data)
- When the RM asks about specific customer information
- When you need to check details about any section

### \`extract_and_generate_nudges\`
**Phase 1 tool.** Use when the RM shares meeting notes, call notes, or observations.
- Extracts structured profile data from the input
- Identifies high-value missing fields using intelligent scoring
- Generates conversational follow-up questions
- Returns extraction data + nudge questions for the RM

### \`finalize_proposal\`
**Phase 2 tool.** Use after the RM has answered or skipped follow-up questions.
- Takes the original extraction + RM's answers
- Merges everything into a complete ProfileUpdateProposal
- Returns the proposal for RM to approve/reject

## Current Customer Context
Customer: ${customer.fullName || "Unknown"}

${missingFields.length > 0 ? `### Profile Gaps (High Priority Fields Missing)
${missingFields.map((f) => `- ${f}`).join("\n")}
` : ""}
## Recent Notes
${notesSummary}

## Guidelines
- **ALWAYS fetch fresh profile data first** via \`get_customer_profile\`
- **Use the two-phase workflow** for processing notes:
  1. get_customer_profile → extract_and_generate_nudges → RM answers questions
  2. finalize_proposal → RM approves updates
- Be conversational and helpful
- Acknowledge when information is missing or incomplete
- NEVER modify the profile directly - always propose updates for RM approval`;
}

/**
 * Format customer profile data into readable sections for the prompt.
 */
function formatProfileForPrompt(customer: CustomerWithNotes): string {
  const sections: string[] = [];

  for (const section of PROFILE_SECTIONS) {
    const sectionData: string[] = [];

    for (const field of section.fields) {
      const value = customer[field.key as keyof typeof customer];
      if (value !== null && value !== undefined && value !== "") {
        const displayValue = formatFieldValue(value);
        if (displayValue) {
          sectionData.push(`- ${field.label}: ${displayValue}`);
        }
      }
    }

    if (sectionData.length > 0) {
      sections.push(`### ${section.label}\n${sectionData.join("\n")}`);
    }
  }

  if (sections.length === 0) {
    return "No profile data has been captured yet.";
  }

  return sections.join("\n\n");
}

/**
 * Format a field value for display in the prompt.
 */
function formatFieldValue(value: unknown): string {
  if (value === null || value === undefined) return "";

  if (Array.isArray(value)) {
    if (value.length === 0) return "";
    return value.join(", ");
  }

  if (value instanceof Date) {
    return value.toLocaleDateString();
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  const strValue = String(value).trim();
  return strValue;
}

/**
 * Format customer notes for the prompt.
 */
function formatNotesForPrompt(notes: CustomerNote[]): string {
  if (!notes || notes.length === 0) {
    return "No notes recorded yet.";
  }

  // Show last 5 notes with dates and source
  return notes
    .slice(0, 5)
    .map((note) => {
      const date = note.createdAt
        ? new Date(note.createdAt).toLocaleDateString()
        : "Unknown date";
      const source = note.source ? ` (${note.source})` : "";
      return `[${date}${source}] ${note.content}`;
    })
    .join("\n");
}

/**
 * Get list of high-priority fields that are missing.
 */
function getMissingHighPriorityFields(customer: CustomerWithNotes): string[] {
  const missing: string[] = [];

  for (const section of PROFILE_SECTIONS) {
    for (const field of section.fields) {
      if (field.priority === "high") {
        const value = customer[field.key as keyof typeof customer];
        if (value === null || value === undefined || value === "") {
          missing.push(field.label);
        }
      }
    }
  }

  return missing;
}
