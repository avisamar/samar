# Artifact Model Implementation Plan

## Purpose

**Why artifacts?** Currently, agent-generated proposals (profile updates, nudges) are ephemeral — they exist only in the chat session and are lost on page refresh. Artifacts introduce a persistent layer that:

1. **Enables audit trails** — Track what the agent proposed, what the RM accepted/rejected/edited
2. **Supports async workflows** — RM can review proposals outside of the chat session (e.g., from overview tab)
3. **Unlocks automation** — Approved artifacts can trigger downstream workflows (e.g., send email, create task)
4. **Provides visibility** — RMs see pending actions across all customers in one place

**What is an artifact?** A representation of a pending action, not the source of truth. When an artifact is acted upon (accepted/rejected), the system processes that action and updates the actual data (e.g., customer profile).

---

## Goals

1. Persist profile edit proposals with full lifecycle tracking
2. Enable RM review from overview tab (outside chat session)
3. Maintain audit trail of all proposed changes and RM decisions
4. Stub workflow triggers for future automation
5. Design for extensibility — new artifact types can be added without schema changes

---

## Constraints

- **RM-in-the-loop**: No auto-save. All changes require explicit RM approval.
- **Immutability**: Artifacts are not modified after creation, except for status transitions and `edited_value` when RM edits before accepting.
- **Rejected artifacts kept**: For audit purposes, rejected artifacts remain in the database.
- **Sessions not persisted**: Chat sessions are frontend-only (Vercel AI SDK). Session-scoped artifacts (nudges) remain ephemeral.
- **Only attached RM can act**: Artifact actions restricted to the RM assigned to that artifact/customer.

---

## Key Decisions Made

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Nudges persistence** | Ephemeral (not persisted) | Nudges are session-scoped follow-up questions. They don't need audit trails and keeping them ephemeral simplifies the model. |
| **Profile edit granularity** | One field = one artifact | Enables atomic accept/reject/edit per field. Clean immutability. Easy querying. Use `batch_id` for UI grouping. |
| **Edited value storage** | In payload (`edited_value` field) | Simpler than creating a new artifact. Slight bend of immutability but keeps the model clean. |
| **Type/status as text** | Text fields, not enums | Extensibility — new types/statuses don't require migrations. Validation in application code. |
| **Optional FKs** | `onDelete: "set null"` | Artifacts preserved even if customer/RM deleted. Audit trail survives. |

---

## Tradeoffs

### Granular vs Grouped Artifacts

**We chose: Granular (one field = one artifact)**

| Aspect | Granular | Grouped |
|--------|----------|---------|
| Immutability | Clean — edit creates `edited_value` in payload | Complex — need separate approval records |
| Partial approval | Natural — each artifact independent | Complex — compound status tracking |
| Audit trail | Clear per-field history | Must look inside payload |
| Querying | Simple WHERE clauses | JSON path queries |
| DB rows | More rows | Fewer rows |
| UI context | Use `batch_id` for grouping | Natural grouping |

### Edited Value Location

**We chose: In original artifact payload**

| Aspect | In payload | New artifact |
|--------|------------|--------------|
| Simplicity | Simple | Complex |
| Rows | Same row | Additional row |
| Immutability | Slightly bent | Pure |
| Audit | Single record shows original + edit | Chain of records |

---

## Brainstorming Highlights

### Artifact Types Discussed

| Type | Persisted | Scope | Initial Support |
|------|-----------|-------|-----------------|
| Profile Edit | Yes | Customer | ✅ Yes |
| Nudge | No | Session | ❌ Ephemeral |
| Task | Future | Customer | ❌ Stub only |
| PDF/File | Future | Customer | ❌ Stub only |
| Email Draft | Future | Customer | ❌ Stub only |

### Status Lifecycles

**Profile Edit:** `pending` → `accepted` | `rejected` | `edited`
- `edited` = RM modified the value before accepting (terminal state)

**Nudge (ephemeral):** `active` → `answered` | `skipped`

### Workflow Trigger Examples (Future)

- Profile edit accepted → Update CRM
- Email draft approved → Send via email service
- Task created → Sync to task management system
- PDF generated → Notify RM for download

### UI Placement

- **Overview tab**: Chronological list of customer artifacts with type-specific actions
- **Session (chat)**: Right panel shows artifacts (similar to reference image with Progress/Working folder/Context sections)

---

## Overview

