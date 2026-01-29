import Link from "next/link";
import { Users } from "lucide-react";
import { Button } from "@/components/ui/button";

export function NoClientSelected() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-6">
      <div className="rounded-full bg-muted p-4 mb-4">
        <Users className="size-8 text-muted-foreground" aria-hidden="true" />
      </div>
      <h3 className="text-lg font-medium mb-2">No customer selected</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-6">
        Select a customer from the list to view their profile and manage their
        information.
      </p>
      <Button asChild>
        <Link href="/customers">Browse Customers</Link>
      </Button>
    </div>
  );
}
