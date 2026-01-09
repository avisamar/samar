import type { customer, customerNote } from "@/db/customer-schema";

// Inferred types from Drizzle schema
export type Customer = typeof customer.$inferSelect;
export type NewCustomer = typeof customer.$inferInsert;
export type CustomerNote = typeof customerNote.$inferSelect;
export type NewCustomerNote = typeof customerNote.$inferInsert;

// Customer with related notes
export interface CustomerWithNotes extends Customer {
  notes: CustomerNote[];
}

// List query options
export interface ListOptions {
  limit?: number;
  offset?: number;
  orderBy?: keyof Customer;
  orderDir?: "asc" | "desc";
}

// Note creation input (without customerId, which is passed separately)
export type NoteInput = Omit<NewCustomerNote, "customerId" | "id" | "createdAt">;

// Partial update for profile fields
export type CustomerProfileUpdate = Partial<
  Omit<Customer, "id" | "createdAt" | "updatedAt">
>;
