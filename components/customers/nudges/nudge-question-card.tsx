"use client";

import React, { useState } from "react";
import { HelpCircle, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { NudgeQuestion, NudgeAnswer } from "@/lib/crm/nudges";

interface NudgeQuestionCardProps {
  nudge: NudgeQuestion;
  answer?: NudgeAnswer;
  onAnswer: (answer: string) => void;
  onSkip: () => void;
  disabled?: boolean;
}

/**
 * A single question card within the nudges list.
 * Shows the question, description, why, and input controls.
 */
export function NudgeQuestionCard({
  nudge,
  answer,
  onAnswer,
  onSkip,
  disabled = false,
}: NudgeQuestionCardProps) {
  const [input, setInput] = useState("");
  const isAnswered = answer && !answer.skipped && answer.answer;
  const isSkipped = answer?.skipped;
  const isDone = isAnswered || isSkipped || disabled;

  const handleSubmit = () => {
    if (input.trim()) {
      onAnswer(input.trim());
      setInput("");
    }
  };

  return (
    <div
      className={cn(
        "rounded-lg border bg-card p-4 space-y-3 transition-all",
        isDone && "opacity-60 bg-muted/30"
      )}
    >
      {/* Section badge */}
      <div className="flex items-center justify-between">
        <Badge variant="outline" className="text-xs font-normal">
          {nudge.sectionLabel}
        </Badge>
        {isAnswered && (
          <div className="flex items-center gap-1 text-xs text-green-600">
            <Check className="size-3" />
            <span>Answered</span>
          </div>
        )}
        {isSkipped && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <X className="size-3" />
            <span>Skipped</span>
          </div>
        )}
      </div>

      {/* Question */}
      <div>
        <p className="text-sm font-medium leading-snug">{nudge.question}</p>
        {nudge.description && (
          <p className="text-xs text-muted-foreground mt-1">{nudge.description}</p>
        )}
      </div>

      {/* Why this matters */}
      <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 rounded-md px-2 py-1.5">
        <HelpCircle className="size-3 mt-0.5 flex-shrink-0 text-muted-foreground/70" />
        <span>{nudge.why}</span>
      </div>

      {/* Input area - only show if not done */}
      {!isDone && (
        <div className="space-y-2 pt-1">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your answer..."
            className="w-full px-3 py-2 text-sm bg-background border rounded-md outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring"
            onKeyDown={(e) => {
              if (e.key === "Enter" && input.trim()) {
                handleSubmit();
              }
            }}
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSubmit} disabled={!input.trim()}>
              Answer
            </Button>
            <Button size="sm" variant="ghost" onClick={onSkip}>
              Skip
            </Button>
          </div>
        </div>
      )}

      {/* Show answer if answered */}
      {isAnswered && answer?.answer && (
        <div className="text-sm bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md px-3 py-2">
          <span className="text-green-700 dark:text-green-300">{answer.answer}</span>
        </div>
      )}
    </div>
  );
}