Implement a persistent artifact model for profile edit proposals. Artifacts have their own lifecycle, can be accessed from the overview tab, and support future workflow triggers.

**Summary of Key Decisions:**
- Nudges remain ephemeral (not persisted)
- Profile edits are persisted as artifacts
- One field = one artifact (granular), with `batch_id` for UI grouping
- `edited_value` stored in payload when RM edits before accepting

---

## 1. Database Schema

**New file: `db/artifact-schema.ts`**

```typescript
import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  integer,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { nanoid } from "nanoid";
import { customer } from "./customer-schema";
import { user } from "./auth-schema";

export const artifact = pgTable("artifact", {
  // Core
  id: text("id").primaryKey().$defaultFn(() => nanoid()),
  createdAt: timestamp("created_at").defaultNow().notNull(),

  // Relationships (optional)
  customerId: text("customer_id").references(() => customer.id, { onDelete: "set null" }),
  rmId: text("rm_id").references(() => user.id, { onDelete: "set null" }),

  // Grouping
  batchId: text("batch_id").notNull(),

  // Versioning (future)
  version: integer("version").default(1).notNull(),

  // Type & Status (text for extensibility)
  artifactType: text("artifact_type").notNull(),  // "profile_edit"
  status: text("status").notNull(),               // "pending" | "accepted" | "rejected" | "edited"

  // Creator tracking
  createdByType: text("created_by_type").notNull(), // "agent" | "admin" | "system"
  createdById: text("created_by_id"),               // user/agent ID

  // Payload
  payload: jsonb("payload").notNull(),

  // Workflow stub
  workflowTrigger: text("workflow_trigger"),
}, (table) => [
  index("artifact_customer_id_idx").on(table.customerId),
  index("artifact_batch_id_idx").on(table.batchId),
  index("artifact_status_idx").on(table.status),
  index("artifact_customer_status_idx").on(table.customerId, table.status),
]);

export const artifactRelations = relations(artifact, ({ one }) => ({
  customer: one(customer, {
    fields: [artifact.customerId],
    references: [customer.id],
  }),
  rm: one(user, {
    fields: [artifact.rmId],
    references: [user.id],
  }),
}));
```

---

## 2. TypeScript Types

**New file: `lib/crm/artifact-types.ts`**

```typescript
import type { artifact } from "@/db/artifact-schema";

// =============================================================================
// Base Types (inferred from Drizzle schema)
// =============================================================================

export type Artifact = typeof artifact.$inferSelect;
export type NewArtifact = typeof artifact.$inferInsert;

// =============================================================================
// Constants
// =============================================================================

export const ARTIFACT_TYPES = {
  PROFILE_EDIT: "profile_edit",
  // Future types can be added here
} as const;

export type ArtifactType = (typeof ARTIFACT_TYPES)[keyof typeof ARTIFACT_TYPES];

export const CREATOR_TYPES = {
  AGENT: "agent",
  ADMIN: "admin",
  SYSTEM: "system",
} as const;

export type CreatorType = (typeof CREATOR_TYPES)[keyof typeof CREATOR_TYPES];

export const PROFILE_EDIT_STATUSES = {
  PENDING: "pending",
  ACCEPTED: "accepted",
  REJECTED: "rejected",
  EDITED: "edited",  // Accepted with modifications
} as const;

export type ProfileEditStatus =
  (typeof PROFILE_EDIT_STATUSES)[keyof typeof PROFILE_EDIT_STATUSES];

// =============================================================================
// Profile Edit Payload
// =============================================================================

export interface ProfileEditPayload {
  /** The data_key from the customer schema (e.g., "fullName", "incomeBandAnnual") */
  field_key: string;
  /** Human-readable label for the field */
  field_display_name: string;
  /** Value extracted/proposed by the agent */
  proposed_value: unknown;
  /** Value in the profile before this proposal (null if field was empty) */
  previous_value: unknown;
  /** Quote or excerpt from the source text */
  source_text: string;
  /** Confidence level of the extraction */
  confidence?: "high" | "medium" | "low";
  /** Filled if RM edits the proposed value before accepting */
  edited_value?: unknown;
}

export interface ProfileEditArtifact extends Omit<Artifact, "payload"> {
  artifactType: typeof ARTIFACT_TYPES.PROFILE_EDIT;
  status: ProfileEditStatus;
  payload: ProfileEditPayload;
}

// =============================================================================
// Type Guards
// =============================================================================

export function isProfileEditArtifact(
  artifact: Artifact
): artifact is ProfileEditArtifact {
  return artifact.artifactType === ARTIFACT_TYPES.PROFILE_EDIT;
}

// =============================================================================
// Input Types for Repository
// =============================================================================

export interface CreateProfileEditInput {
  customerId?: string;
  rmId?: string;
  batchId: string;
  createdByType: CreatorType;
  createdById?: string;
  payload: ProfileEditPayload;
  workflowTrigger?: string;
}

export interface UpdateArtifactStatusInput {
  id: string;
  status: string;
  editedValue?: unknown;
}

export interface ArtifactListOptions {
  limit?: number;
  offset?: number;
  orderDir?: "asc" | "desc";
}

export interface ArtifactFilters {
  customerId?: string;
  batchId?: string;
  status?: string;
  artifactType?: ArtifactType;
}
```

