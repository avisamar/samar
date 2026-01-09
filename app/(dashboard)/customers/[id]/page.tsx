import { notFound } from "next/navigation";
import { crmRepository } from "@/lib/crm";
import { CustomerProfile } from "@/components/customers/customer-profile";

export const dynamic = "force-dynamic";

interface CustomerPageProps {
  params: Promise<{ id: string }>;
}

export default async function CustomerPage({ params }: CustomerPageProps) {
  const { id } = await params;
  const customer = await crmRepository.getCustomerWithNotes(id);

  if (!customer) {
    notFound();
  }

  return <CustomerProfile customer={customer} />;
}
