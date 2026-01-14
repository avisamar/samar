/**
 * Twenty CRM Repository Implementation.
 *
 * Implements ICrmRepository using Twenty's REST API.
 * Maps our flat Customer schema to Twenty's multi-object model (Person + WealthProfile + RiskProfile).
 */

import type { ICrmRepository, CrmRepositoryConfig } from "./interface";
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
import type {
  TwentyPerson,
  TwentyWealthProfile,
  TwentyRiskProfile,
  TwentyNote,
  TwentyNoteTarget,
} from "./twenty-types";
import {
  toCustomer,
  toCustomerNote,
  splitCustomerUpdate,
  toTwentyPersonPayload,
  toTwentyWealthProfilePayload,
  toTwentyRiskProfilePayload,
  toTwentyNotePayload,
} from "./twenty-mapper";
import { ExternalCrmError } from "./errors";

// ---------------------------------------------------------------------------
// Twenty CRM Repository
// ---------------------------------------------------------------------------

export class TwentyCrmRepository implements ICrmRepository {
  private baseUrl: string;
  private apiKey: string | undefined;

  constructor(config: NonNullable<CrmRepositoryConfig["external"]>) {
    if (!config.baseUrl) {
      throw new Error("Twenty CRM baseUrl is required");
    }

    this.baseUrl = config.baseUrl.endsWith("/")
      ? config.baseUrl
      : `${config.baseUrl}/`;
    this.apiKey = config.apiKey;
  }

  // ---------------------------------------------------------------------------
  // HTTP Client Methods
  // ---------------------------------------------------------------------------

  private async request<T>(
    method: "GET" | "POST" | "PATCH" | "DELETE",
    endpoint: string,
    body?: unknown,
    params?: Record<string, string | number>
  ): Promise<T> {
    let url = `${this.baseUrl}${endpoint}`;

    // Add query params
    if (params && Object.keys(params).length > 0) {
      const searchParams = new URLSearchParams();
      for (const [key, value] of Object.entries(params)) {
        searchParams.append(key, String(value));
      }
      url += `?${searchParams.toString()}`;
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (this.apiKey) {
      headers["Authorization"] = `Bearer ${this.apiKey}`;
    }

    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const status = response.status;
      let message = response.statusText;

      try {
        const errorData = await response.json();
        message = (errorData as { message?: string })?.message || message;
      } catch {
        // Ignore JSON parse errors
      }

      console.error(`[TwentyCrmRepository] API Error ${status}: ${message}`);

      if (status === 401) {
        throw new ExternalCrmError("Unauthorized - check API token", 401);
      }
      if (status === 403) {
        throw new ExternalCrmError("Forbidden - access denied", 403);
      }
      if (status === 404) {
        throw new ExternalCrmError("Not found", 404);
      }
      if (status === 429) {
        throw new ExternalCrmError("Rate limit exceeded", 429);
      }

      throw new ExternalCrmError(`API error: ${message}`, status);
    }

    return response.json() as Promise<T>;
  }

  private async get<T>(
    endpoint: string,
    params?: Record<string, string | number>
  ): Promise<T> {
    return this.request<T>("GET", endpoint, undefined, params);
  }

  private async post<T>(
    endpoint: string,
    body: unknown,
    params?: Record<string, string | number>
  ): Promise<T> {
    return this.request<T>("POST", endpoint, body, params);
  }

  private async patch<T>(
    endpoint: string,
    body: unknown,
    params?: Record<string, string | number>
  ): Promise<T> {
    return this.request<T>("PATCH", endpoint, body, params);
  }

  private async delete<T>(
    endpoint: string,
    params?: Record<string, string | number>
  ): Promise<T> {
    return this.request<T>("DELETE", endpoint, undefined, params);
  }

  // ---------------------------------------------------------------------------
  // Customer CRUD
  // ---------------------------------------------------------------------------

  async createCustomer(data: NewCustomer): Promise<Customer> {
    console.log("[TwentyCrmRepository] createCustomer called");

    // 1. Create Person
    const personPayload = toTwentyPersonPayload(data);
    const personResponse = await this.post<{ data: TwentyPerson }>(
      "people",
      personPayload
    );
    const person = this.extractSingleFromResponse<TwentyPerson>(
      personResponse,
      "person"
    );

    if (!person?.id) {
      throw new ExternalCrmError("Failed to create person - no ID returned");
    }

    console.log(`[TwentyCrmRepository] Person created: ${person.id}`);

    // 2. Create WealthProfile and RiskProfile in parallel (if data provided)
    const wealthPayload = toTwentyWealthProfilePayload(data, person.id);
    const riskPayload = toTwentyRiskProfilePayload(data, person.id);

    const [wealthProfile, riskProfile] = await Promise.all([
      wealthPayload
        ? this.createWealthProfile(wealthPayload).catch((e) => {
            console.error(
              "[TwentyCrmRepository] Failed to create WealthProfile:",
              e
            );
            return null;
          })
        : Promise.resolve(null),
      riskPayload
        ? this.createRiskProfile(riskPayload).catch((e) => {
            console.error(
              "[TwentyCrmRepository] Failed to create RiskProfile:",
              e
            );
            return null;
          })
        : Promise.resolve(null),
    ]);

    return toCustomer(person, wealthProfile, riskProfile);
  }

