import { NextRequest, NextResponse } from "next/server";
import { artifactRepository } from "@/lib/crm/artifact-repository";
import { crmRepository } from "@/lib/crm";
import type { ListArtifactsOptions } from "@/lib/crm/artifact-types";
import { PROFILE_EDIT_STATUSES } from "@/lib/crm/artifact-types";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/customers/:id/artifacts
 * List artifacts for a customer with optional filters.
 *
 * Query params:
 * - status: Filter by status (comma-separated for multiple)
 * - artifactType: Filter by artifact type
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
    const artifactType = searchParams.get("artifactType");
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    // Build options
    const options: ListArtifactsOptions = {
      limit,
      offset,
    };

    // Handle status filter (can be comma-separated)
    if (statusParam) {
      const statuses = statusParam.split(",").map((s) => s.trim());
      const validStatuses = Object.values(PROFILE_EDIT_STATUSES);
      const filteredStatuses = statuses.filter((s) =>
        validStatuses.includes(s as typeof validStatuses[number])
      ) as typeof validStatuses[number][];

      if (filteredStatuses.length === 1) {
        options.status = filteredStatuses[0];
      } else if (filteredStatuses.length > 1) {
        options.status = filteredStatuses;
      }
    }

    if (artifactType) {
      options.artifactType = artifactType as ListArtifactsOptions["artifactType"];
    }

    const artifacts = await artifactRepository.listByCustomer(
      customerId,
      options
    );

    return NextResponse.json({ artifacts });
  } catch (error) {
    console.error("Error listing artifacts:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
