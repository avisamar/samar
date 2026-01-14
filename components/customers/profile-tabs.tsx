"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { StickyNote, Clock, Calendar, Sparkles, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProfileAgentChat } from "./profile-agent-chat";
import type { CustomerNote } from "@/lib/crm/types";

const TABS = [
  { id: "agent", label: "Profile Agent", icon: Sparkles },
  { id: "notes", label: "Notes", icon: StickyNote },
  { id: "timeline", label: "Timeline", icon: Clock },
  { id: "meetings", label: "Meetings", icon: Calendar },
] as const;

type TabId = (typeof TABS)[number]["id"];

interface ProfileTabsProps {
  customerId: string;
}

export function ProfileTabs({ customerId }: ProfileTabsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTab = (searchParams.get("tab") as TabId) || "agent";

  const handleTabChange = (tabId: TabId) => {
    const params = new URLSearchParams(searchParams);
    params.set("tab", tabId);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Tab Navigation */}
      <div className="flex border-b">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px",
                isActive
                  ? "border-primary text-primary bg-background"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <Icon className="size-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        <TabContent tabId={currentTab} customerId={customerId} />
      </div>
    </div>
  );
}

interface TabContentProps {
  tabId: TabId;
  customerId: string;
}

function TabContent({ tabId, customerId }: TabContentProps) {
  // Read env variable for showing tool messages (default: true)
  // Set NEXT_PUBLIC_SHOW_TOOL_MESSAGES=false to hide tool usage in chat
  const showToolMessages =
    process.env.NEXT_PUBLIC_SHOW_TOOL_MESSAGES !== "false";

  switch (tabId) {
    case "agent":
      return (
        <ProfileAgentChat
          customerId={customerId}
          showToolMessages={showToolMessages}
        />
      );
    case "notes":
      return <NotesList customerId={customerId} />;
    case "timeline":
      return <TimelinePlaceholder />;
    case "meetings":
      return <MeetingsPlaceholder />;
    default:
      return (
        <ProfileAgentChat
          customerId={customerId}
          showToolMessages={showToolMessages}
        />
      );
  }
}

interface NotesListProps {
  customerId: string;
}

function NotesList({ customerId }: NotesListProps) {
  const [notes, setNotes] = useState<CustomerNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchNotes() {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`/api/customers/${customerId}/notes`);
        if (!response.ok) {
          throw new Error("Failed to fetch notes");
        }
        const data = await response.json();
        setNotes(data.notes || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load notes");
      } finally {
        setLoading(false);
      }
    }
    fetchNotes();
  }, [customerId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[300px]">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center p-6">
        <p className="text-sm text-destructive">{error}</p>
      </div>
    );
  }

  if (notes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center p-6">
        <div className="rounded-full bg-muted p-4 mb-4">
          <StickyNote className="size-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium mb-2">No notes yet</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          Add notes through the Profile Agent to capture client context. Voice
          memos, meeting summaries, and quick observations will appear here.
        </p>
      </div>
    );
  }

  // Sort notes by date (newest first)
  const sortedNotes = [...notes].sort((a, b) => {
    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return dateB - dateA;
  });

  return (
    <div className="p-4">
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-[7px] top-3 bottom-3 w-px bg-border" />

        {/* Timeline items */}
        <div className="space-y-4">
          {sortedNotes.map((note, index) => (
            <TimelineNote key={note.id} note={note} isFirst={index === 0} />
          ))}
        </div>
      </div>
    </div>
  );
}

interface TimelineNoteProps {
  note: CustomerNote;
  isFirst: boolean;
}

function TimelineNote({ note, isFirst }: TimelineNoteProps) {
  const formattedDate = note.createdAt
    ? new Date(note.createdAt).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;

  const formattedTime = note.createdAt
    ? new Date(note.createdAt).toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <div className="relative flex gap-4 pl-6">
      {/* Timeline dot */}
      <div
        className={cn(
          "absolute left-0 top-1.5 size-[15px] rounded-full border-2 bg-background",
          isFirst ? "border-primary" : "border-muted-foreground/30"
        )}
      />

      {/* Content */}
      <div className="flex-1 min-w-0 pb-2">
        {/* Date header */}
        <div className="flex items-center gap-2 mb-1.5">
          {formattedDate && (
            <span className="text-xs font-medium text-muted-foreground">
              {formattedDate}
            </span>
          )}
          {formattedTime && (
            <span className="text-xs text-muted-foreground/60">
              {formattedTime}
            </span>
          )}
          {note.source && (
            <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs capitalize">
              {note.source}
            </span>
          )}
        </div>

        {/* Note content */}
        <div className="rounded-lg border bg-card p-3">
          <p className="text-sm whitespace-pre-wrap">{note.content}</p>
        </div>
      </div>
    </div>
  );
}

function TimelinePlaceholder() {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center p-6">
      <div className="rounded-full bg-muted p-4 mb-4">
        <Clock className="size-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-medium mb-2">Timeline</h3>
      <p className="text-sm text-muted-foreground max-w-sm">
        View the complete interaction history and profile changes over time.
        Track how the customer relationship has evolved.
      </p>
      <div className="mt-6 px-4 py-2 rounded-md bg-primary/10 text-primary text-sm">
        Coming soon
      </div>
    </div>
  );
}

function MeetingsPlaceholder() {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center p-6">
      <div className="rounded-full bg-muted p-4 mb-4">
        <Calendar className="size-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-medium mb-2">Meetings</h3>
      <p className="text-sm text-muted-foreground max-w-sm">
        Schedule and track meetings with this customer. View past meeting notes
        and upcoming appointments.
      </p>
      <div className="mt-6 px-4 py-2 rounded-md bg-primary/10 text-primary text-sm">
        Coming soon
      </div>
    </div>
  );
}
