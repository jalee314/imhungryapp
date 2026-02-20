import { toByteArray } from 'base64-js';
import * as FileSystem from 'expo-file-system';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { PixelRatio, Image } from 'react-native';

import { supabase } from '../../lib/supabase';
import type { ImageType, ImageVariants, VariantContext } from '../types/image';
import { logger } from '../utils/logger';
export type { ImageType, ImageVariants, VariantContext } from '../types/image';

// Define variant thresholds based on component type
const VARIANT_THRESHOLDS = {
  profile: {
    thumbnail: 100,
    small: 200,
    medium: 400,
    large: 800
  },
  deal: {
    thumbnail: 200,
    small: 400,
    medium: 800,
    large: 1200
  },
  restaurant: {
    thumbnail: 100,
    small: 200,
    medium: 400,
    large: 800
  },
  franchise_logo: {
    thumbnail: 100,
    small: 200,
    medium: 400,
    large: 800
  }
};

const getVariantForResolution = (
  variants: ImageVariants,
  requiredWidth: number,
  componentThresholds: typeof VARIANT_THRESHOLDS[keyof typeof VARIANT_THRESHOLDS],
): string | undefined => {
  if (requiredWidth <= componentThresholds.thumbnail) {
    return variants.thumbnail || variants.small || variants.medium || variants.large || variants.original;
  }
  if (requiredWidth <= componentThresholds.small) {
    return variants.small || variants.medium || variants.large || variants.original;
  }
  if (requiredWidth <= componentThresholds.medium) {
    return variants.medium || variants.large || variants.original;
  }
  return variants.large || variants.medium || variants.original;
};

const applyNetworkVariantOverride = (
  selectedVariant: string | undefined,
  variants: ImageVariants,
  networkType: VariantContext['networkType'],
): string | undefined => {
  if (networkType === 'slow-2g' || networkType === '2g') {
    return variants.thumbnail || variants.small || selectedVariant;
  }
  if (networkType === '3g') {
    return variants.small || variants.medium || selectedVariant;
  }
  return selectedVariant;
};

export const getOptimalImageVariant = (
  variants: ImageVariants,
  context: VariantContext
): string => {
  const {
    devicePixelRatio = PixelRatio.get(),
    componentType,
    displaySize,
    networkType
  } = context;

  // Calculate required resolution (accounting for device pixel ratio)
  const requiredWidth = displaySize.width * devicePixelRatio;

  const componentThresholds = VARIANT_THRESHOLDS[componentType];

  const resolutionVariant = getVariantForResolution(variants, requiredWidth, componentThresholds);
  const selectedVariant = applyNetworkVariantOverride(resolutionVariant, variants, networkType);

  // Ensure we never return undefined - return empty string if no variant found
  if (!selectedVariant) {
    logger.warn('No image variant found, returning empty string');
    return '';
  }

  return selectedVariant;
};

const getBucketFromFilename = (filename: string): string => {
  if (filename.startsWith('user_') || filename.startsWith('avatar_')) {
    return 'avatars';
  }
  if (filename.startsWith('deal_')) {
    return 'deal-images';
  }
  if (filename.startsWith('restaurant_')) {
    return 'restaurant_images';
  }
  if (filename.startsWith('franchise_') || filename.startsWith('logo_')) {
    return 'franchise_logos';
  }
  return 'deal-images';
};

const getBucketFromPath = (path: string): string => {
  if (path.includes('avatars')) return 'avatars';
  if (path.includes('deal-images')) return 'deal-images';
  if (path.includes('restaurant_images')) return 'restaurant_images';
  if (path.includes('franchise_logos')) return 'franchise_logos';
  return 'avatars';
};

const isVariantPath = (path: string): boolean =>
  ['large/', 'medium/', 'small/', 'thumbnail/', 'original/'].some((prefix) => path.startsWith(prefix));

export const getImageUrl = (path: string): string => {
  // Validate input - prevent nil URIs from reaching networking layer
  if (!path || typeof path !== 'string' || path.trim() === '') {
    logger.warn('getImageUrl called with invalid path:', path);
    return '';
  }

  // NEW: If it's already a Cloudinary URL, return it directly
  if (path.startsWith('https://res.cloudinary.com/')) {
    return path;
  }

  // NEW: If it's any other HTTPS URL (like other CDNs), return it directly
  if (path.startsWith('https://')) {
    return path;
  }

  if (isVariantPath(path)) {
    const pathParts = path.split('/');
    const filename = pathParts[1]; // e.g., 'deal_1759533745075.jpg'
    const bucket = getBucketFromFilename(filename);
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  }

  if (path.startsWith('public/')) {
    const filename = path.replace('public/', '');
    const bucket = getBucketFromFilename(filename);
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  }

  const bucket = getBucketFromPath(path);
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
};

