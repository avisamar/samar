"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export type ChipConfidence = "high" | "medium" | "low"

export interface InterestChipProps extends React.HTMLAttributes<HTMLSpanElement> {
  confidence: ChipConfidence
  emoji?: string
  source?: string
  children: React.ReactNode
}

const confidenceStyles: Record<ChipConfidence, string> = {
  high: "bg-secondary border-transparent",
  medium: "bg-transparent border-border border",
  low: "bg-transparent border-border border-dashed border",
}

function InterestChip({
  className,
  confidence,
  emoji,
  source,
  children,
  ...props
}: InterestChipProps) {
  const chip = (
    <span
      data-slot="interest-chip"
      data-confidence={confidence}
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
        confidenceStyles[confidence],
        source && "cursor-help",
        className
      )}
      {...props}
    >
      {emoji && <span className="text-sm">{emoji}</span>}
      <span>{children}</span>
    </span>
  )

  if (source) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{chip}</TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">Source: {source}</p>
        </TooltipContent>
      </Tooltip>
    )
  }

  return chip
}

export { InterestChip }
