"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Phone,
  Mail,
  MessageSquare,
  MoreHorizontal,
  Edit,
  Trash2,
  Calendar,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Customer } from "@/lib/crm/types";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Relationship stages for status badge
type RelationshipStage = "new" | "in_convo" | "opportunity" | "client";

interface IdentityBarProps {
  customer: Customer;
  onStageChange?: (stage: RelationshipStage) => void;
}

export function IdentityBar({ customer, onStageChange }: IdentityBarProps) {
  // Derive relationship stage from customer data
  const stage = deriveRelationshipStage(customer);

  return (
    <header className="sticky top-0 z-10 bg-background border-b">
      <div className="flex items-center justify-between gap-2 sm:gap-4 px-3 sm:px-6 py-2 sm:py-3">
        {/* Left: Back navigation + Identity */}
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          {/* Back Navigation */}
          <Link
            href="/customers"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors shrink-0 min-w-[44px] min-h-[44px] justify-center sm:justify-start"
            aria-label="Back to customers"
          >
            <ArrowLeft className="size-4" />
            <span className="hidden sm:inline">Back</span>
          </Link>

          {/* Divider - hidden on mobile */}
          <div className="hidden sm:block h-5 w-px bg-border shrink-0" />

          {/* Client Name and Attributes */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <h1 className="text-base sm:text-lg font-medium truncate max-w-[150px] sm:max-w-none">
              {customer.fullName || "Unnamed Customer"}
            </h1>

            {/* Status Badge - hidden on very small screens */}
            <div className="hidden xs:block">
              <StatusBadge
                stage={stage}
                onClick={onStageChange ? () => {} : undefined}
              />
            </div>

            {/* Key Attributes - desktop only */}
            <div className="hidden lg:flex items-center gap-2 text-sm text-muted-foreground">
              {customer.occupationType && (
                <span className="truncate max-w-[120px]">
                  {customer.occupationType}
                </span>
              )}
              {customer.occupationType && customer.cityOfResidence && (
                <span className="text-border">•</span>
              )}
              {customer.cityOfResidence && (
                <span className="truncate max-w-[100px]">
                  {customer.cityOfResidence}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Action Buttons */}
        <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
          {/* Quick Actions - hidden on mobile, shown in overflow menu */}
          <div className="hidden sm:flex items-center gap-1">
            {customer.primaryMobile && (
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Call customer"
                asChild
              >
                <a href={`tel:${customer.primaryMobile}`}>
                  <Phone className="size-4" />
                </a>
              </Button>
            )}

            {customer.emailPrimary && (
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Email customer"
                asChild
              >
                <a href={`mailto:${customer.emailPrimary}`}>
                  <Mail className="size-4" />
                </a>
              </Button>
            )}

            {customer.primaryMobile && (
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Message customer on WhatsApp"
                asChild
              >
                <a
                  href={`https://wa.me/${customer.primaryMobile.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageSquare className="size-4" />
                </a>
              </Button>
            )}
          </div>

          {/* Overflow Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="More actions"
                className="min-w-[44px] min-h-[44px]"
              >
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {/* Mobile-only contact options */}
              <div className="sm:hidden">
                {customer.primaryMobile && (
                  <DropdownMenuItem asChild>
                    <a href={`tel:${customer.primaryMobile}`}>
                      <Phone className="size-4" />
                      Call
                    </a>
                  </DropdownMenuItem>
                )}
                {customer.emailPrimary && (
                  <DropdownMenuItem asChild>
                    <a href={`mailto:${customer.emailPrimary}`}>
                      <Mail className="size-4" />
                      Email
                    </a>
                  </DropdownMenuItem>
                )}
                {customer.primaryMobile && (
                  <DropdownMenuItem asChild>
                    <a
                      href={`https://wa.me/${customer.primaryMobile.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <MessageSquare className="size-4" />
                      WhatsApp
                    </a>
                  </DropdownMenuItem>
                )}
                {(customer.primaryMobile || customer.emailPrimary) && (
                  <DropdownMenuSeparator />
                )}
              </div>
              <DropdownMenuItem>
                <Calendar className="size-4" />
                Schedule Meeting
              </DropdownMenuItem>
              <DropdownMenuItem>
                <FileText className="size-4" />
                Export Profile
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Edit className="size-4" />
                Edit Basic Info
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive">
                <Trash2 className="size-4" />
                Delete Customer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

interface StatusBadgeProps {
  stage: RelationshipStage;
  onClick?: () => void;
}

function StatusBadge({ stage, onClick }: StatusBadgeProps) {
  const config = getStageConfig(stage);

  const badge = (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium uppercase tracking-wide",
        config.colors,
        onClick && "cursor-pointer hover:opacity-80 transition-opacity"
      )}
      onClick={onClick}
    >
      {config.label}
    </span>
  );

  return badge;
}

function getStageConfig(stage: RelationshipStage): {
  label: string;
  colors: string;
} {
  switch (stage) {
    case "new":
      return {
        label: "New",
        colors: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
      };
    case "in_convo":
      return {
        label: "In Convo",
        colors: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
      };
    case "opportunity":
      return {
        label: "Opportunity",
        colors: "bg-orange-500/15 text-orange-600 dark:text-orange-400",
      };
    case "client":
      return {
        label: "Client",
        colors: "bg-green-500/15 text-green-600 dark:text-green-400",
      };
  }
}

function deriveRelationshipStage(customer: Customer): RelationshipStage {
  // Simple heuristic based on available data
  // Could be replaced with an explicit field later
  const hasGoals = !!customer.goalsSummary || !!customer.primaryGoalType;
  const hasFinancials =
    !!customer.incomeBandAnnual || !!customer.surplusInvestableBand;
  const hasMeetings = !!customer.lastMeetingDate;
  const hasRisk = !!customer.riskBucket || customer.riskQuestionnaireCompleted;

  if (hasRisk && hasGoals && hasFinancials) {
    return "client";
  }

  if (hasGoals || hasFinancials) {
    return "opportunity";
  }

  if (hasMeetings) {
    return "in_convo";
  }

  return "new";
}
