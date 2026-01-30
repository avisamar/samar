import { NextRequest, NextResponse } from "next/server";
import { interestRepository, crmRepository, artifactRepository } from "@/lib/crm";
import { PROFILE_EDIT_STATUSES, ARTIFACT_TYPES } from "@/lib/crm";
import { getRequestUserId } from "@/lib/auth-server";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/customers/:id/interests/confirm
 * Confirm an interest proposal artifact, creating a confirmed interest.
 *
 * Body:
 * - artifactId: string - The artifact ID to confirm
 * - rmId?: string - The RM who is confirming
 * - label?: string - Optional override for the label
 * - description?: string - Optional override for the description
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id: customerId } = await context.params;
    const body = await request.json();

    const { artifactId, rmId: rmIdFromBody, label, description } = body;
    const rmId = (typeof rmIdFromBody === "string" ? rmIdFromBody : null) ?? (await getRequestUserId(request));

    // Validate required fields
    if (!artifactId) {
      return NextResponse.json(
        { error: "Artifact ID is required" },
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

    // Get the artifact
    const artifact = await artifactRepository.getById(artifactId);
    if (!artifact) {
      return NextResponse.json(
        { error: "Artifact not found" },
        { status: 404 }
      );
    }

    // Verify artifact belongs to this customer
    if (artifact.customerId !== customerId) {
      return NextResponse.json(
        { error: "Artifact not found" },
        { status: 404 }
      );
    }

    // Verify artifact is an interest proposal
    if (artifact.artifactType !== ARTIFACT_TYPES.INTEREST_PROPOSAL) {
      return NextResponse.json(
        { error: "Artifact is not an interest proposal" },
        { status: 400 }
      );
    }

    // Verify artifact is pending
    if (artifact.status !== PROFILE_EDIT_STATUSES.PENDING) {
      return NextResponse.json(
        { error: `Cannot confirm artifact with status: ${artifact.status}` },
        { status: 400 }
      );
    }

    if (!rmId) {
      return NextResponse.json(
        { error: "RM ID is required to confirm interests" },
        { status: 400 }
      );
    }

    // Create the confirmed interest from the artifact
    const interest = await interestRepository.createFromArtifact(
      artifactId,
      rmId,
      { label, description }
    );

    if (!interest) {
      return NextResponse.json(
        { error: "Failed to create interest from artifact" },
        { status: 500 }
      );
    }

    // Update artifact status
    await artifactRepository.acceptInterestProposal(artifactId, { label, description });

    return NextResponse.json({ interest }, { status: 201 });
  } catch (error) {
    console.error("Error confirming interest:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
