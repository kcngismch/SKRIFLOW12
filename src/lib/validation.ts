import { FormField } from "@/types/tool";

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  firstErrorFieldId: string | null;
}

/**
 * Validates form input values against required constraints and mathematical maxLength budgets.
 */
export function validateForm(
  fields: FormField[],
  values: Record<string, string>
): ValidationResult {
  const errors: Record<string, string> = {};
  let firstErrorFieldId: string | null = null;

  for (const field of fields) {
    const rawVal = values[field.id];
    const val = typeof rawVal === "string" ? rawVal : "";

    // Required check
    if (field.required && val.trim().length === 0) {
      errors[field.id] = `${field.label} wajib diisi sebelum prompt dapat dirakit.`;
      if (!firstErrorFieldId) {
        firstErrorFieldId = field.id;
      }
      continue;
    }

    // Max length check (without silent truncation)
    if (field.maxLength && val.length > 0) {
      const charCount = Array.from(val).length;
      if (charCount > field.maxLength) {
        const over = charCount - field.maxLength;
        errors[field.id] = `Teks kelebihan ${over} karakter. Ringkas bagian yang berulang.`;
        if (!firstErrorFieldId) {
          firstErrorFieldId = field.id;
        }
      }
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    firstErrorFieldId,
  };
}
