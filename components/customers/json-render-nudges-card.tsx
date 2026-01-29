"use client";

/**
 * NudgesCard component using json-render.
 * Wraps the json-render infrastructure to render follow-up questions.
 */

import React, { useMemo, useCallback } from "react";
import type { ExtractionWithNudges, NudgeAnswer } from "@/lib/crm/nudges";
import {
  ProfileAgentProvider,
  transformNudgesToTree,
  extractNudgeIds,
  NudgesRenderer,
} from "@/lib/json-render";

interface NudgesCardProps {
  extraction: ExtractionWithNudges;
  onFinalize: (answers: NudgeAnswer[]) => void;
  /** Controlled submitted state from parent */
  submitted?: boolean;
}

/**
 * NudgesCard renders follow-up questions using json-render.
 */
export function NudgesCard({ extraction, onFinalize, submitted = false }: NudgesCardProps) {
  // Transform extraction to json-render tree
  const tree = useMemo(() => transformNudgesToTree(extraction), [extraction]);

  // Extract IDs for state initialization
  const nudgeIds = useMemo(() => extractNudgeIds(extraction), [extraction]);

  // Handle finalize
  const handleFinalize = useCallback(
    (answers: Array<{ questionId: string; fieldKey: string; answer: string | null; skipped: boolean }>) => {
      // Map back to the full NudgeAnswer format with fieldKey
      const fullAnswers: NudgeAnswer[] = extraction.nudges.map((nudge) => {
        const answer = answers.find((a) => a.questionId === nudge.id);
        if (answer) {
          return {
            questionId: answer.questionId,
            fieldKey: nudge.fieldKey,
            answer: answer.answer,
            skipped: answer.skipped,
          };
        }
        return {
          questionId: nudge.id,
          fieldKey: nudge.fieldKey,
          answer: null,
          skipped: true,
        };
      });

      onFinalize(fullAnswers);
    },
    [extraction.nudges, onFinalize]
  );

  // If no nudges, don't render
  if (extraction.nudges.length === 0) {
    return null;
  }

  return (
    <ProfileAgentProvider
      initialNudgeIds={nudgeIds}
      initialSubmitted={submitted}
      onFinalize={handleFinalize}
    >
      <NudgesRenderer tree={tree} />
    </ProfileAgentProvider>
  );
}
