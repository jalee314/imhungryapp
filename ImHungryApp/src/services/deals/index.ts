/**
 * @file Deal service facade
 * Re-exports all deal-related functions and types from domain modules
 *
 * This module serves as the public API for deal operations.
 * Import from this file to access any deal functionality.
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
  fetchDealForEdit,
  getDealUploaderId,
} from './read';

// Write operations
export {
  createDeal,
  deleteDeal,
  updateDealFields,
  addDealImages,
  removeDealImage,
  setDealThumbnail,
  updateDealImageOrder,
} from './write';

// Transform operations
export {
  transformDealForUI,
  addVotesToDeals,
  addDistancesToDeals,
} from './transform';

// Moderation operations
export { checkDealContentForProfanity } from './moderation';
