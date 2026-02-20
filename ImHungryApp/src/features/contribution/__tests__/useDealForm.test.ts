/**
 * useDealForm hook tests (PR-039 / RF-039)
 *
 * Tests the core form engine: state management, dirty tracking,
 * field setters, reset, and validation integration.
 */

import { renderHook, act } from '@testing-library/react-native';

import type { DealFormValues, DealFormOptions } from '../engine/types';
import { useDealForm, DEAL_FORM_DEFAULTS } from '../engine/useDealForm';

// ─── helpers ────────────────────────────────────────────────────────────────

const createOptions = (mode: 'create' | 'edit' = 'create'): DealFormOptions => ({
  mode,
});

const editOptions = (
  initial: Partial<DealFormValues> = {},
): DealFormOptions => ({
  mode: 'edit',
  initialValues: initial,
});

// ─── defaults ───────────────────────────────────────────────────────────────

describe('useDealForm — defaults', () => {
  it('should initialise with default empty values in create mode', () => {
    const { result } = renderHook(() => useDealForm(createOptions()));
    expect(result.current.values).toEqual(DEAL_FORM_DEFAULTS);
    expect(result.current.mode).toBe('create');
    expect(result.current.dirty).toBe(false);
  });

  it('should merge initialValues with defaults in edit mode', () => {
    const { result } = renderHook(() =>
      useDealForm(editOptions({ title: 'Free tacos', isAnonymous: true })),
    );
    expect(result.current.values.title).toBe('Free tacos');
    expect(result.current.values.isAnonymous).toBe(true);
    // Non-overridden fields should use defaults
    expect(result.current.values.details).toBe('');
    expect(result.current.values.imageUris).toEqual([]);
  });
});

// ─── setField ───────────────────────────────────────────────────────────────

describe('useDealForm — setField', () => {
  it('should update a single string field', () => {
    const { result } = renderHook(() => useDealForm(createOptions()));
    act(() => result.current.setField('title', 'BOGO Pizza'));
    expect(result.current.values.title).toBe('BOGO Pizza');
  });

  it('should update a boolean field', () => {
    const { result } = renderHook(() => useDealForm(createOptions()));
    act(() => result.current.setField('isAnonymous', true));
    expect(result.current.values.isAnonymous).toBe(true);
  });

  it('should update an array field', () => {
    const { result } = renderHook(() => useDealForm(createOptions()));
    act(() =>
      result.current.setField('imageUris', ['file://a.jpg', 'file://b.jpg']),
    );
    expect(result.current.values.imageUris).toEqual([
      'file://a.jpg',
      'file://b.jpg',
    ]);
  });

  it('should update restaurant (object or null)', () => {
    const { result } = renderHook(() => useDealForm(createOptions()));
    act(() =>
      result.current.setField('restaurant', {
        id: 'r1',
        name: 'Burger Barn',
        address: '456 Oak Ave',
      }),
    );
    expect(result.current.values.restaurant?.name).toBe('Burger Barn');
  });
});

// ─── setFields (batch) ──────────────────────────────────────────────────────

describe('useDealForm — setFields', () => {
  it('should batch-update multiple fields at once', () => {
    const { result } = renderHook(() => useDealForm(createOptions()));
    act(() =>
      result.current.setFields({
        title: 'Happy Hour',
        categoryId: 'cat-2',
        isAnonymous: true,
      }),
    );
    expect(result.current.values.title).toBe('Happy Hour');
    expect(result.current.values.categoryId).toBe('cat-2');
    expect(result.current.values.isAnonymous).toBe(true);
  });
});

// ─── dirty tracking ─────────────────────────────────────────────────────────

