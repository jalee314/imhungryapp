/**
 * DealDetailScreen — Legacy wrapper export
 *
 * This file is retained solely for navigation compatibility.
 * All logic and UI live in the deal-detail feature module.
 *
 * @see features/deal-detail/DealDetailContainer
 */

// Re-export the container as the default screen component
export { default } from '../../features/deal-detail/DealDetailContainer';

// Re-export the cache invalidation helper so existing callers keep working
export { invalidateDealImageCache } from '../../features/deal-detail/useDealDetail';
