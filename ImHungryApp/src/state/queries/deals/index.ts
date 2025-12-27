/**
 * state/queries/deals/index.ts
 *
 * Deals query module exports.
 * Re-exports all deal-related queries and mutations.
 */

// Query hooks
export {
  useDealsQuery,
  usePrefetchDeals,
  useInvalidateDeals,
  dealsKeys,
  type DealsFilters,
} from './useDealsQuery'

// Feed query with realtime support
export { useFeedQuery, type UseFeedQueryParams, type UseFeedQueryResult } from './useFeedQuery'

// Mutation hooks
export { useCreateDeal, useDeleteDeal, useCheckProfanity } from './useDealMutations'
