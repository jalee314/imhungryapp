/**
 * @file Deal image operations
 * Functions for managing deal images (add, remove, reorder, thumbnail)
 */

import { supabase } from '../../../lib/supabase';
import { logger } from '../../utils/logger';

import { getCurrentUserId, uploadDealImage } from './utils';

const migratePrimaryImageToDealImages = async (
  templateId: string,
  primaryImageId: string,
): Promise<boolean> => {
  const { error: migrateError } = await supabase
    .from('deal_images')
    .insert({
      deal_template_id: templateId,
      image_metadata_id: primaryImageId,
      display_order: 0,
      is_thumbnail: true,
    });

  if (migrateError) {
    logger.error('Failed to migrate primary image to deal_images:', migrateError);
    return false;
  }

  logger.info('✅ addDealImages: Successfully migrated primary image');
  return true;
};

const uploadAndInsertDealImages = async (
  imageUris: string[],
  templateId: string,
  currentImageCount: number,
): Promise<Array<{ imageMetadataId: string; url: string }>> => {
  const uploadPromises = imageUris.map(uri => uploadDealImage(uri));
  const uploadedIds = await Promise.all(uploadPromises);
  const newImages: Array<{ imageMetadataId: string; url: string }> = [];

  for (let i = 0; i < uploadedIds.length; i++) {
    const metadataId = uploadedIds[i];
    if (!metadataId) {
      logger.error('Failed to upload image:', imageUris[i]);
      continue;
    }

    const { error: insertError } = await supabase
      .from('deal_images')
      .insert({
        deal_template_id: templateId,
        image_metadata_id: metadataId,
        display_order: currentImageCount + i,
        is_thumbnail: false,
      });

    if (insertError) {
      logger.error('Failed to insert deal image:', insertError);
      continue;
    }

    const { data: metadata } = await supabase
      .from('image_metadata')
      .select('variants')
      .eq('image_metadata_id', metadataId)
      .single();

    const url = metadata?.variants?.large || metadata?.variants?.medium || metadata?.variants?.original || '';
    newImages.push({ imageMetadataId: metadataId, url });
  }

  return newImages;
};

const reassignPrimaryAndThumbnail = async (
  templateId: string,
  newPrimaryId: string,
) => {
  await supabase
    .from('deal_template')
    .update({ image_metadata_id: newPrimaryId })
    .eq('template_id', templateId);

  await supabase
    .from('deal_images')
    .update({ is_thumbnail: true })
    .eq('deal_template_id', templateId)
    .eq('image_metadata_id', newPrimaryId);
};

const cleanupDeletedImage = async (imageMetadataId: string) => {
  const { data: imageMetadata } = await supabase
    .from('image_metadata')
    .select('cloudinary_public_id')
    .eq('image_metadata_id', imageMetadataId)
    .single();

  if (imageMetadata?.cloudinary_public_id) {
    try {
      await supabase.functions.invoke('delete-cloudinary-images', {
        body: { publicIds: [imageMetadata.cloudinary_public_id] }
      });
    } catch (cloudinaryError) {
      logger.warn('Failed to delete from Cloudinary:', cloudinaryError);
    }
  }

  await supabase
    .from('image_metadata')
    .delete()
    .eq('image_metadata_id', imageMetadataId);
};

const handlePrimaryOnlyImageRemoval = async (
  dealImages: Array<{ image_metadata_id: string }>,
  templateId: string,
  imageMetadataId: string,
) => {
  logger.info('📷 removeDealImage: Removing primary-only image:', imageMetadataId);
  if (dealImages.length === 0) return;
  const newPrimaryId = dealImages[0].image_metadata_id;
  await reassignPrimaryAndThumbnail(templateId, newPrimaryId);
};

const deleteImageFromDealImages = async (
  templateId: string,
  imageMetadataId: string,
  wasThumbnail: boolean | undefined,
  dealImages: Array<{ image_metadata_id: string }>,
): Promise<string | null> => {
  const { error: deleteError } = await supabase
    .from('deal_images')
    .delete()
    .eq('deal_template_id', templateId)
    .eq('image_metadata_id', imageMetadataId);

  if (deleteError) {
    logger.error('Error deleting deal image:', deleteError);
    return 'Failed to remove image';
  }

  if (!wasThumbnail) return null;

  const remainingImages = dealImages.filter((img) => img.image_metadata_id !== imageMetadataId);
  if (remainingImages.length > 0) {
    await reassignPrimaryAndThumbnail(templateId, remainingImages[0].image_metadata_id);
  }

  return null;
};

/**
 * Add new images to an existing deal
 */
