/**
 * Deduplication module for removing already-extracted fields from nudge candidates.
 *
 * When the RM's input already contains information about a field,
 * we shouldn't ask about it again. Instead, we show other high-scoring
 * fields from the same section to help complete it.
 */

import type { FieldScore } from "./types";

/**
 * Remove fields that were already extracted from the RM's input.
 *
 * @param scoredFields - All scored empty fields
 * @param extractedFieldKeys - Field keys that were extracted from the input
 * @returns Filtered list with extracted fields removed
 */
export function removeExtractedFields(
  scoredFields: FieldScore[],
  extractedFieldKeys: string[]
): FieldScore[] {
  const extractedSet = new Set(extractedFieldKeys);
  return scoredFields.filter((field) => !extractedSet.has(field.fieldKey as string));
}

/**
 * Get alternative fields from the same sections as the extracted fields.
 * This helps complete sections when the RM has started providing info.
 *
 * @param scoredFields - All scored fields (already deduplicated)
 * @param extractedFieldKeys - Field keys that were extracted
 * @param allScoredFields - Original list with section info
 * @returns Fields from sections that have extracted data
 */
export function prioritizeSectionsWithExtractions(
  scoredFields: FieldScore[],
  extractedFieldKeys: string[],
  allScoredFields: FieldScore[]
): FieldScore[] {
  // Find sections that have extracted fields
  const sectionsWithData = new Set<string>();
  for (const key of extractedFieldKeys) {
    const field = allScoredFields.find((f) => f.fieldKey === key);
    if (field) {
      sectionsWithData.add(field.section);
    }
  }

  // If no sections have data, return as-is
  if (sectionsWithData.size === 0) {
    return scoredFields;
  }

  // Boost fields from sections with extracted data
  // by sorting them to the front while maintaining relative score order
  return [...scoredFields].sort((a, b) => {
    const aInSection = sectionsWithData.has(a.section);
    const bInSection = sectionsWithData.has(b.section);

    // If both or neither are in extraction sections, sort by score
    if (aInSection === bInSection) {
      return b.score - a.score;
    }

    // Prioritize fields in extraction sections
    return aInSection ? -1 : 1;
  });
}

/**
 * Full deduplication pipeline.
 *
 * 1. Remove extracted fields
 * 2. Optionally prioritize sections with extractions
 *
 * @param scoredFields - All scored empty fields
 * @param extractedFieldKeys - Field keys that were extracted
 * @param prioritizeSections - Whether to boost fields from sections with extractions
 * @returns Deduplicated and optionally re-prioritized fields
 */
export function deduplicateFields(
  scoredFields: FieldScore[],
  extractedFieldKeys: string[],
  prioritizeSections: boolean = true
): FieldScore[] {
  // Step 1: Remove extracted fields
  const filtered = removeExtractedFields(scoredFields, extractedFieldKeys);

  // Step 2: Optionally prioritize sections with extractions
  if (prioritizeSections && extractedFieldKeys.length > 0) {
    return prioritizeSectionsWithExtractions(
      filtered,
      extractedFieldKeys,
      scoredFields
    );
  }

  return filtered;
}
