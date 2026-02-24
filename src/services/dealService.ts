/**
 * @file Deal service facade
 * This file re-exports all deal functionality from domain modules.
 * All existing imports continue to work unchanged.
 *
 * @see ./deals/read.ts - Read operations (fetch, get)
 * @see ./deals/write.ts - Core write operations (create, delete)
 * @see ./deals/dealEditing.ts - Edit operations (fetchDealForEdit, updateDealFields)
 * @see ./deals/dealImages.ts - Image operations (add, remove, reorder, thumbnail)
 * @see ./deals/transform.ts - Data transformation
 * @see ./deals/moderation.ts - Content moderation
 * @see ./deals/types.ts - Shared types and interfaces
 */

// Re-export everything from the deals module
export {
  // Types
  type CreateDealData,
  type RankedDealMeta,
  type DatabaseDeal,
  type DealEditData,
  type UpdateDealData,
  // Read operations
  fetchRankedDeals,
  fetchUserPosts,
  getDealUploaderId,
  // Core write operations
  createDeal,
  deleteDeal,
  // Editing operations
  fetchDealForEdit,
  updateDealFields,
  // Image operations
  addDealImages,
  removeDealImage,
  setDealThumbnail,
  updateDealImageOrder,
  // Transform operations
  transformDealForUI,
  addVotesToDeals,
  addDistancesToDeals,
  // Moderation operations
  checkDealContentForProfanity,
} from './deals';
