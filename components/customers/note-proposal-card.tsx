"use client";

import React, { useState } from "react";
import { Check, X, Pencil, StickyNote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { ProposedNote } from "@/lib/crm/extraction-types";

interface NoteProposalCardProps {
  note: ProposedNote;
  status: "pending" | "accepted" | "rejected";
  editedContent?: string | null;
  onAction: (action: "accept" | "reject") => void;
  onEdit: (content: string) => void;
}

export function NoteProposalCard({
  note,
  status,
  editedContent,
  onAction,
  onEdit,
}: NoteProposalCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editInput, setEditInput] = useState(editedContent ?? note.content);

  const handleSaveEdit = () => {
    onEdit(editInput);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditInput(editedContent ?? note.content);
    setIsEditing(false);
  };

  const displayContent = editedContent ?? note.content;

  const sourceLabel = {
    meeting: "Meeting Note",
    call: "Call Note",
    email: "Email",
    voice_note: "Voice Note",
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
          <StickyNote className="size-4 text-muted-foreground" />
          <span className="font-medium text-sm">Proposed Note</span>
          <Badge variant="outline" className="text-xs">
            {sourceLabel[note.source]}
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

      {/* Note content */}
      {isEditing ? (
        <div className="space-y-2">
          <Textarea
            value={editInput}
            onChange={(e) => setEditInput(e.target.value)}
            className="min-h-[80px] text-sm"
            autoFocus
          />
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={handleSaveEdit} className="h-7">
              <Check className="size-3 mr-1" />
              Save
            </Button>
            <Button size="sm" variant="ghost" onClick={handleCancelEdit} className="h-7">
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-foreground mb-2 whitespace-pre-wrap">
          {displayContent}
        </p>
      )}

      {/* Tags */}
      {note.tags.length > 0 && !isEditing && (
        <div className="flex flex-wrap gap-1 mb-2">
          {note.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
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
