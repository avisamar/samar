/**
 * Transform functions to convert agent output to json-render structures.
 */

import type { ProfileUpdateProposal, ProposedFieldUpdate } from "@/lib/crm/extraction-types";
import type { ExtractionWithNudges } from "@/lib/crm/nudges/types";
import type { JsonElement, JsonTree } from "./catalog";

/**
 * Group fields by confidence level.
 */
function groupByConfidence(
  fields: ProposedFieldUpdate[]
): Record<"high" | "medium" | "low", ProposedFieldUpdate[]> {
  return {
    high: fields.filter((f) => f.confidence === "high"),
    medium: fields.filter((f) => f.confidence === "medium"),
    low: fields.filter((f) => f.confidence === "low"),
  };
}

/**
 * Confidence level configuration.
 */
const confidenceConfig = {
  high: {
    label: "High Confidence",
    description: "Clearly stated in the input",
  },
  medium: {
    label: "Medium Confidence",
    description: "Strongly implied",
  },
  low: {
    label: "Needs Review",
    description: "Requires careful verification",
  },
} as const;

/**
 * Transform a ProfileUpdateProposal into a json-render tree.
 */
export function transformProposalToTree(proposal: ProfileUpdateProposal): JsonTree {
  const groupedFields = groupByConfidence(proposal.fieldUpdates);

  // Build confidence groups with field children
  const confidenceGroups: JsonElement[] = [];

  for (const confidence of ["high", "medium", "low"] as const) {
    const fields = groupedFields[confidence];
    if (fields.length === 0) continue;

    const config = confidenceConfig[confidence];
    const fieldElements: JsonElement[] = fields.map((field) => ({
      type: "FieldUpdateCard" as const,
      key: `field-${field.id}`,
      props: {
        fieldId: field.id,
        fieldKey: field.field,
        label: field.label,
        currentValue: field.currentValue,
        proposedValue: field.proposedValue,
        confidence: field.confidence,
        source: field.source,
      },
    }));

    confidenceGroups.push({
      type: "ConfidenceGroup",
      key: `confidence-${confidence}`,
      props: {
        confidence,
        label: config.label,
        description: config.description,
        fieldCount: fields.length,
        defaultOpen: confidence === "low", // Low confidence expanded by default for review
      },
      children: fieldElements,
    });
  }

  // Build additional data elements
  const additionalDataElements: JsonElement[] = (proposal.additionalData || []).map((data) => ({
    type: "AdditionalDataCard" as const,
    key: `additional-${data.id}`,
    props: {
      dataId: data.id,
      key: data.key,
      label: data.label,
      value: data.value,
      confidence: data.confidence,
      source: data.source,
      category: data.category,
    },
  }));

  // Build note element
  const noteElement: JsonElement = {
    type: "NoteProposalCard",
    key: `note-${proposal.note.id}`,
    props: {
      noteId: proposal.note.id,
      content: proposal.note.content,
      source: proposal.note.source,
      tags: proposal.note.tags,
    },
  };

  // Combine all children
  const children: JsonElement[] = [
    ...confidenceGroups,
  ];

  // Add additional data section if present
  if (additionalDataElements.length > 0) {
    children.push(...additionalDataElements);
  }

  // Add note
  children.push(noteElement);

  return {
    root: {
      type: "ProposalCard",
      key: `proposal-${proposal.proposalId}`,
      props: {
        proposalId: proposal.proposalId,
        customerId: proposal.customerId,
        title: "Proposed Profile Updates",
        description: "Review the extracted information and approve or reject each field.",
      },
      children,
    },
  };
}

/**
 * Transform ExtractionWithNudges into a json-render tree for nudges display.
 */
export function transformNudgesToTree(extraction: ExtractionWithNudges): JsonTree {
  const nudgeElements: JsonElement[] = extraction.nudges.map((nudge) => ({
    type: "NudgeQuestionCard" as const,
    key: `nudge-${nudge.id}`,
    props: {
      questionId: nudge.id,
      fieldKey: nudge.fieldKey,
      fieldLabel: nudge.fieldLabel,
      section: nudge.section,
      sectionLabel: nudge.sectionLabel,
      question: nudge.question,
      description: nudge.description,
      why: nudge.why,
    },
  }));

  return {
    root: {
      type: "NudgesCard",
      key: `nudges-${extraction.proposalId}`,
      props: {
        proposalId: extraction.proposalId,
        title: "Quick Follow-ups",
        description: "A few questions to help complete the profile. Answer what you know, skip the rest.",
      },
      children: nudgeElements,
    },
  };
}

/**
 * Extract all field IDs from a proposal for state initialization.
 */
export function extractFieldIds(proposal: ProfileUpdateProposal): string[] {
  return proposal.fieldUpdates.map((f) => f.id);
}

/**
 * Extract all additional data IDs from a proposal for state initialization.
 */
export function extractAdditionalDataIds(proposal: ProfileUpdateProposal): string[] {
  return (proposal.additionalData || []).map((d) => d.id);
}

/**
 * Extract all nudge IDs from an extraction for state initialization.
 */
export function extractNudgeIds(extraction: ExtractionWithNudges): string[] {
  return extraction.nudges.map((n) => n.id);
}

/**
 * Get nudge fieldKey map for answers.
 */
export function getNudgeFieldKeyMap(extraction: ExtractionWithNudges): Record<string, string> {
  return Object.fromEntries(extraction.nudges.map((n) => [n.id, n.fieldKey]));
}
