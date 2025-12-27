/**
 * state/index.ts
 *
 * Main entry point for the state layer.
 *
 * This module organizes state management following Bluesky's pattern:
 *
 * 1. **queries/** - TanStack React Query for SERVER STATE
 *    - Data fetching, caching, background refetching
 *    - Mutations with cache invalidation
 *
 * 2. **stores/** (legacy) - Zustand stores for LOCAL STATE
 *    - Auth state
 *    - Location state
 *    - Admin mode
 *
 * The stores will gradually migrate to React Context as per the refactor plan.
 *
 * @example
 * // Import queries
 * import { useDealsQuery, QueryProvider } from '#/state/queries'
 *
 * // Import stores (legacy)
 * import { useAuthStore } from '#/stores'
 */

// Re-export all queries
export * from './queries'

// Note: Stores are currently in src/stores/ and will be migrated here later
