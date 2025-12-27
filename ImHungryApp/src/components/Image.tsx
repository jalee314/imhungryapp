/**
 * Image.tsx
 *
 * Optimized image component for the ImHungry app.
 * Follows Bluesky's component patterns with ui atoms integration.
 *
 * Features:
 * - Automatic variant selection based on display size and device pixel ratio
 * - Progressive fallback (large → medium → small → thumbnail → original)
 * - Image preloading support
 * - Network-aware optimization
 *
 * Usage:
 *   import { OptimizedImage, preloadImage } from '#/components/Image'
 *
 *   <OptimizedImage
 *     variants={deal.imageVariants}
 *     componentType="deal"
 *     displaySize={{ width: 200, height: 200 }}
 *     fallbackSource={require('../assets/placeholder.png')}
 *     style={[a.rounded_md, a.overflow_hidden]}
 *   />
 */

import React, { useState, useEffect, useCallback, memo } from 'react'
import {
  Image as RNImage,
  ImageProps as RNImageProps,
  ImageStyle,
  PixelRatio,
  Dimensions,
  StyleProp,
} from 'react-native'

import {
  getOptimalImageVariant,
  getImageUrl,
  ImageVariants,
  VariantContext,
} from '../services/imageProcessingService'

// ==========================================
// Types
// ==========================================

export type ImageComponentType = 'profile' | 'deal' | 'restaurant' | 'franchise_logo'

export type NetworkType = 'slow-2g' | '2g' | '3g' | '4g' | 'wifi'

export interface ImageDisplaySize {
  width: number
  height: number
}

export interface OptimizedImageProps extends Omit<RNImageProps, 'source'> {
  /** Image variant URLs (thumbnail, small, medium, large, original) */
  variants: ImageVariants
  /** Context for optimal variant selection */
  componentType: ImageComponentType
  /** Display size in logical pixels */
  displaySize: ImageDisplaySize
  /** Fallback image source when all variants fail */
  fallbackSource?: RNImageProps['source']
  /** Network type for bandwidth-aware selection */
  networkType?: NetworkType
  /** Style prop with proper typing */
  style?: StyleProp<ImageStyle>
}

// ==========================================
// Preloading
// ==========================================

/** Static set to track preloaded images (prevents duplicate preloads) */
const preloadedImages = new Set<string>()

/**
 * Preload an image before displaying it.
 * Useful for prefetching images that will appear on navigation.
 *
 * @param imageSource - Image source (string URI or require())
 * @param variants - Optional image variants for optimal selection
 * @param displaySize - Display size for variant selection
 */
export async function preloadImage(
  imageSource: RNImageProps['source'],
  variants?: ImageVariants,
  displaySize?: ImageDisplaySize,
): Promise<void> {
  try {
    let uriToLoad = ''

    // If we have variants, get the optimal variant
    if (variants && displaySize) {
      const context: VariantContext = {
        componentType: 'deal',
        displaySize,
        devicePixelRatio: PixelRatio.get(),
        screenWidth: Dimensions.get('window').width,
      }
      const optimalVariant = getOptimalImageVariant(variants, context)

      if (!optimalVariant || optimalVariant.trim() === '') {
        console.warn('[Image] No valid variant found for preload')
        return
      }
      uriToLoad = getImageUrl(optimalVariant)
    } else {
      // Fallback to original image source
      if (typeof imageSource === 'string') {
        uriToLoad = imageSource
      } else if (imageSource && typeof imageSource === 'object' && 'uri' in imageSource) {
        uriToLoad = imageSource.uri ?? ''
      } else if (imageSource) {
        const resolved = RNImage.resolveAssetSource(imageSource as number)
        uriToLoad = resolved?.uri ?? ''
      }
    }

    // Validate URI before prefetching
    if (!uriToLoad || uriToLoad.trim() === '') {
      console.warn('[Image] Cannot preload: invalid URI')
      return
    }

    // Skip if already preloaded
    if (preloadedImages.has(uriToLoad)) {
      return
    }

    await RNImage.prefetch(uriToLoad)
    preloadedImages.add(uriToLoad)
  } catch (error) {
    console.error('[Image] Preload error:', error)
  }
}

/**
 * Clear preloaded image cache (useful for memory management)
 */
export function clearPreloadCache(): void {
  preloadedImages.clear()
}

// ==========================================
// Helper Functions
// ==========================================

/**
 * Get the next fallback variant in the chain
 */
function getNextFallbackVariant(
  currentVariant: string,
  variants: ImageVariants,
): string | null {
  if (currentVariant === variants.large && variants.medium) {
    return variants.medium
  }
  if (currentVariant === variants.medium && variants.small) {
    return variants.small
  }
  if (currentVariant === variants.small && variants.thumbnail) {
    return variants.thumbnail
  }
  if (variants.original) {
    return variants.original
  }
  return null
}

/**
 * Validate and create image source from variant
 */
function createImageSource(
  variant: string | undefined,
  fallbackSource: RNImageProps['source'] | undefined,
): RNImageProps['source'] | null {
  if (!variant || variant.trim() === '') {
    return fallbackSource ?? null
  }

  const uri = getImageUrl(variant)
  if (!uri || uri.trim() === '') {
    return fallbackSource ?? null
  }

  return { uri }
}

// ==========================================
// Component
// ==========================================

/**
 * OptimizedImage component with automatic variant selection and fallback handling.
 *
 * Automatically selects the best image variant based on:
 * - Display size
 * - Device pixel ratio
 * - Screen width
 * - Network type (optional)
 */
export const OptimizedImage = memo(function OptimizedImage({
  variants,
  componentType,
  displaySize,
  fallbackSource,
  networkType,
  style,
  ...props
}: OptimizedImageProps) {
  const [currentVariant, setCurrentVariant] = useState<string>('')
  const [hasError, setHasError] = useState(false)

  // Select optimal variant on mount and when dependencies change
  useEffect(() => {
    const context: VariantContext = {
      componentType,
      displaySize,
      devicePixelRatio: PixelRatio.get(),
      screenWidth: Dimensions.get('window').width,
      networkType,
    }

    const optimalVariant = getOptimalImageVariant(variants, context)
    setCurrentVariant(optimalVariant)
    setHasError(false)
  }, [variants, componentType, displaySize.width, displaySize.height, networkType])

  // Handle image load error with progressive fallback
  const handleError = useCallback(() => {
    const nextVariant = getNextFallbackVariant(currentVariant, variants)

    if (nextVariant && nextVariant !== currentVariant) {
      setCurrentVariant(nextVariant)
    } else {
      setHasError(true)
    }
  }, [currentVariant, variants])

  // Show fallback if all variants failed
  if (hasError && fallbackSource) {
    return <RNImage {...props} source={fallbackSource} style={style} />
  }

  // Create image source from current variant
  const imageSource = createImageSource(currentVariant, fallbackSource)

  // Validate source before rendering
  if (!imageSource) {
    if (fallbackSource) {
      return <RNImage {...props} source={fallbackSource} style={style} />
    }
    return null
  }

  // Validate URI if it's an object with uri property
  if (
    typeof imageSource === 'object' &&
    'uri' in imageSource &&
    (!imageSource.uri || imageSource.uri.trim() === '')
  ) {
    if (fallbackSource) {
      return <RNImage {...props} source={fallbackSource} style={style} />
    }
    return null
  }

  return (
    <RNImage
      {...props}
      source={imageSource}
      style={style}
      onError={handleError}
    />
  )
})

// ==========================================
// Re-export for backwards compatibility
// ==========================================

export default OptimizedImage
