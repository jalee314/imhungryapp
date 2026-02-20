/**
 * Validation unit tests (PR-039 / RF-039)
 *
 * Covers all synchronous validation rules extracted from
 * DealCreationScreen and DealEditScreen.
 */

import type { DealFormValues } from '../engine/types';
import {
  validateDealForm,
  getFieldError,
  TITLE_MAX_LENGTH,
  IMAGES_MIN_COUNT,
  IMAGES_MAX_COUNT,
} from '../engine/validation';

// ─── helpers ────────────────────────────────────────────────────────────────

/** A fully-valid creation form. */
const validCreateValues: DealFormValues = {
  title: 'Half-price sushi',
  details: 'Dine-in only',
  imageUris: ['file://img1.jpg'],
  thumbnailIndex: 0,
  restaurant: {
    id: 'rest-1',
    name: 'Sushi Palace',
    address: '123 Main St',
  },
  categoryId: 'cat-1',
  cuisineId: 'cuis-1',
  expirationDate: '2026-12-31',
  isAnonymous: false,
};

/** A fully-valid edit form (restaurant not required). */
const validEditValues: DealFormValues = {
  ...validCreateValues,
  restaurant: null, // edit form doesn't require restaurant
};

// ─── constants ──────────────────────────────────────────────────────────────

describe('validation constants', () => {
  it('should expose expected limits', () => {
    expect(TITLE_MAX_LENGTH).toBe(100);
    expect(IMAGES_MIN_COUNT).toBe(1);
    expect(IMAGES_MAX_COUNT).toBe(5);
  });
});

// ─── create mode ────────────────────────────────────────────────────────────

describe('validateDealForm — create mode', () => {
  it('should pass with complete data', () => {
    const result = validateDealForm(validCreateValues, 'create');
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should fail if title is empty', () => {
    const result = validateDealForm(
      { ...validCreateValues, title: '' },
      'create',
    );
    expect(result.valid).toBe(false);
    expect(getFieldError(result, 'title')).toBeDefined();
  });

  it('should fail if title is whitespace-only', () => {
    const result = validateDealForm(
      { ...validCreateValues, title: '   ' },
      'create',
    );
    expect(result.valid).toBe(false);
    expect(getFieldError(result, 'title')).toBeDefined();
  });

  it('should fail if imageUris is empty', () => {
    const result = validateDealForm(
      { ...validCreateValues, imageUris: [] },
      'create',
    );
    expect(result.valid).toBe(false);
    expect(getFieldError(result, 'imageUris')).toMatch(/photo/i);
  });

  it('should fail if restaurant is null', () => {
    const result = validateDealForm(
      { ...validCreateValues, restaurant: null },
      'create',
    );
    expect(result.valid).toBe(false);
    expect(getFieldError(result, 'restaurant')).toBeDefined();
  });

  it('should collect multiple errors at once', () => {
    const result = validateDealForm(
      { ...validCreateValues, title: '', imageUris: [], restaurant: null },
      'create',
    );
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBe(3);
  });

  it('should allow optional fields to be null', () => {
    const result = validateDealForm(
      {
        ...validCreateValues,
        details: '',
        categoryId: null,
        cuisineId: null,
        expirationDate: null,
      },
      'create',
    );
    expect(result.valid).toBe(true);
  });
});

// ─── edit mode ──────────────────────────────────────────────────────────────

describe('validateDealForm — edit mode', () => {
  it('should pass without a restaurant (read-only in edit)', () => {
    const result = validateDealForm(validEditValues, 'edit');
    expect(result.valid).toBe(true);
  });

  it('should still require title in edit mode', () => {
    const result = validateDealForm(
      { ...validEditValues, title: '' },
      'edit',
    );
    expect(result.valid).toBe(false);
    expect(getFieldError(result, 'title')).toBeDefined();
  });

  it('should still require at least one image in edit mode', () => {
    const result = validateDealForm(
      { ...validEditValues, imageUris: [] },
      'edit',
    );
    expect(result.valid).toBe(false);
    expect(getFieldError(result, 'imageUris')).toBeDefined();
  });
});

// ─── preview mode ───────────────────────────────────────────────────────────

describe('validateDealForm — preview mode', () => {
  it('should enforce same rules as create', () => {
    const result = validateDealForm(
      { ...validCreateValues, restaurant: null },
      'preview',
    );
    expect(result.valid).toBe(false);
    expect(getFieldError(result, 'restaurant')).toBeDefined();
  });
});

// ─── getFieldError helper ───────────────────────────────────────────────────

describe('getFieldError', () => {
  it('should return undefined when no error for a field', () => {
    const result = validateDealForm(validCreateValues, 'create');
    expect(getFieldError(result, 'title')).toBeUndefined();
  });

  it('should return the first matching message', () => {
    const result = validateDealForm(
      { ...validCreateValues, title: '' },
      'create',
    );
    expect(typeof getFieldError(result, 'title')).toBe('string');
  });
});

// ─── snapshot ───────────────────────────────────────────────────────────────

describe('validation result snapshots', () => {
  it('should snapshot a clean validation result', () => {
    expect(validateDealForm(validCreateValues, 'create')).toMatchSnapshot();
  });

  it('should snapshot a multi-error validation result', () => {
    expect(
      validateDealForm(
        { ...validCreateValues, title: '', imageUris: [], restaurant: null },
        'create',
      ),
    ).toMatchSnapshot();
  });
});
