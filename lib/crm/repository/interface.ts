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
 * ICrmRepository defines the contract for CRM data operations.
 * Implementations can target a database or external CRM API.
 */
export interface ICrmRepository {
  // ---------------------------------------------------------------------------
  // Customer CRUD
  // ---------------------------------------------------------------------------

  /**
   * Create a new customer
   */
  createCustomer(data: NewCustomer): Promise<Customer>;

  /**
   * Get a customer by ID
   * @returns Customer or null if not found
   */
  getCustomer(id: string): Promise<Customer | null>;

  /**
   * Get a customer with all their notes
   * @returns CustomerWithNotes or null if not found
   */
  getCustomerWithNotes(id: string): Promise<CustomerWithNotes | null>;

  /**
   * Update a customer's profile
   * @returns Updated customer or null if not found
   */
  updateCustomer(
    id: string,
    data: CustomerProfileUpdate
  ): Promise<Customer | null>;

  /**
   * Delete a customer (and associated notes)
   * @returns true if deleted, false if not found
   */
  deleteCustomer(id: string): Promise<boolean>;

  /**
   * List all customers with optional pagination and ordering
   */
  listCustomers(options?: ListOptions): Promise<Customer[]>;

  // ---------------------------------------------------------------------------
  // Notes CRUD
  // ---------------------------------------------------------------------------

  /**
   * Add a note to a customer
   */
  addNote(customerId: string, data: NoteInput): Promise<CustomerNote>;

  /**
   * Get a note by ID
   */
  getNote(id: string): Promise<CustomerNote | null>;

  /**
   * Update a note
   */
  updateNote(
    id: string,
    data: Partial<NoteInput>
  ): Promise<CustomerNote | null>;

  /**
   * Delete a note
   */
  deleteNote(id: string): Promise<boolean>;

  /**
   * List all notes for a customer
   */
  listNotes(customerId: string): Promise<CustomerNote[]>;

  // ---------------------------------------------------------------------------
  // Profile Enrichment Helpers
  // ---------------------------------------------------------------------------

  /**
   * Update specific profile fields (partial update)
   * Useful for incremental profile enrichment from agent-extracted data
   */
  updateProfileFields(
    customerId: string,
    fields: Record<string, unknown>
  ): Promise<Customer | null>;

  /**
   * Append additional data items to a customer's additionalData field.
   * For external CRMs that don't support JSONB, implementations should
   * map this to an appropriate structure (custom fields, notes, etc.)
   */
  appendAdditionalData(
    customerId: string,
    newData: AdditionalDataItem[]
  ): Promise<Customer | null>;
}

/**
 * Configuration for repository implementation selection
 */
export interface CrmRepositoryConfig {
  /**
   * Which implementation to use
   */
  provider: "drizzle" | "twenty" | "external";

  /**
   * External CRM configuration (required when provider is "twenty" or "external")
   */
  external?: {
    /**
     * External CRM type: "twenty" | "salesforce" | "hubspot" | "custom"
     */
    type: string;
    /**
     * Base URL for the external CRM API
     */
    baseUrl: string;
    /**
     * API key or auth token
     */
    apiKey?: string;
  };
}
