/**
 * json-render catalog for profile agent dynamic UIs.
 * Defines all components and actions available for rendering.
 */

import { z } from "zod";

/**
 * Component schemas for the profile agent UI.
 * These define the structure of props each component accepts.
 */
export const componentSchemas = {
  // Layout components
  ProposalCard: z.object({
    proposalId: z.string(),
    customerId: z.string(),
    title: z.string().default("Proposed Profile Updates"),
    description: z.string().default("Review the extracted information and approve or reject each field."),
  }),

  NudgesCard: z.object({
    proposalId: z.string(),
    title: z.string().default("Quick Follow-ups"),
    description: z.string().default("A few questions to help complete the profile. Answer what you know, skip the rest."),
  }),

  ConfidenceGroup: z.object({
    confidence: z.enum(["high", "medium", "low"]),
    label: z.string(),
    description: z.string(),
    fieldCount: z.number(),
    defaultOpen: z.boolean().default(true),
  }),

  // Field components
  FieldUpdateCard: z.object({
    fieldId: z.string(),
    fieldKey: z.string(),
    label: z.string(),
    currentValue: z.unknown().nullable(),
    proposedValue: z.unknown(),
    confidence: z.enum(["high", "medium", "low"]),
    source: z.string(),
  }),

  AdditionalDataCard: z.object({
    dataId: z.string(),
    key: z.string(),
    label: z.string(),
    value: z.unknown(),
    confidence: z.enum(["high", "medium", "low"]),
    source: z.string(),
    category: z.string().optional(),
  }),

  InterestProposalCard: z.object({
    interestId: z.string(),
    category: z.enum(["personal", "financial"]),
    label: z.string(),
    description: z.string().optional(),
    sourceText: z.string(),
    confidence: z.enum(["high", "medium", "low"]),
  }),

  NoteProposalCard: z.object({
    noteId: z.string(),
    content: z.string(),
    source: z.enum(["meeting", "call", "email", "voice_note"]),
    tags: z.array(z.string()),
  }),

  // Nudge components
  NudgeQuestionCard: z.object({
    questionId: z.string(),
    fieldKey: z.string(),
    fieldLabel: z.string(),
    section: z.string(),
    sectionLabel: z.string(),
    question: z.string(),
    description: z.string().optional(),
    why: z.string(),
  }),

  // Status components
  ProgressIndicator: z.object({
    answered: z.number(),
    skipped: z.number(),
    total: z.number(),
  }),

  StatusBadge: z.object({
    status: z.enum(["pending", "accepted", "rejected"]),
    count: z.number().optional(),
  }),

  ConfidenceBadge: z.object({
    confidence: z.enum(["high", "medium", "low"]),
  }),

  // Success state
  SuccessCard: z.object({
    message: z.string(),
    fieldsUpdated: z.number().optional(),
    additionalDataAdded: z.number().optional(),
    noteCreated: z.boolean().optional(),
  }),

  SubmittedCard: z.object({
    message: z.string(),
    answeredCount: z.number(),
    skippedCount: z.number(),
  }),
} as const;

/**
 * Action schemas for the profile agent UI.
 * These define the parameters each action accepts.
 */
export const actionSchemas = {
  // Field actions
  acceptField: z.object({
    fieldId: z.string(),
  }),

  rejectField: z.object({
    fieldId: z.string(),
  }),

  editField: z.object({
    fieldId: z.string(),
    value: z.unknown(),
  }),

  // Additional data actions
  acceptAdditionalData: z.object({
    dataId: z.string(),
  }),

  rejectAdditionalData: z.object({
    dataId: z.string(),
  }),

  editAdditionalData: z.object({
    dataId: z.string(),
    value: z.unknown(),
  }),

  // Interest actions
  acceptInterest: z.object({
    interestId: z.string(),
  }),

  rejectInterest: z.object({
    interestId: z.string(),
  }),

  editInterest: z.object({
    interestId: z.string(),
    label: z.string().optional(),
    description: z.string().optional(),
  }),

  // Note actions
  acceptNote: z.object({}),

  rejectNote: z.object({}),

  editNote: z.object({
    content: z.string(),
  }),

  // Apply proposal
  applyUpdates: z.object({
    proposalId: z.string(),
    customerId: z.string(),
  }),

  // Nudge actions
  answerQuestion: z.object({
    questionId: z.string(),
    fieldKey: z.string(),
    answer: z.string(),
  }),

  skipQuestion: z.object({
    questionId: z.string(),
    fieldKey: z.string(),
  }),

  submitAnswers: z.object({
    proposalId: z.string(),
  }),
} as const;

/**
 * Types derived from schemas.
 */
export type ComponentName = keyof typeof componentSchemas;
export type ActionName = keyof typeof actionSchemas;

export type ComponentProps<T extends ComponentName> = z.infer<typeof componentSchemas[T]>;
export type ActionParams<T extends ActionName> = z.infer<typeof actionSchemas[T]>;

/**
 * JSON element structure for json-render.
 */
export interface JsonElement {
  type: ComponentName;
  key?: string;
  props: Record<string, unknown>;
  children?: JsonElement[];
  visibility?: {
    path?: string;
    auth?: string;
    and?: Array<{ path: string; op?: string; value?: unknown }>;
  };
}

/**
 * JSON tree structure for json-render.
 */
export interface JsonTree {
  root: JsonElement;
}
