"use client";

import { useCallback, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import {
  LayoutDashboard,
  MessageSquarePlus,
  Clock,
  CheckSquare,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const MODES = [
  { id: "overview", label: "Overview", icon: LayoutDashboard, shortcut: "1" },
  { id: "capture", label: "Capture", icon: MessageSquarePlus, shortcut: "2" },
  { id: "timeline", label: "Timeline", icon: Clock, shortcut: "3" },
  { id: "tasks", label: "Tasks", icon: CheckSquare, shortcut: "4" },
  { id: "profile", label: "Profile", icon: User, shortcut: "5" },
] as const;

export type ModeId = (typeof MODES)[number]["id"];

interface ModeNavigationProps {
  currentMode: ModeId;
  taskCount?: number;
  onModeChange?: (mode: ModeId) => void;
}

export function ModeNavigation({
  currentMode,
  taskCount = 0,
  onModeChange,
}: ModeNavigationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleModeChange = useCallback(
    (modeId: ModeId) => {
      const params = new URLSearchParams(searchParams);
      if (modeId === "overview") {
        params.delete("mode");
      } else {
        params.set("mode", modeId);
      }
      const queryString = params.toString();
      router.push(queryString ? `${pathname}?${queryString}` : pathname);
      onModeChange?.(modeId);
    },
    [router, pathname, searchParams, onModeChange]
  );

  // Keyboard shortcuts: Cmd+1 through Cmd+5
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if Cmd (Mac) or Ctrl (Windows) is pressed
      if (!e.metaKey && !e.ctrlKey) return;

      // Find matching mode by shortcut
      const mode = MODES.find((m) => m.shortcut === e.key);
      if (mode) {
        e.preventDefault();
        handleModeChange(mode.id);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleModeChange]);

  // Arrow key navigation within tabs
  const handleKeyNavigation = useCallback(
    (e: React.KeyboardEvent, currentIndex: number) => {
      let newIndex = currentIndex;

      if (e.key === "ArrowRight") {
        e.preventDefault();
        newIndex = (currentIndex + 1) % MODES.length;
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        newIndex = (currentIndex - 1 + MODES.length) % MODES.length;
      } else if (e.key === "Home") {
        e.preventDefault();
        newIndex = 0;
      } else if (e.key === "End") {
        e.preventDefault();
        newIndex = MODES.length - 1;
      }

      if (newIndex !== currentIndex) {
        handleModeChange(MODES[newIndex].id);
        // Focus the new tab
        const tabElement = document.querySelector(
          `[data-mode-tab="${MODES[newIndex].id}"]`
        ) as HTMLElement;
        tabElement?.focus();
      }
    },
    [handleModeChange]
  );

  return (
    <nav
      className="border-b bg-background overflow-x-auto scrollbar-none"
      role="tablist"
      aria-label="Customer profile modes"
    >
      <div className="flex min-w-max px-2 sm:px-4">
        {MODES.map((mode, index) => {
          const Icon = mode.icon;
          const isActive = currentMode === mode.id;
          const showBadge = mode.id === "tasks" && taskCount > 0;

          return (
            <button
              key={mode.id}
              role="tab"
              aria-selected={isActive}
              aria-controls={`${mode.id}-panel`}
              data-mode-tab={mode.id}
              tabIndex={isActive ? 0 : -1}
              onClick={() => handleModeChange(mode.id)}
              onKeyDown={(e) => handleKeyNavigation(e, index)}
              className={cn(
                "group relative flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px whitespace-nowrap",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
                // Touch target size for mobile
                "min-h-[44px]",
                isActive
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <Icon className="size-4" aria-hidden="true" />
              <span className="hidden sm:inline">{mode.label}</span>
              {/* Mobile: show abbreviated label or just icon */}
              <span className="sm:hidden text-xs">{mode.label.slice(0, 4)}</span>

              {/* Task count badge */}
              {showBadge && (
                <span
                  className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-medium bg-primary text-primary-foreground"
                  aria-label={`${taskCount} pending tasks`}
                >
                  {taskCount > 99 ? "99+" : taskCount}
                </span>
              )}

              {/* Keyboard shortcut hint (shown on hover, desktop only) */}
              <span
                className={cn(
                  "absolute right-1 top-1 text-[10px] text-muted-foreground/50",
                  "opacity-0 group-hover:opacity-100 transition-opacity",
                  "hidden lg:block"
                )}
                aria-hidden="true"
              >
                ⌘{mode.shortcut}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

// Helper to get current mode from URL
export function getModeFromUrl(searchParams: URLSearchParams): ModeId {
  const mode = searchParams.get("mode");
  const validModes = MODES.map((m) => m.id);
  if (mode && validModes.includes(mode as ModeId)) {
    return mode as ModeId;
  }
  return "overview";
}
