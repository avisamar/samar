"use client";

import type { CustomerWithNotes } from "@/lib/crm/types";
import { PrepCard } from "../overview/prep-card";
import { NeedsAttentionCard } from "../overview/needs-attention-card";
import { CompletionCard } from "../overview/completion-card";
import { RecentActivityCard } from "../overview/recent-activity-card";

interface OverviewModeProps {
  customer: CustomerWithNotes;
}

export function OverviewMode({ customer }: OverviewModeProps) {
  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 max-w-5xl mx-auto">
      {/* Top row: Prep + Needs Attention */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <PrepCard customer={customer} />
        <NeedsAttentionCard customer={customer} />
      </div>

      {/* Bottom row: Completion + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <CompletionCard customer={customer} />
        <RecentActivityCard customer={customer} />
      </div>
    </div>
  );
}
