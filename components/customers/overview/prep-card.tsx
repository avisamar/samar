"use client";

import { useMemo } from "react";
import { Calendar, Target, AlertCircle, Clock } from "lucide-react";
import type { Customer } from "@/lib/crm/types";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface PrepCardProps {
  customer: Customer;
}

export function PrepCard({ customer }: PrepCardProps) {
  const now = useMemo(() => new Date(), []);
  const lastMeetingDate = customer.lastMeetingDate
    ? new Date(customer.lastMeetingDate)
    : null;
  const daysSinceLastMeeting = lastMeetingDate
    ? Math.floor((now.getTime() - lastMeetingDate.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const hasAnyContent =
    lastMeetingDate ||
    customer.lastMeetingNotes ||
    customer.primaryGoalType ||
    customer.keyDiscussionPoints ||
    customer.clientPainPoints;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="size-4 text-muted-foreground" aria-hidden="true" />
          Prep for Call
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!hasAnyContent ? (
          <EmptyState />
        ) : (
          <>
            {/* Last Interaction */}
            {lastMeetingDate && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="size-3" />
                  Last Meeting
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    {lastMeetingDate.toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                  {daysSinceLastMeeting !== null && (
                    <span
                      className={cn(
                        "text-xs px-1.5 py-0.5 rounded",
                        daysSinceLastMeeting > 30
                          ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {daysSinceLastMeeting}d ago
                    </span>
                  )}
                </div>
                {customer.lastMeetingNotes && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {customer.lastMeetingNotes}
                  </p>
                )}
              </div>
            )}

            {/* Primary Goal */}
            {customer.primaryGoalType && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Target className="size-3" />
                  Primary Goal
                </div>
                <div className="text-sm font-medium">
                  {customer.primaryGoalType}
                  {customer.primaryGoalHorizon && (
                    <span className="text-muted-foreground font-normal ml-1">
                      ({customer.primaryGoalHorizon})
                    </span>
                  )}
                </div>
                {customer.goalsSummary && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {customer.goalsSummary}
                  </p>
                )}
              </div>
            )}

            {/* Key Discussion Points / Pain Points */}
            {(customer.keyDiscussionPoints || customer.clientPainPoints) && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <AlertCircle className="size-3" />
                  Important Notes
                </div>
                <div className="space-y-1 text-sm">
                  {customer.keyDiscussionPoints && (
                    <p className="text-muted-foreground line-clamp-2">
                      {customer.keyDiscussionPoints}
                    </p>
                  )}
                  {customer.clientPainPoints && (
                    <p className="text-amber-600 dark:text-amber-400 line-clamp-1">
                      Pain: {customer.clientPainPoints}
                    </p>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-4">
      <p className="text-sm text-muted-foreground">
        No meeting history yet. Add notes through the Capture tab to start
        building context.
      </p>
    </div>
  );
}