export const addDealImages = async (
  dealId: string,
  imageUris: string[]
): Promise<{ success: boolean; newImages?: Array<{ imageMetadataId: string; url: string }>; error?: string }> => {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: 'User not authenticated' };
    }

    // Get template_id, verify ownership, and get current image count
    const { data: dealInstance, error: fetchError } = await supabase
      .from('deal_instance')
      .select(`
        template_id,
        deal_template!inner(
          user_id,
          image_metadata_id,
          deal_images(image_metadata_id)
        )
      `)
      .eq('deal_id', dealId)
      .single();

    if (fetchError || !dealInstance) {
      return { success: false, error: 'Deal not found' };
    }

    if ((dealInstance.deal_template).user_id !== userId) {
      return { success: false, error: 'You can only edit your own posts' };
    }

    const template = dealInstance.deal_template;
    let currentImageCount = template.deal_images?.length || 0;
    const primaryImageId = template.image_metadata_id;
    const maxImages = 5;

    // MIGRATION: If deal_images is empty but there's a primary image on deal_template,
    // migrate that image to deal_images first
    if (currentImageCount === 0 && primaryImageId) {
      logger.info('📷 addDealImages: Migrating primary image to deal_images table:', primaryImageId);
      const migrated = await migratePrimaryImageToDealImages(dealInstance.template_id, primaryImageId);
      if (migrated) {
        currentImageCount = 1;
      }
    }

    if (currentImageCount + imageUris.length > maxImages) {
      return { success: false, error: `Cannot add more than ${maxImages} images total` };
    }

    const newImages = await uploadAndInsertDealImages(
      imageUris,
      dealInstance.template_id,
      currentImageCount,
    );

    return { success: true, newImages };
  } catch (error) {
    logger.error('Error in addDealImages:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
};

/**
 * Remove an image from a deal
 */
export const removeDealImage = async (
  dealId: string,
  imageMetadataId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: 'User not authenticated' };
    }

    // Get template_id, verify ownership, and check image count
    const { data: dealInstance, error: fetchError } = await supabase
      .from('deal_instance')
      .select(`
        template_id,
        deal_template!inner(
          user_id,
          image_metadata_id,
          deal_images(image_metadata_id, is_thumbnail)
        )
      `)
      .eq('deal_id', dealId)
      .single();

    if (fetchError || !dealInstance) {
      return { success: false, error: 'Deal not found' };
    }

    if ((dealInstance.deal_template).user_id !== userId) {
      return { success: false, error: 'You can only edit your own posts' };
    }

    const template = dealInstance.deal_template;
    const dealImages = template.deal_images || [];
    const primaryImageId = template.image_metadata_id;
    
    // Calculate total image count
    const primaryInDealImages = dealImages.some((img) => img.image_metadata_id === primaryImageId);
    const totalImageCount = dealImages.length + (primaryImageId && !primaryInDealImages && dealImages.length === 0 ? 1 : 0);
    
    if (totalImageCount <= 1) {
      return { success: false, error: 'Cannot remove the last image. A deal must have at least one photo.' };
    }

    const imageInDealImages = dealImages.find((img) => img.image_metadata_id === imageMetadataId);
    const isRemovingPrimaryOnly = !imageInDealImages && primaryImageId === imageMetadataId;

    if (isRemovingPrimaryOnly) {
      await handlePrimaryOnlyImageRemoval(dealImages, dealInstance.template_id, imageMetadataId);
    } else {
      const removalError = await deleteImageFromDealImages(
        dealInstance.template_id,
        imageMetadataId,
        imageInDealImages?.is_thumbnail,
        dealImages,
      );
      if (removalError) {
        return { success: false, error: removalError };
      }
    }
    await cleanupDeletedImage(imageMetadataId);

    return { success: true };
  } catch (error) {
    logger.error('Error in removeDealImage:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
};

/**
 * Set thumbnail/cover image for a deal
 */
export const setDealThumbnail = async (
  dealId: string,
  imageMetadataId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: 'User not authenticated' };
    }

    // Get template_id and verify ownership
    const { data: dealInstance, error: fetchError } = await supabase
      .from('deal_instance')
      .select(`
        template_id,
        deal_template!inner(user_id)
      `)
      .eq('deal_id', dealId)
      .single();

    if (fetchError || !dealInstance) {
      return { success: false, error: 'Deal not found' };
    }

    if ((dealInstance.deal_template).user_id !== userId) {
      return { success: false, error: 'You can only edit your own posts' };
    }

    // Clear existing thumbnail
    await supabase
      .from('deal_images')
      .update({ is_thumbnail: false })
      .eq('deal_template_id', dealInstance.template_id);

    // Set new thumbnail
    const { error: updateError } = await supabase
      .from('deal_images')
      .update({ is_thumbnail: true })
      .eq('deal_template_id', dealInstance.template_id)
      .eq('image_metadata_id', imageMetadataId);

    if (updateError) {
      logger.error('Error setting thumbnail:', updateError);
      return { success: false, error: 'Failed to set cover photo' };
    }

    // Also update the primary image in deal_template
    await supabase
      .from('deal_template')
      .update({ image_metadata_id: imageMetadataId })
      .eq('template_id', dealInstance.template_id);

    return { success: true };
  } catch (error) {
    logger.error('Error in setDealThumbnail:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
};

/**
 * Update image display order
 */
export const updateDealImageOrder = async (
  dealId: string,
  imageOrder: Array<{ imageMetadataId: string; displayOrder: number }>
): Promise<{ success: boolean; error?: string }> => {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: 'User not authenticated' };
    }

    // Get template_id and verify ownership
    const { data: dealInstance, error: fetchError } = await supabase
      .from('deal_instance')
      .select(`
        template_id,
        deal_template!inner(user_id)
      `)
      .eq('deal_id', dealId)
      .single();

    if (fetchError || !dealInstance) {
      return { success: false, error: 'Deal not found' };
    }

    if ((dealInstance.deal_template).user_id !== userId) {
      return { success: false, error: 'You can only edit your own posts' };
    }

    // Update each image's display order
    for (const item of imageOrder) {
      await supabase
        .from('deal_images')
        .update({ display_order: item.displayOrder })
        .eq('deal_template_id', dealInstance.template_id)
        .eq('image_metadata_id', item.imageMetadataId);
    }

    return { success: true };
  } catch (error) {
    logger.error('Error in updateDealImageOrder:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
};
