"use client";

import * as React from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProgressBar } from "./progress-bar";

export interface ExpandableSectionProps {
  /** Section title */
  title: string;
  /** Children to render when expanded */
  children: React.ReactNode;
  /** Whether the section is expanded */
  defaultExpanded?: boolean;
  /** Controlled expanded state */
  expanded?: boolean;
  /** Callback when expanded state changes */
  onExpandedChange?: (expanded: boolean) => void;
  /** Optional progress percentage (0-100) to show in header */
  progress?: number;
  /** Optional icon to show before title */
  icon?: React.ReactNode;
  /** Optional count/badge to show after title */
  badge?: React.ReactNode;
  /** Custom className for the container */
  className?: string;
  /** ID for the section (used in accordion mode) */
  id?: string;
}

function ExpandableSection({
  title,
  children,
  defaultExpanded = false,
  expanded: controlledExpanded,
  onExpandedChange,
  progress,
  icon,
  badge,
  className,
  id,
}: ExpandableSectionProps) {
  const [uncontrolledExpanded, setUncontrolledExpanded] =
    React.useState(defaultExpanded);

  const isControlled = controlledExpanded !== undefined;
  const isExpanded = isControlled ? controlledExpanded : uncontrolledExpanded;

  const handleToggle = () => {
    const newExpanded = !isExpanded;
    if (!isControlled) {
      setUncontrolledExpanded(newExpanded);
    }
    onExpandedChange?.(newExpanded);
  };

  const contentId = `${id || title.replace(/\s+/g, "-").toLowerCase()}-content`;

  return (
    <div className={cn("border-b last:border-b-0", className)}>
      {/* Header */}
      <button
        type="button"
        onClick={handleToggle}
        aria-expanded={isExpanded}
        aria-controls={contentId}
        className={cn(
          "flex items-center gap-3 w-full px-4 py-3 text-left",
          "hover:bg-muted/50 transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
        )}
      >
        {/* Chevron */}
        <ChevronRight
          className={cn(
            "size-4 text-muted-foreground shrink-0 transition-transform duration-200",
            isExpanded && "rotate-90"
          )}
        />

        {/* Icon */}
        {icon && (
          <span className="shrink-0 text-muted-foreground">{icon}</span>
        )}

        {/* Title */}
        <span className="flex-1 text-sm font-medium">{title}</span>

        {/* Badge */}
        {badge && <span className="shrink-0">{badge}</span>}

        {/* Progress bar */}
        {progress !== undefined && (
          <div className="w-20 shrink-0">
            <ProgressBar value={progress} size="sm" />
          </div>
        )}
      </button>

      {/* Content */}
      <div
        id={contentId}
        role="region"
        aria-labelledby={`${id || title.replace(/\s+/g, "-").toLowerCase()}-header`}
        className={cn(
          "overflow-hidden transition-all duration-200 ease-in-out",
          isExpanded ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="px-4 pb-4 pt-1">{children}</div>
      </div>
    </div>
  );
}

// Accordion context for controlling multiple sections
interface AccordionContextValue {
  expandedId: string | null;
  setExpandedId: (id: string | null) => void;
}

const AccordionContext = React.createContext<AccordionContextValue | null>(
  null
);

export interface AccordionProps {
  children: React.ReactNode;
  /** Default expanded section id */
  defaultExpandedId?: string;
  /** Allow multiple sections to be open (false = only one at a time) */
  multiple?: boolean;
  /** Custom className */
  className?: string;
}

function Accordion({
  children,
  defaultExpandedId,
  multiple = false,
  className,
}: AccordionProps) {
  const [expandedId, setExpandedId] = React.useState<string | null>(
    defaultExpandedId ?? null
  );

  const value = React.useMemo(
    () => ({
      expandedId,
      setExpandedId: multiple
        ? setExpandedId
        : (id: string | null) => setExpandedId(id === expandedId ? null : id),
    }),
    [expandedId, multiple]
  );

  return (
    <AccordionContext.Provider value={value}>
      <div className={cn("divide-y", className)}>{children}</div>
    </AccordionContext.Provider>
  );
}

function useAccordion() {
  return React.useContext(AccordionContext);
}

export interface AccordionSectionProps extends Omit<ExpandableSectionProps, "expanded" | "onExpandedChange"> {
  /** Required ID when used in Accordion */
  id: string;
}

function AccordionSection({ id, ...props }: AccordionSectionProps) {
  const accordion = useAccordion();

  if (!accordion) {
    // Fallback to regular expandable section if not in accordion context
    return <ExpandableSection id={id} {...props} />;
  }

  return (
    <ExpandableSection
      id={id}
      expanded={accordion.expandedId === id}
      onExpandedChange={(expanded) =>
        accordion.setExpandedId(expanded ? id : null)
      }
      {...props}
    />
  );
}

export { ExpandableSection, Accordion, AccordionSection, useAccordion };
