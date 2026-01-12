import { createAgent, type BaseMessage } from "langchain";
import { ChatOpenAI } from "@langchain/openai";
import { MemorySaver } from "@langchain/langgraph";
import type { LangGraphRunnableConfig } from "@langchain/langgraph";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { nanoid } from "nanoid";
import type { CustomerWithNotes, CustomerNote, Customer } from "./types";
import { PROFILE_SECTIONS, type FieldDefinition } from "./sections";
import {
  getFieldDefinition,
  getFieldValue,
  isFieldEmpty,
  getExtractionSchema,
} from "./field-mapping";
import {
  type ProfileUpdateProposal,
  type ProposedFieldUpdate,
  type ProposedNote,
  type ProposedAdditionalData,
  PROPOSAL_TOOL_NAME,
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
 * Create the propose_profile_updates tool that extracts profile updates from meeting notes.
 */
function createProposeProfileUpdatesTool(customer: CustomerWithNotes) {
  return tool(
    async ({ content, source }) => {
      // Use the same LLM to extract structured data
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
4. Examples of non-schema data worth capturing:
   - estimated_net_worth / "Estimated Net Worth"
   - competitor_advisor / "Current/Previous Advisor"
   - specific_investment_holdings / "Current Holdings Mentioned"
   - family_member_details / "Family Member Details"
   - specific_concerns_verbatim / "Specific Concerns (Verbatim)"
   - estate_planning_notes / "Estate Planning Notes"
   - insurance_coverage_notes / "Insurance Coverage Notes"
5. For each extracted item, include a brief quote from the source text
6. Assign confidence levels:
   - "high": Directly stated (e.g., "earns 60L per year", "net worth around 5Cr")
   - "medium": Strongly implied (e.g., "senior position" implies high income)
   - "low": Inferred with uncertainty
7. Generate a concise note summarizing the key points
8. Generate relevant tags for the note

## Input (${source})
${content}

## Output Format
Return a JSON object with:
{
  "extractedFields": [
    {
      "field": "field_key",
      "value": "extracted value",
      "confidence": "high|medium|low",
      "source": "quote from input"
    }
  ],
  "additionalData": [
    {
      "key": "snake_case_key",
      "label": "Human Readable Label",
      "value": "extracted value",
      "confidence": "high|medium|low",
      "source": "quote from input",
      "category": "optional category like wealth, family, advisor, etc."
    }
  ],
  "noteSummary": "Concise summary of the interaction",
  "noteTags": ["tag1", "tag2"]
}

Only include fields/data where you found relevant information. If nothing can be extracted, return empty arrays.`;

      console.log("[ProfileAgent] Extraction schema sample:", getExtractionSchema().slice(0, 500));

      const response = await extractionModel.invoke([
        { role: "system", content: extractionPrompt },
        { role: "user", content: `Extract profile data from this ${source}: ${content}` },
      ]);

      console.log("[ProfileAgent] LLM extraction response:", response.content);

      // Parse the LLM response
      let extraction: {
        extractedFields: Array<{
          field: string;
          value: unknown;
          confidence: "high" | "medium" | "low";
          source: string;
        }>;
        additionalData: Array<{
          key: string;
          label: string;
          value: unknown;
          confidence: "high" | "medium" | "low";
          source: string;
          category?: string;
        }>;
        noteSummary: string;
        noteTags: string[];
      };

      try {
        const responseText = typeof response.content === "string"
          ? response.content
          : JSON.stringify(response.content);

        // Extract JSON from response (handle markdown code blocks)
        const jsonMatch = responseText.match(/```json\n?([\s\S]*?)\n?```/) ||
          responseText.match(/\{[\s\S]*\}/);

        if (jsonMatch) {
          const jsonStr = jsonMatch[1] || jsonMatch[0];
          extraction = JSON.parse(jsonStr);
          // Ensure additionalData exists (for backwards compatibility)
          if (!extraction.additionalData) {
            extraction.additionalData = [];
          }
        } else {
          extraction = {
            extractedFields: [],
            additionalData: [],
            noteSummary: content.slice(0, 200),
            noteTags: [],
          };
        }
      } catch (e) {
        console.error("[ProfileAgent] Failed to parse extraction response:", e);
        extraction = {
          extractedFields: [],
          additionalData: [],
          noteSummary: content.slice(0, 200),
          noteTags: [],
        };
      }

      console.log("[ProfileAgent] Parsed extraction:", JSON.stringify(extraction, null, 2));

      // Build the proposal with current values for comparison
      const fieldUpdates: ProposedFieldUpdate[] = extraction.extractedFields
        .filter((ef) => {
          const fieldDef = getFieldDefinition(ef.field);
          if (!fieldDef) {
            console.log("[ProfileAgent] Skipping unknown field:", ef.field);
          }
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

      // Build additional data items (non-schema data)
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

      console.log("[ProfileAgent] Additional data items:", additionalData.length);

      const note: ProposedNote = {
        id: nanoid(),
        content: extraction.noteSummary || content.slice(0, 200),
        source: source as "meeting" | "call" | "email" | "voice_note",
        tags: extraction.noteTags || [],
      };

      const proposal: ProfileUpdateProposal = {
        proposalId: nanoid(),
        customerId: customer.id,
        fieldUpdates,
        additionalData,
        note,
        rawInput: content,
        createdAt: new Date().toISOString(),
      };

      return JSON.stringify(proposal);
    },
    {
      name: PROPOSAL_TOOL_NAME,
      description: `Extract profile updates from RM meeting notes, calls, or observations. Use this tool when the RM shares notes about a customer interaction.

This tool will:
1. Extract structured profile field values from the unstructured input
2. Compare with current profile to identify new/changed information
3. Generate a proposal for RM to review and approve

Call this tool when the RM shares:
- Meeting notes or summaries
- Call notes or observations
- Any unstructured information about the customer

The RM will then see a card with proposed updates and can approve/reject each one.`,
      schema: z.object({
        content: z
          .string()
          .describe("The meeting note, observation, or unstructured input from the RM"),
        source: z
          .enum(["meeting", "call", "email", "voice_note"])
          .default("meeting")
          .describe("The source type of this information"),
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
  const proposeProfileUpdatesTool = createProposeProfileUpdatesTool(options.customer);

  console.log("[ProfileAgent] Creating agent with tools...");
  const agent = createAgent({
    model,
    tools: [getCustomerProfileTool, proposeProfileUpdatesTool],
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
  const profileSummary = formatProfileForPrompt(customer);
  const notesSummary = formatNotesForPrompt(customer.notes);
  const missingFields = getMissingHighPriorityFields(customer);

  return `You are a Profile Agent for Samar Capital, a wealth management firm. You help Relationship Managers (RMs) capture and manage customer profiles through natural conversation.

## Your Primary Role
When an RM shares meeting notes, call notes, or observations about a customer:
1. FIRST call \`get_customer_profile\` to fetch the latest customer data from the database
2. THEN use the \`propose_profile_updates\` tool to extract structured profile data
3. The RM will see a card with proposed field updates and can approve/reject each one
4. NEVER auto-save data - always propose changes for RM confirmation

## Tools Available

### \`get_customer_profile\`
**CRITICAL: Always call this tool FIRST before proposing any profile updates.**

This tool fetches the latest customer data from the database. Use it:
- ALWAYS before calling \`propose_profile_updates\` (to ensure you have fresh data)
- When the RM asks about specific customer information
- When you need to check details about a section (goals, income, risk, preferences, etc.)
- When you want to provide accurate data in your responses

### \`propose_profile_updates\`
Use this tool when the RM shares:
- Meeting notes or summaries (e.g., "Just met with the client...")
- Call notes (e.g., "Had a call today...")
- Observations about the customer
- Any unstructured text containing customer information

**IMPORTANT**: Always call \`get_customer_profile\` BEFORE this tool to ensure you have the most up-to-date data.

## Current Customer Context
Customer: ${customer.fullName || "Unknown"}

${missingFields.length > 0 ? `### Profile Gaps (High Priority Fields Missing)
${missingFields.map((f) => `- ${f}`).join("\n")}
` : ""}
## Recent Notes
${notesSummary}

## Guidelines
- **ALWAYS fetch fresh profile data via \`get_customer_profile\` before proposing updates**
- The workflow for processing notes is: get_customer_profile → propose_profile_updates
- For questions about the customer, use get_customer_profile first
- Be conversational and helpful
- Acknowledge when information is missing or incomplete
- Focus on high-priority fields first when extracting data
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
