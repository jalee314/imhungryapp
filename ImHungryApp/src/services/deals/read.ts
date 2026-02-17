/**
 * @file Deal read operations
 * Functions for fetching deal data from the database
 */

import { supabase } from '../../../lib/supabase';
import { calculateDistance, getRestaurantLocationsBatch } from '../locationService';
import { getUserVoteStates, calculateVoteCounts } from '../voteService';
import { getCurrentUserId, getUserLocation } from './utils';
import { DatabaseDeal, RankedDealMeta } from './types';

/**
 * Call the ranking function to get ranked deal metadata (id + distance)
 * Internal function used by fetchRankedDeals
 */
const getRankedDealsMeta = async (): Promise<RankedDealMeta[]> => {
  try {
    const location = await getUserLocation();
    if (!location) {
      return [];
    }

    const startTime = Date.now();
    const { data, error } = await supabase.functions.invoke('ranking_posts', {
      body: {
        user_id: await getCurrentUserId(),
        location: {
          latitude: location.lat,
          longitude: location.lng
        }
      }
    });
    const rankingTime = Date.now() - startTime;
    console.log(`⏱️ Ranking function took: ${rankingTime}ms`);

    if (error) {
      return [];
    }

    if (!data || !Array.isArray(data)) {
      return [];
    }

    return data
      .map((item: any) => ({
        deal_id: item.deal_id,
        distance: item.distance ?? null
      }))
      .filter((item: RankedDealMeta) => Boolean(item.deal_id));
  } catch (error) {
    return [];
  }
};

/**
 * Fetch ranked deals from the database
 */
export const fetchRankedDeals = async (): Promise<DatabaseDeal[]> => {
  try {
    console.log('🔍 fetchRankedDeals: Starting to fetch deals...');
    const rankedMeta = await getRankedDealsMeta();
    const rankedIds = rankedMeta.map(item => item.deal_id);
    const distanceMap = new Map(rankedMeta.map(item => [item.deal_id, item.distance ?? null]));
    console.log('🔍 fetchRankedDeals: Ranked IDs:', rankedIds.length);

    if (rankedIds.length === 0) {
      return [];
    }

    const { data: deals, error } = await supabase
      .from('deal_instance')
      .select(`
        deal_id,
        template_id,
        start_date,
        end_date,
        is_anonymous,
        created_at,
        deal_template:template_id (
          title,
          description,
          image_url,
          user_id,
          category_id,
          cuisine_id,
          restaurant_id,
          image_metadata:image_metadata_id (
            variants,
            image_type
          ),
          deal_images (
            image_metadata_id,
            display_order,
            is_thumbnail,
            image_metadata:image_metadata_id (
              variants
            )
          ),
          restaurant:restaurant_id (
            name,
            address
          ),
          cuisine:cuisine_id (
            cuisine_name
          ),
          category:category_id (
            category_name
          ),
          user:user_id (
            display_name,
            profile_photo,
            profile_photo_metadata_id,
            location_city,
            image_metadata:profile_photo_metadata_id (
              variants
            )
          )
        )
      `)
      .in('deal_id', rankedIds);

    if (error) throw error;

    const transformedDeals = deals?.map(deal => {
      const dealImages = ((deal.deal_template as any)?.deal_images || [])
        .map((img: any) => ({
          image_metadata_id: img.image_metadata_id,
          display_order: img.display_order,
          is_thumbnail: img.is_thumbnail,
          variants: img.image_metadata?.variants || null,
        }))
        .sort((a: any, b: any) => a.display_order - b.display_order);

      return {
        deal_id: deal.deal_id,
        template_id: deal.template_id,
        title: (deal.deal_template as any).title,
        description: (deal.deal_template as any).description,
        image_url: (deal.deal_template as any).image_url,
        restaurant_name: (deal.deal_template as any).restaurant.name,
        restaurant_address: (deal.deal_template as any).restaurant.address,
        cuisine_name: (deal.deal_template as any).cuisine?.cuisine_name || null,
        cuisine_id: (deal.deal_template as any).cuisine_id,
        category_name: (deal.deal_template as any).category?.category_name || null,
        created_at: deal.created_at,
        start_date: deal.start_date,
        end_date: deal.end_date,
        is_anonymous: deal.is_anonymous,
        user_id: (deal.deal_template as any).user_id,
        user_display_name: (deal.deal_template as any).user?.display_name || null,
        user_profile_photo: (deal.deal_template as any).user?.profile_photo || null,
        user_city: (deal.deal_template as any).user?.location_city || null,
        user_state: 'CA',
        restaurant_id: (deal.deal_template as any).restaurant_id,
        image_metadata: (deal.deal_template as any).image_metadata || null,
        deal_images: dealImages.length > 0 ? dealImages : undefined,
        user_profile_metadata: (deal.deal_template as any).user?.image_metadata || null,
        distance_miles: distanceMap.get(deal.deal_id) ?? null
      };
    }) || [];

    // Reorder based on ranking
    const orderedDeals = rankedIds
      .map(id => transformedDeals.find(deal => deal.deal_id === id))
      .filter(deal => deal !== undefined) as DatabaseDeal[];

    return orderedDeals;
  } catch (error) {
    console.error('Error fetching ranked deals:', error);
    return [];
  }
};

