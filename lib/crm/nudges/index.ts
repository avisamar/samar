// Types
export type {
  FieldScore,
  NudgeQuestion,
  NudgeAnswer,
  ExtractedField,
  ExtractedAdditionalData,
  Extraction,
  ExtractionWithNudges,
} from "./types";

// Re-export ExtractedInterest for convenience
export type { ExtractedInterest } from "../interest-types";

export {
  EXTRACT_AND_NUDGES_TOOL_NAME,
  FINALIZE_PROPOSAL_TOOL_NAME,
  isExtractionWithNudges,
} from "./types";

// Scoring
export {
  calculateFieldScore,
  scoreEmptyFields,
  selectTopFields,
  getScoreThreshold,
} from "./scoring";

// Deduplication
export {
  removeExtractedFields,
  prioritizeSectionsWithExtractions,
  deduplicateFields,
} from "./deduplication";

// Question generation
export { generateQuestions } from "./question-generation";
