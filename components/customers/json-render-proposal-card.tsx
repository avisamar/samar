"use client";

/**
 * ProposalCard component using json-render.
 * Wraps the json-render infrastructure to render profile update proposals.
 */

import React, { useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { ProfileUpdateProposal } from "@/lib/crm/extraction-types";
import {
  ProfileAgentProvider,
  transformProposalToTree,
  extractFieldIds,
  extractAdditionalDataIds,
  extractInterestIds,
  ProposalRenderer,
} from "@/lib/json-render";

interface ProposalCardProps {
  proposal: ProfileUpdateProposal;
  customerId: string;
  onApplied?: () => void;
}

/**
 * ProposalCard renders a profile update proposal using json-render.
 */
export function ProposalCard({ proposal, customerId, onApplied }: ProposalCardProps) {
  const router = useRouter();

  // Transform proposal to json-render tree
  const tree = useMemo(() => transformProposalToTree(proposal), [proposal]);

  // Extract IDs for state initialization
  const fieldIds = useMemo(() => extractFieldIds(proposal), [proposal]);
  const additionalDataIds = useMemo(() => extractAdditionalDataIds(proposal), [proposal]);
  const interestIds = useMemo(() => extractInterestIds(proposal), [proposal]);

  // Handle apply updates
  const handleApply = useCallback(
    async (data: {
      proposalId: string;
      customerId: string;
      approvedFieldIds: string[];
      approvedAdditionalDataIds: string[];
      approvedInterestIds: string[];
      approvedNote: boolean;
      editedValues: Record<string, unknown>;
      editedAdditionalData: Record<string, unknown>;
      editedInterests: Record<string, { label?: string; description?: string }>;
      editedNoteContent?: string;
    }) => {
      const response = await fetch(`/api/customers/${customerId}/apply-updates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proposalId: data.proposalId,
          approvedFieldIds: data.approvedFieldIds,
          approvedAdditionalDataIds: data.approvedAdditionalDataIds,
          approvedInterestIds: data.approvedInterestIds,
          approvedNote: data.approvedNote,
          editedValues: Object.keys(data.editedValues).length > 0 ? data.editedValues : undefined,
          editedAdditionalData: Object.keys(data.editedAdditionalData).length > 0 ? data.editedAdditionalData : undefined,
          editedInterests: Object.keys(data.editedInterests).length > 0 ? data.editedInterests : undefined,
          editedNoteContent: data.editedNoteContent,
          proposal,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to apply updates");
      }

      if (result.errors && result.errors.length > 0) {
        throw new Error(result.errors.join(", "));
      }

      // Refresh the page to reload customer data from server
      router.refresh();
      onApplied?.();
    },
    [customerId, proposal, router, onApplied]
  );

  return (
    <ProfileAgentProvider
      initialFieldIds={fieldIds}
      initialAdditionalDataIds={additionalDataIds}
      initialInterestIds={interestIds}
      onApply={handleApply}
    >
      <ProposalRenderer tree={tree} />
    </ProfileAgentProvider>
  );
}
