"use client";

import { useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Clock,
  StickyNote,
  Phone,
  Mail,
  Mic,
  Calendar,
  ArrowRight,
} from "lucide-react";
import type { CustomerWithNotes, CustomerNote } from "@/lib/crm/types";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface RecentActivityCardProps {
  customer: CustomerWithNotes;
}

const SOURCE_ICONS: Record<string, React.ReactNode> = {
  meeting: <Calendar className="size-3.5" />,
  call: <Phone className="size-3.5" />,
  email: <Mail className="size-3.5" />,
  voice_note: <Mic className="size-3.5" />,
};

export function RecentActivityCard({ customer }: RecentActivityCardProps) {
  const router = useRouter();
  const pathname = usePathname();

  // Get recent notes, sorted by date
  const recentNotes = [...(customer.notes ?? [])]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, 5);

  const navigateToTimeline = () => {
    router.push(`${pathname}?mode=timeline`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="size-4 text-muted-foreground" aria-hidden="true" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {recentNotes.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-1">
            {recentNotes.map((note) => (
              <ActivityItem key={note.id} note={note} />
            ))}
          </div>
        )}
      </CardContent>
      {recentNotes.length > 0 && (
        <CardFooter>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-between"
            onClick={navigateToTimeline}
          >
            View all activity
            <ArrowRight className="size-4" />
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}

interface ActivityItemProps {
  note: CustomerNote;
}

function ActivityItem({ note }: ActivityItemProps) {
  const now = useMemo(() => new Date(), []);
  const yesterday = useMemo(() => new Date(now.getTime() - 86400000), [now]);
  const noteDate = new Date(note.createdAt);
  const isToday = noteDate.toDateString() === now.toDateString();
  const isYesterday = noteDate.toDateString() === yesterday.toDateString();

  const dateLabel = isToday
    ? "Today"
    : isYesterday
      ? "Yesterday"
      : noteDate.toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
        });

  const timeLabel = noteDate.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  });

  const icon = (note.source && SOURCE_ICONS[note.source]) ?? <StickyNote className="size-3.5" />;

  return (
    <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
      <div
        className={cn(
          "shrink-0 mt-0.5 p-1.5 rounded-full",
          note.source === "meeting" && "bg-blue-500/10 text-blue-600 dark:text-blue-400",
          note.source === "call" && "bg-green-500/10 text-green-600 dark:text-green-400",
          note.source === "email" && "bg-purple-500/10 text-purple-600 dark:text-purple-400",
          note.source === "voice_note" && "bg-amber-500/10 text-amber-600 dark:text-amber-400",
          (!note.source || !["meeting", "call", "email", "voice_note"].includes(note.source)) &&
            "bg-muted text-muted-foreground"
        )}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{dateLabel}</span>
          <span className="text-xs text-muted-foreground/50">{timeLabel}</span>
          {note.source && (
            <span className="text-xs text-muted-foreground capitalize">
              {note.source.replace("_", " ")}
            </span>
          )}
        </div>
        <p className="text-sm text-foreground line-clamp-2 mt-0.5">
          {note.content}
        </p>
        {note.tags && note.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {note.tags.slice(0, 3).map((tag, idx) => (
              <span
                key={idx}
                className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground"
              >
                {tag}
              </span>
            ))}
            {note.tags.length > 3 && (
              <span className="text-[10px] px-1.5 py-0.5 text-muted-foreground">
                +{note.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-6">
      <div className="rounded-full bg-muted p-3 mx-auto w-fit mb-3">
        <Clock className="size-5 text-muted-foreground" aria-hidden="true" />
      </div>
      <p className="text-sm text-muted-foreground">
        No activity recorded yet. Add notes through the Capture tab to start
        tracking interactions.
      </p>
    </div>
  );
}
