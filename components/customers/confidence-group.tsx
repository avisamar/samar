"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronRight, CheckCircle, AlertCircle, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ProposedFieldUpdate } from "@/lib/crm/extraction-types";
import { FieldUpdateCard } from "./field-update-card";

type ConfidenceLevel = "high" | "medium" | "low";
type FieldStatus = "pending" | "accepted" | "rejected";

interface ConfidenceGroupProps {
  confidence: ConfidenceLevel;
  fields: ProposedFieldUpdate[];
  fieldStatuses: Record<string, FieldStatus>;
  editedValues: Record<string, unknown>;
  onAction: (fieldId: string, action: "accept" | "reject") => void;
  onEdit: (fieldId: string, value: unknown) => void;
  defaultOpen?: boolean;
}

const confidenceConfig: Record<
  ConfidenceLevel,
  {
    label: string;
    description: string;
    icon: React.ElementType;
    color: string;
    bgColor: string;
    borderColor: string;
  }
> = {
  high: {
    label: "High Confidence",
    description: "Clearly stated in the input",
    icon: CheckCircle,
    color: "text-green-600",
    bgColor: "bg-green-50 dark:bg-green-900/20",
    borderColor: "border-green-200",
  },
  medium: {
    label: "Medium Confidence",
    description: "Strongly implied",
    icon: AlertCircle,
    color: "text-yellow-600",
    bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
    borderColor: "border-yellow-200",
  },
  low: {
    label: "Needs Review",
    description: "Requires careful verification",
    icon: AlertTriangle,
    color: "text-red-600",
    bgColor: "bg-red-50 dark:bg-red-900/20",
    borderColor: "border-red-200",
  },
};

export function ConfidenceGroup({
  confidence,
  fields,
  fieldStatuses,
  editedValues,
  onAction,
  onEdit,
  defaultOpen = false,
}: ConfidenceGroupProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const config = confidenceConfig[confidence];
  const Icon = config.icon;
  const ChevronIcon = isOpen ? ChevronDown : ChevronRight;

  // Count statuses within this group
  const acceptedCount = fields.filter((f) => fieldStatuses[f.id] === "accepted").length;
  const rejectedCount = fields.filter((f) => fieldStatuses[f.id] === "rejected").length;
  const pendingCount = fields.filter((f) => fieldStatuses[f.id] === "pending").length;

  if (fields.length === 0) {
    return null;
  }

  return (
    <div className={cn("rounded-lg border", config.borderColor)}>
      {/* Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center justify-between p-3 rounded-t-lg transition-colors",
          config.bgColor,
          isOpen ? "rounded-b-none" : "rounded-b-lg"
        )}
      >
        <div className="flex items-center gap-2">
          <ChevronIcon className={cn("size-4", config.color)} />
          <Icon className={cn("size-4", config.color)} />
          <span className={cn("font-medium text-sm", config.color)}>{config.label}</span>
          <Badge variant="outline" className={cn("text-xs", config.color, config.borderColor)}>
            {fields.length}
          </Badge>
        </div>
        <div className="flex items-center gap-1">
          {acceptedCount > 0 && (
            <Badge variant="outline" className="text-xs text-green-600 border-green-200">
              {acceptedCount}
            </Badge>
          )}
          {rejectedCount > 0 && (
            <Badge variant="outline" className="text-xs text-red-600 border-red-200">
              {rejectedCount}
            </Badge>
          )}
          {pendingCount > 0 && (
            <Badge variant="outline" className="text-xs text-muted-foreground">
              {pendingCount}
            </Badge>
          )}
        </div>
      </button>

      {/* Description */}
      {isOpen && (
        <p className={cn("text-xs text-muted-foreground px-3 py-2 border-b", config.borderColor)}>
          {config.description}
        </p>
      )}

      {/* Fields */}
      {isOpen && (
        <div className="p-3 space-y-3">
          {fields.map((field) => (
            <FieldUpdateCard
              key={field.id}
              field={field}
              status={fieldStatuses[field.id]}
              editedValue={editedValues[field.id]}
              onAction={(action) => onAction(field.id, action)}
              onEdit={(value) => onEdit(field.id, value)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
