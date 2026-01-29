import { Skeleton } from "@/components/ui/skeleton";

export function TasksSkeleton() {
  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div className="space-y-1">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-4 w-28 sm:w-36" />
        </div>
        <Skeleton className="h-9 w-24 sm:w-28 rounded-lg" />
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4 sm:mb-6 overflow-x-auto scrollbar-none">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-24 rounded-lg" />
        ))}
      </div>

      {/* Task list */}
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <TaskItemSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

function TaskItemSkeleton() {
  return (
    <div className="flex items-start gap-2 sm:gap-3 p-3 rounded-lg border">
      <Skeleton className="size-5 rounded shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <div className="flex items-center gap-3">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-12" />
        </div>
      </div>
      <Skeleton className="size-7 rounded" />
    </div>
  );
}
