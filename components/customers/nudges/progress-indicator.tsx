"use client";

import { cn } from "@/lib/utils";

interface ProgressIndicatorProps {
  answered: number;
  skipped: number;
  total: number;
}

/**
 * Progress indicator showing dots and count for nudge questions.
 * Dots show three states: answered (primary), skipped (gray), remaining (faint).
 */
export function ProgressIndicator({ answered, skipped, total }: ProgressIndicatorProps) {
  // Limit dots to 10 max for visual clarity
  const dotsToShow = Math.min(total, 10);
  const remaining = total - answered - skipped;

  // Build status text
  const parts: string[] = [];
  if (answered > 0) parts.push(`${answered} answered`);
  if (skipped > 0) parts.push(`${skipped} skipped`);
  if (remaining > 0) parts.push(`${remaining} remaining`);
  const statusText = parts.length > 0 ? parts.join(", ") : `${total} questions`;

  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-1">
        {Array.from({ length: dotsToShow }).map((_, i) => {
          let colorClass: string;
          if (i < answered) {
            colorClass = "bg-primary"; // Answered
          } else if (i < answered + skipped) {
            colorClass = "bg-muted-foreground/50"; // Skipped
          } else {
            colorClass = "bg-muted-foreground/20"; // Remaining
          }
          return (
            <div
              key={i}
              className={cn("size-1.5 rounded-full transition-colors", colorClass)}
            />
          );
        })}
      </div>
      <span className="text-xs text-muted-foreground">{statusText}</span>
    </div>
  );
}
