import { notFound } from "next/navigation";
import { crmRepository } from "@/lib/crm";
import { CustomerProfile } from "@/components/customers/customer-profile";

export const dynamic = "force-dynamic";

interface CustomerPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ mode?: string }>;
}

export default async function CustomerPage({
  params,
  searchParams,
}: CustomerPageProps) {
  const { id } = await params;
  const { mode } = await searchParams;
  const customer = await crmRepository.getCustomerWithNotes(id);

  if (!customer) {
    notFound();
  }

  return <CustomerProfile customer={customer} initialMode={mode} />;
}
