"use client";

import { useState } from "react";
import { Heart, Briefcase, Loader2 } from "lucide-react";
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
import { cn } from "@/lib/utils";

interface AddInterestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId: string;
  onSuccess: () => void;
}

export function AddInterestDialog({
  open,
  onOpenChange,
  customerId,
  onSuccess,
}: AddInterestDialogProps) {
  const [category, setCategory] = useState<"personal" | "financial">("personal");
  const [label, setLabel] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!label.trim()) {
      setError("Label is required");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/customers/${customerId}/interests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          label: label.trim(),
          description: description.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to add interest");
      }

      // Reset form
      setCategory("personal");
      setLabel("");
      setDescription("");
      onSuccess();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setSaving(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      // Reset form on close
      setCategory("personal");
      setLabel("");
      setDescription("");
      setError(null);
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Interest</DialogTitle>
          <DialogDescription>
            Record a personal or financial interest for this customer.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Category Toggle */}
          <div className="space-y-2">
            <Label>Category</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={category === "personal" ? "default" : "outline"}
                onClick={() => setCategory("personal")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2",
                  category === "personal" && "bg-pink-500 hover:bg-pink-600"
                )}
              >
                <Heart className="size-4" />
                Personal
              </Button>
              <Button
                type="button"
                variant={category === "financial" ? "default" : "outline"}
                onClick={() => setCategory("financial")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2",
                  category === "financial" && "bg-blue-500 hover:bg-blue-600"
                )}
              >
                <Briefcase className="size-4" />
                Financial
              </Button>
            </div>
          </div>

          {/* Label */}
          <div className="space-y-2">
            <Label htmlFor="label">Interest</Label>
            <Input
              id="label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder={
                category === "personal"
                  ? "e.g., Golf, Travel, Wine collecting"
                  : "e.g., Retirement planning, Real estate"
              }
              disabled={saving}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Notes (optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Any additional context or details..."
              rows={2}
              disabled={saving}
            />
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving || !label.trim()}>
              {saving && <Loader2 className="size-4 mr-2 animate-spin" />}
              Add Interest
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
