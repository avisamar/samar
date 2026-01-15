"use client";

import { Sparkles, AlertCircle } from "lucide-react";

/**
 * Welcome message shown when chat is empty.
 */
export function WelcomeMessage() {
  return (
    <div className="flex gap-3 justify-start">
      <div className="flex-shrink-0 size-8 rounded-full bg-primary/10 flex items-center justify-center">
        <Sparkles className="size-4 text-primary" />
      </div>
      <div className="flex flex-col gap-2 max-w-[85%]">
        <div className="rounded-2xl rounded-bl-md bg-muted px-4 py-2.5 text-sm">
          Hi! I&apos;m your Profile Agent. I can help you understand this
          customer&apos;s profile, discuss their goals and preferences, or
          identify gaps in their information. What would you like to know?
        </div>
      </div>
    </div>
  );
}

/**
 * Animated thinking indicator while agent is processing.
 */
export function ThinkingIndicator() {
  return (
    <div className="flex gap-3 justify-start">
      <div className="flex-shrink-0 size-8 rounded-full bg-primary/10 flex items-center justify-center">
        <Sparkles className="size-4 text-primary animate-pulse" />
      </div>
      <div className="rounded-2xl rounded-bl-md bg-muted px-4 py-3">
        <div className="flex items-center gap-1.5">
          <span
            className="size-2 rounded-full bg-foreground/40 animate-bounce"
            style={{ animationDelay: "0ms" }}
          />
          <span
            className="size-2 rounded-full bg-foreground/40 animate-bounce"
            style={{ animationDelay: "150ms" }}
          />
          <span
            className="size-2 rounded-full bg-foreground/40 animate-bounce"
            style={{ animationDelay: "300ms" }}
          />
        </div>
      </div>
    </div>
  );
}

/**
 * Error message display.
 */
export function ErrorMessage({ error }: { error: Error }) {
  const errorMessage = error.message || "Something went wrong. Please try again.";

  return (
    <div className="flex gap-3 justify-start">
      <div className="flex-shrink-0 size-8 rounded-full bg-destructive/10 flex items-center justify-center">
        <AlertCircle className="size-4 text-destructive" />
      </div>
      <div className="flex flex-col gap-2 max-w-[85%]">
        <div className="rounded-2xl rounded-bl-md bg-destructive/10 border border-destructive/20 px-4 py-2.5 text-sm text-destructive">
          {errorMessage}
        </div>
      </div>
    </div>
  );
}
