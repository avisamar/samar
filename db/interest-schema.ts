import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { nanoid } from "nanoid";
import { customer } from "./customer-schema";
import { user } from "./auth-schema";
import { artifact } from "./artifact-schema";

// =============================================================================
// CUSTOMER INTEREST TABLE
// =============================================================================

/**
 * Stores confirmed customer interests (personal and financial).
 * Interests can be created from agent suggestions or manually by RMs.
 */
export const customerInterest = pgTable(
  "customer_interest",
  {
    // Core
    id: text("id")
      .primaryKey()
      .$defaultFn(() => nanoid()),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),

    // Relationships
    customerId: text("customer_id")
      .notNull()
      .references(() => customer.id, { onDelete: "cascade" }),
    createdByRmId: text("created_by_rm_id").references(() => user.id, {
      onDelete: "set null",
    }),

    // Interest data
    category: text("category").notNull(), // "personal" | "financial"
    label: text("label").notNull(), // Short name (e.g., "Golf", "Retirement Planning")
    description: text("description"), // Longer description or notes

    // Source tracking
    sourceType: text("source_type").notNull(), // "system_suggested" | "manual"
    sourceArtifactId: text("source_artifact_id").references(() => artifact.id, {
      onDelete: "set null",
    }),
    sourceText: text("source_text"), // Original text that led to extraction
    confidence: text("confidence"), // "high" | "medium" | "low" (for system_suggested)

    // Status
    status: text("status").notNull().default("active"), // "active" | "archived"
  },
  (table) => [
    index("customer_interest_customer_id_idx").on(table.customerId),
    index("customer_interest_category_idx").on(table.category),
    index("customer_interest_status_idx").on(table.status),
    index("customer_interest_customer_status_idx").on(
      table.customerId,
      table.status
    ),
  ]
);

// =============================================================================
// CUSTOMER INTEREST AUDIT TABLE
// =============================================================================

/**
 * Audit trail for all interest changes.
 * Records creation, confirmation, edits, and archival.
 */
export const customerInterestAudit = pgTable(
  "customer_interest_audit",
  {
    // Core
    id: text("id")
      .primaryKey()
      .$defaultFn(() => nanoid()),
    createdAt: timestamp("created_at").defaultNow().notNull(),

    // Reference to the interest
    interestId: text("interest_id")
      .notNull()
      .references(() => customerInterest.id, { onDelete: "cascade" }),

    // Action details
    action: text("action").notNull(), // "created" | "confirmed" | "edited" | "archived"
    actorId: text("actor_id"), // User ID who performed the action
    actorType: text("actor_type").notNull(), // "rm" | "system" | "admin"

    // State snapshots (for change tracking)
    previousState: jsonb("previous_state"), // State before the change
    newState: jsonb("new_state"), // State after the change
  },
  (table) => [
    index("customer_interest_audit_interest_id_idx").on(table.interestId),
    index("customer_interest_audit_action_idx").on(table.action),
  ]
);

// =============================================================================
// RELATIONS
// =============================================================================

export const customerInterestRelations = relations(
  customerInterest,
  ({ one, many }) => ({
    customer: one(customer, {
      fields: [customerInterest.customerId],
      references: [customer.id],
    }),
    createdBy: one(user, {
      fields: [customerInterest.createdByRmId],
      references: [user.id],
    }),
    sourceArtifact: one(artifact, {
      fields: [customerInterest.sourceArtifactId],
      references: [artifact.id],
    }),
    auditRecords: many(customerInterestAudit),
  })
);

export const customerInterestAuditRelations = relations(
  customerInterestAudit,
  ({ one }) => ({
    interest: one(customerInterest, {
      fields: [customerInterestAudit.interestId],
      references: [customerInterest.id],
    }),
    actor: one(user, {
      fields: [customerInterestAudit.actorId],
      references: [user.id],
    }),
  })
);

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type CustomerInterest = typeof customerInterest.$inferSelect;
export type NewCustomerInterest = typeof customerInterest.$inferInsert;
export type CustomerInterestAudit = typeof customerInterestAudit.$inferSelect;
export type NewCustomerInterestAudit = typeof customerInterestAudit.$inferInsert;
