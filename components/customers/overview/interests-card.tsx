"use client";

import { useEffect, useState, useCallback } from "react";
import { Heart, Briefcase, Plus, Loader2 } from "lucide-react";
import type { CustomerInterest } from "@/db/interest-schema";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { InterestBadge } from "./interest-badge";
import { AddInterestDialog } from "../dialogs/add-interest-dialog";
import { EditInterestDialog } from "../dialogs/edit-interest-dialog";
import { cn } from "@/lib/utils";

interface InterestsCardProps {
  customerId: string;
}

export function InterestsCard({ customerId }: InterestsCardProps) {
  const [interests, setInterests] = useState<CustomerInterest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editingInterest, setEditingInterest] = useState<CustomerInterest | null>(null);

  const fetchInterests = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/customers/${customerId}/interests?status=active`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch interests");
      }
      const data = await response.json();
      setInterests(data.interests || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    fetchInterests();
  }, [fetchInterests]);

  const handleEdit = (interest: CustomerInterest) => {
    setEditingInterest(interest);
  };

  const handleArchive = async (interest: CustomerInterest) => {
    try {
      const response = await fetch(
        `/api/customers/${customerId}/interests/${interest.id}`,
        { method: "DELETE" }
      );
      if (!response.ok) {
        throw new Error("Failed to archive interest");
      }
      // Refresh list
      fetchInterests();
    } catch (e) {
      console.error("Failed to archive interest:", e);
    }
  };

  const handleAddSuccess = () => {
    setAddDialogOpen(false);
    fetchInterests();
  };

  const handleEditSuccess = () => {
    setEditingInterest(null);
    fetchInterests();
  };

  // Group by category
  const personalInterests = interests.filter((i) => i.category === "personal");
  const financialInterests = interests.filter((i) => i.category === "financial");

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="size-4 text-muted-foreground" aria-hidden="true" />
            Interests
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
            <Heart className="size-4 text-muted-foreground" aria-hidden="true" />
            Interests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            Failed to load interests
          </p>
        </CardContent>
      </Card>
    );
  }

  const hasInterests = interests.length > 0;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Heart className="size-4 text-muted-foreground" aria-hidden="true" />
              Interests
              {hasInterests && (
                <span className="text-sm font-normal text-muted-foreground">
                  ({interests.length})
                </span>
              )}
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAddDialogOpen(true)}
              className="h-8 px-2"
            >
              <Plus className="size-4" />
              <span className="sr-only">Add interest</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!hasInterests ? (
            <EmptyState onAdd={() => setAddDialogOpen(true)} />
          ) : (
            <div className="space-y-4">
              {/* Personal Interests */}
              {personalInterests.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    <Heart className="size-3 text-pink-500" />
                    Personal
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {personalInterests.map((interest) => (
                      <InterestBadge
                        key={interest.id}
                        interest={interest}
                        showActions
                        onEdit={handleEdit}
                        onArchive={handleArchive}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Financial Interests */}
              {financialInterests.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    <Briefcase className="size-3 text-blue-500" />
                    Financial
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {financialInterests.map((interest) => (
                      <InterestBadge
                        key={interest.id}
                        interest={interest}
                        showActions
                        onEdit={handleEdit}
                        onArchive={handleArchive}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Interest Dialog */}
      <AddInterestDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        customerId={customerId}
        onSuccess={handleAddSuccess}
      />

      {/* Edit Interest Dialog */}
      {editingInterest && (
        <EditInterestDialog
          open={!!editingInterest}
          onOpenChange={(open) => !open && setEditingInterest(null)}
          customerId={customerId}
          interest={editingInterest}
          onSuccess={handleEditSuccess}
        />
      )}
    </>
  );
}

interface EmptyStateProps {
  onAdd: () => void;
}

function EmptyState({ onAdd }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-6 text-center">
      <div className="rounded-full bg-muted p-3 mb-3">
        <Heart className="size-5 text-muted-foreground" aria-hidden="true" />
      </div>
      <p className="text-sm font-medium">No interests captured</p>
      <p className="text-xs text-muted-foreground mt-1 mb-3">
        Interests help personalize conversations
      </p>
      <Button variant="outline" size="sm" onClick={onAdd}>
        <Plus className="size-4 mr-1" />
        Add interest
      </Button>
    </div>
  );
}
