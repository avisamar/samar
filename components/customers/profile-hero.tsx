import {
  Phone,
  Mail,
  MapPin,
  Calendar,
  Target,
  Shield,
  Wallet,
  Clock,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Customer } from "@/lib/crm/types";
import {
  calculateCompleteness,
  getCompletenessBgColor,
} from "@/lib/crm/completeness";

interface ProfileHeroProps {
  customer: Customer;
}

export function ProfileHero({ customer }: ProfileHeroProps) {
  const completeness = calculateCompleteness(customer);
  const today = new Date();

  // Calculate follow-up status
  const followUpDate = customer.nextFollowUpDate
    ? new Date(customer.nextFollowUpDate)
    : null;
  const isOverdue = followUpDate && followUpDate < today;
  const isThisWeek =
    followUpDate &&
    followUpDate >= today &&
    followUpDate <= new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

  // Calculate last meeting staleness
  const lastMeetingDate = customer.lastMeetingDate
    ? new Date(customer.lastMeetingDate)
    : null;
  const daysSinceLastMeeting = lastMeetingDate
    ? Math.floor(
        (today.getTime() - lastMeetingDate.getTime()) / (1000 * 60 * 60 * 24)
      )
    : null;
  const isMeetingStale = daysSinceLastMeeting && daysSinceLastMeeting > 30;

  return (
    <div className="space-y-4">
      {/* Row 1: Identity & Contact */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold">
            {customer.fullName || "Unnamed Customer"}
          </h1>
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            {customer.ageBand && <span>{customer.ageBand}</span>}
            {customer.occupationType && (
              <>
                {/* <span className="text-border">|</span> */}
                <span>{customer.occupationType}</span>
              </>
            )}
            {customer.industry && (
              <>
                <span className="text-border">|</span>
                <span>{customer.industry}</span>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-sm">
          {customer.cityOfResidence && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <MapPin className="size-3.5" />
              <span>{customer.cityOfResidence}</span>
            </div>
          )}
          {customer.primaryMobile && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Phone className="size-3.5" />
              <span>{customer.primaryMobile}</span>
            </div>
          )}
          {customer.emailPrimary && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Mail className="size-3.5" />
              <span className="truncate max-w-[180px]">
                {customer.emailPrimary}
              </span>
            </div>
          )}
          {customer.preferredChannel && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
              {customer.preferredChannel}
            </span>
          )}
        </div>
      </div>

      {/* Row 2: Financial Snapshot */}
      <div className="flex flex-wrap gap-6">
        {/* Income Band */}
        {customer.incomeBandAnnual && (
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Wallet className="size-3" />
              <span>Income</span>
            </div>
            <span
              className={cn(
                "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
                getIncomeBadgeColor(customer.incomeBandAnnual)
              )}
            >
              {customer.incomeBandAnnual}
            </span>
          </div>
        )}

        {/* Investable Surplus */}
        {customer.surplusInvestableBand && (
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <TrendingUp className="size-3" />
              <span>Surplus</span>
            </div>
            <span className="text-sm font-medium">
              {customer.surplusInvestableBand}
            </span>
          </div>
        )}

        {/* Risk Bucket */}
        {customer.riskBucket && (
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Shield className="size-3" />
              <span>Risk</span>
            </div>
            <span
              className={cn(
                "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
                getRiskBadgeColor(customer.riskBucket)
              )}
            >
              {formatRiskBucket(customer.riskBucket)}
            </span>
          </div>
        )}

        {/* Primary Goal */}
        {customer.primaryGoalType && (
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Target className="size-3" />
              <span>Goal</span>
            </div>
            <span className="text-sm font-medium">
              {customer.primaryGoalType}
              {customer.primaryGoalHorizon && (
                <span className="text-muted-foreground ml-1">
                  ({customer.primaryGoalHorizon})
                </span>
              )}
            </span>
          </div>
        )}

        {/* Emergency Buffer */}
        {customer.emergencyBufferStatus && (
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="size-3" />
              <span>Buffer</span>
            </div>
            <span
              className={cn(
                "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
                getBufferBadgeColor(customer.emergencyBufferStatus)
              )}
            >
              {customer.emergencyBufferStatus}
            </span>
          </div>
        )}
      </div>

      {/* Row 3: RM Actions & Completeness */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-6">
          {/* Next Follow-up */}
          <div className="space-y-0.5">
            <div className="text-xs text-muted-foreground">Next Follow-up</div>
            {followUpDate ? (
              <div
                className={cn(
                  "flex items-center gap-1.5 text-sm font-medium",
                  isOverdue && "text-red-600 dark:text-red-400",
                  isThisWeek &&
                    !isOverdue &&
                    "text-amber-600 dark:text-amber-400"
                )}
              >
                <Calendar className="size-3.5" />
                <span>
                  {followUpDate.toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                  })}
                </span>
                {isOverdue && (
                  <span className="text-xs bg-red-500/10 px-1.5 py-0.5 rounded">
                    Overdue
                  </span>
                )}
              </div>
            ) : (
              <span className="text-sm text-muted-foreground/50">Not set</span>
            )}
          </div>

          {/* Last Meeting */}
          <div className="space-y-0.5">
            <div className="text-xs text-muted-foreground">Last Meeting</div>
            {lastMeetingDate ? (
              <div
                className={cn(
                  "flex items-center gap-1.5 text-sm",
                  isMeetingStale && "text-amber-600 dark:text-amber-400"
                )}
              >
                <Calendar className="size-3.5" />
                <span>
                  {lastMeetingDate.toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                  })}
                </span>
                {daysSinceLastMeeting !== null && (
                  <span className="text-xs text-muted-foreground">
                    ({daysSinceLastMeeting}d ago)
                  </span>
                )}
              </div>
            ) : (
              <span className="text-sm text-muted-foreground/50">
                No meetings
              </span>
            )}
          </div>
        </div>

        {/* Profile Completeness */}
        <div className="flex items-center gap-3">
          <div className="">
            <div className="text-xs text-muted-foreground">Profile</div>
            <div className="text-sm font-medium capitalize">
              {completeness.level}
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground text-right">
              {completeness.percentage}%
            </div>
            <div className="h-2 w-24 bg-muted rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  getCompletenessBgColor(completeness.level)
                )}
                style={{ width: `${completeness.percentage}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function getIncomeBadgeColor(band: string): string {
  if (band.includes("2Cr") || band.includes("1-2Cr")) {
    return "bg-blue-600/20 text-blue-700 dark:text-blue-300";
  }
  if (band.includes("1Cr") || band.includes("50L")) {
    return "bg-blue-500/15 text-blue-600 dark:text-blue-400";
  }
  if (band.includes("25") || band.includes("10")) {
    return "bg-blue-400/10 text-blue-500 dark:text-blue-400";
  }
  return "bg-muted text-muted-foreground";
}

function getRiskBadgeColor(bucket: string): string {
  const upper = bucket.toUpperCase();
  if (upper.includes("CAPITAL_PRESERVATION") || upper.includes("CONSERVATIVE")) {
    return "bg-green-500/15 text-green-600 dark:text-green-400";
  }
  if (upper.includes("BALANCED")) {
    return "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400";
  }
  if (upper.includes("GROWTH")) {
    return "bg-orange-500/15 text-orange-600 dark:text-orange-400";
  }
  return "bg-muted text-muted-foreground";
}

function formatRiskBucket(bucket: string): string {
  return bucket
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function getBufferBadgeColor(status: string): string {
  if (status.includes("12+") || status.includes("6-12")) {
    return "bg-green-500/15 text-green-600 dark:text-green-400";
  }
  if (status.includes("3-6")) {
    return "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400";
  }
  if (status.includes("<3") || status.toLowerCase() === "none") {
    return "bg-red-500/15 text-red-600 dark:text-red-400";
  }
  return "bg-muted text-muted-foreground";
}
