import { NextRequest, NextResponse } from "next/server";
import { interestRepository, crmRepository } from "@/lib/crm";
import type { ListInterestsOptions, InterestCategory } from "@/lib/crm";
import { INTEREST_STATUSES, INTEREST_CATEGORIES } from "@/lib/crm";
import { getRequestUserId } from "@/lib/auth-server";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/customers/:id/interests
 * List interests for a customer with optional filters.
 *
 * Query params:
 * - status: Filter by status (comma-separated for multiple)
 * - category: Filter by category (personal, financial)
 * - limit: Max results (default 50)
 * - offset: Pagination offset (default 0)
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id: customerId } = await context.params;

    // Check if customer exists
    const customer = await crmRepository.getCustomer(customerId);
    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get("status");
    const categoryParam = searchParams.get("category");
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    // Build options
    const options: ListInterestsOptions = {
      limit,
      offset,
    };

    // Handle status filter (can be comma-separated)
    if (statusParam) {
      const statuses = statusParam.split(",").map((s) => s.trim());
      const validStatuses = Object.values(INTEREST_STATUSES);
      const filteredStatuses = statuses.filter((s) =>
        validStatuses.includes(s as typeof validStatuses[number])
      ) as typeof validStatuses[number][];

      if (filteredStatuses.length === 1) {
        options.status = filteredStatuses[0];
      } else if (filteredStatuses.length > 1) {
        options.status = filteredStatuses;
      }
    }

    // Handle category filter
    if (categoryParam) {
      const validCategories = Object.values(INTEREST_CATEGORIES);
      if (validCategories.includes(categoryParam as typeof validCategories[number])) {
        options.category = categoryParam as InterestCategory;
      }
    }

    const interests = await interestRepository.listByCustomer(
      customerId,
      options
    );

    return NextResponse.json({ interests });
  } catch (error) {
    console.error("Error listing interests:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/customers/:id/interests
 * Create a manual interest entry.
 *
 * Body:
 * - category: "personal" | "financial"
 * - label: string
 * - description?: string
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id: customerId } = await context.params;
    const body = await request.json();

    // Validate required fields
    const { category, label, description, rmId: rmIdFromBody } = body;
    const rmId = (typeof rmIdFromBody === "string" ? rmIdFromBody : null) ?? (await getRequestUserId(request));

    if (!category || !label) {
      return NextResponse.json(
        { error: "Category and label are required" },
        { status: 400 }
      );
    }

    // Validate category
    const validCategories = Object.values(INTEREST_CATEGORIES);
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { error: `Invalid category. Must be one of: ${validCategories.join(", ")}` },
        { status: 400 }
      );
    }

    // Check if customer exists
    const customer = await crmRepository.getCustomer(customerId);
    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    if (!rmId) {
      return NextResponse.json(
        { error: "RM ID is required to create interests" },
        { status: 400 }
      );
    }

    // Create the interest
    const interest = await interestRepository.createManual({
      customerId,
      rmId,
      category,
      label,
      description,
    });

    return NextResponse.json({ interest }, { status: 201 });
  } catch (error) {
    console.error("Error creating interest:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
