import { Skeleton } from "@/components/ui/skeleton";

export function ProfileSkeleton() {
  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto animate-in fade-in duration-300">
      {/* Header */}
      <div className="mb-4 sm:mb-6 p-3 sm:p-4 rounded-lg border bg-card">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right space-y-1">
              <Skeleton className="h-8 w-16 ml-auto" />
              <Skeleton className="h-4 w-20 ml-auto" />
            </div>
            <Skeleton className="h-3 w-32 rounded-full" />
          </div>
        </div>
      </div>

      {/* Section grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <SectionSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

function SectionSkeleton() {
  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      {/* Section header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <Skeleton className="size-4" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-3 w-8" />
          <Skeleton className="h-1.5 w-16 rounded-full" />
        </div>
      </div>

      {/* Section content */}
      <div className="px-4 pb-4 space-y-2 pl-10">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 py-1">
            <Skeleton className="h-3 w-28 shrink-0" />
            <Skeleton className="h-4 flex-1" />
          </div>
        ))}
      </div>
    </div>
  );
}
