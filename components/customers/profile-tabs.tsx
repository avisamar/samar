"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { StickyNote, Clock, Calendar, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProfileAgentChat } from "./profile-agent-chat";

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
      return <NotesPlaceholder />;
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

function NotesPlaceholder() {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center p-6">
      <div className="rounded-full bg-muted p-4 mb-4">
        <StickyNote className="size-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-medium mb-2">Notes</h3>
      <p className="text-sm text-muted-foreground max-w-sm">
        Add notes to capture client context progressively. Voice memos, meeting
        summaries, and quick observations will appear here.
      </p>
      <div className="mt-6 px-4 py-2 rounded-md bg-primary/10 text-primary text-sm">
        Coming soon
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
