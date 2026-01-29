import { CheckCircle } from "lucide-react";

export function AllCaughtUp() {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="rounded-full bg-green-500/10 p-3 mb-3">
        <CheckCircle className="size-6 text-green-600 dark:text-green-400" aria-hidden="true" />
      </div>
      <p className="text-sm font-medium text-green-600 dark:text-green-400">
        All caught up!
      </p>
      <p className="text-xs text-muted-foreground mt-1">
        No pending items requiring attention
      </p>
    </div>
  );
}
