/**
 * @file Contribution form engine types
 *
 * Shared types for the reusable deal contribution form engine.
 * Covers create, edit, and preview flows.
 */

// ─── Restaurant ─────────────────────────────────────────────────────────────

export interface FormRestaurant {
  id: string;
  name: string;
  address: string;
  lat?: number;
  lng?: number;
  distance_miles?: number;
}

// ─── Form Images ────────────────────────────────────────────────────────────

/** An image that has not yet been uploaded (creation flow). */
export interface LocalImage {
  uri: string;
  /** The original (un-cropped) URI; preserved for re-crop. */
  originalUri: string;
}

/** An image that already exists server-side (edit flow). */
export interface RemoteImage {
  imageMetadataId: string;
  displayOrder: number;
  isThumbnail: boolean;
  url: string;
}

// ─── Form Mode ──────────────────────────────────────────────────────────────

export type FormMode = 'create' | 'edit' | 'preview';

// ─── Form Values ────────────────────────────────────────────────────────────

/**
 * The canonical shape of contribution form data.
 * Both create and edit screens populate this structure.
 */
export interface DealFormValues {
  title: string;
  details: string;
  imageUris: string[];
  thumbnailIndex: number;
  restaurant: FormRestaurant | null;
  categoryId: string | null;
  cuisineId: string | null;
  expirationDate: string | null;
  isAnonymous: boolean;
}

// ─── Validation ─────────────────────────────────────────────────────────────

export interface FieldError {
  field: keyof DealFormValues;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: FieldError[];
}

// ─── Form Options ───────────────────────────────────────────────────────────

export interface DealFormOptions {
  /** The mode the form is operating in. */
  mode: FormMode;
  /** Initial values to seed the form (e.g. from DealEditData). */
  initialValues?: Partial<DealFormValues>;
}

// ─── Form API (returned by useDealForm) ─────────────────────────────────────

export interface DealFormAPI {
  /** Current form values. */
  values: DealFormValues;

  /** Whether any field has been modified from its initial values. */
  dirty: boolean;

  /** Set a single field value. */
  setField: <K extends keyof DealFormValues>(
    field: K,
    value: DealFormValues[K],
  ) => void;

  /** Batch-update multiple fields at once. */
  setFields: (patch: Partial<DealFormValues>) => void;

  /** Run synchronous validation and return the result. */
  validate: () => ValidationResult;

  /** Reset form to initial values. */
  reset: () => void;

  /** The mode the form is currently in. */
  mode: FormMode;
}
