/**
 * Type definitions for the interest extraction feature.
 * Interests are extracted by specialized agents and proposed for RM confirmation.
 */

// =============================================================================
// Interest Categories
// =============================================================================

export const INTEREST_CATEGORIES = {
  PERSONAL: "personal",
  FINANCIAL: "financial",
} as const;

export type InterestCategory =
  (typeof INTEREST_CATEGORIES)[keyof typeof INTEREST_CATEGORIES];

// =============================================================================
// Interest Status
// =============================================================================

export const INTEREST_STATUSES = {
  ACTIVE: "active",
  ARCHIVED: "archived",
} as const;

export type InterestStatus =
  (typeof INTEREST_STATUSES)[keyof typeof INTEREST_STATUSES];

// =============================================================================
// Interest Source Types
// =============================================================================

export const INTEREST_SOURCE_TYPES = {
  SYSTEM_SUGGESTED: "system_suggested",
  MANUAL: "manual",
} as const;

export type InterestSourceType =
  (typeof INTEREST_SOURCE_TYPES)[keyof typeof INTEREST_SOURCE_TYPES];

// =============================================================================
// Extracted Interest (from agent)
// =============================================================================

/**
 * An interest extracted by an interest agent from RM notes.
 * This is the output format from the extraction tools.
 */
export interface ExtractedInterest {
  /** Unique identifier for this extraction */
  id: string;
  /** Interest category */
  category: InterestCategory;
  /** Short label for the interest */
  label: string;
  /** Longer description or context */
  description?: string;
  /** Quote from the source text that led to this extraction */
  sourceText: string;
  /** Confidence level based on clarity of source text */
  confidence: "high" | "medium" | "low";
}

// =============================================================================
// Personal Interest Subcategories
// =============================================================================

/**
 * Personal interests relate to hobbies, lifestyle, and preferences.
 */
export const PERSONAL_INTEREST_TAGS = [
  "hobby",
  "sport",
  "travel",
  "entertainment",
  "food_wine",
  "art_culture",
  "health_wellness",
  "social",
  "family",
  "philanthropy",
  "education",
  "other",
] as const;

export type PersonalInterestTag = (typeof PERSONAL_INTEREST_TAGS)[number];

// =============================================================================
// Financial Interest Subcategories
// =============================================================================

/**
 * Financial interests relate to investment goals, concerns, and curiosities.
 */
export const FINANCIAL_INTEREST_TAGS = [
  "retirement",
  "education_funding",
  "wealth_preservation",
  "wealth_growth",
  "real_estate",
  "business",
  "tax_planning",
  "estate_planning",
  "insurance",
  "philanthropy",
  "passive_income",
  "market_curiosity",
  "other",
] as const;

export type FinancialInterestTag = (typeof FINANCIAL_INTEREST_TAGS)[number];

// =============================================================================
// Interest Proposal (for UI)
// =============================================================================

/**
 * An interest proposal for RM review.
 * Includes the artifact ID for tracking.
 */
export interface InterestProposal {
  /** Unique identifier for this proposal */
  id: string;
  /** ID of the persisted artifact */
  artifactId?: string;
  /** Interest category */
  category: InterestCategory;
  /** Short label for the interest */
  label: string;
  /** Longer description or context */
  description?: string;
  /** Quote from the source text */
  sourceText: string;
  /** Confidence level */
  confidence: "high" | "medium" | "low";
}

// =============================================================================
// Confirmed Interest (from database)
// =============================================================================

/**
 * A confirmed customer interest stored in the database.
 * Matches the database schema structure.
 */
export interface ConfirmedInterest {
  id: string;
  customerId: string;
  createdByRmId?: string | null;
  category: InterestCategory;
  label: string;
  description?: string | null;
  sourceType: InterestSourceType;
  sourceArtifactId?: string | null;
  sourceText?: string | null;
  confidence?: "high" | "medium" | "low" | null;
  status: InterestStatus;
  createdAt: Date;
  updatedAt: Date;
}

// =============================================================================
// Input Types
// =============================================================================

/**
 * Input for creating a manual interest entry.
 */
export interface CreateManualInterestInput {
  customerId: string;
  rmId: string;
  category: InterestCategory;
  label: string;
  description?: string;
}

/**
 * Input for confirming an interest from an artifact.
 */
export interface ConfirmInterestInput {
  artifactId: string;
  rmId: string;
  /** Optional override for the label */
  label?: string;
  /** Optional override for the description */
  description?: string;
}

/**
 * Input for updating an existing interest.
 */
export interface UpdateInterestInput {
  label?: string;
  description?: string;
}

// =============================================================================
// List Options
// =============================================================================

/**
 * Options for listing interests.
 */
export interface ListInterestsOptions {
  status?: InterestStatus | InterestStatus[];
  category?: InterestCategory;
  limit?: number;
  offset?: number;
}

// =============================================================================
// Audit Types
// =============================================================================

export const INTEREST_AUDIT_ACTIONS = {
  CREATED: "created",
  CONFIRMED: "confirmed",
  EDITED: "edited",
  ARCHIVED: "archived",
} as const;

export type InterestAuditAction =
  (typeof INTEREST_AUDIT_ACTIONS)[keyof typeof INTEREST_AUDIT_ACTIONS];

export const INTEREST_ACTOR_TYPES = {
  RM: "rm",
  SYSTEM: "system",
  ADMIN: "admin",
} as const;

export type InterestActorType =
  (typeof INTEREST_ACTOR_TYPES)[keyof typeof INTEREST_ACTOR_TYPES];
