"use client";

import { useState } from "react";
import { Heart, Briefcase, X, Edit2, MoreHorizontal } from "lucide-react";
import type { CustomerInterest } from "@/db/interest-schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface InterestBadgeProps {
  interest: CustomerInterest;
  onEdit?: (interest: CustomerInterest) => void;
  onArchive?: (interest: CustomerInterest) => void;
  showActions?: boolean;
  size?: "sm" | "default";
}

export function InterestBadge({
  interest,
  onEdit,
  onArchive,
  showActions = false,
  size = "default",
}: InterestBadgeProps) {
  const [showMenu, setShowMenu] = useState(false);

  const isPersonal = interest.category === "personal";
  const Icon = isPersonal ? Heart : Briefcase;

  const confidenceColors: Record<string, string> = {
    high: "bg-green-500/10 text-green-700 dark:text-green-400",
    medium: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
    low: "bg-gray-500/10 text-gray-600 dark:text-gray-400",
  };

  const categoryColors: Record<string, string> = {
    personal: "border-pink-500/30 bg-pink-50/50 dark:bg-pink-950/20",
    financial: "border-blue-500/30 bg-blue-50/50 dark:bg-blue-950/20",
  };

  const content = (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-colors",
        categoryColors[interest.category],
        size === "sm" && "px-2 py-0.5 text-xs",
        showActions && "hover:bg-muted/50"
      )}
      onMouseEnter={() => setShowMenu(true)}
      onMouseLeave={() => setShowMenu(false)}
    >
      <Icon
        className={cn(
          "size-3.5",
          isPersonal ? "text-pink-500" : "text-blue-500",
          size === "sm" && "size-3"
        )}
        aria-hidden="true"
      />
      <span className={cn("font-medium", size === "sm" && "text-xs")}>
        {interest.label}
      </span>

      {/* Actions dropdown */}
      {showActions && (onEdit || onArchive) && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-4 w-4 p-0 hover:bg-transparent",
                !showMenu && "opacity-0"
              )}
            >
              <MoreHorizontal className="size-3" />
              <span className="sr-only">Actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-32">
            {onEdit && (
              <DropdownMenuItem onClick={() => onEdit(interest)}>
                <Edit2 className="size-3.5 mr-2" />
                Edit
              </DropdownMenuItem>
            )}
            {onArchive && (
              <DropdownMenuItem
                onClick={() => onArchive(interest)}
                className="text-destructive focus:text-destructive"
              >
                <X className="size-3.5 mr-2" />
                Remove
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );

  // If there's a description or source, wrap in tooltip
  if (interest.description || interest.sourceText) {
    return (
      <TooltipProvider>
        <Tooltip delayDuration={300}>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            <div className="space-y-1.5">
              {interest.description && (
                <p className="text-sm">{interest.description}</p>
              )}
              {interest.sourceText && (
                <p className="text-xs text-muted-foreground italic">
                  &ldquo;{interest.sourceText}&rdquo;
                </p>
              )}
              {interest.confidence && (
                <Badge
                  variant="outline"
                  className={cn("text-[10px]", confidenceColors[interest.confidence])}
                >
                  {interest.confidence} confidence
                </Badge>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return content;
}
