import { PixelRatio, Dimensions } from 'react-native';
import { supabase } from '../../lib/supabase';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { toByteArray } from 'base64-js';

// Define the allowed image types as a union type
export type ImageType = 'profile_image' | 'deal_image' | 'restaurant_image' | 'franchise_logo_image';

export interface ImageVariants {
  original?: string;
  large?: string;
  medium?: string;
  small?: string;
  thumbnail?: string;
}

export interface VariantContext {
  devicePixelRatio?: number;
  screenWidth?: number;
  componentType: 'profile' | 'deal' | 'restaurant' | 'franchise_logo';
  displaySize: { width: number; height: number };
  networkType?: 'slow-2g' | '2g' | '3g' | '4g' | 'wifi';
}

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

export const getOptimalImageVariant = (
  variants: ImageVariants,
  context: VariantContext
): string => {
  const { 
    devicePixelRatio = PixelRatio.get(), 
    screenWidth = Dimensions.get('window').width,
    componentType, 
    displaySize,
    networkType 
  } = context;
  
  // Calculate required resolution (accounting for device pixel ratio)
  const requiredWidth = displaySize.width * devicePixelRatio;
  const requiredHeight = displaySize.height * devicePixelRatio;
  
  const componentThresholds = VARIANT_THRESHOLDS[componentType];
  
  // Select variant based on required resolution
  let selectedVariant: string;
  
  if (requiredWidth <= componentThresholds.thumbnail) {
    selectedVariant = variants.thumbnail || variants.small || variants.medium || variants.large || variants.original;
  } else if (requiredWidth <= componentThresholds.small) {
    selectedVariant = variants.small || variants.medium || variants.large || variants.original;
  } else if (requiredWidth <= componentThresholds.medium) {
    selectedVariant = variants.medium || variants.large || variants.original;
  } else {
    selectedVariant = variants.large || variants.medium || variants.original;
  }
  
  // If network is slow, prefer smaller variants
  if (networkType === 'slow-2g' || networkType === '2g') {
    if (variants.thumbnail) selectedVariant = variants.thumbnail;
    else if (variants.small) selectedVariant = variants.small;
  } else if (networkType === '3g') {
    if (variants.small) selectedVariant = variants.small;
    else if (variants.medium) selectedVariant = variants.medium;
  }
  
  return selectedVariant;
};

export const getImageUrl = (path: string): string => {
  // NEW: If it's already a Cloudinary URL, return it directly
  if (path.startsWith('https://res.cloudinary.com/')) {
    return path;
  }
  
  // NEW: If it's any other HTTPS URL (like other CDNs), return it directly
  if (path.startsWith('https://')) {
    return path;
  }
  
  // Existing logic for Supabase Storage paths
  let bucket: string;
  
  // Handle paths that start with variant folders (large/, medium/, etc.)
  if (path.startsWith('large/') || path.startsWith('medium/') || 
      path.startsWith('small/') || path.startsWith('thumbnail/') || 
      path.startsWith('original/') || path.startsWith('public/')) {
    
    // Extract the variant folder and filename
    const pathParts = path.split('/');
    const variant = pathParts[0]; // e.g., 'large', 'medium', etc.
    const filename = pathParts[1]; // e.g., 'deal_1759533745075.jpg'
    
    // Determine bucket based on filename patterns
    if (filename.startsWith('user_') || filename.startsWith('avatar_')) {
      bucket = 'avatars';
    } else if (filename.startsWith('deal_')) {
      bucket = 'deal-images';
    } else if (filename.startsWith('restaurant_')) {
      bucket = 'restaurant_images';
    } else if (filename.startsWith('franchise_') || filename.startsWith('logo_')) {
      bucket = 'franchise_logos';
    } else {
      // Default fallback for deal images
      bucket = 'deal-images';
    }
    
    // Use the full path for the URL
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  }
  
  // Handle paths that start with 'public/' (legacy format)
  if (path.startsWith('public/')) {
    const filename = path.replace('public/', '');
    
    // Determine bucket based on filename patterns
    if (filename.startsWith('user_') || filename.startsWith('avatar_')) {
      bucket = 'avatars';
    } else if (filename.startsWith('deal_')) {
      bucket = 'deal-images';
    } else if (filename.startsWith('restaurant_')) {
      bucket = 'restaurant_images';
    } else if (filename.startsWith('franchise_') || filename.startsWith('logo_')) {
      bucket = 'franchise_logos';
    } else {
      bucket = 'deal-images';
    }
    
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  }
  
  // Handle paths without prefix (fallback)
  if (path.includes('avatars')) {
    bucket = 'avatars';
  } else if (path.includes('deal-images')) {
    bucket = 'deal-images';
  } else if (path.includes('restaurant_images')) {
    bucket = 'restaurant_images';
  } else if (path.includes('franchise_logos')) {
    bucket = 'franchise_logos';
  } else {
    bucket = 'avatars';
  }
  
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
};

