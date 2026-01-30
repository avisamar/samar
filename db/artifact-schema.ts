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

// =============================================================================
// ARTIFACT TABLE
// =============================================================================

export const artifact = pgTable(
  "artifact",
  {
    // Core
    id: text("id")
      .primaryKey()
      .$defaultFn(() => nanoid()),
    createdAt: timestamp("created_at").defaultNow().notNull(),

    // Relationships (optional - allows orphaned artifacts)
    customerId: text("customer_id").references(() => customer.id, {
      onDelete: "set null",
    }),
    rmId: text("rm_id").references(() => user.id, { onDelete: "set null" }),

    // Grouping
    batchId: text("batch_id").notNull(),

    // Versioning (future)
    version: integer("version").default(1).notNull(),

    // Type & Status (text for extensibility)
    artifactType: text("artifact_type").notNull(), // "profile_edit"
    status: text("status").notNull(), // "pending" | "accepted" | "rejected" | "edited"

    // Creator tracking
    createdByType: text("created_by_type").notNull(), // "agent" | "admin" | "system"
    createdById: text("created_by_id"), // user/agent ID

    // Payload
    payload: jsonb("payload").notNull(),

    // Workflow stub (future)
    workflowTrigger: text("workflow_trigger"),
  },
  (table) => [
    index("artifact_customer_id_idx").on(table.customerId),
    index("artifact_batch_id_idx").on(table.batchId),
    index("artifact_status_idx").on(table.status),
    index("artifact_customer_status_idx").on(table.customerId, table.status),
  ]
);

// Type exports
export type Artifact = typeof artifact.$inferSelect;
export type NewArtifact = typeof artifact.$inferInsert;