describe('useDealForm — dirty tracking', () => {
  it('should be clean on mount', () => {
    const { result } = renderHook(() => useDealForm(createOptions()));
    expect(result.current.dirty).toBe(false);
  });

  it('should become dirty after a field change', () => {
    const { result } = renderHook(() => useDealForm(createOptions()));
    act(() => result.current.setField('title', 'Something'));
    expect(result.current.dirty).toBe(true);
  });

  it('should be clean after resetting back to initial', () => {
    const { result } = renderHook(() => useDealForm(createOptions()));
    act(() => result.current.setField('title', 'Something'));
    expect(result.current.dirty).toBe(true);
    act(() => result.current.reset());
    expect(result.current.dirty).toBe(false);
  });

  it('should track image list changes', () => {
    const { result } = renderHook(() => useDealForm(createOptions()));
    act(() => result.current.setField('imageUris', ['file://new.jpg']));
    expect(result.current.dirty).toBe(true);
  });

  it('should track restaurant changes by id', () => {
    const { result } = renderHook(() =>
      useDealForm(
        editOptions({
          restaurant: { id: 'r1', name: 'Place', address: 'Addr' },
        }),
      ),
    );
    expect(result.current.dirty).toBe(false);
    act(() =>
      result.current.setField('restaurant', {
        id: 'r2',
        name: 'Other',
        address: 'Addr2',
      }),
    );
    expect(result.current.dirty).toBe(true);
  });

  it('should detect dirty when reverting title to a different value', () => {
    const { result } = renderHook(() =>
      useDealForm(editOptions({ title: 'Original' })),
    );
    act(() => result.current.setField('title', 'Changed'));
    expect(result.current.dirty).toBe(true);
    act(() => result.current.setField('title', 'Original'));
    expect(result.current.dirty).toBe(false);
  });
});

// ─── reset ──────────────────────────────────────────────────────────────────

describe('useDealForm — reset', () => {
  it('should restore all values to initial', () => {
    const initial: Partial<DealFormValues> = {
      title: 'Initial Title',
      details: 'Initial details',
    };
    const { result } = renderHook(() => useDealForm(editOptions(initial)));

    act(() => {
      result.current.setField('title', 'Modified');
      result.current.setField('details', 'Modified details');
      result.current.setField('isAnonymous', true);
    });
    expect(result.current.values.title).toBe('Modified');

    act(() => result.current.reset());
    expect(result.current.values.title).toBe('Initial Title');
    expect(result.current.values.details).toBe('Initial details');
    expect(result.current.values.isAnonymous).toBe(false);
    expect(result.current.dirty).toBe(false);
  });
});

// ─── validate integration ───────────────────────────────────────────────────

describe('useDealForm — validate', () => {
  it('should report errors for empty create form', () => {
    const { result } = renderHook(() => useDealForm(createOptions()));
    let validation: ReturnType<typeof result.current.validate> | undefined;
    act(() => {
      validation = result.current.validate();
    });
    expect(validation?.valid).toBe(false);
    expect(validation?.errors.length ?? 0).toBeGreaterThan(0);
  });

  it('should pass validation when form is complete', () => {
    const { result } = renderHook(() => useDealForm(createOptions()));
    act(() =>
      result.current.setFields({
        title: 'Deal',
        imageUris: ['file://img.jpg'],
        restaurant: { id: 'r1', name: 'R', address: 'A' },
      }),
    );
    let validation: ReturnType<typeof result.current.validate> | undefined;
    act(() => {
      validation = result.current.validate();
    });
    expect(validation?.valid).toBe(true);
  });
});

// ─── state shape snapshots ──────────────────────────────────────────────────

describe('useDealForm — state snapshots', () => {
  it('should snapshot default create form values', () => {
    expect(DEAL_FORM_DEFAULTS).toMatchSnapshot();
  });

  it('should snapshot a populated edit form', () => {
    const { result } = renderHook(() =>
      useDealForm(
        editOptions({
          title: 'BOGO Burgers',
          details: 'Lunch only',
          imageUris: ['file://a.jpg', 'file://b.jpg'],
          thumbnailIndex: 1,
          restaurant: { id: 'r1', name: 'Burger Barn', address: '1 Main' },
          categoryId: 'bogo',
          cuisineId: 'american',
          expirationDate: '2026-06-30',
          isAnonymous: true,
        }),
      ),
    );
    expect(result.current.values).toMatchSnapshot();
  });
});
