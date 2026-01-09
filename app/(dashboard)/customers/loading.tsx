import { Skeleton } from "@/components/ui/skeleton";

export default function CustomersLoading() {
  return (
    <div className="space-y-6 p-4">
      <div>
        <h1 className="text-lg font-medium">Customers</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your customer profiles
        </p>
      </div>

      <div className="space-y-4">
        {/* Filters skeleton */}
        <div className="flex gap-3">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-9 w-40" />
        </div>

        {/* Table skeleton */}
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left font-medium px-3 py-2">Name</th>
                <th className="text-left font-medium px-3 py-2">Contact</th>
                <th className="text-left font-medium px-3 py-2">Location</th>
                <th className="text-left font-medium px-3 py-2">Income</th>
                <th className="text-left font-medium px-3 py-2">Goal</th>
                <th className="text-left font-medium px-3 py-2 w-28">Profile</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="border-b last:border-0">
                  <td className="px-3 py-2">
                    <Skeleton className="h-4 w-32 mb-1" />
                    <Skeleton className="h-3 w-20" />
                  </td>
                  <td className="px-3 py-2">
                    <Skeleton className="h-4 w-36 mb-1" />
                    <Skeleton className="h-3 w-24" />
                  </td>
                  <td className="px-3 py-2">
                    <Skeleton className="h-4 w-24 mb-1" />
                    <Skeleton className="h-3 w-16" />
                  </td>
                  <td className="px-3 py-2">
                    <Skeleton className="h-4 w-20 mb-1" />
                    <Skeleton className="h-3 w-16" />
                  </td>
                  <td className="px-3 py-2">
                    <Skeleton className="h-4 w-24 mb-1" />
                    <Skeleton className="h-3 w-16" />
                  </td>
                  <td className="px-3 py-2">
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <Skeleton className="h-3 w-12" />
                        <Skeleton className="h-3 w-8" />
                      </div>
                      <Skeleton className="h-1.5 w-full rounded-full" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary skeleton */}
        <Skeleton className="h-3 w-48" />
      </div>
    </div>
  );
}
