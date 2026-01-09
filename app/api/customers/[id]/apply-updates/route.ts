import { NextRequest, NextResponse } from "next/server";
import { crmRepository } from "@/lib/crm";
import type {
  ProfileUpdateProposal,
  ApplyUpdatesRequest,
  ApplyUpdatesResponse,
} from "@/lib/crm/extraction-types";
import { validateFieldValue } from "@/lib/crm/field-mapping";

interface RouteContext {
  params: Promise<{ id: string }>;
}

interface RequestBody extends ApplyUpdatesRequest {
  proposal: ProfileUpdateProposal;
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id: customerId } = await context.params;
    const body: RequestBody = await request.json();

    console.log("[ApplyUpdates] Received request for customer:", customerId);
    console.log("[ApplyUpdates] Body:", JSON.stringify(body, null, 2));

    const {
      proposalId,
      approvedFieldIds,
      approvedNote,
      editedValues = {},
      editedNoteContent,
      proposal,
    } = body;

    console.log("[ApplyUpdates] Approved field IDs:", approvedFieldIds);
    console.log("[ApplyUpdates] Proposal field updates:", proposal?.fieldUpdates?.map(f => ({ id: f.id, field: f.field, value: f.proposedValue })));

    // Validate request
    if (!proposalId || !proposal) {
      console.log("[ApplyUpdates] Missing proposalId or proposal");
      return NextResponse.json(
        { error: "Proposal ID and proposal data are required" },
        { status: 400 }
      );
    }

    // Check if customer exists
    const existingCustomer = await crmRepository.getCustomer(customerId);
    if (!existingCustomer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    const errors: string[] = [];
    let fieldsUpdated = 0;
    let noteCreated = false;

    // Apply approved field updates
    if (approvedFieldIds.length > 0) {
      const fieldUpdates: Record<string, unknown> = {};

      for (const fieldId of approvedFieldIds) {
        const fieldUpdate = proposal.fieldUpdates.find((f) => f.id === fieldId);
        if (!fieldUpdate) {
          errors.push(`Field update ${fieldId} not found in proposal`);
          continue;
        }

        // Use edited value if available, otherwise use proposed value
        const value = editedValues[fieldId] !== undefined
          ? editedValues[fieldId]
          : fieldUpdate.proposedValue;

        // Validate the field value
        const validation = validateFieldValue(fieldUpdate.field, value);
        if (!validation.valid) {
          errors.push(`Invalid value for ${fieldUpdate.label}: ${validation.error}`);
          continue;
        }

        fieldUpdates[fieldUpdate.field] = validation.value;
      }

      // Apply all field updates at once
      if (Object.keys(fieldUpdates).length > 0) {
        console.log("[ApplyUpdates] Applying field updates:", fieldUpdates);
        const updated = await crmRepository.updateProfileFields(customerId, fieldUpdates);
        console.log("[ApplyUpdates] Update result:", updated ? "success" : "failed");
        if (updated) {
          fieldsUpdated = Object.keys(fieldUpdates).length;
          console.log("[ApplyUpdates] Updated fields count:", fieldsUpdated);
        } else {
          errors.push("Failed to update profile fields");
        }
      } else {
        console.log("[ApplyUpdates] No valid field updates to apply");
      }
    }

    // Create note if approved
    if (approvedNote) {
      const noteContent = editedNoteContent ?? proposal.note.content;

      try {
        await crmRepository.addNote(customerId, {
          content: noteContent,
          source: proposal.note.source,
          tags: proposal.note.tags,
          rawInput: proposal.rawInput,
          extractedFields: {
            proposalId: proposal.proposalId,
            fieldsApproved: approvedFieldIds,
            fieldsRejected: proposal.fieldUpdates
              .filter((f) => !approvedFieldIds.includes(f.id))
              .map((f) => f.id),
          },
        });
        noteCreated = true;
      } catch (e) {
        errors.push(`Failed to create note: ${e instanceof Error ? e.message : "Unknown error"}`);
      }
    }

    const response: ApplyUpdatesResponse = {
      success: errors.length === 0,
      fieldsUpdated,
      noteCreated,
      errors: errors.length > 0 ? errors : undefined,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error applying profile updates:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
