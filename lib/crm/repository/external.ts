import type { ICrmRepository, CrmRepositoryConfig } from "./interface";
import { ExternalCrmError } from "./errors";
import type {
  Customer,
  NewCustomer,
  CustomerNote,
  CustomerWithNotes,
  ListOptions,
  NoteInput,
  CustomerProfileUpdate,
} from "../types";
import type { AdditionalDataItem } from "../extraction-types";

/**
 * External CRM Repository implementation.
 * Skeleton for integrating with external CRM APIs (Salesforce, HubSpot, etc.)
 *
 * Key considerations for external CRM integration:
 * 1. Field mapping: External CRMs have different schemas. Need a mapping layer.
 * 2. Additional data: External CRMs may not support JSONB. Consider:
 *    - Custom fields
 *    - Storing as notes with special tags
 *    - Separate custom object
 * 3. Notes: May map to "Activities", "Tasks", or "Notes" depending on CRM
 * 4. Rate limiting: Must handle API rate limits gracefully
 * 5. Caching: Consider caching frequently accessed data
 */
export class ExternalCrmRepository implements ICrmRepository {
  private config: NonNullable<CrmRepositoryConfig["external"]>;
  private fieldMapping: Map<string, string> = new Map();

  constructor(config: CrmRepositoryConfig["external"]) {
    if (!config) {
      throw new Error("External CRM configuration is required");
    }
    this.config = config;
    this.initializeFieldMapping();
  }

  /**
   * Initialize field mapping between internal schema and external CRM fields.
   * Override this for specific CRM implementations.
   */
  protected initializeFieldMapping(): void {
    // Default mapping - override in subclass for specific CRM
    // Internal field -> External field
    this.fieldMapping.set("fullName", "Name");
    this.fieldMapping.set("emailPrimary", "Email");
    this.fieldMapping.set("primaryMobile", "Phone");
    this.fieldMapping.set("cityOfResidence", "City");
    this.fieldMapping.set("countryOfResidence", "Country");
    // Add more mappings as needed for your CRM
  }

  /**
   * Map internal field names to external CRM field names
   */
  protected mapFieldToExternal(field: string): string {
    return this.fieldMapping.get(field) || field;
  }

  /**
   * Map external CRM field names to internal field names
   */
  protected mapFieldToInternal(field: string): string {
    for (const [internal, external] of this.fieldMapping.entries()) {
      if (external === field) return internal;
    }
    return field;
  }

  /**
   * Make an authenticated request to the external CRM API
   */
  protected async makeRequest<T>(
    method: "GET" | "POST" | "PATCH" | "DELETE",
    endpoint: string,
    body?: unknown
  ): Promise<T> {
    const url = `${this.config.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    // Add authentication
    if (this.config.apiKey) {
      headers["Authorization"] = `Bearer ${this.config.apiKey}`;
    }

    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      throw new ExternalCrmError(
        `External CRM API error: ${response.statusText}`,
        response.status
      );
    }

    return response.json() as Promise<T>;
  }

  // ---------------------------------------------------------------------------
  // Customer CRUD - Skeleton implementations
  // ---------------------------------------------------------------------------

  async createCustomer(_data: NewCustomer): Promise<Customer> {
    // TODO: Map internal fields to external CRM fields
    // TODO: Call external API to create contact/account
    // TODO: Map response back to internal Customer type
    throw new ExternalCrmError("createCustomer not implemented for external CRM");
  }

  async getCustomer(_id: string): Promise<Customer | null> {
    // TODO: Fetch from external CRM by ID
    // TODO: Map response to internal Customer type
    throw new ExternalCrmError("getCustomer not implemented for external CRM");
  }

  async getCustomerWithNotes(_id: string): Promise<CustomerWithNotes | null> {
    // TODO: Fetch customer and related activities/notes from external CRM
    throw new ExternalCrmError(
      "getCustomerWithNotes not implemented for external CRM"
    );
  }

  async updateCustomer(
    _id: string,
    _data: CustomerProfileUpdate
  ): Promise<Customer | null> {
    // TODO: Map fields and update in external CRM
    throw new ExternalCrmError("updateCustomer not implemented for external CRM");
  }

  async deleteCustomer(_id: string): Promise<boolean> {
    // TODO: Delete from external CRM (or mark as inactive)
    throw new ExternalCrmError("deleteCustomer not implemented for external CRM");
  }

  async listCustomers(_options?: ListOptions): Promise<Customer[]> {
    // TODO: Query external CRM with pagination
    throw new ExternalCrmError("listCustomers not implemented for external CRM");
  }

  // ---------------------------------------------------------------------------
  // Notes CRUD - Skeleton implementations
  // ---------------------------------------------------------------------------

  async addNote(_customerId: string, _data: NoteInput): Promise<CustomerNote> {
    // TODO: Create as Activity/Task/Note in external CRM
    throw new ExternalCrmError("addNote not implemented for external CRM");
  }

  async getNote(_id: string): Promise<CustomerNote | null> {
    // TODO: Fetch activity/note from external CRM
    throw new ExternalCrmError("getNote not implemented for external CRM");
  }

  async updateNote(
    _id: string,
    _data: Partial<NoteInput>
  ): Promise<CustomerNote | null> {
    // TODO: Update activity/note in external CRM
    throw new ExternalCrmError("updateNote not implemented for external CRM");
  }

  async deleteNote(_id: string): Promise<boolean> {
    // TODO: Delete activity/note from external CRM
    throw new ExternalCrmError("deleteNote not implemented for external CRM");
  }

  async listNotes(_customerId: string): Promise<CustomerNote[]> {
    // TODO: List activities/notes for customer from external CRM
    throw new ExternalCrmError("listNotes not implemented for external CRM");
  }

  // ---------------------------------------------------------------------------
  // Profile Enrichment Helpers
  // ---------------------------------------------------------------------------

  async updateProfileFields(
    _customerId: string,
    _fields: Record<string, unknown>
  ): Promise<Customer | null> {
    // TODO: Map fields to external CRM custom fields
    // For external CRMs, this may need to:
    // 1. Map known fields to standard CRM fields
    // 2. Store unknown fields in custom fields or notes
    throw new ExternalCrmError(
      "updateProfileFields not implemented for external CRM"
    );
  }

  async appendAdditionalData(
    _customerId: string,
    _newData: AdditionalDataItem[]
  ): Promise<Customer | null> {
    // For external CRMs without JSONB support, consider:
    // 1. Using custom fields for key-value pairs
    // 2. Creating a linked "custom data" object
    // 3. Storing as structured notes with special tags
    // 4. Using CRM-specific extension mechanisms
    throw new ExternalCrmError(
      "appendAdditionalData not implemented for external CRM"
    );
  }
}
