"use client";

import { useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { AlertCircle, CheckCircle, Clock, FileText } from "lucide-react";
import type { CustomerWithNotes } from "@/lib/crm/types";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NeedsAttentionCardProps {
  customer: CustomerWithNotes;
}

export function NeedsAttentionCard({ customer }: NeedsAttentionCardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const now = useMemo(() => new Date(), []);

  // Check for overdue follow-up
  const followUpDate = customer.nextFollowUpDate
    ? new Date(customer.nextFollowUpDate)
    : null;
  const isOverdue = followUpDate && followUpDate < now;
  const daysOverdue = isOverdue
    ? Math.floor((now.getTime() - followUpDate.getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  // Check for incomplete required fields
  const missingHighPriority: string[] = [];
  if (!customer.primaryGoalType) missingHighPriority.push("Primary Goal");
  if (!customer.incomeBandAnnual) missingHighPriority.push("Income Band");
  if (!customer.riskQuestionnaireCompleted)
    missingHighPriority.push("Risk Questionnaire");

  // Count recent notes that might need processing
  const recentUnprocessedNotes = customer.notes?.filter((note) => {
    const noteDate = new Date(note.createdAt);
    const daysSinceNote = Math.floor(
      (now.getTime() - noteDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    // Notes from last 7 days that might have unprocessed extractions
    return daysSinceNote <= 7;
  }).length ?? 0;

  const hasItems =
    isOverdue || missingHighPriority.length > 0 || recentUnprocessedNotes > 0;

  const navigateToMode = (mode: string) => {
    router.push(`${pathname}?mode=${mode}`);
  };

  return (
    <Card variant={hasItems ? "attention" : "default"}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle
            className={cn(
              "size-4",
              hasItems ? "text-primary" : "text-muted-foreground"
            )}
            aria-hidden="true"
          />
          Needs Attention
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!hasItems ? (
          <AllCaughtUp />
        ) : (
          <div className="space-y-3">
            {/* Overdue Follow-up */}
            {isOverdue && followUpDate && (
              <AttentionItem
                icon={<Clock className="size-4 text-red-500" />}
                title="Overdue Follow-up"
                description={`${daysOverdue} days overdue (was ${followUpDate.toLocaleDateString(
                  "en-IN",
                  { day: "numeric", month: "short" }
                )})`}
                action={
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigateToMode("profile")}
                  >
                    Reschedule
                  </Button>
                }
                variant="destructive"
              />
            )}

            {/* Missing High Priority Fields */}
            {missingHighPriority.length > 0 && (
              <AttentionItem
                icon={<FileText className="size-4 text-amber-500" />}
                title="Profile Gaps"
                description={`Missing: ${missingHighPriority.join(", ")}`}
                action={
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigateToMode("capture")}
                  >
                    Add Info
                  </Button>
                }
                variant="warning"
              />
            )}

            {/* Recent Notes */}
            {recentUnprocessedNotes > 0 && (
              <AttentionItem
                icon={<FileText className="size-4 text-blue-500" />}
                title="Recent Notes"
                description={`${recentUnprocessedNotes} note${recentUnprocessedNotes > 1 ? "s" : ""} from the last week`}
                action={
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigateToMode("timeline")}
                  >
                    Review
                  </Button>
                }
                variant="info"
              />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface AttentionItemProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  variant?: "destructive" | "warning" | "info";
}

function AttentionItem({
  icon,
  title,
  description,
  action,
}: AttentionItemProps) {
  return (
    <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
      <div className="shrink-0 mt-0.5">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

function AllCaughtUp() {
  return (
    <div className="flex flex-col items-center justify-center py-6 text-center">
      <div className="rounded-full bg-green-500/10 p-3 mb-3">
        <CheckCircle className="size-6 text-green-600 dark:text-green-400" aria-hidden="true" />
      </div>
      <p className="text-sm font-medium text-green-600 dark:text-green-400">
        All caught up!
      </p>
      <p className="text-xs text-muted-foreground mt-1">
        No pending items requiring attention
      </p>
    </div>
  );
}
