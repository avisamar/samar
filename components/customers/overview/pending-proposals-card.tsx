"use client";

import { useEffect, useState, useCallback } from "react";
import { FileEdit, Loader2, CheckCircle, ChevronRight } from "lucide-react";
import type { Artifact } from "@/db/artifact-schema";
import type { ProfileEditPayload } from "@/lib/crm/artifact-types";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ProposalReviewDialog } from "./proposal-review-dialog";

interface PendingProposalsCardProps {
  customerId: string;
}

interface GroupedArtifacts {
  batchId: string;
  artifacts: Artifact[];
  createdAt: Date;
}

export function PendingProposalsCard({ customerId }: PendingProposalsCardProps) {
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<GroupedArtifacts | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchArtifacts = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/customers/${customerId}/artifacts?status=pending`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch artifacts");
      }
      const data = await response.json();
      setArtifacts(data.artifacts || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    fetchArtifacts();
  }, [fetchArtifacts]);

  // Group artifacts by batchId
  const groupedArtifacts: GroupedArtifacts[] = artifacts.reduce(
    (groups, artifact) => {
      const existing = groups.find((g) => g.batchId === artifact.batchId);
      if (existing) {
        existing.artifacts.push(artifact);
      } else {
        groups.push({
          batchId: artifact.batchId,
          artifacts: [artifact],
          createdAt: new Date(artifact.createdAt),
        });
      }
      return groups;
    },
    [] as GroupedArtifacts[]
  );

  // Sort by most recent first
  groupedArtifacts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const hasPending = groupedArtifacts.length > 0;

  const handleReview = (group: GroupedArtifacts) => {
    setSelectedGroup(group);
    setDialogOpen(true);
  };

  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setSelectedGroup(null);
    }
  };

  const handleApplied = () => {
    // Refresh artifacts after applying
    setLoading(true);
    fetchArtifacts();
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileEdit className="size-4 text-muted-foreground" aria-hidden="true" />
            Pending Proposals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-6">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileEdit className="size-4 text-muted-foreground" aria-hidden="true" />
            Pending Proposals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            Failed to load proposals
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card variant={hasPending ? "attention" : "default"}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileEdit
              className={cn(
                "size-4",
                hasPending ? "text-primary" : "text-muted-foreground"
              )}
              aria-hidden="true"
            />
            Pending Proposals
            {hasPending && (
              <Badge variant="secondary" className="ml-auto">
                {artifacts.length}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!hasPending ? (
            <NoPendingProposals />
          ) : (
            <div className="space-y-3">
              {groupedArtifacts.slice(0, 3).map((group) => (
                <ProposalGroup
                  key={group.batchId}
                  group={group}
                  onReview={() => handleReview(group)}
                />
              ))}
              {groupedArtifacts.length > 3 && (
                <p className="text-xs text-center text-muted-foreground pt-1">
                  +{groupedArtifacts.length - 3} more proposal{groupedArtifacts.length - 3 > 1 ? "s" : ""}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Review Dialog */}
      {selectedGroup && (
        <ProposalReviewDialog
          open={dialogOpen}
          onOpenChange={handleDialogClose}
          batchId={selectedGroup.batchId}
          artifacts={selectedGroup.artifacts}
          customerId={customerId}
          onApplied={handleApplied}
        />
      )}
    </>
  );
}

interface ProposalGroupProps {
  group: GroupedArtifacts;
  onReview: () => void;
}

function ProposalGroup({ group, onReview }: ProposalGroupProps) {
  const fieldCount = group.artifacts.length;
  const fieldNames = group.artifacts
    .slice(0, 3)
    .map((a) => (a.payload as ProfileEditPayload).field_display_name)
    .join(", ");
  const moreCount = fieldCount > 3 ? fieldCount - 3 : 0;

  const timeAgo = getTimeAgo(group.createdAt);

  return (
    <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
      <div className="shrink-0 mt-0.5">
        <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center">
          <FileEdit className="size-4 text-primary" />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">
          {fieldCount} field{fieldCount > 1 ? "s" : ""} to review
        </p>
        <p className="text-xs text-muted-foreground truncate">
          {fieldNames}
          {moreCount > 0 && ` +${moreCount} more`}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">{timeAgo}</p>
      </div>
      <div className="shrink-0">
        <Button variant="outline" size="sm" onClick={onReview}>
          Review
        </Button>
      </div>
    </div>
  );
}

function NoPendingProposals() {
  return (
    <div className="flex flex-col items-center justify-center py-6 text-center">
      <div className="rounded-full bg-green-500/10 p-3 mb-3">
        <CheckCircle
          className="size-6 text-green-600 dark:text-green-400"
          aria-hidden="true"
        />
      </div>
      <p className="text-sm font-medium text-green-600 dark:text-green-400">
        No pending proposals
      </p>
      <p className="text-xs text-muted-foreground mt-1">
        All profile updates have been reviewed
      </p>
    </div>
  );
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}
