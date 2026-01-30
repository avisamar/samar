import { NextRequest, NextResponse } from "next/server";
import { artifactRepository } from "@/lib/crm/artifact-repository";
import { PROFILE_EDIT_STATUSES } from "@/lib/crm/artifact-types";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/artifacts/:id
 * Get a single artifact by ID.
 */
export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    const artifact = await artifactRepository.getById(id);
    if (!artifact) {
      return NextResponse.json(
        { error: "Artifact not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ artifact });
  } catch (error) {
    console.error("Error fetching artifact:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/artifacts/:id
 * Update artifact status.
 *
 * Body:
 * - status: "accepted" | "rejected" | "edited"
 * - editedValue?: unknown (required when status is "edited")
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { status, editedValue } = body;

    // Validate status
    const validStatuses = [
      PROFILE_EDIT_STATUSES.ACCEPTED,
      PROFILE_EDIT_STATUSES.REJECTED,
      PROFILE_EDIT_STATUSES.EDITED,
    ];

    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        {
          error: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Check artifact exists
    const existing = await artifactRepository.getById(id);
    if (!existing) {
      return NextResponse.json(
        { error: "Artifact not found" },
        { status: 404 }
      );
    }

    // Handle status updates
    let artifact;
    switch (status) {
      case PROFILE_EDIT_STATUSES.ACCEPTED:
        artifact = await artifactRepository.acceptProfileEdit(id);
        break;

      case PROFILE_EDIT_STATUSES.REJECTED:
        artifact = await artifactRepository.rejectProfileEdit(id);
        break;

      case PROFILE_EDIT_STATUSES.EDITED:
        if (editedValue === undefined) {
          return NextResponse.json(
            { error: "editedValue is required when status is 'edited'" },
            { status: 400 }
          );
        }
        artifact = await artifactRepository.acceptProfileEditWithEdits(
          id,
          editedValue
        );
        break;

      default:
        return NextResponse.json(
          { error: "Invalid status" },
          { status: 400 }
        );
    }

    if (!artifact) {
      return NextResponse.json(
        { error: "Failed to update artifact" },
        { status: 500 }
      );
    }

    return NextResponse.json({ artifact });
  } catch (error) {
    console.error("Error updating artifact:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
