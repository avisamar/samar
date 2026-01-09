"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreateCustomerDialog } from "./create-customer-dialog";

export function CustomersHeader() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-lg font-medium">Customers</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your customer profiles
        </p>
      </div>
      <Button size="sm" onClick={() => setShowCreateDialog(true)}>
        <Plus className="size-4 mr-1.5" />
        Add Customer
      </Button>
      <CreateCustomerDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />
    </div>
  );
}
