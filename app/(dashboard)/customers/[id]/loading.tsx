import { ArrowLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function CustomerProfileLoading() {
  return (
    <div className="h-screen flex overflow-hidden">
      {/* Left Container: Header + Hero + Profile Sidebar */}
      <div className="w-1/3 min-w-[320px] max-w-[420px] h-full flex flex-col bg-surface-inset overflow-y-auto pt-4">
        {/* Header */}
        <div className="flex items-center gap-2 px-6 py-3">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <ArrowLeft className="size-4" />
            <span>Back to Customers</span>
          </div>
        </div>

        {/* Hero Section Skeleton */}
        <div className="px-6 pb-4 space-y-4">
          {/* Row 1: Identity & Contact */}
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <Skeleton className="h-7 w-48" />
              <div className="flex items-center gap-3">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-36" />
            </div>
          </div>

          {/* Row 2: Financial Snapshot */}
          <div className="flex flex-wrap gap-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="space-y-1">
                <Skeleton className="h-3 w-12" />
                <Skeleton className="h-5 w-20" />
              </div>
            ))}
          </div>

          {/* Row 3: RM Actions & Completeness */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <div className="space-y-1">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-5 w-16" />
              </div>
              <div className="space-y-1">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-5 w-16" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="space-y-1">
                <Skeleton className="h-3 w-12" />
                <Skeleton className="h-4 w-16" />
              </div>
              <div className="space-y-1">
                <Skeleton className="h-3 w-8" />
                <Skeleton className="h-2 w-24 rounded-full" />
              </div>
            </div>
          </div>
        </div>

        {/* Profile Sidebar Skeleton */}
        <div className="pb-6 px-6 space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="border rounded-lg">
              <div className="flex items-center justify-between p-3">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-3 w-8" />
                  <Skeleton className="h-4 w-4" />
                </div>
              </div>
              {i < 2 && (
                <div className="px-3 pb-3 space-y-3">
                  {Array.from({ length: 3 }).map((_, j) => (
                    <div key={j} className="flex justify-between">
                      <Skeleton className="h-3 w-24" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Right Container: Workspace with Tabs */}
      <div className="flex-1 h-full flex flex-col border-l overflow-hidden pl-4 pt-4">
        {/* Tabs Header Skeleton */}
        <div className="flex items-center gap-1 px-2 pb-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-20 rounded-md" />
          ))}
        </div>

        {/* Tabs Content Skeleton */}
        <div className="flex-1 min-h-0 p-4">
          <div className="space-y-4">
            {/* Chat messages skeleton */}
            <div className="flex gap-3">
              <Skeleton className="h-8 w-8 rounded-full shrink-0" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <div className="space-y-2 flex-1 max-w-[70%]">
                <Skeleton className="h-4 w-full ml-auto" />
                <Skeleton className="h-4 w-2/3 ml-auto" />
              </div>
              <Skeleton className="h-8 w-8 rounded-full shrink-0" />
            </div>
            <div className="flex gap-3">
              <Skeleton className="h-8 w-8 rounded-full shrink-0" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
          </div>
        </div>

        {/* Input skeleton */}
        <div className="p-4 border-t">
          <Skeleton className="h-10 w-full rounded-md" />
        </div>
      </div>
    </div>
  );
}
