"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface LiveRegionProps {
  /** The message to announce (change this to trigger announcements) */
  message: string;
  /** Level of urgency: polite (default) or assertive */
  politeness?: "polite" | "assertive";
  /** Additional className */
  className?: string;
}

/**
 * LiveRegion announces messages to screen readers.
 * Change the `message` prop to trigger a new announcement.
 *
 * Usage:
 * ```tsx
 * const [announcement, setAnnouncement] = useState("");
 *
 * const handleSave = () => {
 *   // ...save logic
 *   setAnnouncement("Profile saved successfully");
 * };
 *
 * return (
 *   <>
 *     <LiveRegion message={announcement} />
 *     <button onClick={handleSave}>Save</button>
 *   </>
 * );
 * ```
 */
export function LiveRegion({
  message,
  politeness = "polite",
  className,
}: LiveRegionProps) {
  const [currentMessage, setCurrentMessage] = React.useState("");

  // When message changes, update the live region
  React.useEffect(() => {
    if (message) {
      // Clear first to ensure re-announcement of same message
      setCurrentMessage("");
      // Small delay to ensure screen readers pick up the change
      const timeout = setTimeout(() => {
        setCurrentMessage(message);
      }, 100);
      return () => clearTimeout(timeout);
    }
  }, [message]);

  return (
    <div
      role="status"
      aria-live={politeness}
      aria-atomic="true"
      className={cn("sr-only", className)}
    >
      {currentMessage}
    </div>
  );
}

// Hook for managing live region announcements
export function useLiveRegion() {
  const [message, setMessage] = React.useState("");

  const announce = React.useCallback((text: string) => {
    setMessage(text);
  }, []);

  const clear = React.useCallback(() => {
    setMessage("");
  }, []);

  return { message, announce, clear };
}
