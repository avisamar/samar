import { eq, desc, asc } from "drizzle-orm";
import db from "@/db";
import { customer, customerNote } from "@/db/customer-schema";
import type { ICrmRepository } from "./interface";
import type {
  Customer,
  NewCustomer,
  CustomerNote as CustomerNoteType,
  CustomerWithNotes,
  ListOptions,
  NoteInput,
  CustomerProfileUpdate,
} from "../types";
import type { AdditionalDataItem } from "../extraction-types";

/**
 * Drizzle ORM implementation of ICrmRepository.
 * Uses PostgreSQL via Neon serverless.
 */
export class DrizzleCrmRepository implements ICrmRepository {
  // ---------------------------------------------------------------------------
  // Customer CRUD
  // ---------------------------------------------------------------------------

  async createCustomer(data: NewCustomer): Promise<Customer> {
    const [result] = await db.insert(customer).values(data).returning();
    return result;
  }

  async getCustomer(id: string): Promise<Customer | null> {
    const [result] = await db
      .select()
      .from(customer)
      .where(eq(customer.id, id))
      .limit(1);
    return result ?? null;
  }

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
  }

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
  }

  async deleteCustomer(id: string): Promise<boolean> {
    const result = await db.delete(customer).where(eq(customer.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async listCustomers(options: ListOptions = {}): Promise<Customer[]> {
    const {
      limit = 50,
      offset = 0,
      orderBy = "createdAt",
      orderDir = "desc",
    } = options;

    const orderColumn = customer[orderBy as keyof typeof customer];
    const orderFn = orderDir === "asc" ? asc : desc;

    return db
      .select()
      .from(customer)
      .orderBy(orderFn(orderColumn as typeof customer.createdAt))
      .limit(limit)
      .offset(offset);
  }

  // ---------------------------------------------------------------------------
  // Notes CRUD
  // ---------------------------------------------------------------------------

  async addNote(customerId: string, data: NoteInput): Promise<CustomerNoteType> {
    const [result] = await db
      .insert(customerNote)
      .values({
        ...data,
        customerId,
      })
      .returning();
    return result;
  }

  async getNote(id: string): Promise<CustomerNoteType | null> {
    const [result] = await db
      .select()
      .from(customerNote)
      .where(eq(customerNote.id, id))
      .limit(1);
    return result ?? null;
  }

  async updateNote(
    id: string,
    data: Partial<NoteInput>
  ): Promise<CustomerNoteType | null> {
    const [result] = await db
      .update(customerNote)
      .set(data)
      .where(eq(customerNote.id, id))
      .returning();
    return result ?? null;
  }

  async deleteNote(id: string): Promise<boolean> {
    const result = await db
      .delete(customerNote)
      .where(eq(customerNote.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async listNotes(customerId: string): Promise<CustomerNoteType[]> {
    return db
      .select()
      .from(customerNote)
      .where(eq(customerNote.customerId, customerId))
      .orderBy(desc(customerNote.createdAt));
  }

  // ---------------------------------------------------------------------------
  // Profile Enrichment Helpers
  // ---------------------------------------------------------------------------

  async updateProfileFields(
    customerId: string,
    fields: Record<string, unknown>
  ): Promise<Customer | null> {
    console.log("[DrizzleCrmRepository] updateProfileFields called with:", {
      customerId,
      fields,
    });

    // Filter out undefined values and reserved fields
    const validFields: Record<string, unknown> = {};
    const reservedFields = ["id", "createdAt", "updatedAt"];

    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined && !reservedFields.includes(key)) {
        validFields[key] = value;
      }
    }

    console.log(
      "[DrizzleCrmRepository] Valid fields after filtering:",
      validFields
    );

    if (Object.keys(validFields).length === 0) {
      console.log(
        "[DrizzleCrmRepository] No valid fields to update, returning existing customer"
      );
      return this.getCustomer(customerId);
    }

    console.log("[DrizzleCrmRepository] Executing database update...");
    const [result] = await db
      .update(customer)
      .set(validFields as CustomerProfileUpdate)
      .where(eq(customer.id, customerId))
      .returning();

    console.log(
      "[DrizzleCrmRepository] Update result:",
      result ? "success" : "no result"
    );
    return result ?? null;
  }

  async appendAdditionalData(
    customerId: string,
    newData: AdditionalDataItem[]
  ): Promise<Customer | null> {
    console.log("[DrizzleCrmRepository] appendAdditionalData called with:", {
      customerId,
      newDataCount: newData.length,
    });

    if (newData.length === 0) {
      console.log("[DrizzleCrmRepository] No additional data to append");
      return this.getCustomer(customerId);
    }

    // Get existing customer
    const existingCustomer = await this.getCustomer(customerId);
    if (!existingCustomer) {
      console.log("[DrizzleCrmRepository] Customer not found");
      return null;
    }

    // Get existing additional data (or empty array)
    const existingData: AdditionalDataItem[] =
      (existingCustomer.additionalData as AdditionalDataItem[]) || [];

    console.log(
      "[DrizzleCrmRepository] Existing additional data count:",
      existingData.length
    );

    // Merge: update existing keys, append new ones
    const dataMap = new Map(existingData.map((d) => [d.key, d]));
    for (const item of newData) {
      dataMap.set(item.key, item); // Overwrites if key exists
    }

    const mergedData = Array.from(dataMap.values());
    console.log(
      "[DrizzleCrmRepository] Merged additional data count:",
      mergedData.length
    );

    // Update the customer
    const [result] = await db
      .update(customer)
      .set({ additionalData: mergedData })
      .where(eq(customer.id, customerId))
      .returning();

    console.log(
      "[DrizzleCrmRepository] Additional data update result:",
      result ? "success" : "no result"
    );
    return result ?? null;
  }
}
