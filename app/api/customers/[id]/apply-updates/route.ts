import { NextRequest, NextResponse } from "next/server";
import { crmRepository, interestRepository } from "@/lib/crm";
import { artifactRepository } from "@/lib/crm/artifact-repository";
import { PROFILE_EDIT_STATUSES } from "@/lib/crm/artifact-types";
import type {
  ProfileUpdateProposal,
  ApplyUpdatesRequest,
  ApplyUpdatesResponse,
  AdditionalDataItem,
} from "@/lib/crm/extraction-types";
import type { ExtractedInterest } from "@/lib/crm/interest-types";
import { validateFieldValue } from "@/lib/crm/field-mapping";

interface RouteContext {
  params: Promise<{ id: string }>;
}

interface InterestProposalWithArtifact extends ExtractedInterest {
  artifactId?: string;
}

interface ProposalWithInterests extends ProfileUpdateProposal {
  interestProposals?: InterestProposalWithArtifact[];
}

interface RequestBody extends ApplyUpdatesRequest {
  proposal: ProposalWithInterests;
  /** IDs of interest proposals that were approved */
  approvedInterestIds?: string[];
  /** Edited interest values (interest ID -> { label?, description? }) */
  editedInterests?: Record<string, { label?: string; description?: string }>;
  /** RM user ID performing the action */
  rmId?: string;
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
      approvedAdditionalDataIds = [],
      approvedInterestIds = [],
      approvedNote,
      editedValues = {},
      editedAdditionalData = {},
      editedInterests = {},
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
    let additionalDataAdded = 0;
    let interestsConfirmed = 0;
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

    // Apply approved additional data
    if (approvedAdditionalDataIds.length > 0 && proposal.additionalData) {
      const newAdditionalData: AdditionalDataItem[] = [];

      for (const dataId of approvedAdditionalDataIds) {
        const additionalItem = proposal.additionalData.find((d) => d.id === dataId);
        if (!additionalItem) {
          errors.push(`Additional data ${dataId} not found in proposal`);
          continue;
        }

        // Use edited value if available, otherwise use proposed value
        const value = editedAdditionalData[dataId] !== undefined
          ? editedAdditionalData[dataId]
          : additionalItem.value;

        newAdditionalData.push({
          key: additionalItem.key,
          label: additionalItem.label,
          value,
          confidence: additionalItem.confidence,
          source: additionalItem.source,
          category: additionalItem.category,
          addedAt: new Date().toISOString(),
        });
      }

      if (newAdditionalData.length > 0) {
        console.log("[ApplyUpdates] Appending additional data:", newAdditionalData.length, "items");
        const updated = await crmRepository.appendAdditionalData(customerId, newAdditionalData);
        if (updated) {
          additionalDataAdded = newAdditionalData.length;
          console.log("[ApplyUpdates] Additional data added count:", additionalDataAdded);
        } else {
          errors.push("Failed to add additional data");
        }
      }
    }

    // Apply approved interest proposals
    const interestProposals = proposal.interestProposals || [];
    if (approvedInterestIds.length > 0 && interestProposals.length > 0) {
      for (const interestId of approvedInterestIds) {
        const interestProposal = interestProposals.find((i) => i.id === interestId);
        if (!interestProposal) {
          errors.push(`Interest proposal ${interestId} not found in proposal`);
          continue;
        }

        if (!interestProposal.artifactId) {
          errors.push(`Interest proposal ${interestId} has no artifact ID`);
          continue;
        }

        try {
          // Get edits if any
          const edits = editedInterests[interestId];

          // Create confirmed interest from artifact
          const interest = await interestRepository.createFromArtifact(
            interestProposal.artifactId,
            body.rmId || "system", // TODO: Get from auth context
            edits
          );

          if (interest) {
            // Update artifact status
            await artifactRepository.acceptInterestProposal(
              interestProposal.artifactId,
              edits
            );
            interestsConfirmed++;
            console.log(`[ApplyUpdates] Confirmed interest: ${interest.label}`);
          } else {
            errors.push(`Failed to confirm interest: ${interestProposal.label}`);
          }
        } catch (e) {
          errors.push(`Failed to confirm interest ${interestProposal.label}: ${e instanceof Error ? e.message : "Unknown error"}`);
        }
      }

      // Reject non-approved interest proposals
      for (const interestProposal of interestProposals) {
        if (!approvedInterestIds.includes(interestProposal.id) && interestProposal.artifactId) {
          try {
            await artifactRepository.rejectProfileEdit(interestProposal.artifactId);
            console.log(`[ApplyUpdates] Rejected interest artifact: ${interestProposal.artifactId}`);
          } catch (e) {
            console.error(`[ApplyUpdates] Failed to reject interest artifact ${interestProposal.artifactId}:`, e);
          }
        }
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
            interestsConfirmed: approvedInterestIds,
            interestsRejected: interestProposals
              .filter((i) => !approvedInterestIds.includes(i.id))
              .map((i) => i.id),
          },
        });
        noteCreated = true;
      } catch (e) {
        errors.push(`Failed to create note: ${e instanceof Error ? e.message : "Unknown error"}`);
      }
    }

    // Update artifact statuses
    // Track artifacts that need status updates
    const artifactUpdates: Array<{
      artifactId: string;
      status: string;
      editedValue?: unknown;
    }> = [];

    for (const fieldUpdate of proposal.fieldUpdates) {
      if (!fieldUpdate.artifactId) continue;

      const isApproved = approvedFieldIds.includes(fieldUpdate.id);
      const hasEdit = editedValues[fieldUpdate.id] !== undefined;

      if (isApproved) {
        if (hasEdit) {
          artifactUpdates.push({
            artifactId: fieldUpdate.artifactId,
            status: PROFILE_EDIT_STATUSES.EDITED,
            editedValue: editedValues[fieldUpdate.id],
          });
        } else {
          artifactUpdates.push({
            artifactId: fieldUpdate.artifactId,
            status: PROFILE_EDIT_STATUSES.ACCEPTED,
          });
        }
      } else {
        artifactUpdates.push({
          artifactId: fieldUpdate.artifactId,
          status: PROFILE_EDIT_STATUSES.REJECTED,
        });
      }
    }

    // Apply artifact updates
    for (const update of artifactUpdates) {
      try {
        if (update.status === PROFILE_EDIT_STATUSES.EDITED) {
          await artifactRepository.acceptProfileEditWithEdits(
            update.artifactId,
            update.editedValue
          );
        } else if (update.status === PROFILE_EDIT_STATUSES.ACCEPTED) {
          await artifactRepository.acceptProfileEdit(update.artifactId);
        } else if (update.status === PROFILE_EDIT_STATUSES.REJECTED) {
          await artifactRepository.rejectProfileEdit(update.artifactId);
        }
        console.log(`[ApplyUpdates] Updated artifact ${update.artifactId} to ${update.status}`);
      } catch (e) {
        console.error(`[ApplyUpdates] Failed to update artifact ${update.artifactId}:`, e);
        // Don't fail the whole operation for artifact update failures
      }
    }

    const response: ApplyUpdatesResponse & { interestsConfirmed?: number } = {
      success: errors.length === 0,
      fieldsUpdated,
      additionalDataAdded,
      noteCreated,
      interestsConfirmed: interestsConfirmed > 0 ? interestsConfirmed : undefined,
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
