"use client";

import { useState, useMemo } from "react";
import {
  Plus,
  CheckSquare,
  Square,
  Calendar,
  Flag,
  MoreHorizontal,
  Trash2,
  Pencil,
} from "lucide-react";
import type { CustomerWithNotes } from "@/lib/crm/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface TasksModeProps {
  customer: CustomerWithNotes;
}

type Priority = "high" | "medium" | "low";

interface Task {
  id: string;
  title: string;
  dueDate: Date | null;
  priority: Priority;
  completed: boolean;
  notes?: string;
  createdAt: Date;
}

export function TasksMode({ customer }: TasksModeProps) {
  // Client-side state for tasks (will be replaced with database integration)
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [filter, setFilter] = useState<"all" | "pending" | "completed">("all");

  const pendingTasks = tasks.filter((t) => !t.completed);
  const completedTasks = tasks.filter((t) => t.completed);

  const filteredTasks =
    filter === "all"
      ? tasks
      : filter === "pending"
        ? pendingTasks
        : completedTasks;

  // Sort by due date (overdue first, then by date)
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    // Completed tasks go to the end
    if (a.completed !== b.completed) return a.completed ? 1 : -1;

    // Then by due date
    if (a.dueDate && b.dueDate) {
      return a.dueDate.getTime() - b.dueDate.getTime();
    }
    if (a.dueDate) return -1;
    if (b.dueDate) return 1;

    // Then by priority
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  const handleAddTask = (task: Omit<Task, "id" | "createdAt" | "completed">) => {
    setTasks((prev) => [
      ...prev,
      {
        ...task,
        id: crypto.randomUUID(),
        createdAt: new Date(),
        completed: false,
      },
    ]);
    setShowAddDialog(false);
  };

  const handleToggleComplete = (id: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, completed: !t.completed } : t
      )
    );
  };

  const handleDeleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div>
          <h2 className="text-lg font-medium">Tasks</h2>
          <p className="text-sm text-muted-foreground">
            {pendingTasks.length} pending · {completedTasks.length} completed
          </p>
        </div>
        <Button onClick={() => setShowAddDialog(true)} className="gap-1.5">
          <Plus className="size-4" />
          Add Task
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4 sm:mb-6 overflow-x-auto scrollbar-none">
        {(["all", "pending", "completed"] as const).map((f) => (
          <Button
            key={f}
            variant={filter === f ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(f)}
            className="capitalize"
          >
            {f}
          </Button>
        ))}
      </div>

      {/* Task list */}
      {sortedTasks.length === 0 ? (
        <EmptyState
          hasFilter={filter !== "all"}
          onAddTask={() => setShowAddDialog(true)}
        />
      ) : (
        <div className="space-y-2">
          {sortedTasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onToggleComplete={handleToggleComplete}
              onDelete={handleDeleteTask}
            />
          ))}
        </div>
      )}

      {/* Add Task Dialog */}
      <AddTaskDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onAdd={handleAddTask}
        customerName={customer.fullName}
      />
    </div>
  );
}

interface TaskItemProps {
  task: Task;
  onToggleComplete: (id: string) => void;
  onDelete: (id: string) => void;
}

function TaskItem({ task, onToggleComplete, onDelete }: TaskItemProps) {
  const now = useMemo(() => new Date(), []);
  const tomorrow = useMemo(() => new Date(now.getTime() + 86400000), [now]);

  const isOverdue = !task.completed && task.dueDate && task.dueDate < now;
  const isDueToday = task.dueDate?.toDateString() === now.toDateString();
  const isDueTomorrow = task.dueDate?.toDateString() === tomorrow.toDateString();

  return (
    <div
      className={cn(
        "flex items-start gap-2 sm:gap-3 p-3 sm:p-3 rounded-lg border transition-colors",
        task.completed && "opacity-60",
        isOverdue && "border-red-500/50 bg-red-500/5"
      )}
    >
      {/* Checkbox */}
      <button
        onClick={() => onToggleComplete(task.id)}
        className="mt-0.5 shrink-0 min-w-[44px] min-h-[44px] -m-2 flex items-center justify-center"
        aria-label={task.completed ? "Mark incomplete" : "Mark complete"}
      >
        {task.completed ? (
          <CheckSquare className="size-5 text-green-600" />
        ) : (
          <Square className="size-5 text-muted-foreground hover:text-foreground transition-colors" />
        )}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "text-sm font-medium",
            task.completed && "line-through text-muted-foreground"
          )}
        >
          {task.title}
        </p>

        <div className="flex items-center gap-3 mt-1">
          {/* Due date */}
          {task.dueDate && (
            <span
              className={cn(
                "flex items-center gap-1 text-xs",
                isOverdue && "text-red-600 dark:text-red-400",
                isDueToday && !isOverdue && "text-amber-600 dark:text-amber-400",
                isDueTomorrow && "text-blue-600 dark:text-blue-400",
                !isOverdue &&
                  !isDueToday &&
                  !isDueTomorrow &&
                  "text-muted-foreground"
              )}
            >
              <Calendar className="size-3" />
              {isDueToday
                ? "Today"
                : isDueTomorrow
                  ? "Tomorrow"
                  : task.dueDate.toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                    })}
            </span>
          )}

          {/* Priority */}
          <span
            className={cn(
              "flex items-center gap-1 text-xs",
              task.priority === "high" && "text-red-600 dark:text-red-400",
              task.priority === "medium" && "text-amber-600 dark:text-amber-400",
              task.priority === "low" && "text-muted-foreground"
            )}
          >
            <Flag className="size-3" />
            {task.priority}
          </span>
        </div>
      </div>

      {/* Actions */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label="More actions">
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem disabled>
            <Pencil className="size-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            onClick={() => onDelete(task.id)}
          >
            <Trash2 className="size-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

interface AddTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (task: Omit<Task, "id" | "createdAt" | "completed">) => void;
  customerName?: string | null;
}

function AddTaskDialog({
  open,
  onOpenChange,
  onAdd,
  customerName,
}: AddTaskDialogProps) {
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onAdd({
      title: title.trim(),
      dueDate: dueDate ? new Date(dueDate) : null,
      priority,
    });

    // Reset form
    setTitle("");
    setDueDate("");
    setPriority("medium");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-4">
        <DialogHeader>
          <DialogTitle>Add Task</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Task</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={`Follow up with ${customerName || "customer"}...`}
              autoFocus
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Due Date</label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="min-h-[44px]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Priority</label>
              <div className="flex gap-1.5 sm:gap-2">
                {(["low", "medium", "high"] as const).map((p) => (
                  <Button
                    key={p}
                    type="button"
                    variant={priority === p ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPriority(p)}
                    className={cn(
                      "flex-1 capitalize",
                      priority === p && p === "high" && "bg-red-600 hover:bg-red-700",
                      priority === p && p === "medium" && "bg-amber-600 hover:bg-amber-700"
                    )}
                  >
                    {p}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!title.trim()}>
              Add Task
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EmptyState({
  hasFilter,
  onAddTask,
}: {
  hasFilter: boolean;
  onAddTask: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="rounded-full bg-muted p-4 mb-4">
        <CheckSquare className="size-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-medium mb-2">
        {hasFilter ? "No matching tasks" : "No tasks yet"}
      </h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-4">
        {hasFilter
          ? "Try changing your filter to see more tasks."
          : "Create tasks to track follow-ups, action items, and reminders for this customer."}
      </p>
      {!hasFilter && (
        <Button onClick={onAddTask} className="gap-1.5">
          <Plus className="size-4" />
          Add First Task
        </Button>
      )}
    </div>
  );
}
