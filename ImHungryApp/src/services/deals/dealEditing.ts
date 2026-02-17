/**
 * @file Deal editing operations
 * Functions for fetching deal data for editing and updating deal fields
 */

import { supabase } from '../../../lib/supabase';
import { getCurrentUserId } from './utils';
import { checkDealContentForProfanity } from './moderation';
import { DealEditData, UpdateDealData } from './types';

/**
 * Fetch deal data for editing
 */
export const fetchDealForEdit = async (
  dealId: string
): Promise<{ success: boolean; data?: DealEditData; error?: string }> => {
  try {
    console.log('📝 fetchDealForEdit: Starting to fetch deal:', dealId);
    
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
      console.error('❌ fetchDealForEdit: Error fetching deal:', fetchError);
      return { success: false, error: 'Deal not found' };
    }

    const template = dealInstance.deal_template as any;
    console.log('📝 fetchDealForEdit: Deal template data:', {
      templateId: template.template_id,
      imageMetadataId: template.image_metadata_id,
      hasImageMetadata: !!template.image_metadata,
      dealImagesCount: template.deal_images?.length || 0,
      dealImages: template.deal_images?.map((img: any) => ({
        id: img.image_metadata_id,
        hasVariants: !!img.image_metadata?.variants,
      })),
    });

    if (template.user_id !== userId) {
      return { success: false, error: 'You can only edit your own posts' };
    }

    let images = (template.deal_images || [])
      .map((img: any) => ({
        imageMetadataId: img.image_metadata_id,
        displayOrder: img.display_order,
        isThumbnail: img.is_thumbnail,
        url: img.image_metadata?.variants?.large || 
             img.image_metadata?.variants?.medium || 
             img.image_metadata?.variants?.original || '',
      }))
      .filter((img: any) => img.url !== '')
      .sort((a: any, b: any) => a.displayOrder - b.displayOrder);

    console.log('📷 fetchDealForEdit: Images from deal_images table:', images.length);

    // Fallback to primary image on deal_template
    if (images.length === 0 && template.image_metadata) {
      console.log('📷 fetchDealForEdit: Using fallback - primary image from deal_template');
      const primaryUrl = template.image_metadata.variants?.large ||
                        template.image_metadata.variants?.medium ||
                        template.image_metadata.variants?.original || '';
      if (primaryUrl) {
        images = [{
          imageMetadataId: template.image_metadata_id,
          displayOrder: 0,
          isThumbnail: true,
          url: primaryUrl,
        }];
        console.log('✅ fetchDealForEdit: Found primary image:', primaryUrl.substring(0, 50) + '...');
      }
    }

    console.log('✅ fetchDealForEdit: Final image count:', images.length);

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
    console.error('Error in fetchDealForEdit:', error);
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