  async getCustomer(id: string): Promise<Customer | null> {
    console.log(`[TwentyCrmRepository] getCustomer: ${id}`);

    try {
      // Fetch person
      const personResponse = await this.get<{ data: TwentyPerson }>(
        `people/${id}`
      );
      const person = this.extractSingleFromResponse<TwentyPerson>(
        personResponse,
        "person"
      );

      if (!person) {
        return null;
      }

      // Fetch WealthProfile and RiskProfile in parallel
      const [wealthProfile, riskProfile] = await Promise.all([
        this.getWealthProfileByPersonId(id).catch(() => null),
        this.getRiskProfileByPersonId(id).catch(() => null),
      ]);

      return toCustomer(person, wealthProfile, riskProfile);
    } catch (error) {
      if (this.isNotFoundError(error)) {
        return null;
      }
      throw error;
    }
  }

  async getCustomerWithNotes(id: string): Promise<CustomerWithNotes | null> {
    console.log(`[TwentyCrmRepository] getCustomerWithNotes: ${id}`);

    // Fetch customer and notes in parallel
    const [customer, notes] = await Promise.all([
      this.getCustomer(id),
      this.listNotes(id).catch(() => []),
    ]);

    if (!customer) {
      return null;
    }

    return { ...customer, notes };
  }

  async updateCustomer(
    id: string,
    data: CustomerProfileUpdate
  ): Promise<Customer | null> {
    console.log(`[TwentyCrmRepository] updateCustomer: ${id}`);

    // Check if person exists
    const existingCustomer = await this.getCustomer(id);
    if (!existingCustomer) {
      return null;
    }

    // Split updates into person/wealth/risk fields
    const { personFields, wealthFields, riskFields } =
      splitCustomerUpdate(data);

    // Update all objects in parallel
    const updates: Promise<void>[] = [];

    if (Object.keys(personFields).length > 0) {
      updates.push(
        this.patch(`people/${id}`, personFields).then(() => undefined)
      );
    }

    if (Object.keys(wealthFields).length > 0) {
      updates.push(this.updateOrCreateWealthProfile(id, wealthFields));
    }

    if (Object.keys(riskFields).length > 0) {
      updates.push(this.updateOrCreateRiskProfile(id, riskFields));
    }

    await Promise.all(updates);

    // Return updated customer
    return this.getCustomer(id);
  }

  async deleteCustomer(id: string): Promise<boolean> {
    console.log(`[TwentyCrmRepository] deleteCustomer: ${id}`);

    try {
      await this.delete(`people/${id}`);
      return true;
    } catch (error) {
      if (this.isNotFoundError(error)) {
        return false;
      }
      throw error;
    }
  }

  async listCustomers(options: ListOptions = {}): Promise<Customer[]> {
    const { limit = 50 } = options;
    console.log(`[TwentyCrmRepository] listCustomers: limit=${limit}`);

    const response = await this.get<{ data: { people: TwentyPerson[] } }>(
      "people",
      { limit }
    );

    const people = this.extractListFromResponse<TwentyPerson>(
      response,
      "people"
    );

    // For list operations, we don't fetch wealth/risk profiles to avoid N+1
    // The caller can use getCustomer() for full profile if needed
    return people.map((person) => toCustomer(person, null, null));
  }

  // ---------------------------------------------------------------------------
  // Notes CRUD
  // ---------------------------------------------------------------------------

  async addNote(customerId: string, data: NoteInput): Promise<CustomerNote> {
    console.log(`[TwentyCrmRepository] addNote for customer: ${customerId}`);

    // 1. Create note
    const notePayload = toTwentyNotePayload(data.content);
    const noteResponse = await this.post<{ data: TwentyNote }>(
      "notes",
      notePayload,
      { depth: 0 }
    );
    const note = this.extractSingleFromResponse<TwentyNote>(
      noteResponse,
      "note"
    );

    if (!note?.id) {
      throw new ExternalCrmError("Failed to create note - no ID returned");
    }

    // 2. Create noteTarget to link note to person
    await this.post(
      "noteTargets",
      {
        noteId: note.id,
        personId: customerId,
      },
      { depth: 0 }
    );

    console.log(`[TwentyCrmRepository] Note created and linked: ${note.id}`);

    return toCustomerNote(note, customerId);
  }

