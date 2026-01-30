import { NextRequest, NextResponse } from "next/server";
import { interestRepository, crmRepository } from "@/lib/crm";
import { getRequestUserId } from "@/lib/auth-server";

interface RouteContext {
  params: Promise<{ id: string; interestId: string }>;
}

/**
 * GET /api/customers/:id/interests/:interestId
 * Get a single interest by ID.
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id: customerId, interestId } = await context.params;

    // Check if customer exists
    const customer = await crmRepository.getCustomer(customerId);
    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    const interest = await interestRepository.getById(interestId);
    if (!interest) {
      return NextResponse.json(
        { error: "Interest not found" },
        { status: 404 }
      );
    }

    // Verify interest belongs to this customer
    if (interest.customerId !== customerId) {
      return NextResponse.json(
        { error: "Interest not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ interest });
  } catch (error) {
    console.error("Error getting interest:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/customers/:id/interests/:interestId
 * Update an existing interest.
 *
 * Body:
 * - label?: string
 * - description?: string
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id: customerId, interestId } = await context.params;
    const body = await request.json();

    // Check if customer exists
    const customer = await crmRepository.getCustomer(customerId);
    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    // Check if interest exists and belongs to this customer
    const existing = await interestRepository.getById(interestId);
    if (!existing || existing.customerId !== customerId) {
      return NextResponse.json(
        { error: "Interest not found" },
        { status: 404 }
      );
    }

    const { label, description, rmId: rmIdFromBody } = body as {
      label?: unknown;
      description?: unknown;
      rmId?: unknown;
    };
    const rmId =
      (typeof rmIdFromBody === "string" ? rmIdFromBody : null) ??
      (await getRequestUserId(request));

    // Validate at least one field to update
    if (label === undefined && description === undefined) {
      return NextResponse.json(
        { error: "At least one field to update is required (label or description)" },
        { status: 400 }
      );
    }

    const interest = await interestRepository.update(
      interestId,
      { label, description },
      rmId ?? undefined
    );

    if (!interest) {
      return NextResponse.json(
        { error: "Failed to update interest" },
        { status: 500 }
      );
    }

    return NextResponse.json({ interest });
  } catch (error) {
    console.error("Error updating interest:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/customers/:id/interests/:interestId
 * Archive an interest (soft delete).
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id: customerId, interestId } = await context.params;

    // Check if customer exists
    const customer = await crmRepository.getCustomer(customerId);
    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    // Check if interest exists and belongs to this customer
    const existing = await interestRepository.getById(interestId);
    if (!existing || existing.customerId !== customerId) {
      return NextResponse.json(
        { error: "Interest not found" },
        { status: 404 }
      );
    }

    // Prefer explicit rmId query param; fall back to authenticated user
    const { searchParams } = new URL(request.url);
    const rmIdFromQuery = searchParams.get("rmId");
    const rmId =
      (typeof rmIdFromQuery === "string" ? rmIdFromQuery : null) ??
      (await getRequestUserId(request));

    const interest = await interestRepository.archive(interestId, rmId ?? undefined);

    if (!interest) {
      return NextResponse.json(
        { error: "Failed to archive interest" },
        { status: 500 }
      );
    }

    return NextResponse.json({ interest });
  } catch (error) {
    console.error("Error archiving interest:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