---

## 3. Repository

**New file: `lib/crm/artifact-repository.ts`**

```typescript
import { eq, desc, asc, and } from "drizzle-orm";
import db from "@/db";
import { artifact } from "@/db/artifact-schema";
import type {
  Artifact,
  NewArtifact,
  CreateProfileEditInput,
  UpdateArtifactStatusInput,
  ArtifactListOptions,
  ArtifactFilters,
  ProfileEditPayload,
} from "./artifact-types";
import {
  ARTIFACT_TYPES,
  PROFILE_EDIT_STATUSES,
  isProfileEditArtifact,
} from "./artifact-types";

export const artifactRepository = {
  // ---------------------------------------------------------------------------
  // Core CRUD
  // ---------------------------------------------------------------------------

  async getById(id: string): Promise<Artifact | null> {
    const [result] = await db
      .select()
      .from(artifact)
      .where(eq(artifact.id, id))
      .limit(1);
    return result ?? null;
  },

  async listByCustomer(
    customerId: string,
    options: ArtifactListOptions = {}
  ): Promise<Artifact[]> {
    const { limit = 50, offset = 0, orderDir = "desc" } = options;
    const orderFn = orderDir === "asc" ? asc : desc;

    return db
      .select()
      .from(artifact)
      .where(eq(artifact.customerId, customerId))
      .orderBy(orderFn(artifact.createdAt))
      .limit(limit)
      .offset(offset);
  },

  async listPendingByCustomer(customerId: string): Promise<Artifact[]> {
    return db
      .select()
      .from(artifact)
      .where(
        and(
          eq(artifact.customerId, customerId),
          eq(artifact.status, PROFILE_EDIT_STATUSES.PENDING)
        )
      )
      .orderBy(desc(artifact.createdAt));
  },

  async listByBatchId(batchId: string): Promise<Artifact[]> {
    return db
      .select()
      .from(artifact)
      .where(eq(artifact.batchId, batchId))
      .orderBy(asc(artifact.createdAt));
  },

  async list(
    filters: ArtifactFilters,
    options: ArtifactListOptions = {}
  ): Promise<Artifact[]> {
    const { limit = 50, offset = 0, orderDir = "desc" } = options;
    const orderFn = orderDir === "asc" ? asc : desc;

    const conditions = [];
    if (filters.customerId) {
      conditions.push(eq(artifact.customerId, filters.customerId));
    }
    if (filters.batchId) {
      conditions.push(eq(artifact.batchId, filters.batchId));
    }
    if (filters.status) {
      conditions.push(eq(artifact.status, filters.status));
    }
    if (filters.artifactType) {
      conditions.push(eq(artifact.artifactType, filters.artifactType));
    }

    const query = db
      .select()
      .from(artifact)
      .orderBy(orderFn(artifact.createdAt))
      .limit(limit)
      .offset(offset);

    if (conditions.length > 0) {
      return query.where(and(...conditions));
    }

    return query;
  },

  // ---------------------------------------------------------------------------
  // Profile Edit Operations
  // ---------------------------------------------------------------------------

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
      workflowTrigger: input.workflowTrigger,
    };

    const [result] = await db.insert(artifact).values(newArtifact).returning();
    return result;
  },

  async createProfileEditBatch(
    inputs: CreateProfileEditInput[]
  ): Promise<Artifact[]> {
    if (inputs.length === 0) return [];

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
      workflowTrigger: input.workflowTrigger,
    }));

    return db.insert(artifact).values(newArtifacts).returning();
  },

  async updateStatus(input: UpdateArtifactStatusInput): Promise<Artifact | null> {
    const existing = await this.getById(input.id);
    if (!existing) return null;

    let updatedPayload = existing.payload;

    if (
      isProfileEditArtifact(existing) &&
      input.status === PROFILE_EDIT_STATUSES.EDITED &&
      input.editedValue !== undefined
    ) {
      const payload = existing.payload as ProfileEditPayload;
      updatedPayload = {
        ...payload,
        edited_value: input.editedValue,
      };
    }

    const [result] = await db
      .update(artifact)
      .set({
        status: input.status,
        payload: updatedPayload,
      })
      .where(eq(artifact.id, input.id))
      .returning();

    return result ?? null;
  },

  async acceptProfileEdit(id: string): Promise<Artifact | null> {
    return this.updateStatus({ id, status: PROFILE_EDIT_STATUSES.ACCEPTED });
  },

  async rejectProfileEdit(id: string): Promise<Artifact | null> {
    return this.updateStatus({ id, status: PROFILE_EDIT_STATUSES.REJECTED });
  },

  async acceptProfileEditWithEdits(
    id: string,
    editedValue: unknown
  ): Promise<Artifact | null> {
    return this.updateStatus({
      id,
      status: PROFILE_EDIT_STATUSES.EDITED,
      editedValue,
    });
  },

  // ---------------------------------------------------------------------------
  // Batch Operations
  // ---------------------------------------------------------------------------

  async acceptBatch(batchId: string): Promise<number> {
    const result = await db
      .update(artifact)
      .set({ status: PROFILE_EDIT_STATUSES.ACCEPTED })
      .where(
        and(
          eq(artifact.batchId, batchId),
          eq(artifact.status, PROFILE_EDIT_STATUSES.PENDING)
        )
      );
    return result.rowCount ?? 0;
  },

  async rejectBatch(batchId: string): Promise<number> {
    const result = await db
      .update(artifact)
      .set({ status: PROFILE_EDIT_STATUSES.REJECTED })
      .where(
        and(
          eq(artifact.batchId, batchId),
          eq(artifact.status, PROFILE_EDIT_STATUSES.PENDING)
        )
      );
    return result.rowCount ?? 0;
  },
};

export type ArtifactRepository = typeof artifactRepository;
```