  async getNote(id: string): Promise<CustomerNote | null> {
    console.log(`[TwentyCrmRepository] getNote: ${id}`);

    try {
      const response = await this.get<{ data: TwentyNote }>(`notes/${id}`);
      const note = this.extractSingleFromResponse<TwentyNote>(response, "note");

      if (!note) {
        return null;
      }

      // Find the linked person via noteTargets
      const targetsResponse = await this.get<{
        data: { noteTargets: TwentyNoteTarget[] };
      }>("noteTargets", {
        filter: `noteId[eq]:"${id}"`,
        limit: 1,
      });
      const targets = this.extractListFromResponse<TwentyNoteTarget>(
        targetsResponse,
        "noteTargets"
      );
      const customerId = targets[0]?.personId ?? "";

      return toCustomerNote(note, customerId);
    } catch (error) {
      if (this.isNotFoundError(error)) {
        return null;
      }
      throw error;
    }
  }

  async updateNote(
    id: string,
    data: Partial<NoteInput>
  ): Promise<CustomerNote | null> {
    console.log(`[TwentyCrmRepository] updateNote: ${id}`);

    try {
      const payload: Record<string, unknown> = {};

      if (data.content !== undefined) {
        payload.bodyV2 = { markdown: data.content };
      }

      const response = await this.patch<{ data: TwentyNote }>(
        `notes/${id}`,
        payload
      );
      const note = this.extractSingleFromResponse<TwentyNote>(response, "note");

      if (!note) {
        return null;
      }

      // Find the linked person
      const targetsResponse = await this.get<{
        data: { noteTargets: TwentyNoteTarget[] };
      }>("noteTargets", {
        filter: `noteId[eq]:"${id}"`,
        limit: 1,
      });
      const targets = this.extractListFromResponse<TwentyNoteTarget>(
        targetsResponse,
        "noteTargets"
      );
      const customerId = targets[0]?.personId ?? "";

      return toCustomerNote(note, customerId);
    } catch (error) {
      if (this.isNotFoundError(error)) {
        return null;
      }
      throw error;
    }
  }

  async deleteNote(id: string): Promise<boolean> {
    console.log(`[TwentyCrmRepository] deleteNote: ${id}`);

    try {
      // First delete noteTargets
      const targetsResponse = await this.get<{
        data: { noteTargets: TwentyNoteTarget[] };
      }>("noteTargets", {
        filter: `noteId[eq]:"${id}"`,
      });
      const targets = this.extractListFromResponse<TwentyNoteTarget>(
        targetsResponse,
        "noteTargets"
      );

      // Delete all targets
      await Promise.all(
        targets.map((target) =>
          this.delete(`noteTargets/${target.id}`).catch(() => {})
        )
      );

      // Delete the note
      await this.delete(`notes/${id}`);
      return true;
    } catch (error) {
      if (this.isNotFoundError(error)) {
        return false;
      }
      throw error;
    }
  }

  async listNotes(customerId: string): Promise<CustomerNote[]> {
    console.log(`[TwentyCrmRepository] listNotes for customer: ${customerId}`);

    // Find noteTargets for this person
    const targetsResponse = await this.get<{
      data: { noteTargets: TwentyNoteTarget[] };
    }>("noteTargets", {
      filter: `personId[eq]:"${customerId}"`,
      limit: 100,
    });
    const targets = this.extractListFromResponse<TwentyNoteTarget>(
      targetsResponse,
      "noteTargets"
    );

    if (targets.length === 0) {
      return [];
    }

    // Fetch all notes in parallel
    const notes = await Promise.all(
      targets.map(async (target) => {
        try {
          const response = await this.get<{ data: TwentyNote }>(
            `notes/${target.noteId}`
          );
          const note = this.extractSingleFromResponse<TwentyNote>(
            response,
            "note"
          );
          return note ? toCustomerNote(note, customerId) : null;
        } catch {
          return null;
        }
      })
    );

    return notes.filter((n): n is CustomerNote => n !== null);
  }

  // ---------------------------------------------------------------------------
  // Profile Enrichment Helpers
  // ---------------------------------------------------------------------------

  async updateProfileFields(
    customerId: string,
    fields: Record<string, unknown>
  ): Promise<Customer | null> {
    console.log(`[TwentyCrmRepository] updateProfileFields: ${customerId}`);
    return this.updateCustomer(customerId, fields as CustomerProfileUpdate);
  }

  async appendAdditionalData(
    customerId: string,
    _newData: AdditionalDataItem[]
  ): Promise<Customer | null> {
    // Per design decision: skip additionalData sync
    console.log(
      "[TwentyCrmRepository] appendAdditionalData: skipped (not synced to Twenty)"
    );
    return this.getCustomer(customerId);
  }

