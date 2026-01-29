"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import type { CustomerWithNotes } from "@/lib/crm/types";
import { IdentityBar } from "./identity-bar";
import { ModeNavigation, getModeFromUrl, type ModeId } from "./mode-navigation";
import { ModeContent } from "./mode-content";

interface CustomerProfileProps {
  customer: CustomerWithNotes;
  initialMode?: string;
}

export function CustomerProfile({ customer, initialMode }: CustomerProfileProps) {
  const searchParams = useSearchParams();

  // Get current mode from URL, fallback to initialMode or "overview"
  const currentMode = getModeFromUrl(searchParams) ||
    (isValidMode(initialMode) ? initialMode : "overview");

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      {/* Sticky Identity Bar */}
      <IdentityBar customer={customer} />

      {/* Mode Navigation */}
      <ModeNavigation currentMode={currentMode} />

      {/* Mode Content Area */}
      <Suspense fallback={<ContentLoading />}>
        <ModeContent mode={currentMode} customer={customer} />
      </Suspense>
    </div>
  );
}

function ContentLoading() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        <span>Loading...</span>
      </div>
    </div>
  );
}

function isValidMode(mode?: string): mode is ModeId {
  const validModes: ModeId[] = ["overview", "capture", "timeline", "tasks", "profile"];
  return !!mode && validModes.includes(mode as ModeId);
}
