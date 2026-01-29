/**
 * Field mapping utilities for profile extraction.
 * Maps between LLM output and database schema fields.
 */

import { PROFILE_SECTIONS, type FieldDefinition } from "./sections";
import { validateContactField } from "@/lib/validation";
import type { Customer } from "./types";

/** All field definitions flattened from sections */
const ALL_FIELDS: FieldDefinition[] = PROFILE_SECTIONS.flatMap((s) => s.fields);

/** Map of field key to definition for quick lookup */
const FIELD_MAP = new Map<string, FieldDefinition>(
  ALL_FIELDS.map((f) => [f.key, f])
);

/** Map of lowercase label to field key for fuzzy matching */
const LABEL_TO_KEY = new Map<string, string>(
  ALL_FIELDS.map((f) => [f.label.toLowerCase(), f.key as string])
);

/**
 * Get field definition by key.
 */
export function getFieldDefinition(key: string): FieldDefinition | undefined {
  return FIELD_MAP.get(key);
}

/**
 * Get field key from a label (case-insensitive).
 */
export function getFieldKeyFromLabel(label: string): string | undefined {
  return LABEL_TO_KEY.get(label.toLowerCase());
}

/**
 * Get all high-priority fields.
 */
export function getHighPriorityFields(): FieldDefinition[] {
  return ALL_FIELDS.filter((f) => f.priority === "high");
}

/**
 * Get all field keys.
 */
export function getAllFieldKeys(): string[] {
  return ALL_FIELDS.map((f) => f.key as string);
}

/**
 * Validate a field value against its type.
 * Returns the validated/coerced value or null if invalid.
 */
export function validateFieldValue(
  key: string,
  value: unknown
): { valid: boolean; value: unknown; error?: string } {
  const field = FIELD_MAP.get(key);
  if (!field) {
    return { valid: false, value: null, error: `Unknown field: ${key}` };
  }

  // Null/undefined is always valid (means "not set")
  if (value === null || value === undefined || value === "") {
    return { valid: true, value: null };
  }

  // Check if this is a contact field (phone/email) that needs special validation
  const contactValidation = validateContactField(key, value);
  if (contactValidation !== null) {
    return contactValidation;
  }

  switch (field.type) {
    case "text":
      if (typeof value !== "string") {
        return { valid: true, value: String(value) };
      }
      return { valid: true, value };

    case "number":
      if (typeof value === "number") {
        return { valid: true, value };
      }
      const num = Number(value);
      if (isNaN(num)) {
        return { valid: false, value: null, error: `Invalid number: ${value}` };
      }
      return { valid: true, value: num };

    case "boolean":
      if (typeof value === "boolean") {
        return { valid: true, value };
      }
      if (value === "true" || value === "yes" || value === "1") {
        return { valid: true, value: true };
      }
      if (value === "false" || value === "no" || value === "0") {
        return { valid: true, value: false };
      }
      return { valid: false, value: null, error: `Invalid boolean: ${value}` };

    case "date":
      if (value instanceof Date) {
        return { valid: true, value };
      }
      const date = new Date(value as string);
      if (isNaN(date.getTime())) {
        return { valid: false, value: null, error: `Invalid date: ${value}` };
      }
      return { valid: true, value: date };

    case "enum":
      // Enums are stored as strings
      return { valid: true, value: String(value) };

    case "multi_select":
      // Multi-select should be an array of strings
      if (Array.isArray(value)) {
        return { valid: true, value: value.map(String) };
      }
      // Allow comma-separated string
      if (typeof value === "string") {
        return {
          valid: true,
          value: value.split(",").map((s) => s.trim()).filter(Boolean),
        };
      }
      return { valid: false, value: null, error: `Invalid multi_select: ${value}` };

    case "json":
      // JSON can be any object
      if (typeof value === "object") {
        return { valid: true, value };
      }
      try {
        const parsed = JSON.parse(value as string);
        return { valid: true, value: parsed };
      } catch {
        return { valid: false, value: null, error: `Invalid JSON: ${value}` };
      }

    default:
      return { valid: true, value };
  }
}

/**
 * Format a field value for display.
 */
export function formatFieldForDisplay(key: string, value: unknown): string {
  if (value === null || value === undefined) {
    return "(not set)";
  }

  const field = FIELD_MAP.get(key);
  if (!field) {
    return String(value);
  }

  switch (field.type) {
    case "boolean":
      return value ? "Yes" : "No";

    case "date":
      if (value instanceof Date) {
        return value.toLocaleDateString();
      }
      return new Date(value as string).toLocaleDateString();

    case "multi_select":
      if (Array.isArray(value)) {
        return value.join(", ");
      }
      return String(value);

    case "json":
      return JSON.stringify(value, null, 2);

    default:
      return String(value);
  }
}

/**
 * Get the current value of a field from a customer profile.
 */
export function getFieldValue(customer: Customer, key: string): unknown {
  return customer[key as keyof Customer];
}

/**
 * Check if a field value is empty/not set.
 */
export function isFieldEmpty(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === "string" && value.trim() === "") return true;
  if (Array.isArray(value) && value.length === 0) return true;
  return false;
}

/**
 * Schema description for LLM extraction.
 * Returns a simplified schema description for the LLM to understand.
 */
export function getExtractionSchema(): string {
  const sections: string[] = [];

  for (const section of PROFILE_SECTIONS) {
    const fields = section.fields
      .filter((f) => f.priority === "high" || f.priority === "medium")
      .map((f) => {
        let typeHint: string = f.type;
        if (f.type === "enum") {
          typeHint = "enum (string value)";
        } else if (f.type === "multi_select") {
          typeHint = "array of strings";
        }
        return `  - ${f.key} (${f.label}): ${typeHint}${f.priority === "high" ? " [HIGH PRIORITY]" : ""}`;
      });

    if (fields.length > 0) {
      sections.push(`${section.label}:\n${fields.join("\n")}`);
    }
  }

  return sections.join("\n\n");
}
