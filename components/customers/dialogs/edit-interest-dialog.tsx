"use client";

import { useState, useEffect } from "react";
import { Heart, Briefcase, Loader2 } from "lucide-react";
import type { CustomerInterest } from "@/db/interest-schema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface EditInterestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId: string;
  interest: CustomerInterest;
  onSuccess: () => void;
}

export function EditInterestDialog({
  open,
  onOpenChange,
  customerId,
  interest,
  onSuccess,
}: EditInterestDialogProps) {
  const [label, setLabel] = useState(interest.label);
  const [description, setDescription] = useState(interest.description || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update form when interest changes
  useEffect(() => {
    setLabel(interest.label);
    setDescription(interest.description || "");
  }, [interest]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!label.trim()) {
      setError("Label is required");
      return;
    }

    // Check if anything changed
    if (label.trim() === interest.label && description.trim() === (interest.description || "")) {
      onOpenChange(false);
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(
        `/api/customers/${customerId}/interests/${interest.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            label: label.trim(),
            description: description.trim() || undefined,
          }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update interest");
      }

      onSuccess();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setSaving(false);
    }
  };

  const isPersonal = interest.category === "personal";
  const Icon = isPersonal ? Heart : Briefcase;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Edit Interest
            <Badge
              variant="outline"
              className={cn(
                "ml-2 capitalize",
                isPersonal
                  ? "border-pink-500/30 text-pink-600"
                  : "border-blue-500/30 text-blue-600"
              )}
            >
              <Icon className="size-3 mr-1" />
              {interest.category}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Update the details for this interest.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Label */}
          <div className="space-y-2">
            <Label htmlFor="edit-label">Interest</Label>
            <Input
              id="edit-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              disabled={saving}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="edit-description">Notes (optional)</Label>
            <Textarea
              id="edit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Any additional context or details..."
              rows={2}
              disabled={saving}
            />
          </div>

          {/* Source info (read-only) */}
          {interest.sourceText && (
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Source</Label>
              <p className="text-xs text-muted-foreground italic bg-muted/50 rounded p-2">
                &ldquo;{interest.sourceText}&rdquo;
              </p>
            </div>
          )}

          {/* Error */}
          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving || !label.trim()}>
              {saving && <Loader2 className="size-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
