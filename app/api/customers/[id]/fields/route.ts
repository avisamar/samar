import { NextRequest, NextResponse } from "next/server";
import { crmRepository } from "@/lib/crm";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    const { field, value } = body;

    if (!field) {
      return NextResponse.json(
        { error: "Field name is required" },
        { status: 400 }
      );
    }

    // Validate that the field exists in the schema
    const reservedFields = ["id", "createdAt", "updatedAt"];
    if (reservedFields.includes(field)) {
      return NextResponse.json(
        { error: "Cannot update reserved field" },
        { status: 400 }
      );
    }

    // Check if customer exists
    const existingCustomer = await crmRepository.getCustomer(id);
    if (!existingCustomer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    // Update the field
    const updatedCustomer = await crmRepository.updateProfileFields(id, {
      [field]: value,
    });

    if (!updatedCustomer) {
      return NextResponse.json(
        { error: "Failed to update field" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      field,
      value: updatedCustomer[field as keyof typeof updatedCustomer],
    });
  } catch (error) {
    console.error("Error updating customer field:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
