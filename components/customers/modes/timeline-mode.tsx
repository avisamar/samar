"use client";

import { useState, useMemo } from "react";
import { Clock, StickyNote, Phone, Mail, Mic, Calendar, UserCog, Search } from "lucide-react";
import type { CustomerWithNotes, CustomerNote } from "@/lib/crm/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TimelineModeProps {
  customer: CustomerWithNotes;
}

type EntryType = "all" | "note" | "meeting" | "call" | "email" | "voice_note" | "profile_change";

const ENTRY_TYPES: { id: EntryType; label: string; icon: React.ReactNode }[] = [
  { id: "all", label: "All", icon: <Clock className="size-3.5" /> },
  { id: "note", label: "Notes", icon: <StickyNote className="size-3.5" /> },
  { id: "meeting", label: "Meetings", icon: <Calendar className="size-3.5" /> },
  { id: "call", label: "Calls", icon: <Phone className="size-3.5" /> },
  { id: "email", label: "Emails", icon: <Mail className="size-3.5" /> },
  { id: "voice_note", label: "Voice", icon: <Mic className="size-3.5" /> },
];

export function TimelineMode({ customer }: TimelineModeProps) {
  const [filter, setFilter] = useState<EntryType>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Build timeline entries from notes
  const timelineEntries = useMemo(() => {
    let entries = [...(customer.notes ?? [])];

    // Filter by type
    if (filter !== "all") {
      entries = entries.filter((note) => {
        if (filter === "note" && !note.source) return true;
        return note.source === filter;
      });
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      entries = entries.filter(
        (note) =>
          note.content.toLowerCase().includes(query) ||
          note.tags?.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    // Sort by date (newest first)
    return entries.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [customer.notes, filter, searchQuery]);

  // Group entries by date
  const groupedEntries = useMemo(() => {
    const groups: Map<string, CustomerNote[]> = new Map();

    for (const entry of timelineEntries) {
      const date = new Date(entry.createdAt);
      const dateKey = date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });

      if (!groups.has(dateKey)) {
        groups.set(dateKey, []);
      }
      groups.get(dateKey)!.push(entry);
    }

    return groups;
  }, [timelineEntries]);

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto">
      {/* Filters */}
      <div className="mb-4 sm:mb-6 space-y-3 sm:space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search timeline..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Type filters */}
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          {ENTRY_TYPES.map((type) => (
            <Button
              key={type.id}
              variant={filter === type.id ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(type.id)}
              className="gap-1.5"
            >
              {type.icon}
              {type.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Timeline */}
      {timelineEntries.length === 0 ? (
        <EmptyState hasFilter={filter !== "all" || searchQuery.trim() !== ""} />
      ) : (
        <div className="space-y-6 sm:space-y-8">
          {Array.from(groupedEntries.entries()).map(([date, entries]) => (
            <div key={date}>
              {/* Date header */}
              <div className="sticky top-0 z-10 bg-background pb-2">
                <h3 className="text-xs sm:text-sm font-medium text-muted-foreground">
                  {date}
                </h3>
              </div>

              {/* Entries for this date */}
              <div className="relative pl-5 sm:pl-6 space-y-3 sm:space-y-4">
                {entries.map((entry, index) => (
                  <TimelineEntry
                    key={entry.id}
                    entry={entry}
                    isFirst={index === 0}
                    isLast={index === entries.length - 1}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface TimelineEntryProps {
  entry: CustomerNote;
  isFirst: boolean;
  isLast: boolean;
}

function TimelineEntry({ entry, isFirst, isLast }: TimelineEntryProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const entryDate = new Date(entry.createdAt);
  const timeLabel = entryDate.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  });

  const icon = getEntryIcon(entry.source);
  const bgColor = getEntryBgColor(entry.source);

  const isLongContent = entry.content.length > 200;
  const displayContent =
    isLongContent && !isExpanded
      ? entry.content.slice(0, 200) + "..."
      : entry.content;

  // Icon dimensions: mobile 22px (14px icon + 4px*2 padding), sm 26px (14px icon + 6px*2 padding)
  // Line position: centered at -20px (mobile) or -24px (sm) from content edge
  // Gap: 4px on each side of the icon

  return (
    <div className="relative">
      {/* Line segment above icon - starts in gap, ends before icon */}
      {!isFirst && (
        <div
          className="absolute -left-[21px] sm:-left-[25px] w-0.5 bg-muted -top-3 sm:-top-4 h-2 sm:h-3"
          aria-hidden="true"
        />
      )}

      {/* Line segment below icon - starts after icon, extends into gap */}
      {!isLast && (
        <div
          className="absolute -left-[21px] sm:-left-[25px] w-0.5 bg-muted top-[26px] sm:top-[30px] bottom-[-8px] sm:bottom-[-12px]"
          aria-hidden="true"
        />
      )}

      {/* Timeline dot - centered on the line */}
      <div
        className={cn(
          "absolute top-0 -left-[31px] sm:-left-[37px] p-1 sm:p-1.5 rounded-full",
          bgColor
        )}
      >
        {icon}
      </div>

      {/* Entry content */}
      <div className="pb-2">
        {/* Header */}
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs text-muted-foreground">{timeLabel}</span>
          {entry.source && (
            <span className="text-xs text-muted-foreground capitalize">
              {entry.source.replace("_", " ")}
            </span>
          )}
        </div>

        {/* Content */}
        <p className="text-sm whitespace-pre-wrap">{displayContent}</p>

        {/* Show more button */}
        {isLongContent && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs text-primary hover:underline mt-1"
          >
            {isExpanded ? "Show less" : "Show more"}
          </button>
        )}

        {/* Tags */}
        {entry.tags && entry.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {entry.tags.map((tag, idx) => (
              <span
                key={idx}
                className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Extracted fields indicator */}
        {entry.extractedFields !== null && entry.extractedFields !== undefined && (
          <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
            <UserCog className="size-3" />
            <span>Profile updated from this note</span>
          </div>
        )}
      </div>
    </div>
  );
}

function getEntryIcon(source: string | null) {
  switch (source) {
    case "meeting":
      return <Calendar className="size-3.5" />;
    case "call":
      return <Phone className="size-3.5" />;
    case "email":
      return <Mail className="size-3.5" />;
    case "voice_note":
      return <Mic className="size-3.5" />;
    default:
      return <StickyNote className="size-3.5" />;
  }
}

function getEntryBgColor(source: string | null) {
  switch (source) {
    case "meeting":
      return "bg-blue-500/10 text-blue-600 dark:text-blue-400";
    case "call":
      return "bg-green-500/10 text-green-600 dark:text-green-400";
    case "email":
      return "bg-purple-500/10 text-purple-600 dark:text-purple-400";
    case "voice_note":
      return "bg-amber-500/10 text-amber-600 dark:text-amber-400";
    default:
      return "bg-muted text-muted-foreground";
  }
}

function EmptyState({ hasFilter }: { hasFilter: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="rounded-full bg-muted p-4 mb-4">
        <Clock className="size-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-medium mb-2">
        {hasFilter ? "No matching entries" : "No timeline entries yet"}
      </h3>
      <p className="text-sm text-muted-foreground max-w-sm">
        {hasFilter
          ? "Try adjusting your filters or search query."
          : "Add notes through the Capture tab to start building a timeline of interactions."}
      </p>
    </div>
  );
}
