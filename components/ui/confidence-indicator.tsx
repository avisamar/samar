"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

export type ConfidenceLevel = "high" | "medium" | "low"

export interface ConfidenceIndicatorProps extends React.HTMLAttributes<HTMLDivElement> {
  level: ConfidenceLevel
  showLabel?: boolean
}

const confidenceConfig: Record<
  ConfidenceLevel,
  { dotClass: string; label: string }
> = {
  high: {
    dotClass: "bg-green-500 dark:bg-green-400",
    label: "High confidence",
  },
  medium: {
    dotClass: "bg-amber-500 dark:bg-amber-400",
    label: "Medium confidence",
  },
  low: {
    dotClass: "border-2 border-gray-400 dark:border-gray-500 bg-transparent",
    label: "Inferred",
  },
}

function ConfidenceIndicator({
  className,
  level,
  showLabel = true,
  ...props
}: ConfidenceIndicatorProps) {
  const config = confidenceConfig[level]

  return (
    <div
      data-slot="confidence-indicator"
      data-level={level}
      className={cn("inline-flex items-center gap-1.5", className)}
      {...props}
    >
      <span
        className={cn(
          "size-2 rounded-full shrink-0",
          config.dotClass
        )}
        aria-hidden="true"
      />
      {showLabel && (
        <span className="text-xs text-muted-foreground">{config.label}</span>
      )}
    </div>
  )
}

export { ConfidenceIndicator }
