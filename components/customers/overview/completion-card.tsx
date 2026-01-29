"use client";

import { useRouter, usePathname } from "next/navigation";
import { BarChart3 } from "lucide-react";
import type { Customer } from "@/lib/crm/types";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import {
  calculateCompleteness,
  getCompletenessBgColor,
} from "@/lib/crm/completeness";
import {
  PROFILE_SECTIONS,
  calculateSectionCompleteness,
} from "@/lib/crm/sections";
import { cn } from "@/lib/utils";

interface CompletionCardProps {
  customer: Customer;
}

export function CompletionCard({ customer }: CompletionCardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const completeness = calculateCompleteness(customer);

  // Calculate per-section completeness
  const sectionStats = PROFILE_SECTIONS.map((section) => ({
    ...section,
    ...calculateSectionCompleteness(customer, section),
  }));

  // Sort by percentage (lowest first to highlight gaps)
  const sortedSections = [...sectionStats].sort(
    (a, b) => a.percentage - b.percentage
  );

  // Show top 5 sections needing attention
  const sectionsToShow = sortedSections.slice(0, 5);

  const navigateToProfile = () => {
    router.push(`${pathname}?mode=profile`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="size-4 text-muted-foreground" aria-hidden="true" />
          Profile Completion
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Completion */}
        <div className="flex items-center gap-4">
          <div className="relative size-16">
            <svg
              className="size-16 -rotate-90"
              viewBox="0 0 36 36"
              role="img"
              aria-label={`Profile ${completeness.percentage}% complete`}
            >
              <path
                className="text-muted stroke-current"
                strokeWidth="3"
                fill="none"
                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className={cn("stroke-current", getCompletenessBgColor(completeness.level).replace("bg-", "text-"))}
                strokeWidth="3"
                strokeLinecap="round"
                fill="none"
                strokeDasharray={`${completeness.percentage}, 100`}
                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-lg font-semibold">
              {completeness.percentage}%
            </span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium capitalize">
              {completeness.level} Profile
            </p>
            <p className="text-xs text-muted-foreground">
              {completeness.highPriorityFilled}/{completeness.highPriorityTotal}{" "}
              high priority fields filled
            </p>
            <p className="text-xs text-muted-foreground">
              {completeness.mediumPriorityFilled}/
              {completeness.mediumPriorityTotal} medium priority fields filled
            </p>
          </div>
        </div>

        {/* Section Breakdown */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Sections Needing Attention
          </p>
          {sectionsToShow.map((section) => (
            <button
              key={section.id}
              onClick={navigateToProfile}
              className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors text-left"
            >
              <span className="flex-1 text-sm truncate">{section.label}</span>
              <span className="text-xs text-muted-foreground tabular-nums">
                {section.filled}/{section.total}
              </span>
              <div className="w-16">
                <ProgressBar value={section.percentage} size="sm" />
              </div>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
