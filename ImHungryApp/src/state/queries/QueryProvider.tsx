/**
 * state/queries/QueryProvider.tsx
 *
 * TanStack React Query provider setup.
 * Wraps the app to provide query client context.
 *
 * React Query is used for SERVER STATE:
 * - Data fetching from API
 * - Caching responses
 * - Background refetching
 * - Mutation handling
 *
 * Local state (auth, UI) uses React Context or Zustand stores.
 *
 * @example
 * // In Shell or App.tsx
 * <QueryProvider>
 *   <App />
 * </QueryProvider>
 */

import React, { ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

/**
 * Default stale time for queries (5 minutes).
 * Data is considered fresh during this time and won't refetch.
 */
const DEFAULT_STALE_TIME = 5 * 60 * 1000

/**
 * Default cache time for queries (30 minutes).
 * Unused data is garbage collected after this time.
 */
const DEFAULT_GC_TIME = 30 * 60 * 1000

/**
 * Create QueryClient with sensible defaults for a mobile app.
 *
 * Key settings:
 * - staleTime: How long data is considered fresh (no refetch)
 * - gcTime: How long unused data stays in cache
 * - retry: Number of retries on failure
 * - refetchOnWindowFocus: Disabled for mobile (no "window focus")
 */
function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: DEFAULT_STALE_TIME,
        gcTime: DEFAULT_GC_TIME,
        retry: 2,
        refetchOnWindowFocus: false, // Not useful on mobile
        refetchOnMount: true,
      },
      mutations: {
        retry: 1,
      },
    },
  })
}

// Singleton query client instance
let queryClient: QueryClient | null = null

/**
 * Get the singleton QueryClient instance.
 * Creates one if it doesn't exist.
 */
export function getQueryClient(): QueryClient {
  if (!queryClient) {
    queryClient = createQueryClient()
  }
  return queryClient
}

interface QueryProviderProps {
  children: ReactNode
}

/**
 * QueryProvider wraps your app to enable React Query.
 *
 * @example
 * function App() {
 *   return (
 *     <QueryProvider>
 *       <Shell />
 *     </QueryProvider>
 *   )
 * }
 */
export function QueryProvider({ children }: QueryProviderProps) {
  // Use singleton to avoid recreating on re-renders
  const client = getQueryClient()

  return (
    <QueryClientProvider client={client}>
      {children}
    </QueryClientProvider>
  )
}

/**
 * Reset the query client (useful for testing or logout).
 * Clears all cached data.
 */
export function resetQueryClient(): void {
  if (queryClient) {
    queryClient.clear()
  }
}

/**
 * Invalidate all queries (force refetch).
 * Useful after mutations that affect multiple queries.
 */
export function invalidateAllQueries(): void {
  if (queryClient) {
    queryClient.invalidateQueries()
  }
}
