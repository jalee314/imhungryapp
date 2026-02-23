/**
 * @file useDealForm — Core contribution form hook
 *
 * Manages form state, field-level setters, dirty tracking,
 * and synchronous validation for both create and edit flows.
 *
 * Async side-effects (profanity check, image upload, API calls)
 * intentionally live outside this hook so screens can orchestrate
 * them without coupling the engine to network concerns.
 */

import { useCallback, useMemo, useRef, useState } from 'react';

import {
  DealFormAPI,
  DealFormOptions,
  DealFormValues,
  FormMode,
  ValidationResult,
} from './types';
import { validateDealForm } from './validation';

// ─── Defaults ───────────────────────────────────────────────────────────────

const DEFAULT_VALUES: DealFormValues = {
  title: '',
  details: '',
  imageUris: [],
  thumbnailIndex: 0,
  restaurant: null,
  categoryId: null,
  cuisineId: null,
  expirationDate: null,
  isAnonymous: false,
};

/**
 * Merge user-provided initial values with defaults so every field
 * is guaranteed to be defined.
 */
function buildInitialValues(
  partial?: Partial<DealFormValues>,
): DealFormValues {
  if (!partial) return { ...DEFAULT_VALUES };
  return { ...DEFAULT_VALUES, ...partial };
}

// ─── Hook ───────────────────────────────────────────────────────────────────

export function useDealForm(options: DealFormOptions): DealFormAPI {
  const { mode, initialValues: initialPartial } = options;

  // Compute full initial snapshot once on mount.
  const initialRef = useRef<DealFormValues>(
    buildInitialValues(initialPartial),
  );

  const [values, setValues] = useState<DealFormValues>(
    () => initialRef.current,
  );

  // ── Field setters ──────────────────────────────────────────────────────

  const setField = useCallback(
    <K extends keyof DealFormValues>(
      field: K,
      value: DealFormValues[K],
    ) => {
      setValues((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  const setFields = useCallback(
    (patch: Partial<DealFormValues>) => {
      setValues((prev) => ({ ...prev, ...patch }));
    },
    [],
  );

  // ── Validation ─────────────────────────────────────────────────────────

  const validate = useCallback((): ValidationResult => {
    return validateDealForm(values, mode);
  }, [values, mode]);

  // ── Reset ──────────────────────────────────────────────────────────────

  const reset = useCallback(() => {
    setValues({ ...initialRef.current });
  }, []);

  // ── Dirty tracking ────────────────────────────────────────────────────

  const dirty = useMemo(() => {
    const init = initialRef.current;
    if (values.title !== init.title) return true;
    if (values.details !== init.details) return true;
    if (values.isAnonymous !== init.isAnonymous) return true;
    if (values.expirationDate !== init.expirationDate) return true;
    if (values.categoryId !== init.categoryId) return true;
    if (values.cuisineId !== init.cuisineId) return true;
    if (values.thumbnailIndex !== init.thumbnailIndex) return true;

    // Restaurant comparison (by id)
    const curR = values.restaurant;
    const initR = init.restaurant;
    if ((curR?.id ?? null) !== (initR?.id ?? null)) return true;

    // Image list comparison (order-sensitive)
    if (values.imageUris.length !== init.imageUris.length) return true;
    for (let i = 0; i < values.imageUris.length; i++) {
      if (values.imageUris[i] !== init.imageUris[i]) return true;
    }

    return false;
  }, [values]);

  // ── API ────────────────────────────────────────────────────────────────

  return {
    values,
    dirty,
    setField,
    setFields,
    validate,
    reset,
    mode,
  };
}

// Re-export for convenience
export { DEFAULT_VALUES as DEAL_FORM_DEFAULTS };
