/**
 * @file Deal write operations
 * Functions for creating, updating, and deleting deals
 */

import { supabase } from '../../../lib/supabase';
import { logger } from '../../utils/logger';

import { CreateDealData } from './types';
import { getCurrentUserId, uploadDealImage } from './utils';

const cleanupCloudinaryImages = async (imageIdsToDelete: string[]): Promise<void> => {
  if (imageIdsToDelete.length === 0) return;

  try {
    const { data: imageMetadataList, error: metadataError } = await supabase
      .from('image_metadata')
      .select('image_metadata_id, cloudinary_public_id')
      .in('image_metadata_id', imageIdsToDelete);

    if (metadataError || !imageMetadataList || imageMetadataList.length === 0) {
      return;
    }

    const publicIds = imageMetadataList
      .map(img => img.cloudinary_public_id)
      .filter(id => id !== null && id !== undefined);

    if (publicIds.length === 0) return;

    logger.info('Deleting Cloudinary images:', publicIds.length);
    const { error: cloudinaryError } = await supabase.functions.invoke('delete-cloudinary-images', {
      body: { publicIds }
    });

    if (cloudinaryError) {
      logger.warn('Failed to delete images from Cloudinary:', cloudinaryError);
    } else {
      logger.info('Successfully deleted Cloudinary images');
    }
  } catch (cloudinaryCleanupError) {
    logger.warn('Error during Cloudinary cleanup:', cloudinaryCleanupError);
  }
};

/**
 * Create a new deal template (database trigger will create instance)
 */
export const createDeal = async (
  dealData: CreateDealData
): Promise<{ success: boolean; error?: string }> => {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: 'No authenticated user found' };
    }

    // Upload all images in parallel
    const uploadPromises = dealData.imageUris.map(uri => uploadDealImage(uri));
    const uploadedIds = await Promise.all(uploadPromises);

    // Check for any failures
    const imageMetadataIds: string[] = [];
    for (let i = 0; i < uploadedIds.length; i++) {
      const id = uploadedIds[i];
      if (!id) {
        logger.error('Failed to upload image:', dealData.imageUris[i]);
        return { success: false, error: 'Failed to upload one or more images' };
      }
      imageMetadataIds.push(id);
    }

    // Use the thumbnail image as the primary image in deal_template
    const thumbnailIndex = Math.min(dealData.thumbnailIndex, imageMetadataIds.length - 1);
    const primaryMetadataId = imageMetadataIds.length > 0 ? imageMetadataIds[thumbnailIndex] : null;

    const dealTemplateData = {
      restaurant_id: dealData.restaurantId,
      user_id: userId,
      title: dealData.title,
      description: dealData.description || null,
      image_metadata_id: primaryMetadataId,
      category_id: dealData.categoryId,
      cuisine_id: dealData.cuisineId,
      is_anonymous: dealData.isAnonymous,
      source_type: 'community_uploaded',
    };

    logger.info('📝 Attempting to insert deal template:', dealTemplateData);

    const { data: templateData, error: templateError } = await supabase
      .from('deal_template')
      .insert(dealTemplateData)
      .select('template_id')
      .single();

    if (templateError || !templateData) {
      logger.error('❌ Deal template error:', templateError);
      return {
        success: false,
        error: `Failed to create deal: ${templateError?.message || 'Unknown error'}`
      };
    }

    logger.info('✅ Deal template created successfully:', templateData);

    // Insert all images into deal_images junction table
    if (imageMetadataIds.length > 0) {
      const dealImagesData = imageMetadataIds.map((metadataId, index) => ({
        deal_template_id: templateData.template_id,
        image_metadata_id: metadataId,
        display_order: index,
        is_thumbnail: index === thumbnailIndex,
      }));

      const { error: imagesError } = await supabase
        .from('deal_images')
        .insert(dealImagesData);

      if (imagesError) {
        logger.warn('Failed to insert images into deal_images:', imagesError);
      } else {
        logger.info('✅ Added', imageMetadataIds.length, 'images to deal_images table');
      }
    }

    return { success: true };
  } catch (error) {
    logger.error('❌ Unexpected error in createDeal:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
};

/**
 * Delete a deal (both instance and template)
 */
export const deleteDeal = async (
  dealId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: 'User not authenticated' };
    }

    // First, get the deal instance to find the template_id and verify ownership
    const { data: dealInstance, error: fetchError } = await supabase
      .from('deal_instance')
      .select(`
        template_id,
        deal_template!inner(
          user_id,
          image_url,
          image_metadata_id
        )
      `)
      .eq('deal_id', dealId)
      .single();

    if (fetchError || !dealInstance) {
      logger.error('Error fetching deal:', fetchError);
      return { success: false, error: 'Deal not found' };
    }

    if ((dealInstance.deal_template).user_id !== userId) {
      return { success: false, error: 'Unauthorized: You can only delete your own posts' };
    }

    // Get all image metadata IDs associated with this deal
    const templateImageId = (dealInstance.deal_template).image_metadata_id;
    const templateId = dealInstance.template_id;

    const { data: dealImages } = await supabase
      .from('deal_images')
      .select('image_metadata_id')
      .eq('deal_template_id', templateId);

    const allImageIds = new Set<string>();
    if (templateImageId) allImageIds.add(templateImageId);
    if (dealImages) {
      dealImages.forEach((img) => {
        if (img.image_metadata_id) allImageIds.add(img.image_metadata_id);
      });
    }

    const imageIdsToDelete = Array.from(allImageIds);

    // Delete from Cloudinary
    await cleanupCloudinaryImages(imageIdsToDelete);

    // Delete legacy image from Supabase Storage if it exists
    if ((dealInstance.deal_template).image_url) {
      const { error: storageError } = await supabase.storage
        .from('deal-images')
        .remove([(dealInstance.deal_template).image_url]);

      if (storageError) {
        logger.warn('Failed to delete image from storage:', storageError);
      }
    }

    // Delete the deal instance
    const { error: deleteInstanceError } = await supabase
      .from('deal_instance')
      .delete()
      .eq('deal_id', dealId);

    if (deleteInstanceError) {
      logger.error('Error deleting deal instance:', deleteInstanceError);
      return { success: false, error: 'Failed to delete deal' };
    }

    // Delete deal_images rows
    const { error: deleteImagesError } = await supabase
      .from('deal_images')
      .delete()
      .eq('deal_template_id', dealInstance.template_id);

    if (deleteImagesError) {
      logger.warn('Failed to delete deal_images rows:', deleteImagesError);
    }

    // Delete the deal template
    const { error: deleteTemplateError } = await supabase
      .from('deal_template')
      .delete()
      .eq('template_id', dealInstance.template_id);

    if (deleteTemplateError) {
      logger.error('Error deleting deal template:', deleteTemplateError);
      return { success: false, error: 'Failed to delete deal template' };
    }

    // Cleanup image_metadata records
    if (imageIdsToDelete.length > 0) {
      const { error: deleteMetadataError } = await supabase
        .from('image_metadata')
        .delete()
        .in('image_metadata_id', imageIdsToDelete);

      if (deleteMetadataError) {
        logger.warn('Failed to cleanup image_metadata records:', deleteMetadataError);
      } else {
        logger.info('Successfully cleaned up image_metadata records');
      }
    }

    return { success: true };
  } catch (error) {
    logger.error('Error in deleteDeal:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
};
