"use client";

import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft, MoreHorizontal } from "lucide-react";
import type { CustomerWithNotes } from "@/lib/crm/types";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ProfileHero } from "./profile-hero";
import { ProfileSidebar } from "./profile-sidebar";
import { ProfileTabs } from "./profile-tabs";

interface CustomerProfileProps {
  customer: CustomerWithNotes;
}

export function CustomerProfile({ customer }: CustomerProfileProps) {
  return (
    <div className="h-screen flex overflow-hidden">
      {/* Left Container: Header + Hero + Profile Sidebar */}
      <div className="w-1/3 min-w-[320px] max-w-[420px] h-full flex flex-col bg-surface-inset overflow-y-auto pt-4">
        {/* Header */}
        <div className="flex items-center gap-2 px-6 py-3">
          <Link
            href="/customers"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="size-4" />
            <span>Back to Customers</span>
          </Link>
        </div>

        {/* Hero Section */}
        <div className="px-6 pb-4">
          <ProfileHero customer={customer} />
        </div>

        {/* Profile Sidebar */}
        <div className="pb-6">
          <ProfileSidebar customer={customer} />
        </div>
      </div>

      {/* Right Container: Workspace with Tabs */}
      <div className="flex-1 h-full flex flex-col border-l overflow-hidden pl-4 pt-4">
        {/* Tabs Panel - fills remaining height */}
        <div className="flex-1 min-h-0">
          <Suspense fallback={<TabsLoading />}>
            <ProfileTabs customerId={customer.id} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

function TabsLoading() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-sm text-muted-foreground">Loading...</div>
    </div>
  );
}
