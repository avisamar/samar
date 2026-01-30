import { eq, and, inArray, desc } from "drizzle-orm";
import db from "@/db";
import {
  customerInterest,
  customerInterestAudit,
  type CustomerInterest,
  type NewCustomerInterest,
  type NewCustomerInterestAudit,
} from "@/db/interest-schema";
import { artifact } from "@/db/artifact-schema";
import type { InterestProposalPayload } from "./artifact-types";
import {
  INTEREST_STATUSES,
  INTEREST_SOURCE_TYPES,
  INTEREST_AUDIT_ACTIONS,
  INTEREST_ACTOR_TYPES,
  type ListInterestsOptions,
  type CreateManualInterestInput,
  type UpdateInterestInput,
  type InterestCategory,
} from "./interest-types";

// =============================================================================
// Interest Repository
// =============================================================================

export const interestRepository = {
  // ---------------------------------------------------------------------------
  // Read Operations
  // ---------------------------------------------------------------------------

  /**
   * Get a single interest by ID.
   */
  async getById(id: string): Promise<CustomerInterest | null> {
    const [result] = await db
      .select()
      .from(customerInterest)
      .where(eq(customerInterest.id, id))
      .limit(1);
    return result ?? null;
  },

  /**
   * List interests for a customer with optional filters.
   */
  async listByCustomer(
    customerId: string,
    options: ListInterestsOptions = {}
  ): Promise<CustomerInterest[]> {
    const { status, category, limit = 50, offset = 0 } = options;

    const conditions = [eq(customerInterest.customerId, customerId)];

    if (status) {
      if (Array.isArray(status)) {
        conditions.push(inArray(customerInterest.status, status));
      } else {
        conditions.push(eq(customerInterest.status, status));
      }
    }

    if (category) {
      conditions.push(eq(customerInterest.category, category));
    }

    return db
      .select()
      .from(customerInterest)
      .where(and(...conditions))
      .orderBy(desc(customerInterest.createdAt))
      .limit(limit)
      .offset(offset);
  },

  /**
   * List active interests for a customer.
   */
  async listActiveByCustomer(customerId: string): Promise<CustomerInterest[]> {
    return this.listByCustomer(customerId, {
      status: INTEREST_STATUSES.ACTIVE,
    });
  },

  /**
   * List interests by category.
   */
  async listByCategory(
    customerId: string,
    category: InterestCategory
  ): Promise<CustomerInterest[]> {
    return this.listByCustomer(customerId, {
      status: INTEREST_STATUSES.ACTIVE,
      category,
    });
  },

  // ---------------------------------------------------------------------------
  // Create Operations
  // ---------------------------------------------------------------------------

  /**
   * Create an interest from an approved artifact.
   * Used when RM confirms a system-suggested interest.
   */
  async createFromArtifact(
    artifactId: string,
    rmId: string,
    edits?: { label?: string; description?: string }
  ): Promise<CustomerInterest | null> {
    // Get the artifact
    const [artifactRecord] = await db
      .select()
      .from(artifact)
      .where(eq(artifact.id, artifactId))
      .limit(1);

    if (!artifactRecord || !artifactRecord.customerId) {
      return null;
    }

    const payload = artifactRecord.payload as InterestProposalPayload;

    // Create the interest
    const newInterest: NewCustomerInterest = {
      customerId: artifactRecord.customerId,
      createdByRmId: rmId,
      category: payload.category,
      label: edits?.label || payload.edited_label || payload.label,
      description: edits?.description || payload.edited_description || payload.description,
      sourceType: INTEREST_SOURCE_TYPES.SYSTEM_SUGGESTED,
      sourceArtifactId: artifactId,
      sourceText: payload.source_text,
      confidence: payload.confidence,
      status: INTEREST_STATUSES.ACTIVE,
    };

    const [interest] = await db
      .insert(customerInterest)
      .values(newInterest)
      .returning();

    // Create audit record
    await this.createAuditRecord(interest.id, {
      action: INTEREST_AUDIT_ACTIONS.CONFIRMED,
      actorId: rmId,
      actorType: INTEREST_ACTOR_TYPES.RM,
      newState: interest,
    });

    return interest;
  },

  /**
   * Create a manual interest entry.
   * Used when RM adds an interest directly without agent suggestion.
   */
  async createManual(input: CreateManualInterestInput): Promise<CustomerInterest> {
    const newInterest: NewCustomerInterest = {
      customerId: input.customerId,
      createdByRmId: input.rmId,
      category: input.category,
      label: input.label,
      description: input.description,
      sourceType: INTEREST_SOURCE_TYPES.MANUAL,
      status: INTEREST_STATUSES.ACTIVE,
    };

    const [interest] = await db
      .insert(customerInterest)
      .values(newInterest)
      .returning();

    // Create audit record
    await this.createAuditRecord(interest.id, {
      action: INTEREST_AUDIT_ACTIONS.CREATED,
      actorId: input.rmId,
      actorType: INTEREST_ACTOR_TYPES.RM,
      newState: interest,
    });

    return interest;
  },

  // ---------------------------------------------------------------------------
  // Update Operations
  // ---------------------------------------------------------------------------

  /**
   * Update an existing interest.
   */
  async update(
    id: string,
    data: UpdateInterestInput,
    rmId: string
  ): Promise<CustomerInterest | null> {
    // Get current state for audit
    const current = await this.getById(id);
    if (!current) {
      return null;
    }

    const updateData: Partial<NewCustomerInterest> = {};
    if (data.label !== undefined) {
      updateData.label = data.label;
    }
    if (data.description !== undefined) {
      updateData.description = data.description;
    }

    const [updated] = await db
      .update(customerInterest)
      .set(updateData)
      .where(eq(customerInterest.id, id))
      .returning();

    if (!updated) {
      return null;
    }

    // Create audit record
    await this.createAuditRecord(id, {
      action: INTEREST_AUDIT_ACTIONS.EDITED,
      actorId: rmId,
      actorType: INTEREST_ACTOR_TYPES.RM,
      previousState: current,
      newState: updated,
    });

    return updated;
  },

  /**
   * Archive an interest (soft delete).
   */
  async archive(id: string, rmId: string): Promise<CustomerInterest | null> {
    // Get current state for audit
    const current = await this.getById(id);
    if (!current) {
      return null;
    }

    const [archived] = await db
      .update(customerInterest)
      .set({ status: INTEREST_STATUSES.ARCHIVED })
      .where(eq(customerInterest.id, id))
      .returning();

    if (!archived) {
      return null;
    }

    // Create audit record
    await this.createAuditRecord(id, {
      action: INTEREST_AUDIT_ACTIONS.ARCHIVED,
      actorId: rmId,
      actorType: INTEREST_ACTOR_TYPES.RM,
      previousState: current,
      newState: archived,
    });

    return archived;
  },

  // ---------------------------------------------------------------------------
  // Audit Operations
  // ---------------------------------------------------------------------------

  /**
   * Create an audit record for an interest change.
   */
  async createAuditRecord(
    interestId: string,
    data: {
      action: string;
      actorId?: string;
      actorType: string;
      previousState?: unknown;
      newState?: unknown;
    }
  ): Promise<void> {
    const auditRecord: NewCustomerInterestAudit = {
      interestId,
      action: data.action,
      actorId: data.actorId,
      actorType: data.actorType,
      previousState: data.previousState,
      newState: data.newState,
    };

    await db.insert(customerInterestAudit).values(auditRecord);
  },

  /**
   * Get audit history for an interest.
   */
  async getAuditHistory(interestId: string) {
    return db
      .select()
      .from(customerInterestAudit)
      .where(eq(customerInterestAudit.interestId, interestId))
      .orderBy(desc(customerInterestAudit.createdAt));
  },
};

export type InterestRepository = typeof interestRepository;
