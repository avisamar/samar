import { crmRepository } from "@/lib/crm";
import { CustomersTable } from "@/components/customers/customers-table";
import { CustomersHeader } from "@/components/customers/customers-header";

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  const customers = await crmRepository.listCustomers({ limit: 100 });

  return (
    <div className="space-y-6 p-4">
      <CustomersHeader />
      <CustomersTable customers={customers} />
    </div>
  );
}