/**
 * Fetch user's own posts
 */
export const fetchUserPosts = async (): Promise<DatabaseDeal[]> => {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const userLocation = await getUserLocation();

    const { data: deals, error } = await supabase
      .from('deal_instance')
      .select(`
        deal_id,
        template_id,
        is_anonymous,
        start_date,
        end_date,
        created_at,
        deal_template!inner(
          template_id,
          user_id,
          title,
          description,
          image_url,
          image_metadata_id,
          category_id,
          cuisine_id,
          restaurant_id,
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
          ),
          category:category_id(category_name),
          cuisine:cuisine_id(cuisine_name),
          restaurant:restaurant_id(
            restaurant_id,
            name,
            address,
            location
          ),
          user:user_id(
            user_id,
            display_name,
            profile_photo,
            profile_photo_metadata_id,
            location_city,
            image_metadata:profile_photo_metadata_id(
              variants
            )
          )
        )
      `)
      .eq('deal_template.user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user posts:', error);
      throw error;
    }

    if (!deals || deals.length === 0) {
      return [];
    }

    // Get all restaurant locations for distance calculation
    const restaurantIds = deals.map(d => (d.deal_template as any).restaurant.restaurant_id);
    const locationMap = await getRestaurantLocationsBatch(restaurantIds);

    // Get vote states and vote counts
    const dealIds = deals.map(d => d.deal_id);
    const [voteStates, voteCounts] = await Promise.all([
      getUserVoteStates(dealIds),
      calculateVoteCounts(dealIds)
    ]);

    const transformedDeals: DatabaseDeal[] = deals.map(deal => {
      const template = deal.deal_template as any;
      const restaurant = template.restaurant;
      const restaurantLocation = locationMap[restaurant.restaurant_id];

      let distanceMiles = null;
      if (restaurantLocation && userLocation) {
        distanceMiles = calculateDistance(
          userLocation.lat,
          userLocation.lng,
          restaurantLocation.lat,
          restaurantLocation.lng
        );
      }

      const voteState = voteStates[deal.deal_id] || {
        isUpvoted: false,
        isDownvoted: false,
        isFavorited: false
      };

      const dealImages = (template?.deal_images || [])
        .map((img: any) => ({
          image_metadata_id: img.image_metadata_id,
          display_order: img.display_order,
          is_thumbnail: img.is_thumbnail,
          variants: img.image_metadata?.variants || null,
        }))
        .sort((a: any, b: any) => a.display_order - b.display_order);

      return {
        deal_id: deal.deal_id,
        template_id: deal.template_id,
        title: template.title,
        description: template.description,
        image_url: template.image_url,
        image_metadata: template.image_metadata,
        deal_images: dealImages.length > 0 ? dealImages : undefined,
        restaurant_name: restaurant.name,
        restaurant_address: restaurant.address,
        cuisine_name: template.cuisine?.cuisine_name || null,
        cuisine_id: template.cuisine_id,
        category_name: template.category?.category_name || null,
        created_at: deal.created_at,
        start_date: deal.start_date,
        end_date: deal.end_date,
        is_anonymous: deal.is_anonymous,
        user_id: template.user_id,
        user_display_name: template.user?.display_name || null,
        user_profile_photo: template.user?.profile_photo || null,
        user_city: template.user?.location_city || null,
        user_state: 'CA',
        user_profile_metadata: template.user?.image_metadata,
        votes: voteCounts[deal.deal_id] || 0,
        is_upvoted: voteState.isUpvoted,
        is_downvoted: voteState.isDownvoted,
        is_favorited: voteState.isFavorited,
        distance_miles: distanceMiles,
        restaurant_id: restaurant.restaurant_id,
      };
    });

    return transformedDeals;
  } catch (error) {
    console.error('Error in fetchUserPosts:', error);
    throw error;
  }
};

/**
 * Fetch deal data for editing
 */
export const fetchDealForEdit = async (
  dealId: string
): Promise<{ success: boolean; data?: import('./types').DealEditData; error?: string }> => {
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
 * Get user ID for a specific deal's uploader
 */
export const getDealUploaderId = async (dealId: string): Promise<string | null> => {
  try {
    const { data, error } = await supabase
      .from('deal_instance')
      .select(`
        deal_template!inner(
          user_id
        )
      `)
      .eq('deal_id', dealId)
      .single();

    if (error) {
      return null;
    }

    const userId = (data.deal_template as any)?.user_id;
    return userId;
  } catch (error) {
    return null;
  }
};
