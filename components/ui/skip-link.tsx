"use client";

import { cn } from "@/lib/utils";

interface SkipLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

export function SkipLink({ href, children, className }: SkipLinkProps) {
  return (
    <a
      href={href}
      className={cn(
        "sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:top-4 focus:left-4",
        "focus:px-4 focus:py-2 focus:rounded-md focus:bg-background focus:text-foreground",
        "focus:ring-2 focus:ring-ring focus:outline-none",
        "transition-all duration-150",
        className
      )}
    >
      {children}
    </a>
  );
}
