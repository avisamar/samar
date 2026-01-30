"use client";

import { Heart, Briefcase, Check, X, Edit2 } from "lucide-react";
import type { InterestProposalPayload } from "@/lib/crm/artifact-types";
import type { Artifact } from "@/db/artifact-schema";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface PendingInterestItemProps {
  artifact: Artifact;
  isApproved: boolean;
  onToggle: () => void;
  onEdit?: () => void;
}

export function PendingInterestItem({
  artifact,
  isApproved,
  onToggle,
  onEdit,
}: PendingInterestItemProps) {
  const payload = artifact.payload as InterestProposalPayload;
  const isPersonal = payload.category === "personal";
  const Icon = isPersonal ? Heart : Briefcase;

  const confidenceColors = {
    high: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/30",
    medium: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30",
    low: "bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/30",
  };

  return (
    <div
      className={cn(
        "flex items-start gap-3 p-3 rounded-lg border transition-all",
        isApproved
          ? "bg-green-50/50 dark:bg-green-950/20 border-green-500/30"
          : "bg-muted/30 border-transparent"
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          "shrink-0 size-8 rounded-full flex items-center justify-center",
          isPersonal
            ? "bg-pink-100 dark:bg-pink-900/30"
            : "bg-blue-100 dark:bg-blue-900/30"
        )}
      >
        <Icon
          className={cn(
            "size-4",
            isPersonal ? "text-pink-500" : "text-blue-500"
          )}
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{payload.label}</span>
          <Badge
            variant="outline"
            className={cn("text-[10px] capitalize", confidenceColors[payload.confidence])}
          >
            {payload.confidence}
          </Badge>
        </div>
        {payload.description && (
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
            {payload.description}
          </p>
        )}
        {payload.source_text && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <p className="text-xs text-muted-foreground/70 mt-1 italic truncate cursor-help">
                  &ldquo;{payload.source_text}&rdquo;
                </p>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs">
                <p className="text-sm">{payload.source_text}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      {/* Actions */}
      <div className="shrink-0 flex items-center gap-1">
        {onEdit && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={onEdit}
          >
            <Edit2 className="size-3.5" />
            <span className="sr-only">Edit</span>
          </Button>
        )}
        <Button
          variant={isApproved ? "default" : "outline"}
          size="sm"
          className="h-8 w-8 p-0"
          onClick={onToggle}
        >
          {isApproved ? (
            <Check className="size-4" />
          ) : (
            <X className="size-4 text-muted-foreground" />
          )}
          <span className="sr-only">{isApproved ? "Remove" : "Approve"}</span>
        </Button>
      </div>
    </div>
  );
}

interface PendingInterestsListProps {
  artifacts: Artifact[];
  approvedIds: Set<string>;
  onToggle: (artifactId: string) => void;
  onEdit?: (artifact: Artifact) => void;
}

export function PendingInterestsList({
  artifacts,
  approvedIds,
  onToggle,
  onEdit,
}: PendingInterestsListProps) {
  if (artifacts.length === 0) {
    return null;
  }

  // Group by category
  const personalArtifacts = artifacts.filter(
    (a) => (a.payload as InterestProposalPayload).category === "personal"
  );
  const financialArtifacts = artifacts.filter(
    (a) => (a.payload as InterestProposalPayload).category === "financial"
  );

  return (
    <div className="space-y-4">
      {/* Personal Interests */}
      {personalArtifacts.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">
            <Heart className="size-3 text-pink-500" />
            Personal Interests ({personalArtifacts.length})
          </div>
          <div className="space-y-2">
            {personalArtifacts.map((artifact) => (
              <PendingInterestItem
                key={artifact.id}
                artifact={artifact}
                isApproved={approvedIds.has(artifact.id)}
                onToggle={() => onToggle(artifact.id)}
                onEdit={onEdit ? () => onEdit(artifact) : undefined}
              />
            ))}
          </div>
        </div>
      )}

      {/* Financial Interests */}
      {financialArtifacts.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">
            <Briefcase className="size-3 text-blue-500" />
            Financial Interests ({financialArtifacts.length})
          </div>
          <div className="space-y-2">
            {financialArtifacts.map((artifact) => (
              <PendingInterestItem
                key={artifact.id}
                artifact={artifact}
                isApproved={approvedIds.has(artifact.id)}
                onToggle={() => onToggle(artifact.id)}
                onEdit={onEdit ? () => onEdit(artifact) : undefined}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
