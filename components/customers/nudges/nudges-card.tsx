"use client";

import React, { useState, useCallback, useMemo } from "react";
import { ChevronRight, MessageSquare, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import type { ExtractionWithNudges, NudgeAnswer } from "@/lib/crm/nudges";
import { NudgeQuestionCard } from "./nudge-question-card";
import { ProgressIndicator } from "./progress-indicator";

interface NudgesCardProps {
  extraction: ExtractionWithNudges;
  onFinalize: (answers: NudgeAnswer[]) => void;
  /** Controlled submitted state from parent */
  submitted?: boolean;
}

/**
 * Card component that displays all follow-up questions for the RM.
 * Allows answering/skipping individual questions and submitting all at once.
 */
export function NudgesCard({ extraction, onFinalize, submitted = false }: NudgesCardProps) {
  const [answers, setAnswers] = useState<Record<string, NudgeAnswer>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Use parent's submitted state if provided, otherwise track locally
  const [localSubmitted, setLocalSubmitted] = useState(false);
  const isSubmitted = submitted || localSubmitted;

  const handleAnswer = useCallback(
    (questionId: string, fieldKey: string, answer: string) => {
      setAnswers((prev) => ({
        ...prev,
        [questionId]: { questionId, fieldKey, answer, skipped: false },
      }));
    },
    []
  );

  const handleSkip = useCallback((questionId: string, fieldKey: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: { questionId, fieldKey, answer: null, skipped: true },
    }));
  }, []);

  const handleSkipAll = useCallback(() => {
    setIsSubmitting(true);
    // Mark all unanswered questions as skipped
    const allAnswers = extraction.nudges.map((q) => {
      if (answers[q.id]) {
        return answers[q.id];
      }
      return {
        questionId: q.id,
        fieldKey: q.fieldKey,
        answer: null,
        skipped: true,
      };
    });
    onFinalize(allAnswers);
    setLocalSubmitted(true);
  }, [extraction.nudges, answers, onFinalize]);

  const handleContinue = useCallback(() => {
    setIsSubmitting(true);
    // Convert answers to array, marking unanswered as skipped
    const allAnswers = extraction.nudges.map((q) => {
      if (answers[q.id]) {
        return answers[q.id];
      }
      return {
        questionId: q.id,
        fieldKey: q.fieldKey,
        answer: null,
        skipped: true,
      };
    });
    onFinalize(allAnswers);
    setLocalSubmitted(true);
  }, [extraction.nudges, answers, onFinalize]);

  // Calculate progress
  const answeredCount = useMemo(() => {
    return Object.values(answers).filter((a) => !a.skipped && a.answer).length;
  }, [answers]);

  const totalCount = extraction.nudges.length;

  // If no nudges, don't render the card
  if (extraction.nudges.length === 0) {
    return null;
  }

  // Show completed state after submission
  if (isSubmitted) {
    return (
      <div className="flex gap-3 justify-start">
        <div className="flex-shrink-0 size-8 rounded-full bg-green-500/10 flex items-center justify-center">
          <CheckCircle2 className="size-4 text-green-600" />
        </div>
        <Card className="max-w-[85%] overflow-hidden bg-muted/30">
          <CardHeader className="py-3">
            <div className="flex items-center gap-2">
              <span className="font-medium text-muted-foreground">Follow-ups Submitted</span>
              <span className="text-xs text-muted-foreground">
                {answeredCount} answered, {totalCount - answeredCount} skipped
              </span>
            </div>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex gap-3 justify-start">
      <div className="flex-shrink-0 size-8 rounded-full bg-primary/10 flex items-center justify-center">
        <MessageSquare className="size-4 text-primary" />
      </div>
      <Card className="max-w-[85%] overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="font-medium">Quick Follow-ups</span>
              <ProgressIndicator current={answeredCount} total={totalCount} />
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            A few questions to help complete the profile. Answer what you know, skip the rest.
          </p>
        </CardHeader>

        <CardContent className="space-y-3 pb-3 max-h-[400px] overflow-y-auto">
          {extraction.nudges.map((nudge) => (
            <NudgeQuestionCard
              key={nudge.id}
              nudge={nudge}
              answer={answers[nudge.id]}
              onAnswer={(answer) => handleAnswer(nudge.id, nudge.fieldKey, answer)}
              onSkip={() => handleSkip(nudge.id, nudge.fieldKey)}
              disabled={isSubmitting}
            />
          ))}
        </CardContent>

        <CardFooter className="border-t pt-3 flex justify-between gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSkipAll}
            disabled={isSubmitting}
          >
            Skip All & Continue
          </Button>
          <Button
            size="sm"
            onClick={handleContinue}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              "Processing..."
            ) : (
              <>
                Continue
                <ChevronRight className="size-4 ml-1" />
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
