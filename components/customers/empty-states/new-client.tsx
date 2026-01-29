"use client";

import { useRouter, usePathname } from "next/navigation";
import { Sparkles, MessageSquarePlus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NewClientProps {
  customerName?: string | null;
}

export function NewClient({ customerName }: NewClientProps) {
  const router = useRouter();
  const pathname = usePathname();

  const navigateToCapture = () => {
    router.push(`${pathname}?mode=capture`);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-6">
      <div className="rounded-full bg-primary/10 p-4 mb-4">
        <Sparkles className="size-8 text-primary" aria-hidden="true" />
      </div>
      <h3 className="text-lg font-medium mb-2">
        Welcome, {customerName || "New Customer"}!
      </h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-6">
        Start building this customer's profile by adding notes from your
        conversations. The AI will help extract and organize key information.
      </p>
      <Button onClick={navigateToCapture} className="gap-2">
        <MessageSquarePlus className="size-4" />
        Add First Note
      </Button>
    </div>
  );
}