  // ---------------------------------------------------------------------------
  // Private Helpers: WealthProfile
  // ---------------------------------------------------------------------------

  private async createWealthProfile(
    payload: Record<string, unknown>
  ): Promise<TwentyWealthProfile | null> {
    const response = await this.post<{ data: TwentyWealthProfile }>(
      "wealthProfiles",
      payload
    );
    return this.extractSingleFromResponse<TwentyWealthProfile>(
      response,
      "wealthProfile"
    );
  }

  private async getWealthProfileByPersonId(
    personId: string
  ): Promise<TwentyWealthProfile | null> {
    const response = await this.get<{
      data: { wealthProfiles: TwentyWealthProfile[] };
    }>("wealthProfiles", {
      filter: `personId[eq]:"${personId}"`,
      limit: 1,
    });
    const profiles = this.extractListFromResponse<TwentyWealthProfile>(
      response,
      "wealthProfiles"
    );
    return profiles[0] ?? null;
  }

  private async updateOrCreateWealthProfile(
    personId: string,
    fields: Record<string, unknown>
  ): Promise<void> {
    const existing = await this.getWealthProfileByPersonId(personId);

    if (existing) {
      await this.patch(`wealthProfiles/${existing.id}`, fields);
    } else {
      await this.createWealthProfile({ ...fields, personId });
    }
  }

  // ---------------------------------------------------------------------------
  // Private Helpers: RiskProfile
  // ---------------------------------------------------------------------------

  private async createRiskProfile(
    payload: Record<string, unknown>
  ): Promise<TwentyRiskProfile | null> {
    const response = await this.post<{ data: TwentyRiskProfile }>(
      "riskProfiles",
      payload
    );
    return this.extractSingleFromResponse<TwentyRiskProfile>(
      response,
      "riskProfile"
    );
  }

  private async getRiskProfileByPersonId(
    personId: string
  ): Promise<TwentyRiskProfile | null> {
    const response = await this.get<{
      data: { riskProfiles: TwentyRiskProfile[] };
    }>("riskProfiles", {
      filter: `personId[eq]:"${personId}"`,
      limit: 1,
    });
    const profiles = this.extractListFromResponse<TwentyRiskProfile>(
      response,
      "riskProfiles"
    );
    return profiles[0] ?? null;
  }

  private async updateOrCreateRiskProfile(
    personId: string,
    fields: Record<string, unknown>
  ): Promise<void> {
    const existing = await this.getRiskProfileByPersonId(personId);

    if (existing) {
      await this.patch(`riskProfiles/${existing.id}`, fields);
    } else {
      await this.createRiskProfile({ ...fields, personId });
    }
  }

  // ---------------------------------------------------------------------------
  // Private Helpers: Response Extraction
  // ---------------------------------------------------------------------------

  /**
   * Extract single entity from Twenty API response.
   * Twenty wraps responses in various structures.
   */
  private extractSingleFromResponse<T>(
    response: unknown,
    entityType: string
  ): T | null {
    const data = response as Record<string, unknown>;

    // Try different response shapes Twenty uses
    // Shape 1: { data: { person: {...} } }
    // Shape 2: { data: { createPerson: {...} } }
    // Shape 3: { data: {...} } (direct object)
    const nestedData = data?.data as Record<string, unknown> | undefined;

    if (nestedData) {
      // Try entity type key
      if (entityType in nestedData) {
        return nestedData[entityType] as T;
      }
      // Try create prefix
      const createKey = `create${entityType.charAt(0).toUpperCase()}${entityType.slice(1)}`;
      if (createKey in nestedData) {
        return nestedData[createKey] as T;
      }
      // Return nested data directly if it has an id
      if ("id" in nestedData) {
        return nestedData as T;
      }
    }

    // Direct data case
    if (data && "id" in data) {
      return data as T;
    }

    return null;
  }

  /**
   * Extract list from Twenty API response.
   */
  private extractListFromResponse<T>(
    response: unknown,
    collectionName: string
  ): T[] {
    const data = response as Record<string, unknown>;
    const nestedData = data?.data as Record<string, unknown> | undefined;

    // Try: { data: { people: [...] } }
    if (nestedData && collectionName in nestedData) {
      const list = nestedData[collectionName];
      return Array.isArray(list) ? (list as T[]) : [];
    }

    // Try: { data: [...] }
    if (Array.isArray(nestedData)) {
      return nestedData as T[];
    }

    // Try: { people: [...] }
    if (collectionName in data) {
      const list = data[collectionName];
      return Array.isArray(list) ? (list as T[]) : [];
    }

    return [];
  }

  private isNotFoundError(error: unknown): boolean {
    return error instanceof ExternalCrmError && error.statusCode === 404;
  }
}
