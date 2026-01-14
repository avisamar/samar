import { NextRequest, NextResponse } from "next/server";
import { crmRepository } from "@/lib/crm";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    // Check if customer exists
    const customer = await crmRepository.getCustomer(id);
    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    // Fetch notes for the customer
    const notes = await crmRepository.listNotes(id);

    return NextResponse.json({ notes });
  } catch (error) {
    console.error("Error fetching customer notes:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
