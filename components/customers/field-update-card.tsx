"use client";

import React, { useState } from "react";
import { Check, X, Pencil, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { ProposedFieldUpdate } from "@/lib/crm/extraction-types";
import { validateContactField, isContactField } from "@/lib/validation";

interface FieldUpdateCardProps {
  field: ProposedFieldUpdate;
  status: "pending" | "accepted" | "rejected";
  editedValue?: unknown;
  onAction: (action: "accept" | "reject") => void;
  onEdit: (value: unknown) => void;
}

export function FieldUpdateCard({
  field,
  status,
  editedValue,
  onAction,
  onEdit,
}: FieldUpdateCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editInput, setEditInput] = useState(String(field.proposedValue));
  const [editError, setEditError] = useState<string | null>(null);

  const handleSaveEdit = () => {
    // Validate contact fields before saving
    if (isContactField(field.field)) {
      const result = validateContactField(field.field, editInput);
      if (result && !result.valid) {
        setEditError(result.error || "Invalid value");
        return;
      }
    }
    setEditError(null);
    onEdit(editInput);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditInput(String(editedValue ?? field.proposedValue));
    setEditError(null);
    setIsEditing(false);
  };

  const displayValue = editedValue !== undefined ? editedValue : field.proposedValue;
  const currentDisplay = field.currentValue === null ? "(not set)" : String(field.currentValue);
  const proposedDisplay = String(displayValue);

  const confidenceColor = {
    high: "text-green-600 border-green-200 bg-green-50 dark:bg-green-900/20",
    medium: "text-yellow-600 border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20",
    low: "text-red-600 border-red-200 bg-red-50 dark:bg-red-900/20",
  };

  return (
    <div
      className={cn(
        "rounded-lg border p-3 transition-colors",
        status === "accepted" && "border-green-200 bg-green-50/50 dark:bg-green-900/10",
        status === "rejected" && "border-red-200 bg-red-50/50 dark:bg-red-900/10 opacity-60",
        status === "pending" && "border-border"
      )}
    >
      {/* Header row */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{field.label}</span>
          <Badge variant="outline" className={cn("text-xs", confidenceColor[field.confidence])}>
            {field.confidence}
          </Badge>
        </div>
        {status !== "pending" && (
          <Badge
            variant="outline"
            className={cn(
              "text-xs",
              status === "accepted" && "text-green-600 border-green-200",
              status === "rejected" && "text-red-600 border-red-200"
            )}
          >
            {status}
          </Badge>
        )}
      </div>

      {/* Value change display */}
      <div className="flex items-center gap-2 text-sm mb-2">
        <span className="text-muted-foreground line-through">{currentDisplay}</span>
        <ArrowRight className="size-3 text-muted-foreground" />
        {isEditing ? (
          <div className="flex flex-col gap-1 flex-1">
            <div className="flex items-center gap-2">
              <Input
                value={editInput}
                onChange={(e) => {
                  setEditInput(e.target.value);
                  if (editError) setEditError(null);
                }}
                className="h-7 text-sm"
                autoFocus
                aria-invalid={!!editError}
              />
              <Button size="sm" variant="ghost" onClick={handleSaveEdit} className="h-7 px-2">
                <Check className="size-3" />
              </Button>
              <Button size="sm" variant="ghost" onClick={handleCancelEdit} className="h-7 px-2">
                <X className="size-3" />
              </Button>
            </div>
            {editError && (
              <p className="text-destructive text-xs">{editError}</p>
            )}
          </div>
        ) : (
          <span className="font-medium">{proposedDisplay}</span>
        )}
      </div>

      {/* Source quote */}
      {field.source && (
        <p className="text-xs text-muted-foreground italic mb-2 line-clamp-2">
          &ldquo;{field.source}&rdquo;
        </p>
      )}

      {/* Action buttons */}
      {status === "pending" && !isEditing && (
        <div className="flex items-center gap-2 mt-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onAction("accept")}
            className="h-7 text-green-600 border-green-200 hover:bg-green-50 dark:hover:bg-green-900/20"
          >
            <Check className="size-3 mr-1" />
            Accept
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onAction("reject")}
            className="h-7 text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            <X className="size-3 mr-1" />
            Reject
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsEditing(true)}
            className="h-7"
          >
            <Pencil className="size-3 mr-1" />
            Edit
          </Button>
        </div>
      )}

      {/* Undo for decided items */}
      {status !== "pending" && !isEditing && (
        <div className="flex items-center gap-2 mt-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onAction(status === "accepted" ? "reject" : "accept")}
            className="h-7 text-muted-foreground"
          >
            {status === "accepted" ? "Reject instead" : "Accept instead"}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsEditing(true)}
            className="h-7 text-muted-foreground"
          >
            <Pencil className="size-3 mr-1" />
            Edit
          </Button>
        </div>
      )}
    </div>
  );
}
