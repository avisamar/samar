"use client";

import React, { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Check, FileText, Sparkles, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type {
  ProfileUpdateProposal,
  ProposedFieldUpdate,
} from "@/lib/crm/extraction-types";
import { ConfidenceGroup } from "./confidence-group";
import { AdditionalDataCard } from "./additional-data-card";
import { NoteProposalCard } from "./note-proposal-card";

interface ProposalCardProps {
  proposal: ProfileUpdateProposal;
  customerId: string;
  onApplied?: () => void;
}

type FieldStatus = "pending" | "accepted" | "rejected";
type ConfidenceLevel = "high" | "medium" | "low";

/** Group fields by confidence level */
function groupByConfidence(
  fields: ProposedFieldUpdate[]
): Record<ConfidenceLevel, ProposedFieldUpdate[]> {
  return {
    high: fields.filter((f) => f.confidence === "high"),
    medium: fields.filter((f) => f.confidence === "medium"),
    low: fields.filter((f) => f.confidence === "low"),
  };
}

export function ProposalCard({ proposal, customerId, onApplied }: ProposalCardProps) {
  const router = useRouter();

  // Group fields by confidence
  const groupedFields = useMemo(
    () => groupByConfidence(proposal.fieldUpdates),
    [proposal.fieldUpdates]
  );

  // Track status of each field update
  const [fieldStatuses, setFieldStatuses] = useState<Record<string, FieldStatus>>(
    () => Object.fromEntries(proposal.fieldUpdates.map((f) => [f.id, "pending" as FieldStatus]))
  );

  // Track edited values
  const [editedValues, setEditedValues] = useState<Record<string, unknown>>({});

  // Track status of each additional data item
  const [additionalDataStatuses, setAdditionalDataStatuses] = useState<Record<string, FieldStatus>>(
    () => Object.fromEntries((proposal.additionalData || []).map((d) => [d.id, "pending" as FieldStatus]))
  );

  // Track edited additional data values
  const [editedAdditionalData, setEditedAdditionalData] = useState<Record<string, unknown>>({});

  // Track note status
  const [noteStatus, setNoteStatus] = useState<FieldStatus>("pending");
  const [editedNoteContent, setEditedNoteContent] = useState<string | null>(null);

  // Track if we're applying
  const [isApplying, setIsApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFieldAction = useCallback((fieldId: string, action: "accept" | "reject") => {
    setFieldStatuses((prev) => ({
      ...prev,
      [fieldId]: action === "accept" ? "accepted" : "rejected",
    }));
  }, []);

  const handleFieldEdit = useCallback((fieldId: string, value: unknown) => {
    setEditedValues((prev) => ({
      ...prev,
      [fieldId]: value,
    }));
    // Auto-accept when edited
    setFieldStatuses((prev) => ({
      ...prev,
      [fieldId]: "accepted",
    }));
  }, []);

  const handleNoteAction = useCallback((action: "accept" | "reject") => {
    setNoteStatus(action === "accept" ? "accepted" : "rejected");
  }, []);

  const handleNoteEdit = useCallback((content: string) => {
    setEditedNoteContent(content);
    setNoteStatus("accepted");
  }, []);

  const handleAdditionalDataAction = useCallback((dataId: string, action: "accept" | "reject") => {
    setAdditionalDataStatuses((prev) => ({
      ...prev,
      [dataId]: action === "accept" ? "accepted" : "rejected",
    }));
  }, []);

  const handleAdditionalDataEdit = useCallback((dataId: string, value: unknown) => {
    setEditedAdditionalData((prev) => ({
      ...prev,
      [dataId]: value,
    }));
    // Auto-accept when edited
    setAdditionalDataStatuses((prev) => ({
      ...prev,
      [dataId]: "accepted",
    }));
  }, []);

  const handleApply = useCallback(async () => {
    setIsApplying(true);
    setError(null);

    try {
      // Collect approved field IDs
      const approvedFieldIds = Object.entries(fieldStatuses)
        .filter(([, status]) => status === "accepted")
        .map(([id]) => id);

      // Collect approved additional data IDs
      const approvedAdditionalDataIds = Object.entries(additionalDataStatuses)
        .filter(([, status]) => status === "accepted")
        .map(([id]) => id);

      console.log("[ProposalCard] Sending apply request:", {
        proposalId: proposal.proposalId,
        approvedFieldIds,
        approvedAdditionalDataIds,
        approvedNote: noteStatus === "accepted",
        fieldUpdatesCount: proposal.fieldUpdates.length,
        additionalDataCount: proposal.additionalData?.length || 0,
      });

      const response = await fetch(`/api/customers/${customerId}/apply-updates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proposalId: proposal.proposalId,
          approvedFieldIds,
          approvedAdditionalDataIds,
          approvedNote: noteStatus === "accepted",
          editedValues: Object.keys(editedValues).length > 0 ? editedValues : undefined,
          editedAdditionalData: Object.keys(editedAdditionalData).length > 0 ? editedAdditionalData : undefined,
          editedNoteContent: editedNoteContent ?? undefined,
          proposal, // Send the full proposal for the API to use
        }),
      });

      const result = await response.json();
      console.log("[ProposalCard] Response:", result);

      if (!response.ok) {
        throw new Error(result.error || "Failed to apply updates");
      }

      if (result.errors && result.errors.length > 0) {
        setError(result.errors.join(", "));
      } else {
        setApplied(true);
        // Refresh the page to reload customer data from server
        router.refresh();
        onApplied?.();
      }
    } catch (e) {
      console.error("[ProposalCard] Error:", e);
      setError(e instanceof Error ? e.message : "Failed to apply updates");
    } finally {
      setIsApplying(false);
    }
  }, [customerId, proposal, fieldStatuses, additionalDataStatuses, noteStatus, editedValues, editedAdditionalData, editedNoteContent, onApplied, router]);

  // Count field statuses
  const acceptedCount = Object.values(fieldStatuses).filter((s) => s === "accepted").length;
  const rejectedCount = Object.values(fieldStatuses).filter((s) => s === "rejected").length;
  const pendingCount = Object.values(fieldStatuses).filter((s) => s === "pending").length;

  // Count additional data statuses
  const additionalAcceptedCount = Object.values(additionalDataStatuses).filter((s) => s === "accepted").length;

  // Check if any changes to apply
  const hasAccepted = acceptedCount > 0 || additionalAcceptedCount > 0 || noteStatus === "accepted";

  if (applied) {
    return (
      <div className="flex gap-3 justify-start">
        <div className="flex-shrink-0 size-8 rounded-full bg-green-500/10 flex items-center justify-center">
          <Check className="size-4 text-green-600" />
        </div>
        <Card className="max-w-[85%] border-green-500/20 bg-green-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
              <Check className="size-4" />
              <span className="font-medium">Updates applied successfully</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {acceptedCount > 0 && `${acceptedCount} field${acceptedCount !== 1 ? "s" : ""} updated`}
              {acceptedCount > 0 && additionalAcceptedCount > 0 && ", "}
              {additionalAcceptedCount > 0 && `${additionalAcceptedCount} additional data item${additionalAcceptedCount !== 1 ? "s" : ""} added`}
              {(acceptedCount > 0 || additionalAcceptedCount > 0) && noteStatus === "accepted" && ", "}
              {noteStatus === "accepted" && "note added"}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex gap-3 justify-start">
      <div className="flex-shrink-0 size-8 rounded-full bg-primary/10 flex items-center justify-center">
        <Sparkles className="size-4 text-primary" />
      </div>
      <Card className="max-w-[85%] overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="size-4 text-muted-foreground" />
              <span className="font-medium">Proposed Profile Updates</span>
            </div>
            <div className="flex gap-1">
              {acceptedCount > 0 && (
                <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 dark:bg-green-900/20">
                  {acceptedCount} accepted
                </Badge>
              )}
              {rejectedCount > 0 && (
                <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50 dark:bg-red-900/20">
                  {rejectedCount} rejected
                </Badge>
              )}
              {pendingCount > 0 && (
                <Badge variant="outline" className="text-muted-foreground">
                  {pendingCount} pending
                </Badge>
              )}
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Review the extracted information and approve or reject each field.
          </p>
        </CardHeader>
        <CardContent className="space-y-4 pb-3">
          {/* Field updates grouped by confidence */}
          {(["high", "medium", "low"] as const).map((confidence) => {
            const fields = groupedFields[confidence];
            if (fields.length === 0) return null;
            return (
              <ConfidenceGroup
                key={confidence}
                confidence={confidence}
                fields={fields}
                fieldStatuses={fieldStatuses}
                editedValues={editedValues}
                onAction={handleFieldAction}
                onEdit={handleFieldEdit}
                defaultOpen={confidence === "low"} // Low confidence expanded by default for review
              />
            );
          })}

          {/* Additional data section */}
          {proposal.additionalData && proposal.additionalData.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 pt-2 border-t">
                <Plus className="size-4 text-muted-foreground" />
                <span className="text-sm font-medium">Additional Information</span>
                <Badge variant="outline" className="text-xs text-muted-foreground">
                  {proposal.additionalData.length} item{proposal.additionalData.length !== 1 ? "s" : ""}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                These data points don&apos;t match standard profile fields but may be valuable.
              </p>
              {proposal.additionalData.map((data) => (
                <AdditionalDataCard
                  key={data.id}
                  data={data}
                  status={additionalDataStatuses[data.id]}
                  editedValue={editedAdditionalData[data.id]}
                  onAction={(action) => handleAdditionalDataAction(data.id, action)}
                  onEdit={(value) => handleAdditionalDataEdit(data.id, value)}
                />
              ))}
            </div>
          )}

          {/* Note proposal */}
          <NoteProposalCard
            note={proposal.note}
            status={noteStatus}
            editedContent={editedNoteContent}
            onAction={handleNoteAction}
            onEdit={handleNoteEdit}
          />
        </CardContent>
        <CardFooter className="border-t pt-3 flex justify-end">
          <Button
            size="sm"
            onClick={handleApply}
            disabled={!hasAccepted || isApplying}
          >
            {isApplying ? "Applying..." : "Apply Changes"}
          </Button>
        </CardFooter>
        {error && (
          <div className="px-4 pb-3">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}
      </Card>
    </div>
  );
}
