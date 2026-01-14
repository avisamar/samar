/**
 * Base error class for CRM repository operations
 */
export class CrmRepositoryError extends Error {
  constructor(
    message: string,
    public code: string,
    public cause?: unknown
  ) {
    super(message);
    this.name = "CrmRepositoryError";
  }
}

/**
 * Thrown when a customer is not found
 */
export class CustomerNotFoundError extends CrmRepositoryError {
  constructor(customerId: string) {
    super(`Customer not found: ${customerId}`, "CUSTOMER_NOT_FOUND");
    this.name = "CustomerNotFoundError";
  }
}

/**
 * Thrown when a note is not found
 */
export class NoteNotFoundError extends CrmRepositoryError {
  constructor(noteId: string) {
    super(`Note not found: ${noteId}`, "NOTE_NOT_FOUND");
    this.name = "NoteNotFoundError";
  }
}

/**
 * Thrown when an external CRM API call fails
 */
export class ExternalCrmError extends CrmRepositoryError {
  constructor(
    message: string,
    public statusCode?: number,
    cause?: unknown
  ) {
    super(message, "EXTERNAL_CRM_ERROR", cause);
    this.name = "ExternalCrmError";
  }
}
