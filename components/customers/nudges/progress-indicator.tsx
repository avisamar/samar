"use client";

import { cn } from "@/lib/utils";

interface ProgressIndicatorProps {
  current: number;
  total: number;
}

/**
 * Progress indicator showing dots and count for nudge questions.
 */
export function ProgressIndicator({ current, total }: ProgressIndicatorProps) {
  // Limit dots to 10 max for visual clarity
  const dotsToShow = Math.min(total, 10);

  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-1">
        {Array.from({ length: dotsToShow }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "size-1.5 rounded-full transition-colors",
              i < current ? "bg-primary" : "bg-muted-foreground/30"
            )}
          />
        ))}
      </div>
      <span className="text-xs text-muted-foreground">
        {current} of {total}
      </span>
    </div>
  );
}
