/**
 * @file Deal service facade
 * Re-exports all deal-related functions and types from domain modules
 *
 * This module serves as the public API for deal operations.
 * Import from this file to access any deal functionality.
 *
 * @see ./read.ts - Read operations (fetch, get)
 * @see ./write.ts - Core write operations (create, delete)
 * @see ./dealEditing.ts - Edit operations (fetchDealForEdit, updateDealFields)
 * @see ./dealImages.ts - Image operations (add, remove, reorder, thumbnail)
 * @see ./transform.ts - Data transformation
 * @see ./moderation.ts - Content moderation
 * @see ./types.ts - Shared types and interfaces
 */

// Types
export type {
  CreateDealData,
  RankedDealMeta,
  DatabaseDeal,
  DealEditData,
  UpdateDealData,
  ServiceResult,
  ImageVariants,
  ImageType,
} from './types';

// Read operations
export {
  fetchRankedDeals,
  fetchUserPosts,
  getDealUploaderId,
} from './read';

// Core write operations
export {
  createDeal,
  deleteDeal,
} from './write';

// Editing operations
export {
  fetchDealForEdit,
  updateDealFields,
} from './dealEditing';

// Image operations
export {
  addDealImages,
  removeDealImage,
  setDealThumbnail,
  updateDealImageOrder,
} from './dealImages';

// Transform operations
export {
  transformDealForUI,
  addVotesToDeals,
  addDistancesToDeals,
} from './transform';

// Moderation operations
export { checkDealContentForProfanity } from './moderation';