// Helper function to read local file as Uint8Array in React Native
const readLocalFile = async (uri: string): Promise<Uint8Array> => {
  try {
    logger.info('Reading file from URI:', uri);

    // Read file as base64 using expo-file-system
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    logger.info('File read as base64, length:', base64.length);

    if (!base64 || base64.length === 0) {
      throw new Error('File is empty or could not be read');
    }

    // Convert base64 to Uint8Array (same as your working deal image upload)
    const byteArray = toByteArray(base64);

    logger.info('Converted to Uint8Array, size:', byteArray.length, 'bytes');

    return byteArray;
  } catch (error) {
    logger.error('Error reading local file:', error);
    throw error;
  }
};

// Update processImageWithEdgeFunction to compress first
export const processImageWithEdgeFunction = async (
  imageUri: string,
  type: ImageType
): Promise<{ success: boolean; metadataId?: string; variants?: ImageVariants; error?: string }> => {
  try {
    const startTime = Date.now();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Step 0: Compress/Resize image locally using expo-image-manipulator
    // Skip if image is already optimized (e.g., from PhotoReviewModal crop)
    let uriToUpload = imageUri;
    try {
      // Check if image needs optimization by getting its info
      const imageInfo = await new Promise<{ width: number; height: number }>((resolve, reject) => {
        Image.getSize(imageUri, (width, height) => resolve({ width, height }), reject);
      });

      // Only resize if image is larger than 1200px (allow some margin above 1080)
      if (imageInfo.width > 1200) {
        logger.info(`🔄 Optimizing large image (${imageInfo.width}px) before upload...`);
        const manipResult = await manipulateAsync(
          imageUri,
          [{ resize: { width: 1080 } }], // Safe max width for mobile
          { compress: 0.8, format: SaveFormat.JPEG }
        );
        uriToUpload = manipResult.uri;
        logger.info('✅ Image optimized successfully');
      } else {
        logger.info(`✅ Image already optimized (${imageInfo.width}px), skipping resize`);
      }
    } catch (optError) {
      logger.warn('⚠️ Image optimization check failed, using original:', optError);
      // Continue with original URI
    }

    // Step 1: Upload directly to temp folder
    const filename = `temp_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
    const bucket = type === 'profile_image' ? 'avatars' :
      type === 'deal_image' ? 'deal-images' :
        type === 'restaurant_image' ? 'restaurant_images' : 'franchise_logos';

    logger.info('Uploading temp image from URI:', uriToUpload);
    logger.info('Target bucket:', bucket);

    // Read the COMPRESSED file as Uint8Array
    const readStart = Date.now();
    const byteArray = await readLocalFile(uriToUpload);
    logger.warn(`⏱️ File read took: ${Date.now() - readStart}ms`);

    const tempPath = `temp/${filename}`;

    logger.info('Uploading to temp path:', tempPath);
    logger.info('Uint8Array size:', byteArray.length, 'bytes');
    logger.info('Size in MB:', (byteArray.length / 1024 / 1024).toFixed(2), 'MB');

    // Upload the Uint8Array directly
    const uploadStart = Date.now();
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(tempPath, byteArray, {
        contentType: 'image/jpeg',
        cacheControl: '3600',
      });

    logger.warn(`⏱️ Supabase Storage upload took: ${Date.now() - uploadStart}ms`);

    if (uploadError) {
      logger.error('Upload error:', uploadError);
      throw new Error(`Failed to upload image: ${uploadError.message}`);
    }

    logger.info('Temp image uploaded successfully to:', tempPath);

    // Step 2: Call the edge function with the temp path
    const edgeStart = Date.now();
    logger.info('🚀 Invoking edge function for Cloudinary processing...');
    const edgeFunctionResponse = await supabase.functions.invoke('process-images', {
      body: {
        tempPath: tempPath,
        bucket: bucket,
        type
      }
    });
    logger.warn(`⏱️ Edge function (Cloudinary) took: ${Date.now() - edgeStart}ms`);

    if (edgeFunctionResponse.error) {
      throw new Error(`Edge function error: ${edgeFunctionResponse.error.message || JSON.stringify(edgeFunctionResponse.error)}`);
    }

    logger.info('Edge function processed image successfully');
    logger.warn(`⏱️ Total processImageWithEdgeFunction took: ${Date.now() - startTime}ms`);

    return edgeFunctionResponse.data;
  } catch (error: unknown) {
    logger.error('Error processing image:', error);
    return { success: false, error: error.message || 'Unknown error' };
  }
};