---

## 4. API Endpoints

### 4.1 List Customer Artifacts

**New file: `app/api/customers/[id]/artifacts/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { artifactRepository } from "@/lib/crm/artifact-repository";
import { crmRepository } from "@/lib/crm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: customerId } = await params;

  // Verify customer exists
  const customer = await crmRepository.getCustomer(customerId);
  if (!customer) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }

  // Parse query params
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") ?? undefined;
  const limit = parseInt(searchParams.get("limit") ?? "50", 10);
  const offset = parseInt(searchParams.get("offset") ?? "0", 10);

  const artifacts = await artifactRepository.list(
    { customerId, status },
    { limit, offset }
  );

  return NextResponse.json({ artifacts });
}
```

### 4.2 Single Artifact Operations

**New file: `app/api/artifacts/[id]/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { artifactRepository } from "@/lib/crm/artifact-repository";
import { PROFILE_EDIT_STATUSES } from "@/lib/crm/artifact-types";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const artifact = await artifactRepository.getById(id);
  if (!artifact) {
    return NextResponse.json({ error: "Artifact not found" }, { status: 404 });
  }

  return NextResponse.json({ artifact });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { status, editedValue } = body;

  // Validate status
  const validStatuses = Object.values(PROFILE_EDIT_STATUSES);
  if (!validStatuses.includes(status)) {
    return NextResponse.json(
      { error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` },
      { status: 400 }
    );
  }

  const artifact = await artifactRepository.updateStatus({
    id,
    status,
    editedValue,
  });

  if (!artifact) {
    return NextResponse.json({ error: "Artifact not found" }, { status: 404 });
  }

  return NextResponse.json({ artifact });
}
```

---

## 5. Integration Points

### 5.1 Profile Agent Integration

**Modify: `lib/crm/profile-agent.ts`**

In the `finalize_proposal` tool, after building `fieldUpdates`, persist artifacts:

```typescript
import { artifactRepository } from "./artifact-repository";
import { CREATOR_TYPES } from "./artifact-types";
import type { CreateProfileEditInput } from "./artifact-types";

// ... existing code in finalize_proposal tool ...

