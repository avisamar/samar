import { eq, desc, asc } from "drizzle-orm";
import db from "@/db";
import { customer, customerNote } from "@/db/customer-schema";
import type {
  Customer,
  NewCustomer,
  CustomerNote,
  CustomerWithNotes,
  ListOptions,
  NoteInput,
  CustomerProfileUpdate,
} from "./types";

// =============================================================================
// CRM Repository
// =============================================================================

export const crmRepository = {
  // ---------------------------------------------------------------------------
  // Customer CRUD
  // ---------------------------------------------------------------------------

  /**
   * Create a new customer
   */
  async createCustomer(data: NewCustomer): Promise<Customer> {
    const [result] = await db.insert(customer).values(data).returning();
    return result;
  },

  /**
   * Get a customer by ID
   */
  async getCustomer(id: string): Promise<Customer | null> {
    const [result] = await db
      .select()
      .from(customer)
      .where(eq(customer.id, id))
      .limit(1);
    return result ?? null;
  },

  /**
   * Get a customer with all their notes
   */
  async getCustomerWithNotes(id: string): Promise<CustomerWithNotes | null> {
    const customerResult = await this.getCustomer(id);
    if (!customerResult) return null;

    const notes = await db
      .select()
      .from(customerNote)
      .where(eq(customerNote.customerId, id))
      .orderBy(desc(customerNote.createdAt));

    return {
      ...customerResult,
      notes,
    };
  },

  /**
   * Update a customer
   */
  async updateCustomer(
    id: string,
    data: CustomerProfileUpdate
  ): Promise<Customer | null> {
    const [result] = await db
      .update(customer)
      .set(data)
      .where(eq(customer.id, id))
      .returning();
    return result ?? null;
  },

  /**
   * Delete a customer (cascades to notes)
   */
  async deleteCustomer(id: string): Promise<boolean> {
    const result = await db.delete(customer).where(eq(customer.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  },

  /**
   * List all customers with optional pagination and ordering
   */
  async listCustomers(options: ListOptions = {}): Promise<Customer[]> {
    const { limit = 50, offset = 0, orderBy = "createdAt", orderDir = "desc" } = options;

    const orderColumn = customer[orderBy as keyof typeof customer];
    const orderFn = orderDir === "asc" ? asc : desc;

    return db
      .select()
      .from(customer)
      .orderBy(orderFn(orderColumn as typeof customer.createdAt))
      .limit(limit)
      .offset(offset);
  },

  // ---------------------------------------------------------------------------
  // Notes CRUD
  // ---------------------------------------------------------------------------

  /**
   * Add a note to a customer
   */
  async addNote(customerId: string, data: NoteInput): Promise<CustomerNote> {
    const [result] = await db
      .insert(customerNote)
      .values({
        ...data,
        customerId,
      })
      .returning();
    return result;
  },

  /**
   * Get a note by ID
   */
  async getNote(id: string): Promise<CustomerNote | null> {
    const [result] = await db
      .select()
      .from(customerNote)
      .where(eq(customerNote.id, id))
      .limit(1);
    return result ?? null;
  },

  /**
   * Update a note
   */
  async updateNote(
    id: string,
    data: Partial<NoteInput>
  ): Promise<CustomerNote | null> {
    const [result] = await db
      .update(customerNote)
      .set(data)
      .where(eq(customerNote.id, id))
      .returning();
    return result ?? null;
  },

  /**
   * Delete a note
   */
  async deleteNote(id: string): Promise<boolean> {
    const result = await db.delete(customerNote).where(eq(customerNote.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  },

  /**
   * List all notes for a customer
   */
  async listNotes(customerId: string): Promise<CustomerNote[]> {
    return db
      .select()
      .from(customerNote)
      .where(eq(customerNote.customerId, customerId))
      .orderBy(desc(customerNote.createdAt));
  },

  // ---------------------------------------------------------------------------
  // Profile Enrichment Helpers
  // ---------------------------------------------------------------------------

  /**
   * Update specific profile fields (partial update)
   * Useful for incremental profile enrichment from agent-extracted data
   */
  async updateProfileFields(
    customerId: string,
    fields: Record<string, unknown>
  ): Promise<Customer | null> {
    console.log("[Repository] updateProfileFields called with:", { customerId, fields });

    // Filter out undefined values and reserved fields
    const validFields: Record<string, unknown> = {};
    const reservedFields = ["id", "createdAt", "updatedAt"];

    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined && !reservedFields.includes(key)) {
        validFields[key] = value;
      }
    }

    console.log("[Repository] Valid fields after filtering:", validFields);

    if (Object.keys(validFields).length === 0) {
      console.log("[Repository] No valid fields to update, returning existing customer");
      return this.getCustomer(customerId);
    }

    console.log("[Repository] Executing database update...");
    const [result] = await db
      .update(customer)
      .set(validFields as CustomerProfileUpdate)
      .where(eq(customer.id, customerId))
      .returning();

    console.log("[Repository] Update result:", result ? "success" : "no result");
    return result ?? null;
  },
};

export type CrmRepository = typeof crmRepository;
