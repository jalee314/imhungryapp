/**
 * imagePreloader.ts
 *
 * Image preloading utilities for feed performance optimization.
 * Follows Bluesky's approach of prefetching images for smoother scrolling.
 *
 * Key features:
 * - Batch preloading for feed items
 * - Priority-based loading (visible items first)
 * - Memory-efficient with preload tracking
 * - Network-aware batching
 */

import { Image } from 'react-native'

// ==========================================
// Types
// ==========================================

export interface PreloadableItem {
  /** Primary image URL */
  imageUrl?: string
  /** Image variants for optimal selection */
  imageVariants?: {
    thumbnail?: string
    small?: string
    medium?: string
    large?: string
    original?: string
  }
  /** User profile photo */
  userProfilePhoto?: string
}

export interface PreloadOptions {
  /** Number of items to preload in each batch */
  batchSize?: number
  /** Delay between batches in ms */
  batchDelay?: number
  /** Include user profile photos */
  includeProfiles?: boolean
  /** Preferred variant to preload */
  preferredVariant?: 'thumbnail' | 'small' | 'medium' | 'large' | 'original'
}

// ==========================================
// Constants
// ==========================================

const DEFAULT_BATCH_SIZE = 5
const DEFAULT_BATCH_DELAY = 100
const DEFAULT_PREFERRED_VARIANT = 'medium'

// Track preloaded images to prevent duplicate requests
const preloadedImages = new Set<string>()

// ==========================================
// Utilities
// ==========================================

/**
 * Extract the best image URL from an item.
 * Prioritizes variants over direct imageUrl.
 */
function getImageUrl(
  item: PreloadableItem,
  preferredVariant: string = DEFAULT_PREFERRED_VARIANT
): string | null {
  // Try variants first
  if (item.imageVariants) {
    const variants = item.imageVariants
    // Fallback chain: preferred → medium → small → thumbnail → original
    return (
      variants[preferredVariant as keyof typeof variants] ||
      variants.medium ||
      variants.small ||
      variants.thumbnail ||
      variants.original ||
      null
    )
  }

  // Fall back to direct imageUrl
  return item.imageUrl || null
}

/**
 * Preload a single image URL.
 * Returns a promise that resolves when the image is cached.
 */
async function preloadSingleImage(url: string): Promise<boolean> {
  // Skip if already preloaded or invalid
  if (!url || preloadedImages.has(url)) {
    return true
  }

  try {
    await Image.prefetch(url)
    preloadedImages.add(url)
    return true
  } catch (error) {
    // Silently fail - image may not exist or network issue
    console.debug('[ImagePreloader] Failed to preload:', url)
    return false
  }
}

/**
 * Sleep utility for batch delays.
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// ==========================================
// Main API
// ==========================================

/**
 * Preload images for a list of feed items.
 * Batches requests to avoid overwhelming the network.
 *
 * @example
 * ```ts
 * // Preload images when deals are fetched
 * const { data: deals } = useDealsQuery()
 *
 * useEffect(() => {
 *   if (deals?.length) {
 *     preloadFeedImages(deals.map(d => ({
 *       imageUrl: d.image?.uri,
 *       imageVariants: d.imageVariants,
 *       userProfilePhoto: d.userProfilePhoto,
 *     })))
 *   }
 * }, [deals])
 * ```
 */
export async function preloadFeedImages(
  items: PreloadableItem[],
  options: PreloadOptions = {}
): Promise<{ success: number; failed: number }> {
  const {
    batchSize = DEFAULT_BATCH_SIZE,
    batchDelay = DEFAULT_BATCH_DELAY,
    includeProfiles = true,
    preferredVariant = DEFAULT_PREFERRED_VARIANT,
  } = options

  // Collect all URLs to preload
  const urlsToPreload: string[] = []

  for (const item of items) {
    // Main image
    const imageUrl = getImageUrl(item, preferredVariant)
    if (imageUrl && !preloadedImages.has(imageUrl)) {
      urlsToPreload.push(imageUrl)
    }

    // Profile photo
    if (includeProfiles && item.userProfilePhoto && !preloadedImages.has(item.userProfilePhoto)) {
      urlsToPreload.push(item.userProfilePhoto)
    }
  }

  // Skip if nothing to preload
  if (urlsToPreload.length === 0) {
    return { success: 0, failed: 0 }
  }

  let success = 0
  let failed = 0

  // Process in batches
  for (let i = 0; i < urlsToPreload.length; i += batchSize) {
    const batch = urlsToPreload.slice(i, i + batchSize)
    const results = await Promise.all(batch.map(preloadSingleImage))

    results.forEach((result) => {
      if (result) success++
      else failed++
    })

    // Delay before next batch (unless it's the last one)
    if (i + batchSize < urlsToPreload.length) {
      await sleep(batchDelay)
    }
  }

  return { success, failed }
}

/**
 * Preload images for items that will appear when scrolling.
 * Call this with the next batch of items before they become visible.
 *
 * @example
 * ```ts
 * // In FlashList's onViewableItemsChanged
 * onViewableItemsChanged={({ viewableItems }) => {
 *   const lastVisibleIndex = viewableItems[viewableItems.length - 1]?.index ?? 0
 *   const nextItems = deals.slice(lastVisibleIndex + 1, lastVisibleIndex + 6)
 *   preloadNextImages(nextItems)
 * }}
 * ```
 */
export function preloadNextImages(
  items: PreloadableItem[],
  options: Omit<PreloadOptions, 'batchDelay'> = {}
): void {
  // Fire and forget - don't block the UI
  preloadFeedImages(items, { ...options, batchDelay: 0 }).catch(() => {
    // Silently ignore errors
  })
}

/**
 * Clear the preload tracking set.
 * Useful when the user logs out or the app needs to free memory.
 */
export function clearPreloadCache(): void {
  preloadedImages.clear()
}

/**
 * Check if an image URL has been preloaded.
 */
export function isImagePreloaded(url: string): boolean {
  return preloadedImages.has(url)
}

/**
 * Get the current number of preloaded images.
 * Useful for debugging and monitoring.
 */
export function getPreloadedCount(): number {
  return preloadedImages.size
}
