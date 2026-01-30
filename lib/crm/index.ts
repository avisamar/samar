// CRM Repository exports
export { crmRepository } from "./repository";
export type { CrmRepository } from "./repository";

// Artifact Repository exports
export { artifactRepository } from "./artifact-repository";
export type { ArtifactRepository } from "./artifact-repository";

// Interest Repository exports
export { interestRepository } from "./interest-repository";
export type { InterestRepository } from "./interest-repository";

// Types
export type {
  Customer,
  NewCustomer,
  CustomerNote,
  NewCustomerNote,
  CustomerWithNotes,
  ListOptions,
  NoteInput,
  CustomerProfileUpdate,
} from "./types";

// Artifact types
export {
  ARTIFACT_TYPES,
  CREATOR_TYPES,
  PROFILE_EDIT_STATUSES,
} from "./artifact-types";
export type {
  ArtifactType,
  CreatorType,
  ProfileEditStatus,
  ProfileEditPayload,
  InterestProposalPayload,
  CreateProfileEditInput,
  CreateInterestProposalInput,
  ListArtifactsOptions,
} from "./artifact-types";

// Interest types
export {
  INTEREST_CATEGORIES,
  INTEREST_STATUSES,
  INTEREST_SOURCE_TYPES,
  PERSONAL_INTEREST_TAGS,
  FINANCIAL_INTEREST_TAGS,
  INTEREST_AUDIT_ACTIONS,
  INTEREST_ACTOR_TYPES,
} from "./interest-types";
export type {
  InterestCategory,
  InterestStatus,
  InterestSourceType,
  ExtractedInterest,
  PersonalInterestTag,
  FinancialInterestTag,
  InterestProposal,
  ConfirmedInterest,
  CreateManualInterestInput,
  ConfirmInterestInput,
  UpdateInterestInput,
  ListInterestsOptions,
  InterestAuditAction,
  InterestActorType,
} from "./interest-types";

// Completeness utilities
export {
  calculateCompleteness,
  getCompletenessColor,
  getCompletenessBgColor,
} from "./completeness";
export type { ProfileCompleteness } from "./completeness";

// Section definitions
export {
  PROFILE_SECTIONS,
  calculateSectionCompleteness,
  getSectionCompletenessColor,
  getSectionCompletenessBgColor,
} from "./sections";
export type { SectionDefinition, FieldDefinition } from "./sections";
