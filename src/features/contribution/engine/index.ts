/**
 * @file Contribution engine barrel export
 *
 * Public API for the form engine used by contribution screens.
 */

// Hook
export { useDealForm, DEAL_FORM_DEFAULTS } from './useDealForm';

// Validation
export {
  validateDealForm,
  getFieldError,
  TITLE_MAX_LENGTH,
  IMAGES_MIN_COUNT,
  IMAGES_MAX_COUNT,
} from './validation';

// Types
export type {
  DealFormValues,
  DealFormAPI,
  DealFormOptions,
  FormMode,
  FormRestaurant,
  LocalImage,
  RemoteImage,
  FieldError,
  ValidationResult,
} from './types';
