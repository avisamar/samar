"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Customer } from "@/lib/crm/types";
import {
  type SectionDefinition,
  type FieldDefinition,
  calculateSectionCompleteness,
  getSectionCompletenessBgColor,
} from "@/lib/crm/sections";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { FieldEditModal } from "./field-edit-modal";

interface ProfileSectionProps {
  section: SectionDefinition;
  customer: Customer;
  defaultOpen?: boolean;
}

export function ProfileSection({
  section,
  customer,
  defaultOpen = true,
}: ProfileSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [editingField, setEditingField] = useState<FieldDefinition | null>(null);
  const completeness = calculateSectionCompleteness(customer, section);

  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          {isOpen ? (
            <ChevronDown className="size-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="size-4 text-muted-foreground" />
          )}
          <span className="text-sm font-medium">{section.label}</span>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground tabular-nums">
                  {completeness.filled}/{completeness.total}
                </span>
                <div className="h-1.5 w-16 bg-muted rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      getSectionCompletenessBgColor(completeness.percentage)
                    )}
                    style={{ width: `${completeness.percentage}%` }}
                  />
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent side="left" className="text-xs">
              {completeness.filled} of {completeness.total} fields completed
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </button>

      {isOpen && (
        <div className="px-4 pb-4 pt-1">
          <div className="space-y-1 pl-6">
            {section.fields.map((field) => (
              <FieldRow
                key={field.key}
                field={field}
                customer={customer}
                onEdit={() => setEditingField(field)}
              />
            ))}
          </div>
        </div>
      )}

      <FieldEditModal
        open={editingField !== null}
        onOpenChange={(open) => !open && setEditingField(null)}
        field={editingField}
        customer={customer}
      />
    </div>
  );
}

interface FieldRowProps {
  field: FieldDefinition;
  customer: Customer;
  onEdit: () => void;
}

function FieldRow({ field, customer, onEdit }: FieldRowProps) {
  const value = customer[field.key];
  const displayValue = formatFieldValue(value, field.type);
  const isEmpty = displayValue === null || displayValue === "—";

  return (
    <button
      onClick={onEdit}
      className="group flex items-baseline gap-3 py-1.5 text-sm w-full text-left rounded transition-colors hover:bg-muted/50 cursor-pointer -mx-2 px-2"
    >
      <span className="text-muted-foreground text-xs min-w-[130px] shrink-0 group-hover:text-foreground transition-colors">
        {field.label}
      </span>
      <span
        className={cn(
          "flex-1 text-sm",
          isEmpty && "text-muted-foreground/50",
          "group-hover:text-foreground transition-colors"
        )}
      >
        {displayValue ?? "—"}
      </span>
      <Pencil className="size-3 text-muted-foreground/0 group-hover:text-muted-foreground transition-colors shrink-0 self-center" />
    </button>
  );
}

function formatFieldValue(
  value: unknown,
  type: FieldDefinition["type"]
): React.ReactNode {
  if (value === null || value === undefined) {
    return "—";
  }

  switch (type) {
    case "boolean":
      return (
        <span
          className={cn(
            "inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium",
            value
              ? "bg-green-500/10 text-green-600 dark:text-green-400"
              : "bg-muted text-muted-foreground"
          )}
        >
          {value ? "Yes" : "No"}
        </span>
      );

    case "date":
      if (value instanceof Date) {
        return value.toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        });
      }
      if (typeof value === "string") {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          return date.toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
          });
        }
      }
      return String(value);

    case "multi_select":
      if (Array.isArray(value) && value.length > 0) {
        return (
          <span className="flex flex-wrap gap-1">
            {value.map((item, i) => (
              <span
                key={i}
                className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-muted"
              >
                {String(item)}
              </span>
            ))}
          </span>
        );
      }
      return "—";

    case "json":
      if (typeof value === "object") {
        return (
          <span className="text-xs text-muted-foreground italic">
            [structured data]
          </span>
        );
      }
      return String(value);

    case "number":
      return typeof value === "number" ? value.toLocaleString() : String(value);

    case "text":
    case "enum":
    default:
      if (typeof value === "string" && value.trim() === "") {
        return "—";
      }
      return String(value);
  }
}
