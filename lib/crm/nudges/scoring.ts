/**
 * Scoring module for selecting which fields to ask follow-up questions about.
 *
 * Formula: Score = Priority + (SectionCompleteness² × 3)
 * - Priority: High=3, Medium=2, Low=1
 * - SectionCompleteness: 0-1 (percentage as decimal)
 *
 * This rewards fields in nearly-complete sections, encouraging the RM
 * to "finish" a section rather than jumping around.
 */

import { PROFILE_SECTIONS, calculateSectionCompleteness } from "../sections";
import { isFieldEmpty, getFieldValue } from "../field-mapping";
import type { Customer } from "../types";
import type { FieldScore } from "./types";

/**
 * Priority weight mapping.
 */
const PRIORITY_WEIGHTS: Record<"high" | "medium" | "low", number> = {
  high: 3,
  medium: 2,
  low: 1,
};

/**
 * Calculate the score for a single field.
 * Score = Priority + (SectionCompleteness² × 3)
 */
export function calculateFieldScore(
  priority: "high" | "medium" | "low",
  sectionCompletenessPercent: number
): number {
  const priorityScore = PRIORITY_WEIGHTS[priority];
  const completenessDecimal = sectionCompletenessPercent / 100;
  const completenessBoost = Math.pow(completenessDecimal, 2) * 3;
  return priorityScore + completenessBoost;
}

/**
 * Get all empty fields with their scores.
 * Returns fields sorted by score (descending).
 */
export function scoreEmptyFields(customer: Customer): FieldScore[] {
  const scores: FieldScore[] = [];

  for (const section of PROFILE_SECTIONS) {
    const completeness = calculateSectionCompleteness(customer, section);

    for (const field of section.fields) {
      const value = getFieldValue(customer, field.key);
      const empty = isFieldEmpty(value);

      if (empty) {
        const score = calculateFieldScore(field.priority, completeness.percentage);

        scores.push({
          fieldKey: field.key,
          fieldLabel: field.label,
          section: section.id,
          sectionLabel: section.label,
          priority: field.priority,
          sectionCompleteness: completeness.percentage,
          score,
        });
      }
    }
  }

  // Sort by score descending
  return scores.sort((a, b) => b.score - a.score);
}

/**
 * Select top-scored fields for nudges.
 * Returns top 20% of scores, capped at maxQuestions.
 */
export function selectTopFields(
  scores: FieldScore[],
  maxQuestions: number = 10
): FieldScore[] {
  if (scores.length === 0) return [];

  // Take top 20%
  const top20PercentCount = Math.ceil(scores.length * 0.2);
  const selectedCount = Math.min(top20PercentCount, maxQuestions);

  // Scores should already be sorted, but ensure it
  const sorted = [...scores].sort((a, b) => b.score - a.score);

  return sorted.slice(0, selectedCount);
}

/**
 * Get the minimum score threshold for a field to be included.
 * This is the score of the last field in the top 20%.
 */
export function getScoreThreshold(scores: FieldScore[]): number {
  const topFields = selectTopFields(scores);
  if (topFields.length === 0) return 0;
  return topFields[topFields.length - 1].score;
}
