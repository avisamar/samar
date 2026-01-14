// CRM Repository exports
export {
  crmRepository,
  getCrmRepository,
  createCrmRepository,
  DrizzleCrmRepository,
  ExternalCrmRepository,
} from "./repository";
export type { ICrmRepository, CrmRepositoryConfig } from "./repository";

// Backward compatibility - CrmRepository type alias
export type { ICrmRepository as CrmRepository } from "./repository";

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