// Create artifact records for each field update
const artifactInputs: CreateProfileEditInput[] = fieldUpdates.map((fu) => ({
  customerId: customer.id,
  rmId: undefined, // Could be passed from session context
  batchId: proposalId,
  createdByType: CREATOR_TYPES.AGENT,
  createdById: "profile-agent",
  payload: {
    field_key: fu.field,
    field_display_name: fu.label,
    proposed_value: fu.proposedValue,
    previous_value: fu.currentValue,
    source_text: fu.source,
    confidence: fu.confidence,
  },
}));

if (artifactInputs.length > 0) {
  await artifactRepository.createProfileEditBatch(artifactInputs);
}
```

### 5.2 Apply Updates Integration

**Modify: `app/api/customers/[id]/apply-updates/route.ts`**

After applying updates to the profile, update artifact statuses:

```typescript
import { artifactRepository } from "@/lib/crm/artifact-repository";
import { isProfileEditArtifact } from "@/lib/crm/artifact-types";

// ... existing code ...

// After applying field updates successfully, update artifact statuses
const batchArtifacts = await artifactRepository.listByBatchId(proposal.proposalId);

for (const fieldUpdate of proposal.fieldUpdates) {
  const matchingArtifact = batchArtifacts.find(
    (a) => isProfileEditArtifact(a) && a.payload.field_key === fieldUpdate.field
  );

  if (!matchingArtifact) continue;

  if (approvedFieldIds.includes(fieldUpdate.id)) {
    const editedValue = editedValues?.[fieldUpdate.id];
    if (editedValue !== undefined) {
      await artifactRepository.acceptProfileEditWithEdits(matchingArtifact.id, editedValue);
    } else {
      await artifactRepository.acceptProfileEdit(matchingArtifact.id);
    }
  } else {
    await artifactRepository.rejectProfileEdit(matchingArtifact.id);
  }
}
```

---

## 6. Export Updates

**Modify: `db/schema.ts`**

```typescript
export * from "./auth-schema";
export * from "./customer-schema";
export * from "./artifact-schema";  // Add this
```

**Modify: `lib/crm/index.ts`**

```typescript
// ... existing exports ...

// Artifact Repository
export { artifactRepository } from "./artifact-repository";
export type { ArtifactRepository } from "./artifact-repository";

// Artifact Types
export type {
  Artifact,
  NewArtifact,
  ArtifactType,
  CreatorType,
  ProfileEditStatus,
  ProfileEditPayload,
  ProfileEditArtifact,
  CreateProfileEditInput,
  UpdateArtifactStatusInput,
  ArtifactListOptions,
  ArtifactFilters,
} from "./artifact-types";

export {
  ARTIFACT_TYPES,
  CREATOR_TYPES,
  PROFILE_EDIT_STATUSES,
  isProfileEditArtifact,
} from "./artifact-types";
```

---

## 7. Files Summary

| File | Action | Purpose |
|------|--------|---------|
| `db/artifact-schema.ts` | Create | Drizzle schema |
| `db/schema.ts` | Modify | Export artifact schema |
| `lib/crm/artifact-types.ts` | Create | Types & constants |
| `lib/crm/artifact-repository.ts` | Create | Repository methods |
| `lib/crm/index.ts` | Modify | Export artifact module |
| `app/api/customers/[id]/artifacts/route.ts` | Create | List artifacts API |
| `app/api/artifacts/[id]/route.ts` | Create | Single artifact API |
| `lib/crm/profile-agent.ts` | Modify | Persist artifacts on proposal |
| `app/api/customers/[id]/apply-updates/route.ts` | Modify | Update artifact status |

---

## 8. Migration

```bash
bun run drizzle-kit generate
bun run drizzle-kit migrate
```

---

## 9. Verification

1. **Create artifacts**: Submit meeting notes via chat → verify artifacts created in DB with status "pending"
2. **List artifacts**: `GET /api/customers/:id/artifacts` → verify returns customer's artifacts
3. **Accept artifact**: `PATCH /api/artifacts/:id` with `{status: "accepted"}` → verify status updated
4. **Edit before accept**: PATCH with `{status: "edited", editedValue: "new"}` → verify `edited_value` in payload
5. **Apply updates flow**: Use existing proposal card UI → verify artifact statuses updated correctly

---

## 10. Out of Scope (Future Work)

- Workflow trigger implementation (interface stubbed with `workflowTrigger` field)
- UI components for overview tab artifact display
- UI components for session right panel
- Additional artifact types (PDF, task, note_proposal, etc.)
- Version history tracking
- Artifact permissions/authorization middleware
