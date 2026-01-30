"use client";

import { useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { Artifact } from "@/db/artifact-schema";
import type { ProfileEditPayload, InterestProposalPayload } from "@/lib/crm/artifact-types";
import { ARTIFACT_TYPES } from "@/lib/crm/artifact-types";
import type { ProfileUpdateProposal, ProposedFieldUpdate } from "@/lib/crm/extraction-types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
} from "@/components/ui/dialog";
import {
  ProfileAgentProvider,
  transformProposalToTree,
  extractFieldIds,
  extractInterestIds,
  ProposalRenderer,
} from "@/lib/json-render";

interface ProposalReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  batchId: string;
  artifacts: Artifact[];
  customerId: string;
  onApplied?: () => void;
}

/**
 * Reconstruct a ProfileUpdateProposal from artifacts.
 * Artifacts store individual field updates that were created during finalize_proposal.
 */
function reconstructProposalFromArtifacts(
  batchId: string,
  artifacts: Artifact[],
  customerId: string
): ProfileUpdateProposal {
  const profileArtifacts = artifacts.filter((a) => a.artifactType === ARTIFACT_TYPES.PROFILE_EDIT);
  const interestArtifacts = artifacts.filter((a) => a.artifactType === ARTIFACT_TYPES.INTEREST_PROPOSAL);

  const fieldUpdates: ProposedFieldUpdate[] = profileArtifacts.map((artifact) => {
    const payload = artifact.payload as ProfileEditPayload;
    return {
      id: artifact.id, // Use artifact ID as the field update ID for tracking
      field: payload.field_key,
      label: payload.field_display_name,
      currentValue: payload.previous_value,
      proposedValue: payload.proposed_value,
      confidence: payload.confidence || "medium",
      source: payload.source_text,
      artifactId: artifact.id,
    };
  });

  // Sort by field label for consistent display
  fieldUpdates.sort((a, b) => a.label.localeCompare(b.label));

  const interestProposals = interestArtifacts.map((artifact) => {
    const payload = artifact.payload as InterestProposalPayload;
    return {
      id: artifact.id,
      category: payload.category,
      label: payload.edited_label || payload.label,
      description: payload.edited_description || payload.description,
      sourceText: payload.source_text,
      confidence: payload.confidence || "medium",
      artifactId: artifact.id,
    };
  });

  return {
    proposalId: batchId,
    customerId,
    fieldUpdates,
    additionalData: [], // Additional data is not persisted as artifacts
    interestProposals,
    note: {
      id: `note-${batchId}`,
      content: "", // Note content not available from artifacts
      source: "meeting",
      tags: [],
    },
    rawInput: "", // Raw input not available from artifacts
    createdAt: typeof artifacts[0]?.createdAt === 'string'
      ? artifacts[0].createdAt
      : artifacts[0]?.createdAt instanceof Date
        ? artifacts[0].createdAt.toISOString()
        : new Date().toISOString(),
  };
}

export function ProposalReviewDialog({
  open,
  onOpenChange,
  batchId,
  artifacts,
  customerId,
  onApplied,
}: ProposalReviewDialogProps) {
  const router = useRouter();

  // Reconstruct proposal from artifacts
  const proposal = useMemo(
    () => reconstructProposalFromArtifacts(batchId, artifacts, customerId),
    [batchId, artifacts, customerId]
  );

  // Transform proposal to json-render tree
  const tree = useMemo(() => transformProposalToTree(proposal), [proposal]);

  // Extract IDs for state initialization
  const fieldIds = useMemo(() => extractFieldIds(proposal), [proposal]);
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
          approvedNote: false, // No note from artifact-based proposals
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

      // Close dialog and refresh after a short delay to show success state
      setTimeout(() => {
        onOpenChange(false);
        router.refresh();
        onApplied?.();
      }, 1000);
    },
    [customerId, proposal, router, onOpenChange, onApplied]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Review Profile Updates</DialogTitle>
        </DialogHeader>
        <DialogBody className="p-0">
          <ProfileAgentProvider
            initialFieldIds={fieldIds}
            initialAdditionalDataIds={[]}
            initialInterestIds={interestIds}
            onApply={handleApply}
          >
            <ProposalRenderer tree={tree} />
          </ProfileAgentProvider>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
