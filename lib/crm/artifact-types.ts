/**
 * Types and constants for the artifact model.
 * Artifacts are persistent records of agent-proposed changes.
 */

// =============================================================================
// Constants
// =============================================================================

export const ARTIFACT_TYPES = {
  PROFILE_EDIT: "profile_edit",
  INTEREST_PROPOSAL: "interest_proposal",
} as const;

export type ArtifactType = (typeof ARTIFACT_TYPES)[keyof typeof ARTIFACT_TYPES];

export const CREATOR_TYPES = {
  AGENT: "agent",
  ADMIN: "admin",
  SYSTEM: "system",
} as const;

export type CreatorType = (typeof CREATOR_TYPES)[keyof typeof CREATOR_TYPES];

export const PROFILE_EDIT_STATUSES = {
  PENDING: "pending",
  ACCEPTED: "accepted",
  REJECTED: "rejected",
  EDITED: "edited",
} as const;

export type ProfileEditStatus =
  (typeof PROFILE_EDIT_STATUSES)[keyof typeof PROFILE_EDIT_STATUSES];

// =============================================================================
// Payload Types
// =============================================================================

/**
 * Payload for profile edit artifacts.
 * One artifact = one field update proposal.
 */
export interface ProfileEditPayload {
  /** The data_key from the customer schema */
  field_key: string;
  /** Human-readable label for the field */
  field_display_name: string;
  /** Value proposed by the agent */
  proposed_value: unknown;
  /** Value in the profile at time of proposal (null if empty) */
  previous_value: unknown;
  /** Quote from the source text that led to this extraction */
  source_text: string;
  /** Confidence level based on clarity of source text */
  confidence?: "high" | "medium" | "low";
  /** Value after RM edits (filled when status is "edited") */
  edited_value?: unknown;
}

/**
 * Payload for interest proposal artifacts.
 * One artifact = one interest suggestion.
 */
export interface InterestProposalPayload {
  /** Interest category */
  category: "personal" | "financial";
  /** Short label for the interest (e.g., "Golf", "Retirement Planning") */
  label: string;
  /** Longer description or context */
  description?: string;
  /** Quote from the source text that led to this extraction */
  source_text: string;
  /** Confidence level based on clarity of source text */
  confidence: "high" | "medium" | "low";
  /** Value after RM edits (filled when status is "edited") */
  edited_label?: string;
  /** Description after RM edits */
  edited_description?: string;
}

// =============================================================================
// Input Types
// =============================================================================

/**
 * Input for creating a single profile edit artifact.
 */
export interface CreateProfileEditInput {
  customerId: string;
  rmId?: string;
  batchId: string;
  createdByType: CreatorType;
  createdById?: string;
  payload: ProfileEditPayload;
}

/**
 * Input for creating a single interest proposal artifact.
 */
export interface CreateInterestProposalInput {
  customerId: string;
  rmId?: string;
  batchId: string;
  createdByType: CreatorType;
  createdById?: string;
  payload: InterestProposalPayload;
}

/**
 * Options for listing artifacts.
 */
export interface ListArtifactsOptions {
  status?: ProfileEditStatus | ProfileEditStatus[];
  artifactType?: ArtifactType;
  limit?: number;
  offset?: number;
}
