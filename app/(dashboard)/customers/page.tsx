import { crmRepository } from "@/lib/crm";
import { CustomersTable } from "@/components/customers/customers-table";

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  const customers = await crmRepository.listCustomers({ limit: 100 });

  return (
    <div className="space-y-6 p-4">
      <div>
        <h1 className="text-lg font-medium">Customers</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your customer profiles
        </p>
      </div>

      <CustomersTable customers={customers} />
    </div>
  );
}
