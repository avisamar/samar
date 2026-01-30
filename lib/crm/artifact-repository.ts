import { eq, and, inArray, desc } from "drizzle-orm";
import db from "@/db";
import { artifact } from "@/db/artifact-schema";
import type { Artifact, NewArtifact } from "@/db/artifact-schema";
import {
  ARTIFACT_TYPES,
  PROFILE_EDIT_STATUSES,
  type ProfileEditPayload,
  type InterestProposalPayload,
  type CreateProfileEditInput,
  type CreateInterestProposalInput,
  type ListArtifactsOptions,
} from "./artifact-types";

// =============================================================================
// Artifact Repository
// =============================================================================

export const artifactRepository = {
  // ---------------------------------------------------------------------------
  // Read Operations
  // ---------------------------------------------------------------------------

  /**
   * Get a single artifact by ID.
   */
  async getById(id: string): Promise<Artifact | null> {
    const [result] = await db
      .select()
      .from(artifact)
      .where(eq(artifact.id, id))
      .limit(1);
    return result ?? null;
  },

  /**
   * List artifacts for a customer with optional filters.
   */
  async listByCustomer(
    customerId: string,
    options: ListArtifactsOptions = {}
  ): Promise<Artifact[]> {
    const { status, artifactType, limit = 50, offset = 0 } = options;

    const conditions = [eq(artifact.customerId, customerId)];

    if (status) {
      if (Array.isArray(status)) {
        conditions.push(inArray(artifact.status, status));
      } else {
        conditions.push(eq(artifact.status, status));
      }
    }

    if (artifactType) {
      conditions.push(eq(artifact.artifactType, artifactType));
    }

    return db
      .select()
      .from(artifact)
      .where(and(...conditions))
      .orderBy(desc(artifact.createdAt))
      .limit(limit)
      .offset(offset);
  },

  /**
   * List pending artifacts for a customer (actionable items).
   */
  async listPendingByCustomer(customerId: string): Promise<Artifact[]> {
    return this.listByCustomer(customerId, {
      status: PROFILE_EDIT_STATUSES.PENDING,
    });
  },

  /**
   * List all artifacts from the same batch.
   */
  async listByBatchId(batchId: string): Promise<Artifact[]> {
    return db
      .select()
      .from(artifact)
      .where(eq(artifact.batchId, batchId))
      .orderBy(desc(artifact.createdAt));
  },

  // ---------------------------------------------------------------------------
  // Create Operations
  // ---------------------------------------------------------------------------

  /**
   * Create a single profile edit artifact.
   */
  async createProfileEdit(input: CreateProfileEditInput): Promise<Artifact> {
    const newArtifact: NewArtifact = {
      customerId: input.customerId,
      rmId: input.rmId,
      batchId: input.batchId,
      version: 1,
      artifactType: ARTIFACT_TYPES.PROFILE_EDIT,
      status: PROFILE_EDIT_STATUSES.PENDING,
      createdByType: input.createdByType,
      createdById: input.createdById,
      payload: input.payload,
    };

    const [result] = await db.insert(artifact).values(newArtifact).returning();
    return result;
  },

  /**
   * Create multiple profile edit artifacts in a batch.
   * All artifacts share the same batchId for UI grouping.
   */
  async createProfileEditBatch(
    inputs: CreateProfileEditInput[]
  ): Promise<Artifact[]> {
    if (inputs.length === 0) {
      return [];
    }

    const newArtifacts: NewArtifact[] = inputs.map((input) => ({
      customerId: input.customerId,
      rmId: input.rmId,
      batchId: input.batchId,
      version: 1,
      artifactType: ARTIFACT_TYPES.PROFILE_EDIT,
      status: PROFILE_EDIT_STATUSES.PENDING,
      createdByType: input.createdByType,
      createdById: input.createdById,
      payload: input.payload,
    }));

    return db.insert(artifact).values(newArtifacts).returning();
  },

  /**
   * Create a single interest proposal artifact.
   */
  async createInterestProposal(input: CreateInterestProposalInput): Promise<Artifact> {
    const newArtifact: NewArtifact = {
      customerId: input.customerId,
      rmId: input.rmId,
      batchId: input.batchId,
      version: 1,
      artifactType: ARTIFACT_TYPES.INTEREST_PROPOSAL,
      status: PROFILE_EDIT_STATUSES.PENDING,
      createdByType: input.createdByType,
      createdById: input.createdById,
      payload: input.payload,
    };

    const [result] = await db.insert(artifact).values(newArtifact).returning();
    return result;
  },

  /**
   * Create multiple interest proposal artifacts in a batch.
   * All artifacts share the same batchId for UI grouping.
   */
  async createInterestProposalBatch(
    inputs: CreateInterestProposalInput[]
  ): Promise<Artifact[]> {
    if (inputs.length === 0) {
      return [];
    }

    const newArtifacts: NewArtifact[] = inputs.map((input) => ({
      customerId: input.customerId,
      rmId: input.rmId,
      batchId: input.batchId,
      version: 1,
      artifactType: ARTIFACT_TYPES.INTEREST_PROPOSAL,
      status: PROFILE_EDIT_STATUSES.PENDING,
      createdByType: input.createdByType,
      createdById: input.createdById,
      payload: input.payload,
    }));

    return db.insert(artifact).values(newArtifacts).returning();
  },

  /**
   * Accept an interest proposal artifact with optional edits.
   */
  async acceptInterestProposal(
    id: string,
    edits?: { label?: string; description?: string }
  ): Promise<Artifact | null> {
    const current = await this.getById(id);
    if (!current) {
      return null;
    }

    const currentPayload = current.payload as InterestProposalPayload;
    const updatedPayload: InterestProposalPayload = {
      ...currentPayload,
    };

    let status: string = PROFILE_EDIT_STATUSES.ACCEPTED;

    if (edits?.label || edits?.description) {
      status = PROFILE_EDIT_STATUSES.EDITED;
      if (edits.label) {
        updatedPayload.edited_label = edits.label;
      }
      if (edits.description) {
        updatedPayload.edited_description = edits.description;
      }
    }

    const [result] = await db
      .update(artifact)
      .set({
        status,
        payload: updatedPayload,
      })
      .where(eq(artifact.id, id))
      .returning();

    return result ?? null;
  },

  // ---------------------------------------------------------------------------
  // Update Operations
  // ---------------------------------------------------------------------------

  /**
   * Accept a profile edit artifact (set status to "accepted").
   */
  async acceptProfileEdit(id: string): Promise<Artifact | null> {
    const [result] = await db
      .update(artifact)
      .set({ status: PROFILE_EDIT_STATUSES.ACCEPTED })
      .where(eq(artifact.id, id))
      .returning();
    return result ?? null;
  },

  /**
   * Reject a profile edit artifact (set status to "rejected").
   */
  async rejectProfileEdit(id: string): Promise<Artifact | null> {
    const [result] = await db
      .update(artifact)
      .set({ status: PROFILE_EDIT_STATUSES.REJECTED })
      .where(eq(artifact.id, id))
      .returning();
    return result ?? null;
  },

  /**
   * Accept a profile edit with RM edits.
   * Sets status to "edited" and stores the edited value in the payload.
   */
  async acceptProfileEditWithEdits(
    id: string,
    editedValue: unknown
  ): Promise<Artifact | null> {
    // First get the current artifact to access its payload
    const current = await this.getById(id);
    if (!current) {
      return null;
    }

    const currentPayload = current.payload as ProfileEditPayload;
    const updatedPayload: ProfileEditPayload = {
      ...currentPayload,
      edited_value: editedValue,
    };

    const [result] = await db
      .update(artifact)
      .set({
        status: PROFILE_EDIT_STATUSES.EDITED,
        payload: updatedPayload,
      })
      .where(eq(artifact.id, id))
      .returning();

    return result ?? null;
  },

  /**
   * Bulk update artifact statuses by field IDs.
   * Used when applying proposal updates.
   */
  async updateStatusByIds(
    ids: string[],
    status: string
  ): Promise<number> {
    if (ids.length === 0) {
      return 0;
    }

    const result = await db
      .update(artifact)
      .set({ status })
      .where(inArray(artifact.id, ids));

    return result.rowCount ?? 0;
  },
};

export type ArtifactRepository = typeof artifactRepository;
