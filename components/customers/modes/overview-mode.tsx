"use client";

import type { CustomerWithNotes } from "@/lib/crm/types";
import { PrepCard } from "../overview/prep-card";
import { NeedsAttentionCard } from "../overview/needs-attention-card";
import { CompletionCard } from "../overview/completion-card";
import { RecentActivityCard } from "../overview/recent-activity-card";
import { PendingProposalsCard } from "../overview/pending-proposals-card";
import { InterestsCard } from "../overview/interests-card";

interface OverviewModeProps {
  customer: CustomerWithNotes;
}

export function OverviewMode({ customer }: OverviewModeProps) {
  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 max-w-5xl mx-auto">
      {/* Middle row: Pending Proposals + Completion */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        
        <CompletionCard customer={customer} />
        <PendingProposalsCard customerId={customer.id} />
      </div>

      {/* Top row: Prep + Needs Attention */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <PrepCard customer={customer} />
        <NeedsAttentionCard customer={customer} />
      </div>


      {/* Interests row */}
      <InterestsCard customerId={customer.id} />

      {/* Bottom row: Recent Activity */}
      <RecentActivityCard customer={customer} />
    </div>
  );
}
