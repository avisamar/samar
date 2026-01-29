"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import type { ModeId } from "./mode-navigation";
import type { CustomerWithNotes } from "@/lib/crm/types";

// Mode components
import { ProfileAgentChat } from "./profile-agent-chat";
import { OverviewMode } from "./modes/overview-mode";
import { ProfileMode } from "./modes/profile-mode";
import { TimelineMode } from "./modes/timeline-mode";
import { TasksMode } from "./modes/tasks-mode";

interface ModeContentProps {
  mode: ModeId;
  customer: CustomerWithNotes;
}

export function ModeContent({ mode, customer }: ModeContentProps) {
  const [activeMode, setActiveMode] = useState(mode);
  // Simplified transition - just use mode directly
  const isTransitioning = mode !== activeMode;
  const scrollPositions = useRef<Map<ModeId, number>>(new Map());
  const contentRef = useRef<HTMLDivElement>(null);

  // Save scroll position before mode change
  const saveScrollPosition = useCallback(() => {
    if (contentRef.current) {
      scrollPositions.current.set(activeMode, contentRef.current.scrollTop);
    }
  }, [activeMode]);

  // Restore scroll position after mode change
  const restoreScrollPosition = useCallback((targetMode: ModeId) => {
    if (contentRef.current) {
      const savedPosition = scrollPositions.current.get(targetMode) ?? 0;
      contentRef.current.scrollTop = savedPosition;
    }
  }, []);

  // Handle mode transition with crossfade
  useEffect(() => {
    if (mode !== activeMode) {
      saveScrollPosition();

      // Small delay for fade out, then switch mode
      const timeout = setTimeout(() => {
        setActiveMode(mode);

        // Restore scroll position after content renders
        requestAnimationFrame(() => {
          restoreScrollPosition(mode);
        });
      }, 75); // Half of 150ms transition

      return () => clearTimeout(timeout);
    }
  }, [mode, activeMode, saveScrollPosition, restoreScrollPosition]);

  return (
    <div
      ref={contentRef}
      id={`${activeMode}-panel`}
      role="tabpanel"
      aria-labelledby={`${activeMode}-tab`}
      className={cn(
        "flex-1 overflow-y-auto transition-opacity duration-150",
        isTransitioning ? "opacity-0" : "opacity-100"
      )}
    >
      <ModePanel mode={activeMode} customer={customer} />
    </div>
  );
}

interface ModePanelProps {
  mode: ModeId;
  customer: CustomerWithNotes;
}

function ModePanel({ mode, customer }: ModePanelProps) {
  // Read env variable for showing tool messages (default: true)
  const showToolMessages =
    process.env.NEXT_PUBLIC_SHOW_TOOL_MESSAGES !== "false";

  switch (mode) {
    case "overview":
      return <OverviewMode customer={customer} />;
    case "capture":
      return (
        <ProfileAgentChat
          customerId={customer.id}
          showToolMessages={showToolMessages}
        />
      );
    case "timeline":
      return <TimelineMode customer={customer} />;
    case "tasks":
      return <TasksMode customer={customer} />;
    case "profile":
      return <ProfileMode customer={customer} />;
    default:
      return <OverviewMode customer={customer} />;
  }
}
