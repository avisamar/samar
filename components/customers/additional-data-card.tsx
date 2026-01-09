"use client";

import React, { useState } from "react";
import { Check, X, Pencil, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { ProposedAdditionalData } from "@/lib/crm/extraction-types";

interface AdditionalDataCardProps {
  data: ProposedAdditionalData;
  status: "pending" | "accepted" | "rejected";
  editedValue?: unknown;
  onAction: (action: "accept" | "reject") => void;
  onEdit: (value: unknown) => void;
}

export function AdditionalDataCard({
  data,
  status,
  editedValue,
  onAction,
  onEdit,
}: AdditionalDataCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editInput, setEditInput] = useState(String(data.value));

  const handleSaveEdit = () => {
    onEdit(editInput);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditInput(String(editedValue ?? data.value));
    setIsEditing(false);
  };

  const displayValue = editedValue !== undefined ? editedValue : data.value;

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
          <Database className="size-3 text-muted-foreground" />
          <span className="font-medium text-sm">{data.label}</span>
          <Badge variant="outline" className={cn("text-xs", confidenceColor[data.confidence])}>
            {data.confidence}
          </Badge>
          {data.category && (
            <Badge variant="outline" className="text-xs text-muted-foreground">
              {data.category}
            </Badge>
          )}
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

      {/* Key display */}
      <p className="text-xs text-muted-foreground mb-2 font-mono">
        {data.key}
      </p>

      {/* Value display */}
      <div className="flex items-center gap-2 text-sm mb-2">
        {isEditing ? (
          <div className="flex items-center gap-2 flex-1">
            <Input
              value={editInput}
              onChange={(e) => setEditInput(e.target.value)}
              className="h-7 text-sm"
              autoFocus
            />
            <Button size="sm" variant="ghost" onClick={handleSaveEdit} className="h-7 px-2">
              <Check className="size-3" />
            </Button>
            <Button size="sm" variant="ghost" onClick={handleCancelEdit} className="h-7 px-2">
              <X className="size-3" />
            </Button>
          </div>
        ) : (
          <span className="font-medium">{String(displayValue)}</span>
        )}
      </div>

      {/* Source quote */}
      {data.source && (
        <p className="text-xs text-muted-foreground italic mb-2 line-clamp-2">
          &ldquo;{data.source}&rdquo;
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
