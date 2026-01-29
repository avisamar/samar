import { Skeleton } from "@/components/ui/skeleton";

export function TimelineSkeleton() {
  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto animate-in fade-in duration-300">
      {/* Search and filters */}
      <div className="mb-4 sm:mb-6 space-y-3 sm:space-y-4">
        <Skeleton className="h-10 w-full rounded-lg" />
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-16 sm:w-20 rounded-lg" />
          ))}
        </div>
      </div>

      {/* Timeline entries */}
      <div className="space-y-6 sm:space-y-8">
        {Array.from({ length: 3 }).map((_, groupIndex) => (
          <div key={groupIndex}>
            {/* Date header */}
            <Skeleton className="h-4 w-32 mb-3" />

            {/* Entries */}
            <div className="relative pl-5 sm:pl-6 border-l-2 border-muted space-y-3 sm:space-y-4">
              {Array.from({ length: 3 }).map((_, entryIndex) => (
                <TimelineEntrySkeleton key={entryIndex} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TimelineEntrySkeleton() {
  return (
    <div className="relative">
      {/* Dot */}
      <Skeleton className="absolute -left-[21px] sm:-left-[25px] size-6 sm:size-7 rounded-full" />

      {/* Content */}
      <div className="pb-2">
        <div className="flex items-center gap-2 mb-2">
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-3 w-16" />
        </div>
        <Skeleton className="h-4 w-full mb-1" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </div>
  );
}
