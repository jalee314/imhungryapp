/**
 * @file Deal write operations
 * Functions for creating, updating, and deleting deals
 */

import { supabase } from '../../../lib/supabase';
import { getCurrentUserId, uploadDealImage } from './utils';
import { checkDealContentForProfanity } from './moderation';
import { CreateDealData, UpdateDealData } from './types';

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
        console.error('Failed to upload image:', dealData.imageUris[i]);
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

    console.log('📝 Attempting to insert deal template:', dealTemplateData);

    const { data: templateData, error: templateError } = await supabase
      .from('deal_template')
      .insert(dealTemplateData)
      .select('template_id')
      .single();

    if (templateError || !templateData) {
      console.error('❌ Deal template error:', templateError);
      return {
        success: false,
        error: `Failed to create deal: ${templateError?.message || 'Unknown error'}`
      };
    }

    console.log('✅ Deal template created successfully:', templateData);

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
        console.warn('Failed to insert images into deal_images:', imagesError);
      } else {
        console.log('✅ Added', imageMetadataIds.length, 'images to deal_images table');
      }
    }

    return { success: true };
  } catch (error) {
    console.error('❌ Unexpected error in createDeal:', error);
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
      console.error('Error fetching deal:', fetchError);
      return { success: false, error: 'Deal not found' };
    }

    if ((dealInstance.deal_template as any).user_id !== userId) {
      return { success: false, error: 'Unauthorized: You can only delete your own posts' };
    }

    // Get all image metadata IDs associated with this deal
    const templateImageId = (dealInstance.deal_template as any).image_metadata_id;
    const templateId = dealInstance.template_id;

    const { data: dealImages } = await supabase
      .from('deal_images')
      .select('image_metadata_id')
      .eq('deal_template_id', templateId);

    const allImageIds = new Set<string>();
    if (templateImageId) allImageIds.add(templateImageId);
    if (dealImages) {
      dealImages.forEach((img: any) => {
        if (img.image_metadata_id) allImageIds.add(img.image_metadata_id);
      });
    }

    const imageIdsToDelete = Array.from(allImageIds);

    // Delete from Cloudinary
    if (imageIdsToDelete.length > 0) {
      try {
        const { data: imageMetadataList, error: metadataError } = await supabase
          .from('image_metadata')
          .select('image_metadata_id, cloudinary_public_id')
          .in('image_metadata_id', imageIdsToDelete);

        if (!metadataError && imageMetadataList && imageMetadataList.length > 0) {
          const publicIds = imageMetadataList
            .map(img => img.cloudinary_public_id)
            .filter(id => id !== null && id !== undefined);

          if (publicIds.length > 0) {
            console.log('Deleting Cloudinary images:', publicIds.length);

            const { error: cloudinaryError } = await supabase.functions.invoke('delete-cloudinary-images', {
              body: { publicIds }
            });

            if (cloudinaryError) {
              console.warn('Failed to delete images from Cloudinary:', cloudinaryError);
            } else {
              console.log('Successfully deleted Cloudinary images');
            }
          }
        }
      } catch (cloudinaryCleanupError) {
        console.warn('Error during Cloudinary cleanup:', cloudinaryCleanupError);
      }
    }

    // Delete legacy image from Supabase Storage if it exists
    if ((dealInstance.deal_template as any).image_url) {
      const { error: storageError } = await supabase.storage
        .from('deal-images')
        .remove([(dealInstance.deal_template as any).image_url]);

      if (storageError) {
        console.warn('Failed to delete image from storage:', storageError);
      }
    }

    // Delete the deal instance
    const { error: deleteInstanceError } = await supabase
      .from('deal_instance')
      .delete()
      .eq('deal_id', dealId);

    if (deleteInstanceError) {
      console.error('Error deleting deal instance:', deleteInstanceError);
      return { success: false, error: 'Failed to delete deal' };
    }

    // Delete deal_images rows
    const { error: deleteImagesError } = await supabase
      .from('deal_images')
      .delete()
      .eq('deal_template_id', dealInstance.template_id);

    if (deleteImagesError) {
      console.warn('Failed to delete deal_images rows:', deleteImagesError);
    }

    // Delete the deal template
    const { error: deleteTemplateError } = await supabase
      .from('deal_template')
      .delete()
      .eq('template_id', dealInstance.template_id);

    if (deleteTemplateError) {
      console.error('Error deleting deal template:', deleteTemplateError);
      return { success: false, error: 'Failed to delete deal template' };
    }

    // Cleanup image_metadata records
    if (imageIdsToDelete.length > 0) {
      const { error: deleteMetadataError } = await supabase
        .from('image_metadata')
        .delete()
        .in('image_metadata_id', imageIdsToDelete);

      if (deleteMetadataError) {
        console.warn('Failed to cleanup image_metadata records:', deleteMetadataError);
      } else {
        console.log('Successfully cleaned up image_metadata records');
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Error in deleteDeal:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
};

/**
 * Update deal text fields
 */
export const updateDealFields = async (
  dealId: string,
  updates: UpdateDealData
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

    // Check for profanity if title or description changed
    if (updates.title || updates.description) {
      const profanityCheck = await checkDealContentForProfanity(
        updates.title || '',
        updates.description || ''
      );
      if (!profanityCheck.success) {
        return { success: false, error: profanityCheck.error };
      }
    }

    // Update deal_template for title/description
    if (updates.title !== undefined || updates.description !== undefined) {
      const templateUpdates: any = {};
      if (updates.title !== undefined) templateUpdates.title = updates.title;
      if (updates.description !== undefined) templateUpdates.description = updates.description;

      const { error: templateError } = await supabase
        .from('deal_template')
        .update(templateUpdates)
        .eq('template_id', dealInstance.template_id);

      if (templateError) {
        console.error('Error updating deal template:', templateError);
        return { success: false, error: 'Failed to update deal' };
      }
    }

    // Update deal_instance for expiration date and anonymous flag
    if (updates.expirationDate !== undefined || updates.isAnonymous !== undefined) {
      const instanceUpdates: any = {};
      if (updates.expirationDate !== undefined) {
        instanceUpdates.end_date = updates.expirationDate === 'Unknown' ? null : updates.expirationDate;
      }
      if (updates.isAnonymous !== undefined) instanceUpdates.is_anonymous = updates.isAnonymous;

      const { error: instanceError } = await supabase
        .from('deal_instance')
        .update(instanceUpdates)
        .eq('deal_id', dealId);

      if (instanceError) {
        console.error('Error updating deal instance:', instanceError);
        return { success: false, error: 'Failed to update deal' };
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Error in updateDealFields:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
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
