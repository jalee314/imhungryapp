import { supabase } from '../../../lib/supabase';
import { logAction } from './core';
import type { Deal, ServiceResult } from './types';

export async function getDeals(searchQuery?: string, limit: number = 100): Promise<Deal[]> {
  try {
    const query = supabase
      .from('deal_instance')
      .select(`
        deal_id,
        template_id,
        created_at,
        start_date,
        end_date,
        deal_template:template_id(
          title,
          description,
          image_metadata_id,
          user_id,
          restaurant!inner(
            name,
            address
          ),
          category(
            category_name
          ),
          cuisine(
            cuisine_name
          ),
          image_metadata:image_metadata_id(
            variants
          ),
          deal_images (
            image_metadata_id,
            display_order,
            is_thumbnail,
            image_metadata:image_metadata_id (
              variants
            )
          )
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    const { data, error } = await query;
    if (error) throw error;

    let results = data || [];
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      results = results.filter((deal: any) =>
        deal.deal_template?.title?.toLowerCase().includes(lowerQuery) ||
        deal.deal_template?.description?.toLowerCase().includes(lowerQuery)
      );
    }

    return results.map((deal: any) => {
      let imageUrl = null;
      const dealImages = deal.deal_template?.deal_images || [];
      const sortedDealImages = [...dealImages].sort((a: any, b: any) =>
        (a.display_order ?? 999) - (b.display_order ?? 999)
      );
      const firstImageByOrder = sortedDealImages.find((img: any) => img.image_metadata?.variants);
      const thumbnailImage = !firstImageByOrder ? dealImages.find((img: any) => img.is_thumbnail && img.image_metadata?.variants) : null;

      if (firstImageByOrder?.image_metadata?.variants) {
        const variants = firstImageByOrder.image_metadata.variants;
        imageUrl = variants.medium || variants.large || variants.original || variants.small || null;
      } else if (thumbnailImage?.image_metadata?.variants) {
        const variants = thumbnailImage.image_metadata.variants;
        imageUrl = variants.medium || variants.large || variants.original || variants.small || null;
      } else if (deal.deal_template?.image_metadata?.variants) {
        const variants = deal.deal_template.image_metadata.variants;
        imageUrl = variants.medium || variants.large || variants.original || variants.small || null;
      }

      return {
        deal_instance_id: deal.deal_id,
        deal_template_id: deal.template_id,
        title: deal.deal_template?.title || 'Unknown',
        description: deal.deal_template?.description || '',
        image_url: imageUrl,
        expiration_date: deal.end_date || null,
        restaurant_name: deal.deal_template?.restaurant?.name || 'Unknown',
        restaurant_address: deal.deal_template?.restaurant?.address || '',
        uploader_user_id: deal.deal_template?.user_id || '',
        category_name: deal.deal_template?.category?.category_name || null,
        cuisine_name: deal.deal_template?.cuisine?.cuisine_name || null,
        created_at: deal.created_at,
      };
    });
  } catch (error) {
    console.error('Error fetching deals:', error);
    return [];
  }
}

export async function updateDeal(
  dealInstanceId: string,
  updates: {
    title?: string;
    description?: string;
    expiration_date?: string;
    image_metadata_id?: string | null;
  }
): Promise<ServiceResult> {
  try {
    const { data: dealInstance, error: fetchError } = await supabase
      .from('deal_instance')
      .select('template_id')
      .eq('deal_id', dealInstanceId)
      .single();

    if (fetchError) throw fetchError;

    const templateUpdates: any = {};
    if (updates.title) templateUpdates.title = updates.title;
    if (updates.description) templateUpdates.description = updates.description;
    if (updates.image_metadata_id !== undefined) templateUpdates.image_metadata_id = updates.image_metadata_id;

    if (Object.keys(templateUpdates).length > 0) {
      const { error } = await supabase
        .from('deal_template')
        .update(templateUpdates)
        .eq('template_id', dealInstance.template_id);

      if (error) throw error;
    }

    if (updates.expiration_date) {
      const { error: instanceError } = await supabase
        .from('deal_instance')
        .update({ end_date: updates.expiration_date })
        .eq('deal_id', dealInstanceId);

      if (instanceError) throw instanceError;
    }

    await logAction('edit_deal', 'deal', dealInstanceId, updates);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteDeal(dealInstanceId: string): Promise<ServiceResult> {
  try {
    const { data: dealInstance, error: fetchError } = await supabase
      .from('deal_instance')
      .select(`
        template_id,
        deal_template!inner(
          image_metadata_id
        )
      `)
      .eq('deal_id', dealInstanceId)
      .single();

    if (fetchError) {
      console.warn('Could not fetch deal for image cleanup:', fetchError);
    }

    const imageMetadataId = (dealInstance?.deal_template as any)?.image_metadata_id;
    if (imageMetadataId) {
      try {
        const { data: imageMetadata, error: metadataError } = await supabase
          .from('image_metadata')
          .select('cloudinary_public_id')
          .eq('image_metadata_id', imageMetadataId)
          .single();

        if (!metadataError && imageMetadata?.cloudinary_public_id) {
          console.log('Admin deleting Cloudinary image:', imageMetadata.cloudinary_public_id);

          const { error: cloudinaryError } = await supabase.functions.invoke('delete-cloudinary-images', {
            body: { publicIds: [imageMetadata.cloudinary_public_id] }
          });

          if (cloudinaryError) {
            console.warn('Failed to delete image from Cloudinary:', cloudinaryError);
          } else {
            console.log('Successfully deleted Cloudinary image');
          }

          await supabase
            .from('image_metadata')
            .delete()
            .eq('image_metadata_id', imageMetadataId);
        }
      } catch (cloudinaryCleanupError) {
        console.warn('Error during Cloudinary cleanup:', cloudinaryCleanupError);
      }
    }

    const { error } = await supabase
      .from('deal_instance')
      .delete()
      .eq('deal_id', dealInstanceId);

    if (error) throw error;

    await logAction('delete_deal', 'deal', dealInstanceId, {});
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function featureDeal(dealInstanceId: string, featured: boolean): Promise<ServiceResult> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const updates: any = {
      is_featured: featured,
      featured_at: featured ? new Date().toISOString() : null,
      featured_by: featured ? user.id : null,
    };

    const { error } = await supabase
      .from('deal_instance')
      .update(updates)
      .eq('deal_id', dealInstanceId);

    if (error) throw error;

    await logAction('feature_deal', 'deal', dealInstanceId, { featured });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function pinDeal(dealInstanceId: string, pinOrder: number | null): Promise<ServiceResult> {
  try {
    const { error } = await supabase
      .from('deal_instance')
      .update({ pin_order: pinOrder })
      .eq('deal_id', dealInstanceId);

    if (error) throw error;

    await logAction('pin_deal', 'deal', dealInstanceId, { pinOrder });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
