/**
 * Types for profile extraction and update proposals.
 * Used by the profile agent to propose updates from meeting notes.
 */

export interface ProposedFieldUpdate {
  /** Unique identifier for this field update */
  id: string;
  /** The data_key from the customer schema */
  field: string;
  /** Human-readable label for the field */
  label: string;
  /** Current value in the profile (null if not set) */
  currentValue: unknown;
  /** Value extracted from the meeting note */
  proposedValue: unknown;
  /** Confidence level based on clarity of source text */
  confidence: "high" | "medium" | "low";
  /** Quote from the input that led to this extraction */
  source: string;
}

export interface ProposedNote {
  /** Unique identifier for this note */
  id: string;
  /** Summarized note content */
  content: string;
  /** Source type of the original input */
  source: "meeting" | "call" | "email" | "voice_note";
  /** Auto-generated tags based on content */
  tags: string[];
}

export interface ProfileUpdateProposal {
  /** Unique identifier for this proposal batch */
  proposalId: string;
  /** Customer ID this proposal is for */
  customerId: string;
  /** List of proposed field updates */
  fieldUpdates: ProposedFieldUpdate[];
  /** Proposed note to attach */
  note: ProposedNote;
  /** Original raw input from the RM */
  rawInput: string;
  /** Timestamp when proposal was created */
  createdAt: string;
}

/** Request to apply approved updates */
export interface ApplyUpdatesRequest {
  /** The proposal ID being actioned */
  proposalId: string;
  /** IDs of field updates that were approved */
  approvedFieldIds: string[];
  /** Whether the note was approved */
  approvedNote: boolean;
  /** Any edited values (field ID -> new value) */
  editedValues?: Record<string, unknown>;
  /** Edited note content (if note was edited) */
  editedNoteContent?: string;
}

/** Response from applying updates */
export interface ApplyUpdatesResponse {
  success: boolean;
  /** Number of profile fields updated */
  fieldsUpdated: number;
  /** Whether a note was created */
  noteCreated: boolean;
  /** Any errors encountered */
  errors?: string[];
}

/** Tool output type marker for UI detection */
export const PROPOSAL_TOOL_NAME = "propose_profile_updates";

/** Check if a tool result is a profile update proposal */
export function isProfileUpdateProposal(
  toolName: string | undefined,
  content: unknown
): content is ProfileUpdateProposal {
  if (toolName !== PROPOSAL_TOOL_NAME) return false;
  if (!content || typeof content !== "object") return false;
  const obj = content as Record<string, unknown>;
  return (
    typeof obj.proposalId === "string" &&
    typeof obj.customerId === "string" &&
    Array.isArray(obj.fieldUpdates) &&
    obj.note !== undefined
  );
}
