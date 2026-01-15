/**
 * Type definitions for the nudges (follow-up questions) feature.
 */

import type { Customer } from "../types";

/**
 * A scored field for nudge selection.
 * Used to rank empty fields by importance.
 */
export interface FieldScore {
  fieldKey: keyof Customer;
  fieldLabel: string;
  section: string;
  sectionLabel: string;
  priority: "high" | "medium" | "low";
  sectionCompleteness: number; // 0-100 percentage
  score: number; // Calculated score for ranking
}

/**
 * A follow-up question to ask the RM.
 */
export interface NudgeQuestion {
  id: string;
  fieldKey: string;
  fieldLabel: string;
  section: string;
  sectionLabel: string;
  question: string; // Human-like question text
  description?: string; // Additional context or example
  why: string; // Explanation of why this field matters
}

/**
 * RM's answer to a nudge question.
 */
export interface NudgeAnswer {
  questionId: string;
  fieldKey: string;
  answer: string | null; // null if skipped
  skipped: boolean;
}

/**
 * Extracted field from RM input.
 */
export interface ExtractedField {
  field: string;
  value: unknown;
  confidence: "high" | "medium" | "low";
  source: string; // Quote from input
}

/**
 * Extracted additional data (non-schema).
 */
export interface ExtractedAdditionalData {
  key: string;
  label: string;
  value: unknown;
  confidence: "high" | "medium" | "low";
  source: string;
  category?: string;
}

/**
 * Extraction result from initial RM input.
 */
export interface Extraction {
  extractedFields: ExtractedField[];
  additionalData: ExtractedAdditionalData[];
  noteSummary: string;
  noteTags: string[];
}

/**
 * Result from extract_and_generate_nudges tool.
 * Contains both extracted data and follow-up questions.
 */
export interface ExtractionWithNudges {
  proposalId: string;
  customerId: string;
  extraction: Extraction;
  nudges: NudgeQuestion[];
  rawInput: string;
  source: "meeting" | "call" | "email" | "voice_note";
  createdAt: string;
}

/**
 * Tool name constants.
 */
export const EXTRACT_AND_NUDGES_TOOL_NAME = "extract_and_generate_nudges";
export const FINALIZE_PROPOSAL_TOOL_NAME = "finalize_proposal";

/**
 * Type guard for ExtractionWithNudges.
 */
export function isExtractionWithNudges(
  toolName: string | undefined,
  content: unknown
): content is ExtractionWithNudges {
  if (toolName !== EXTRACT_AND_NUDGES_TOOL_NAME) return false;
  if (!content || typeof content !== "object") return false;
  const obj = content as Record<string, unknown>;
  return (
    typeof obj.proposalId === "string" &&
    typeof obj.customerId === "string" &&
    obj.extraction !== undefined &&
    Array.isArray(obj.nudges)
  );
}
