"use client";

import type { Customer } from "@/lib/crm/types";
import { PROFILE_SECTIONS } from "@/lib/crm/sections";
import { ProfileSection } from "./profile-section";

interface ProfileSidebarProps {
  customer: Customer;
}

export function ProfileSidebar({ customer }: ProfileSidebarProps) {
  return (
    <div className="px-6 py-2">
      <h2 className="text-sm font-medium text-muted-foreground mb-2">Profile Details</h2>
      {PROFILE_SECTIONS.map((section, index) => (
        <ProfileSection
          key={section.id}
          section={section}
          customer={customer}
          defaultOpen={index < 4} // First 4 sections open by default
        />
      ))}
    </div>
  );
}
