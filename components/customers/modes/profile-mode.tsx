"use client";

import { useState, useMemo, useCallback } from "react";
import { Pencil } from "lucide-react";
import type { CustomerWithNotes } from "@/lib/crm/types";
import type { Customer } from "@/lib/crm/types";
import {
  PROFILE_SECTIONS,
  type FieldDefinition,
  type SectionDefinition,
} from "@/lib/crm/sections";
import { calculateCompleteness } from "@/lib/crm/completeness";
import { ProgressBar } from "@/components/ui/progress-bar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FieldEditModal } from "../field-edit-modal";
import { cn } from "@/lib/utils";

type GroupBy = "section" | "priority" | "status";
type FilterBy = "all" | "filled" | "empty";

interface ProfileModeProps {
  customer: CustomerWithNotes;
}

interface FieldWithSection extends FieldDefinition {
  section: SectionDefinition;
}

export function ProfileMode({ customer }: ProfileModeProps) {
  const [groupBy, setGroupBy] = useState<GroupBy>("section");
  const [filterBy, setFilterBy] = useState<FilterBy>("all");
  const [editingField, setEditingField] = useState<FieldDefinition | null>(null);

  const completeness = calculateCompleteness(customer);

  // Flatten all fields with section info
  const allFields: FieldWithSection[] = useMemo(() => {
    return PROFILE_SECTIONS.flatMap((section) =>
      section.fields.map((field) => ({ ...field, section }))
    );
  }, []);

  // Check if a field has a value
  const hasValue = useCallback(
    (field: FieldDefinition): boolean => {
      const value = customer[field.key];
      if (value === null || value === undefined) return false;
      if (typeof value === "string" && value.trim() === "") return false;
      if (Array.isArray(value) && value.length === 0) return false;
      return true;
    },
    [customer]
  );

  // Filter fields
  const filteredFields = useMemo(() => {
    return allFields.filter((field) => {
      if (filterBy === "all") return true;
      const filled = hasValue(field);
      return filterBy === "filled" ? filled : !filled;
    });
  }, [allFields, filterBy, hasValue]);

  // Group fields
  const groupedFields = useMemo(() => {
    const groups: Map<string, { label: string; fields: FieldWithSection[]; order: number }> = new Map();

    filteredFields.forEach((field) => {
      let groupKey: string;
      let groupLabel: string;
      let order: number;

      switch (groupBy) {
        case "section":
          groupKey = field.section.id;
          groupLabel = field.section.label;
          order = PROFILE_SECTIONS.findIndex((s) => s.id === field.section.id);
          break;
        case "priority":
          groupKey = field.priority;
          groupLabel = `${field.priority.charAt(0).toUpperCase() + field.priority.slice(1)} Priority`;
          order = field.priority === "high" ? 0 : field.priority === "medium" ? 1 : 2;
          break;
        case "status":
          const filled = hasValue(field);
          groupKey = filled ? "filled" : "empty";
          groupLabel = filled ? "Completed" : "Incomplete";
          order = filled ? 0 : 1;
          break;
      }

      if (!groups.has(groupKey)) {
        groups.set(groupKey, { label: groupLabel, fields: [], order });
      }
      groups.get(groupKey)!.fields.push(field);
    });

    // Sort groups by order
    return Array.from(groups.entries())
      .sort((a, b) => a[1].order - b[1].order)
      .map(([key, value]) => ({ key, ...value }));
  }, [filteredFields, groupBy, hasValue]);

  // Count stats
  const totalFields = allFields.length;
  const filledCount = allFields.filter((f) => hasValue(f)).length;
  const emptyCount = totalFields - filledCount;

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      {/* Header with overall completion */}
      <div className="mb-4 sm:mb-6 p-3 sm:p-4 rounded-lg border bg-card">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div>
            <h2 className="text-base sm:text-lg font-medium">Profile Completion</h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {completeness.highPriorityFilled}/{completeness.highPriorityTotal} high priority •{" "}
              {completeness.mediumPriorityFilled}/{completeness.mediumPriorityTotal} medium
            </p>
          </div>
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="text-left sm:text-right">
              <p className="text-xl sm:text-2xl font-semibold">{completeness.percentage}%</p>
              <p
                className={cn(
                  "text-xs sm:text-sm capitalize",
                  completeness.level === "minimal" && "text-red-500",
                  completeness.level === "basic" && "text-orange-500",
                  completeness.level === "moderate" && "text-yellow-500",
                  completeness.level === "detailed" && "text-blue-500",
                  completeness.level === "complete" && "text-green-500"
                )}
              >
                {completeness.level}
              </p>
            </div>
            <div className="w-24 sm:w-32">
              <ProgressBar value={completeness.percentage} size="lg" />
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Group by:</span>
          <Select value={groupBy} onValueChange={(v) => setGroupBy(v as GroupBy)}>
            <SelectTrigger className="w-[130px] h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="section">Section</SelectItem>
              <SelectItem value="priority">Priority</SelectItem>
              <SelectItem value="status">Status</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Show:</span>
          <Select value={filterBy} onValueChange={(v) => setFilterBy(v as FilterBy)}>
            <SelectTrigger className="w-[130px] h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All ({totalFields})</SelectItem>
              <SelectItem value="filled">Filled ({filledCount})</SelectItem>
              <SelectItem value="empty">Empty ({emptyCount})</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Field list */}
      <div className="rounded-lg border bg-card overflow-hidden">
        {groupedFields.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            No fields match the current filter.
          </div>
        ) : (
          groupedFields.map((group) => (
            <div key={group.key}>
              {/* Sticky group header */}
              <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-2 bg-muted/50 border-b backdrop-blur-sm">
                <span className="text-sm font-medium">{group.label}</span>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {group.fields.filter((f) => hasValue(f)).length}/{group.fields.length}
                </span>
              </div>

              {/* Field rows */}
              <div className="divide-y divide-border/50">
                {group.fields.map((field) => (
                  <FieldRow
                    key={`${field.section.id}-${field.key}`}
                    field={field}
                    customer={customer}
                    showSection={groupBy !== "section"}
                    onEdit={() => setEditingField(field)}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>

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
  field: FieldWithSection;
  customer: Customer;
  showSection: boolean;
  onEdit: () => void;
}

function FieldRow({ field, customer, showSection, onEdit }: FieldRowProps) {
  const value = customer[field.key];
  const displayValue = formatFieldValue(value, field.type);
  const isEmpty = displayValue === null || displayValue === "—";

  return (
    <button
      onClick={onEdit}
      className="group flex items-center gap-3 w-full px-4 py-2.5 text-left hover:bg-muted/30 transition-colors"
    >
      {/* Priority indicator */}
      <span
        className={cn(
          "size-2 rounded-full shrink-0",
          field.priority === "high" && "bg-red-500",
          field.priority === "medium" && "bg-amber-500",
          field.priority === "low" && "bg-gray-300 dark:bg-gray-600"
        )}
        title={`${field.priority} priority`}
      />

      {/* Field label */}
      <span className="text-sm text-muted-foreground min-w-[140px] shrink-0 group-hover:text-foreground transition-colors">
        {field.label}
      </span>

      {/* Value */}
      <span
        className={cn(
          "flex-1 text-sm truncate",
          isEmpty && "text-muted-foreground/50 italic",
          "group-hover:text-foreground transition-colors"
        )}
      >
        {displayValue ?? "—"}
      </span>

      {/* Section tag (when not grouped by section) */}
      {showSection && (
        <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded shrink-0">
          {field.section.label}
        </span>
      )}

      {/* Edit icon */}
      <Pencil className="size-3 text-muted-foreground/0 group-hover:text-muted-foreground transition-colors shrink-0" />
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
            {value.slice(0, 3).map((item, i) => (
              <span
                key={i}
                className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-muted"
              >
                {String(item)}
              </span>
            ))}
            {value.length > 3 && (
              <span className="text-xs text-muted-foreground">
                +{value.length - 3} more
              </span>
            )}
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
      const str = String(value);
      // Truncate long text
      if (str.length > 60) {
        return str.slice(0, 60) + "…";
      }
      return str;
  }
}
