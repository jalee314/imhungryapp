/**
 * @file Deal editing operations
 * Functions for fetching deal data for editing and updating deal fields
 */

import { supabase } from '../../../lib/supabase';
import { logger } from '../../utils/logger';

import { checkDealContentForProfanity } from './moderation';
import { DealEditData, UpdateDealData } from './types';
import { getCurrentUserId } from './utils';

const getImageUrlFromVariants = (
  variants?: { large?: string; medium?: string; original?: string },
): string => variants?.large || variants?.medium || variants?.original || '';

const buildDealEditImages = (
  template: DealEditData['images'][number] & {
    deal_images?: Array<{
      image_metadata_id: string;
      display_order: number;
      is_thumbnail: boolean;
      image_metadata?: { variants?: { large?: string; medium?: string; original?: string } };
    }>;
    image_metadata?: { variants?: { large?: string; medium?: string; original?: string } };
    image_metadata_id: string;
  },
) => {
  const mappedImages = (template.deal_images || [])
    .map((img) => ({
      imageMetadataId: img.image_metadata_id,
      displayOrder: img.display_order,
      isThumbnail: img.is_thumbnail,
      url: getImageUrlFromVariants(img.image_metadata?.variants),
    }))
    .filter((img) => img.url !== '')
    .sort((a, b) => a.displayOrder - b.displayOrder);

  if (mappedImages.length > 0 || !template.image_metadata) {
    return mappedImages;
  }

  const primaryUrl = getImageUrlFromVariants(template.image_metadata.variants);
  if (!primaryUrl) return mappedImages;

  return [{
    imageMetadataId: template.image_metadata_id,
    displayOrder: 0,
    isThumbnail: true,
    url: primaryUrl,
  }];
};

const buildTemplateUpdates = (updates: UpdateDealData): { title?: string; description?: string } => {
  const templateUpdates: { title?: string; description?: string } = {};
  if (updates.title !== undefined) templateUpdates.title = updates.title;
  if (updates.description !== undefined) templateUpdates.description = updates.description;
  return templateUpdates;
};

const buildInstanceUpdates = (updates: UpdateDealData): { end_date?: string | null; is_anonymous?: boolean } => {
  const instanceUpdates: { end_date?: string | null; is_anonymous?: boolean } = {};
  if (updates.expirationDate !== undefined) {
    instanceUpdates.end_date = updates.expirationDate === 'Unknown' ? null : updates.expirationDate;
  }
  if (updates.isAnonymous !== undefined) {
    instanceUpdates.is_anonymous = updates.isAnonymous;
  }
  return instanceUpdates;
};

/**
 * Fetch deal data for editing
 */
export const fetchDealForEdit = async (
  dealId: string
): Promise<{ success: boolean; data?: DealEditData; error?: string }> => {
  try {
    logger.info('📝 fetchDealForEdit: Starting to fetch deal:', dealId);
    
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: 'User not authenticated' };
    }

    const { data: dealInstance, error: fetchError } = await supabase
      .from('deal_instance')
      .select(`
        deal_id,
        template_id,
        end_date,
        is_anonymous,
        deal_template!inner(
          template_id,
          user_id,
          title,
          description,
          restaurant_id,
          category_id,
          cuisine_id,
          image_metadata_id,
          image_metadata:image_metadata_id(
            image_metadata_id,
            variants
          ),
          restaurant:restaurant_id(
            restaurant_id,
            name,
            address
          ),
          deal_images(
            image_metadata_id,
            display_order,
            is_thumbnail,
            image_metadata:image_metadata_id(
              variants
            )
          )
        )
      `)
      .eq('deal_id', dealId)
      .single();

    if (fetchError || !dealInstance) {
      logger.error('❌ fetchDealForEdit: Error fetching deal:', fetchError);
      return { success: false, error: 'Deal not found' };
    }

    const template = dealInstance.deal_template;
    logger.info('📝 fetchDealForEdit: Deal template data:', {
      templateId: template.template_id,
      imageMetadataId: template.image_metadata_id,
      hasImageMetadata: !!template.image_metadata,
      dealImagesCount: template.deal_images?.length || 0,
      dealImages: template.deal_images?.map((img) => ({
        id: img.image_metadata_id,
        hasVariants: !!img.image_metadata?.variants,
      })),
    });

    if (template.user_id !== userId) {
      return { success: false, error: 'You can only edit your own posts' };
    }

    let images = buildDealEditImages(template);

    logger.info('📷 fetchDealForEdit: Images from deal_images table:', images.length);

    // Fallback to primary image on deal_template
    if (images.length === 0 && template.image_metadata) {
      logger.info('📷 fetchDealForEdit: Using fallback - primary image from deal_template');
      const primaryUrl = getImageUrlFromVariants(template.image_metadata.variants);
      if (primaryUrl) {
        images = [{
          imageMetadataId: template.image_metadata_id,
          displayOrder: 0,
          isThumbnail: true,
          url: primaryUrl,
        }];
        logger.info('✅ fetchDealForEdit: Found primary image:', primaryUrl.substring(0, 50) + '...');
      }
    }

    logger.info('✅ fetchDealForEdit: Final image count:', images.length);

    return {
      success: true,
      data: {
        templateId: template.template_id,
        dealId: dealInstance.deal_id,
        title: template.title,
        description: template.description,
        expirationDate: dealInstance.end_date,
        restaurantId: template.restaurant_id,
        restaurantName: template.restaurant?.name || '',
        restaurantAddress: template.restaurant?.address || '',
        categoryId: template.category_id,
        cuisineId: template.cuisine_id,
        isAnonymous: dealInstance.is_anonymous,
        images,
      },
    };
  } catch (error) {
    logger.error('Error in fetchDealForEdit:', error);
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

    if ((dealInstance.deal_template).user_id !== userId) {
      return { success: false, error: 'You can only edit your own posts' };
    }

    if (updates.title || updates.description) {
      const profanityCheck = await checkDealContentForProfanity(
        updates.title || '',
        updates.description || ''
      );
      if (!profanityCheck.success) {
        return { success: false, error: profanityCheck.error };
      }
    }

    const templateUpdates = buildTemplateUpdates(updates);
    if (Object.keys(templateUpdates).length > 0) {
      const { error: templateError } = await supabase
        .from('deal_template')
        .update(templateUpdates)
        .eq('template_id', dealInstance.template_id);

      if (templateError) {
        logger.error('Error updating deal template:', templateError);
        return { success: false, error: 'Failed to update deal' };
      }
    }

    const instanceUpdates = buildInstanceUpdates(updates);
    if (Object.keys(instanceUpdates).length > 0) {
      const { error: instanceError } = await supabase
        .from('deal_instance')
        .update(instanceUpdates)
        .eq('deal_id', dealId);

      if (instanceError) {
        logger.error('Error updating deal instance:', instanceError);
        return { success: false, error: 'Failed to update deal' };
      }
    }

    return { success: true };
  } catch (error) {
    logger.error('Error in updateDealFields:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
};
