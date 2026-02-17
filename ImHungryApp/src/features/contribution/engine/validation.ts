/**
 * @file Deal form validation rules
 *
 * Extracted from DealCreationScreen.handlePreview / handlePost
 * and DealEditScreen.validateForm to provide a single source of truth.
 *
 * Only synchronous, structural validation lives here.
 * Async checks (profanity moderation) remain in the service layer.
 */

import { DealFormValues, FieldError, ValidationResult, FormMode } from './types';

/** Maximum characters for the deal title (matches TextInput maxLength). */
export const TITLE_MAX_LENGTH = 100;

/** Minimum number of images required. */
export const IMAGES_MIN_COUNT = 1;

/** Maximum number of images allowed. */
export const IMAGES_MAX_COUNT = 5;

/**
 * Run all synchronous validation rules against the given form values.
 *
 * The `mode` parameter controls which rules apply:
 * - `create` requires a restaurant selection
 * - `edit` does NOT require a restaurant (it's read-only / pre-set)
 * - `preview` runs the same rules as `create`
 */
export function validateDealForm(
  values: DealFormValues,
  mode: FormMode,
): ValidationResult {
  const errors: FieldError[] = [];

  // ── Title ────────────────────────────────────────────────────────────────
  if (!values.title || !values.title.trim()) {
    errors.push({
      field: 'title',
      message: 'Please enter a deal title.',
    });
  }

  // ── Images ───────────────────────────────────────────────────────────────
  if (!values.imageUris || values.imageUris.length < IMAGES_MIN_COUNT) {
    errors.push({
      field: 'imageUris',
      message: 'Please add at least one photo to continue.',
    });
  }

  // ── Restaurant (create / preview only) ───────────────────────────────────
  if ((mode === 'create' || mode === 'preview') && !values.restaurant) {
    errors.push({
      field: 'restaurant',
      message:
        'Please select a restaurant and add a deal title to continue.',
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get the first error message for a specific field.
 * Convenience helper for rendering inline errors.
 */
export function getFieldError(
  result: ValidationResult,
  field: keyof DealFormValues,
): string | undefined {
  return result.errors.find((e) => e.field === field)?.message;
}
