import * as React from "react";
import { cn } from "@/lib/utils";

export interface ProgressBarProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Progress value from 0 to 100 */
  value: number;
  /** Whether to show the percentage label */
  showLabel?: boolean;
  /** Size variant */
  size?: "sm" | "default" | "lg";
}

function getProgressColor(value: number): string {
  if (value < 25) {
    return "bg-red-500";
  }
  if (value < 50) {
    return "bg-amber-500";
  }
  if (value < 75) {
    return "bg-gray-400 dark:bg-gray-500";
  }
  return "bg-green-500";
}

function getHeightClass(size: "sm" | "default" | "lg"): string {
  switch (size) {
    case "sm":
      return "h-1.5";
    case "lg":
      return "h-3";
    default:
      return "h-2";
  }
}

function ProgressBar({
  value,
  showLabel = false,
  size = "default",
  className,
  ...props
}: ProgressBarProps) {
  // Clamp value between 0 and 100
  const normalizedValue = Math.max(0, Math.min(100, value));
  const progressColor = getProgressColor(normalizedValue);
  const heightClass = getHeightClass(size);

  return (
    <div className={cn("flex items-center gap-2", className)} {...props}>
      <div
        className={cn(
          "flex-1 bg-muted rounded-full overflow-hidden",
          heightClass
        )}
        role="progressbar"
        aria-valuenow={normalizedValue}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={cn(
            "h-full rounded-full transition-all duration-300 ease-out",
            progressColor
          )}
          style={{ width: `${normalizedValue}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs text-muted-foreground tabular-nums min-w-[32px] text-right">
          {Math.round(normalizedValue)}%
        </span>
      )}
    </div>
  );
}

export { ProgressBar };