// Helper function to read local file as Uint8Array in React Native
const readLocalFile = async (uri: string): Promise<Uint8Array> => {
  try {
    console.log('Reading file from URI:', uri);
    
    // Read file as base64 using expo-file-system
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    
    console.log('File read as base64, length:', base64.length);
    
    if (!base64 || base64.length === 0) {
      throw new Error('File is empty or could not be read');
    }
    
    // Convert base64 to Uint8Array (same as your working deal image upload)
    const byteArray = toByteArray(base64);
    
    console.log('Converted to Uint8Array, size:', byteArray.length, 'bytes');
    
    return byteArray;
  } catch (error) {
    console.error('Error reading local file:', error);
    throw error;
  }
};

// Update processImageWithEdgeFunction to compress first
export const processImageWithEdgeFunction = async (
  imageUri: string,
  type: ImageType
): Promise<{ success: boolean; metadataId?: string; variants?: ImageVariants; error?: string }> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');
    
    // Step 1: Upload directly to temp folder
    const filename = `temp_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
    const bucket = type === 'profile_image' ? 'avatars' : 
                   type === 'deal_image' ? 'deal-images' :
                   type === 'restaurant_image' ? 'restaurant_images' : 'franchise_logos';
    
    console.log('Uploading temp image from URI:', imageUri);
    console.log('Target bucket:', bucket);
    console.log('Target filename:', filename);
    
    // Read the COMPRESSED file as Uint8Array
    const byteArray = await readLocalFile(imageUri);
    
    const tempPath = `temp/${filename}`;
    
    console.log('Uploading to temp path:', tempPath);
    console.log('Uint8Array size:', byteArray.length, 'bytes');
    console.log('Size in MB:', (byteArray.length / 1024 / 1024).toFixed(2), 'MB');
    
    // Upload the Uint8Array directly
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(tempPath, byteArray, {
        contentType: 'image/jpeg',
        cacheControl: '3600',
      });
    
    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw new Error(`Failed to upload image: ${uploadError.message}`);
    }
    
    console.log('Temp image uploaded successfully to:', tempPath);
    console.log('Upload data:', uploadData);
    
    // Step 2: Call the edge function with the temp path
    const edgeFunctionResponse = await supabase.functions.invoke('process-images', {
      body: {
        tempPath: tempPath,
        bucket: bucket,
        type 
      }
    });
    
    if (edgeFunctionResponse.error) {
      throw new Error(`Edge function error: ${edgeFunctionResponse.error.message || JSON.stringify(edgeFunctionResponse.error)}`);
    }
    
    console.log('Edge function processed image successfully');
    
    return edgeFunctionResponse.data;
  } catch (error) {
    console.error('Error processing image:', error);
    return { success: false, error: error.message };
  }
};

export const getOptimizedImageUrl = (
  variants: ImageVariants,
  context: VariantContext
): string => {
  const selectedVariant = getOptimalImageVariant(variants, context);
  return getImageUrl(selectedVariant);
};



