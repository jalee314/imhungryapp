/**
 * @file Deal image operations
 * Functions for managing deal images (add, remove, reorder, thumbnail)
 */

import { supabase } from '../../../lib/supabase';

import { getCurrentUserId, uploadDealImage } from './utils';

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

    if ((dealInstance.deal_template as any).user_id !== userId) {
      return { success: false, error: 'You can only edit your own posts' };
    }

    const template = dealInstance.deal_template as any;
    let currentImageCount = template.deal_images?.length || 0;
    const primaryImageId = template.image_metadata_id;
    const maxImages = 5;

    // MIGRATION: If deal_images is empty but there's a primary image on deal_template,
    // migrate that image to deal_images first
    if (currentImageCount === 0 && primaryImageId) {
      console.log('📷 addDealImages: Migrating primary image to deal_images table:', primaryImageId);
      
      const { error: migrateError } = await supabase
        .from('deal_images')
        .insert({
          deal_template_id: dealInstance.template_id,
          image_metadata_id: primaryImageId,
          display_order: 0,
          is_thumbnail: true,
        });

      if (migrateError) {
        console.error('Failed to migrate primary image to deal_images:', migrateError);
      } else {
        console.log('✅ addDealImages: Successfully migrated primary image');
        currentImageCount = 1;
      }
    }

    if (currentImageCount + imageUris.length > maxImages) {
      return { success: false, error: `Cannot add more than ${maxImages} images total` };
    }

    // Upload all images
    const uploadPromises = imageUris.map(uri => uploadDealImage(uri));
    const uploadedIds = await Promise.all(uploadPromises);

    const newImages: Array<{ imageMetadataId: string; url: string }> = [];

    for (let i = 0; i < uploadedIds.length; i++) {
      const metadataId = uploadedIds[i];
      if (!metadataId) {
        console.error('Failed to upload image:', imageUris[i]);
        continue;
      }

      const { error: insertError } = await supabase
        .from('deal_images')
        .insert({
          deal_template_id: dealInstance.template_id,
          image_metadata_id: metadataId,
          display_order: currentImageCount + i,
          is_thumbnail: false,
        });

      if (insertError) {
        console.error('Failed to insert deal image:', insertError);
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

    return { success: true, newImages };
  } catch (error) {
    console.error('Error in addDealImages:', error);
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

    if ((dealInstance.deal_template as any).user_id !== userId) {
      return { success: false, error: 'You can only edit your own posts' };
    }

    const template = dealInstance.deal_template as any;
    const dealImages = template.deal_images || [];
    const primaryImageId = template.image_metadata_id;
    
    // Calculate total image count
    const primaryInDealImages = dealImages.some((img: any) => img.image_metadata_id === primaryImageId);
    const totalImageCount = dealImages.length + (primaryImageId && !primaryInDealImages && dealImages.length === 0 ? 1 : 0);
    
    if (totalImageCount <= 1) {
      return { success: false, error: 'Cannot remove the last image. A deal must have at least one photo.' };
    }

    const imageInDealImages = dealImages.find((img: any) => img.image_metadata_id === imageMetadataId);
    const isRemovingPrimaryOnly = !imageInDealImages && primaryImageId === imageMetadataId;

    // Get Cloudinary public ID for deletion
    const { data: imageMetadata } = await supabase
      .from('image_metadata')
      .select('cloudinary_public_id')
      .eq('image_metadata_id', imageMetadataId)
      .single();

    if (isRemovingPrimaryOnly) {
      console.log('📷 removeDealImage: Removing primary-only image:', imageMetadataId);
      
      if (dealImages.length > 0) {
        const newPrimaryId = dealImages[0].image_metadata_id;
        await supabase
          .from('deal_template')
          .update({ image_metadata_id: newPrimaryId })
          .eq('template_id', dealInstance.template_id);
        
        await supabase
          .from('deal_images')
          .update({ is_thumbnail: true })
          .eq('deal_template_id', dealInstance.template_id)
          .eq('image_metadata_id', newPrimaryId);
      }
    } else {
      const wasThumbnail = imageInDealImages?.is_thumbnail;

      const { error: deleteError } = await supabase
        .from('deal_images')
        .delete()
        .eq('deal_template_id', dealInstance.template_id)
        .eq('image_metadata_id', imageMetadataId);

      if (deleteError) {
        console.error('Error deleting deal image:', deleteError);
        return { success: false, error: 'Failed to remove image' };
      }

      if (wasThumbnail) {
        const remainingImages = dealImages.filter((img: any) => img.image_metadata_id !== imageMetadataId);
        if (remainingImages.length > 0) {
          await supabase
            .from('deal_images')
            .update({ is_thumbnail: true })
            .eq('deal_template_id', dealInstance.template_id)
            .eq('image_metadata_id', remainingImages[0].image_metadata_id);

          await supabase
            .from('deal_template')
            .update({ image_metadata_id: remainingImages[0].image_metadata_id })
            .eq('template_id', dealInstance.template_id);
        }
      }
    }

    // Delete from Cloudinary
    if (imageMetadata?.cloudinary_public_id) {
      try {
        await supabase.functions.invoke('delete-cloudinary-images', {
          body: { publicIds: [imageMetadata.cloudinary_public_id] }
        });
      } catch (cloudinaryError) {
        console.warn('Failed to delete from Cloudinary:', cloudinaryError);
      }
    }

    // Delete from image_metadata
    await supabase
      .from('image_metadata')
      .delete()
      .eq('image_metadata_id', imageMetadataId);

    return { success: true };
  } catch (error) {
    console.error('Error in removeDealImage:', error);
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

    if ((dealInstance.deal_template as any).user_id !== userId) {
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
      console.error('Error setting thumbnail:', updateError);
      return { success: false, error: 'Failed to set cover photo' };
    }

    // Also update the primary image in deal_template
    await supabase
      .from('deal_template')
      .update({ image_metadata_id: imageMetadataId })
      .eq('template_id', dealInstance.template_id);

    return { success: true };
  } catch (error) {
    console.error('Error in setDealThumbnail:', error);
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

    if ((dealInstance.deal_template as any).user_id !== userId) {
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
    console.error('Error in updateDealImageOrder:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
};
