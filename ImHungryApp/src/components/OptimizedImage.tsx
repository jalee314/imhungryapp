import React, { useState, useEffect } from 'react';
import { Image, ImageProps, PixelRatio, Dimensions } from 'react-native';
import { getOptimalImageVariant, getImageUrl, ImageVariants, VariantContext } from '../services/imageProcessingService';

// Static set to track preloaded images
const preloadedImages = new Set<string>();

/**
 * Preload an image before displaying it
 */
export const preloadImage = async (imageSource: any, variants?: ImageVariants, displaySize?: { width: number; height: number }) => {
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
    
    if (uriToLoad && !preloadedImages.has(uriToLoad)) {
      console.log('🖼️ Preloading image:', uriToLoad);
      await Image.prefetch(uriToLoad);
      preloadedImages.add(uriToLoad);
      console.log('✅ Image preloaded:', uriToLoad);
    }
  } catch (error) {
    console.error('Error preloading image:', error);
  }
};

interface OptimizedImageProps extends Omit<ImageProps, 'source'> {
  variants: ImageVariants;
  componentType: 'profile' | 'deal' | 'restaurant' | 'franchise_logo';
  displaySize: { width: number; height: number };
  fallbackSource?: any;
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
  
  const imageSource = currentVariant 
    ? { uri: getImageUrl(currentVariant) }
    : fallbackSource;
  
  return (
    <Image
      {...props}
      source={imageSource}
      onError={handleError}
    />
  );
};

export default OptimizedImage;
