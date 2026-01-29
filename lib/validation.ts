/**
 * Validation utilities for contact fields (phone, email).
 */

export type ValidationResult = {
  valid: boolean;
  value: unknown;
  error?: string;
};

/**
 * Contact field keys that require validation.
 */
const PHONE_FIELDS = ["primaryMobile", "alternatePhone", "emergencyContactPhone"];
const EMAIL_FIELDS = ["emailPrimary", "emailSecondary"];

/**
 * Validate and normalize an Indian mobile phone number.
 *
 * Accepts formats:
 * - 9876543210
 * - +919876543210
 * - +91 98765 43210
 * - 91 98765 43210
 * - 0919876543210
 *
 * Normalizes to: +91 XXXXX XXXXX
 */
export function validatePhoneNumber(value: unknown): ValidationResult {
  if (value === null || value === undefined || value === "") {
    return { valid: true, value: null };
  }

  const str = String(value).trim();

  // Remove all spaces, dashes, and parentheses
  const cleaned = str.replace(/[\s\-()]/g, "");

  // Extract digits only
  const digits = cleaned.replace(/[^\d]/g, "");

  // Handle various formats
  let tenDigits: string;

  if (digits.length === 10) {
    // Already 10 digits: 9876543210
    tenDigits = digits;
  } else if (digits.length === 11 && digits.startsWith("0")) {
    // With leading 0: 09876543210
    tenDigits = digits.slice(1);
  } else if (digits.length === 12 && digits.startsWith("91")) {
    // With country code: 919876543210
    tenDigits = digits.slice(2);
  } else if (digits.length === 13 && digits.startsWith("091")) {
    // With 0 and country code: 0919876543210
    tenDigits = digits.slice(3);
  } else {
    return {
      valid: false,
      value: null,
      error: "Phone number must be 10 digits (with optional +91 prefix)",
    };
  }

  // Validate that the number starts with 6-9 (Indian mobile numbers)
  if (!/^[6-9]/.test(tenDigits)) {
    return {
      valid: false,
      value: null,
      error: "Indian mobile numbers must start with 6, 7, 8, or 9",
    };
  }

  // Normalize to +91 XXXXX XXXXX
  const normalized = `+91 ${tenDigits.slice(0, 5)} ${tenDigits.slice(5)}`;

  return { valid: true, value: normalized };
}

/**
 * Validate an email address.
 *
 * Lowercases and trims the value.
 */
export function validateEmail(value: unknown): ValidationResult {
  if (value === null || value === undefined || value === "") {
    return { valid: true, value: null };
  }

  const str = String(value).trim().toLowerCase();

  // Basic email regex - allows most valid emails
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(str)) {
    return {
      valid: false,
      value: null,
      error: "Invalid email format",
    };
  }

  return { valid: true, value: str };
}

/**
 * Validate a contact field (phone or email) by field key.
 *
 * Returns null if the field is not a contact field.
 */
export function validateContactField(
  fieldKey: string,
  value: unknown
): ValidationResult | null {
  if (PHONE_FIELDS.includes(fieldKey)) {
    return validatePhoneNumber(value);
  }

  if (EMAIL_FIELDS.includes(fieldKey)) {
    return validateEmail(value);
  }

  // Not a contact field
  return null;
}

/**
 * Check if a field key is a contact field that requires validation.
 */
export function isContactField(fieldKey: string): boolean {
  return PHONE_FIELDS.includes(fieldKey) || EMAIL_FIELDS.includes(fieldKey);
}

/**
 * Check if a field key is a phone field.
 */
export function isPhoneField(fieldKey: string): boolean {
  return PHONE_FIELDS.includes(fieldKey);
}

/**
 * Check if a field key is an email field.
 */
export function isEmailField(fieldKey: string): boolean {
  return EMAIL_FIELDS.includes(fieldKey);
}
