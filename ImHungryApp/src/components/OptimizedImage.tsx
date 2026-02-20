import React, { useState, useEffect } from 'react';
import { Image, ImageProps, PixelRatio, Dimensions } from 'react-native';
import type { ImageSourcePropType } from 'react-native';

import { getOptimalImageVariant, getImageUrl } from '../services/imageProcessingService';
import type { ImageVariants, VariantContext } from '../types/image';
import { logger } from '../utils/logger';
// Static set to track preloaded images
const preloadedImages = new Set<string>();

/**
 * Preload an image before displaying it
 */
export const preloadImage = async (
  imageSource: ImageSourcePropType | string,
  variants?: ImageVariants,
  displaySize?: { width: number; height: number }
) => {
  try {
    let uriToLoad = '';
    
    // If we have variants, get the optimal variant
    if (variants && displaySize) {
      const context: VariantContext = {
        componentType: 'deal',
        displaySize,
        devicePixelRatio: PixelRatio.get(),
        screenWidth: Dimensions.get('window').width,
      };
      const optimalVariant = getOptimalImageVariant(variants, context);
      if (!optimalVariant || optimalVariant.trim() === '') {
        logger.warn('No valid variant found for preload');
        return;
      }
      uriToLoad = getImageUrl(optimalVariant);
    } else {
      // Fallback to original image source
      if (typeof imageSource === 'string') {
        uriToLoad = imageSource;
      } else {
        const resolved = Image.resolveAssetSource(imageSource);
        uriToLoad = resolved.uri;
      }
    }
    
    // Validate URI before prefetching to prevent nil URIs
    if (!uriToLoad || uriToLoad.trim() === '') {
      logger.warn('Cannot preload image: invalid URI');
      return;
    }
    
    if (uriToLoad && !preloadedImages.has(uriToLoad)) {
      logger.info('🖼️ Preloading image:', uriToLoad);
      await Image.prefetch(uriToLoad);
      preloadedImages.add(uriToLoad);
      logger.info('✅ Image preloaded:', uriToLoad);
    }
  } catch (error) {
    logger.error('Error preloading image:', error);
  }
};

interface OptimizedImageProps extends Omit<ImageProps, 'source'> {
  variants: ImageVariants;
  componentType: 'profile' | 'deal' | 'restaurant' | 'franchise_logo';
  displaySize: { width: number; height: number };
  fallbackSource?: ImageSourcePropType;
  networkType?: 'slow-2g' | '2g' | '3g' | '4g' | 'wifi';
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  variants,
  componentType,
  displaySize,
  fallbackSource,
  networkType,
  ...props
}) => {
  const [currentVariant, setCurrentVariant] = useState<string>('');
  const [imageError, setImageError] = useState(false);
  
  useEffect(() => {
    const context: VariantContext = {
      componentType,
      displaySize,
      devicePixelRatio: PixelRatio.get(),
      screenWidth: Dimensions.get('window').width,
      networkType
    };
    
    const optimalVariant = getOptimalImageVariant(variants, context);
    setCurrentVariant(optimalVariant);
    setImageError(false);
  }, [variants, componentType, displaySize, networkType]);
  
  const handleError = () => {
    // Try fallback to smaller variant
    if (currentVariant === variants.large && variants.medium) {
      setCurrentVariant(variants.medium);
    } else if (currentVariant === variants.medium && variants.small) {
      setCurrentVariant(variants.small);
    } else if (currentVariant === variants.small && variants.thumbnail) {
      setCurrentVariant(variants.thumbnail);
    } else if (variants.original) {
      setCurrentVariant(variants.original);
    } else {
      setImageError(true);
    }
  };
  
  if (imageError && fallbackSource) {
    return <Image {...props} source={fallbackSource} />;
  }
  
  // Validate variant before creating URI to prevent nil URIs
  const imageSource = currentVariant && currentVariant.trim() !== ''
    ? (() => {
        const uri = getImageUrl(currentVariant);
        // Double-check URI is valid before using it
        if (!uri || uri.trim() === '') {
          return fallbackSource;
        }
        return { uri };
      })()
    : fallbackSource;
  
  // Ensure we never pass invalid source to Image component
  if (!imageSource || (typeof imageSource === 'object' && 'uri' in imageSource && (!imageSource.uri || imageSource.uri.trim() === ''))) {
    if (fallbackSource) {
      return <Image {...props} source={fallbackSource} />;
    }
    return null;
  }
  
  return (
    <Image
      {...props}
      source={imageSource}
      onError={handleError}
    />
  );
};

export default OptimizedImage;
