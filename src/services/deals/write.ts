/**
 * @file Deal write operations
 * Functions for creating, updating, and deleting deals
 */

import { supabase } from '../../../lib/supabase';

import { CreateDealData } from './types';
import { getCurrentUserId, uploadDealImage } from './utils';

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

    // --- Parallel cleanup: Cloudinary + legacy storage can run concurrently ---
    const cleanupPromises: Promise<void>[] = [];

    // Cloudinary cleanup
    if (imageIdsToDelete.length > 0) {
      cleanupPromises.push(
        (async () => {
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
        })()
      );
    }

    // Legacy storage cleanup
    if ((dealInstance.deal_template as any).image_url) {
      cleanupPromises.push(
        (async () => {
          const { error: storageError } = await supabase.storage
            .from('deal-images')
            .remove([(dealInstance.deal_template as any).image_url]);
          if (storageError) {
            console.warn('Failed to delete image from storage:', storageError);
          }
        })()
      );
    }

    // Wait for all external cleanup to finish before deleting DB rows
    await Promise.all(cleanupPromises);

    // --- Parallel DB deletes: deal_instance + deal_images are independent ---
    const [instanceResult, imagesResult] = await Promise.all([
      supabase.from('deal_instance').delete().eq('deal_id', dealId),
      supabase.from('deal_images').delete().eq('deal_template_id', dealInstance.template_id),
    ]);

    if (instanceResult.error) {
      console.error('Error deleting deal instance:', instanceResult.error);
      return { success: false, error: 'Failed to delete deal' };
    }
    if (imagesResult.error) {
      console.warn('Failed to delete deal_images rows:', imagesResult.error);
    }

    // Delete the deal template (must be after instance + images due to FK constraints)
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
