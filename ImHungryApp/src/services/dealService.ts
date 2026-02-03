import { Deal } from '../components/DealCard';
import { supabase } from '../../lib/supabase';
import * as FileSystem from 'expo-file-system';
import { toByteArray } from 'base64-js';
import { calculateDistance, getRestaurantLocationsBatch } from './locationService';
import { getUserVoteStates, calculateVoteCounts } from './voteService';
import { ImageVariants, ImageType, processImageWithEdgeFunction, getImageUrl } from './imageProcessingService';


// Get current user ID from Supabase auth
const getCurrentUserId = async (): Promise<string | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id || null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

// Upload image and get metadata ID
const uploadDealImage = async (imageUri: string): Promise<string | null> => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('User not authenticated:', authError);
      return null;
    }

    // Use new Cloudinary processing - FIX: Change 'deal' to 'deal_image'
    const result = await processImageWithEdgeFunction(imageUri, 'deal_image');

    if (!result.success || !result.metadataId) {
      console.error('Failed to process image:', result.error);
      return null;
    }

    return result.metadataId;
  } catch (error) {
    console.error('Error in uploadDealImage:', error);
    return null;
  }
};

// Helper function to safely parse and format dates
const parseDate = (dateString: string | null): string | null => {
  if (!dateString || dateString === 'Unknown') {
    return null;
  }
  try {
    let date: Date;
    if (dateString.includes('T') || dateString.includes('Z')) {
      date = new Date(dateString);
    } else {
      date = new Date(dateString);
    }
    if (isNaN(date.getTime())) {
      console.error('Invalid date format:', dateString);
      return null;
    }
    return date.toISOString();
  } catch (error) {
    console.error('Error parsing date:', dateString, error);
    return null;
  }
};

// Interface for creating a deal
export interface CreateDealData {
  title: string;
  description: string;
  imageUris: string[];  // Changed from imageUri to array
  thumbnailIndex: number;  // Which image is the thumbnail
  expirationDate: string | null;
  restaurantId: string;
  categoryId: string | null;
  cuisineId: string | null;
  isAnonymous: boolean;
}

// Create deal template ONLY (let database trigger create instance)
export const createDeal = async (dealData: CreateDealData): Promise<{ success: boolean; error?: string }> => {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: 'No authenticated user found' };
    }

    // Upload all images and collect metadata IDs
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
      image_metadata_id: primaryMetadataId, // Use thumbnail as primary image
      category_id: dealData.categoryId,
      cuisine_id: dealData.cuisineId,
      is_anonymous: dealData.isAnonymous,
      source_type: 'community_uploaded',
    };

    console.log('📝 Attempting to insert deal template:', dealTemplateData);

    // Insert ONLY the deal template (database trigger will create instance)
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

    // Now insert all images into deal_images junction table
    if (imageMetadataIds.length > 0) {
      // Insert all images into deal_images table using deal_template_id
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
        // Deal was still created successfully, just without the junction table entries
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


// Check for profanity using your existing Supabase Edge Function
export const checkDealContentForProfanity = async (title: string, description?: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const { data: titleData, error: titleError } = await supabase.functions.invoke('catch-profanity', {
      body: { text: title }
    });

    if (titleError) {
      return { success: true };
    }

    if (!titleData?.isClean) {
      return {
        success: false,
        error: 'Just because you\'re hungry doesn\'t mean you can use offensive language. Please edit your post to remove it.'
      };
    }

    if (description && description.trim()) {
      const { data: descData, error: descError } = await supabase.functions.invoke('catch-profanity', {
        body: { text: description }
      });

      if (descError) {
        return { success: true };
      }

      if (!descData?.isClean) {
        return {
          success: false,
          error: 'Just because you\'re hungry doesn\'t mean you can use offensive language. Please edit your post to remove it.'
        };
      }
    }

    return { success: true };
  } catch (error) {
    return { success: true };
  }
};


// Interface for the ranking function response
export interface RankedDealMeta {
  deal_id: string;
  distance?: number | null;
}

// Update DatabaseDeal interface to match your current schema
export interface DatabaseDeal {
  deal_id: string; // This is actually template_id from the view
  template_id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  restaurant_name: string;
  restaurant_address: string;
  cuisine_name: string | null;
  cuisine_id: string | null;
  category_name: string | null;
  created_at: string;
  start_date: string;
  end_date: string | null;
  is_anonymous: boolean;
  user_id: string;
  user_display_name: string | null;
  user_profile_photo: string | null;
  user_city?: string | null;
  user_state?: string | null;
  restaurant_id: string;
  // Add image metadata (primary/thumbnail image)
  image_metadata?: {
    variants: ImageVariants;
    image_type: ImageType;
  };
  // Add all images from deal_images table
  deal_images?: Array<{
    image_metadata_id: string;
    display_order: number;
    is_thumbnail: boolean;
    variants: ImageVariants;
  }>;
  // Add user profile metadata
  user_profile_metadata?: {
    variants: ImageVariants;
  };
  // Add distance
  distance_miles?: number | null;
  // Add vote information
  votes?: number;
  is_upvoted?: boolean;
  is_downvoted?: boolean;
  is_favorited?: boolean;
}

// Get user's location for ranking
const getUserLocation = async (): Promise<{ lat: number; lng: number } | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('No authenticated user found');
      return null;
    }


    // Query to extract lat/lng from PostGIS geography column
    const { data: userData, error } = await supabase
      .rpc('get_user_location_coords', { user_uuid: user.id });


    if (error) {
      return null;
    }

    if (!userData || userData.length === 0) {
      return null;
    }

    // Extract the first (and should be only) result from the array
    const locationData = userData[0];

    // The RPC function should return { lat: number, lng: number }
    if (!locationData.lat || !locationData.lng) {
      return null;
    }

    return {
      lat: locationData.lat,
      lng: locationData.lng
    };
  } catch (error) {
    return null;
  }
};

// Call the ranking function to get ranked deal metadata (id + distance)
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

    // Preserve both the id and the server-computed distance
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

// Utility function to add vote information to deals
export const addVotesToDeals = async (deals: DatabaseDeal[]): Promise<DatabaseDeal[]> => {
  try {
    if (deals.length === 0) return deals;

    // Get deal IDs
    const dealIds = deals.map(deal => deal.deal_id);

    // Fetch vote states and counts in parallel
    const [voteStates, voteCounts] = await Promise.all([
      getUserVoteStates(dealIds),
      calculateVoteCounts(dealIds)
    ]);

    // Add vote information to each deal
    return deals.map(deal => {
      const voteState = voteStates[deal.deal_id] || {
        isUpvoted: false,
        isDownvoted: false,
        isFavorited: false
      };

      return {
        ...deal,
        votes: voteCounts[deal.deal_id] || 0,
        is_upvoted: voteState.isUpvoted,
        is_downvoted: voteState.isDownvoted,
        is_favorited: voteState.isFavorited
      };
    });
  } catch (error) {
    console.error('Error adding votes to deals:', error);
    return deals; // Return deals without vote info if error
  }
};

// Utility function to add distance information to deals
export const addDistancesToDeals = async (deals: DatabaseDeal[], customCoordinates?: { lat: number; lng: number }): Promise<DatabaseDeal[]> => {
  try {
    if (!customCoordinates) {
      // Distances already come from the ranking pipeline; nothing to recompute.
      return deals;
    }

    console.log('📍 Using custom coordinates for distance calculation:', customCoordinates);
    const restaurantIds = Array.from(new Set(deals.map(deal => deal.restaurant_id)));
    if (restaurantIds.length === 0) {
      return deals;
    }

    const { data, error } = await supabase.rpc('get_restaurant_coords_with_distance', {
      restaurant_ids: restaurantIds,
      ref_lat: customCoordinates.lat,
      ref_lng: customCoordinates.lng
    });

    if (error) {
      console.error('Error fetching custom distance overrides:', error);
      return deals;
    }

    const distanceMap = new Map<string, number | null>();
    data?.forEach((row: any) => {
      if (row.restaurant_id) {
        distanceMap.set(row.restaurant_id, row.distance_miles ?? null);
      }
    });

    return deals.map(deal => ({
      ...deal,
      distance_miles: distanceMap.has(deal.restaurant_id)
        ? distanceMap.get(deal.restaurant_id) ?? null
        : deal.distance_miles ?? null
    }));
  } catch (error) {
    console.error('Error adding distances to deals:', error);
    return deals; // Return deals without distance if error
  }
};

// Update fetchRankedDeals to use the correct tables from your current schema
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

    // Query the actual tables directly - NO VIEWS
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

    // Transform the nested data structure
    const transformedDeals = deals?.map(deal => {
      // Transform deal_images array, sort by display_order (from deal_template)
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
        user_state: 'CA', // Hardcoded for California (as per app's current scope)
        restaurant_id: (deal.deal_template as any).restaurant_id,
        // Add image metadata with fallback
        image_metadata: (deal.deal_template as any).image_metadata || null,
        // Add all images from deal_images table
        deal_images: dealImages.length > 0 ? dealImages : undefined,
        // Add user profile image metadata
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

// Update transformDealForUI to match your current schema
export const transformDealForUI = (dbDeal: DatabaseDeal): Deal => {
  const timeAgo = getTimeAgo(new Date(dbDeal.created_at));

  // Handle image source - ONLY use Cloudinary or placeholder
  // PRIORITY: 1. First image by display_order from deal_images, 2. is_thumbnail flag, 3. Primary image from deal_template.image_metadata
  let imageSource;
  let imageVariants = undefined;

  // Sort deal_images by display_order and get the first one (which is the cover/thumbnail)
  const sortedDealImages = [...(dbDeal.deal_images || [])].sort((a, b) => 
    (a.display_order ?? 999) - (b.display_order ?? 999)
  );
  const firstImageByOrder = sortedDealImages.find(img => img.variants);
  // Fallback: check for is_thumbnail flag (for backward compatibility)
  const thumbnailImage = !firstImageByOrder ? dbDeal.deal_images?.find(img => img.is_thumbnail && img.variants) : null;

  if (firstImageByOrder?.variants) {
    // Use first image by display_order (preferred - this is the cover)
    imageSource = require('../../img/default-rest.png'); // Fallback for Image component
    imageVariants = firstImageByOrder.variants;
  } else if (thumbnailImage?.variants) {
    // Fallback to is_thumbnail flag
    imageSource = require('../../img/default-rest.png');
    imageVariants = thumbnailImage.variants;
  } else if (dbDeal.image_metadata?.variants) {
    // Fallback to primary image on deal_template (for old deals not yet migrated to deal_images)
    imageSource = require('../../img/default-rest.png'); // Fallback for Image component
    imageVariants = dbDeal.image_metadata.variants; // OptimizedImage will use this
  } else {
    // No image available → use placeholder
    imageSource = require('../../img/default-rest.png');
    imageVariants = undefined; // No variants = OptimizedImage won't be used
  }

  // Get user profile photo with same logic
  let userProfilePhoto = null;
  if (dbDeal.user_profile_metadata?.variants?.small) {
    // Use Cloudinary variant for profile
    userProfilePhoto = dbDeal.user_profile_metadata.variants.small;
  } else if (dbDeal.user_profile_metadata?.variants?.thumbnail) {
    userProfilePhoto = dbDeal.user_profile_metadata.variants.thumbnail;
  }
  // If no Cloudinary variant, leave as null (will show default avatar icon)

  // Format distance
  let milesAway = '?mi';
  if (dbDeal.distance_miles !== null && dbDeal.distance_miles !== undefined) {
    milesAway = `${Math.round(dbDeal.distance_miles * 10) / 10}mi`;
  }

  // Extract image URLs from deal_images for carousel (use sorted images!)
  let images: string[] | undefined = undefined;
  if (sortedDealImages && sortedDealImages.length > 0) {
    images = sortedDealImages
      .filter(img => img.variants)
      .map(img => {
        // Prefer large, then medium, then original
        return img.variants?.large || img.variants?.medium || img.variants?.original || '';
      })
      .filter(url => url !== '');
  }

  return {
    id: dbDeal.deal_id,
    title: dbDeal.title,
    restaurant: dbDeal.restaurant_name,
    details: dbDeal.description || '',
    image: imageSource,
    imageVariants: imageVariants,  // Only set if Cloudinary variants exist
    images: images,  // Array of image URLs for carousel
    votes: dbDeal.votes || 0,
    isUpvoted: dbDeal.is_upvoted || false,
    isDownvoted: dbDeal.is_downvoted || false,
    isFavorited: dbDeal.is_favorited || false,
    cuisine: dbDeal.cuisine_name || 'Cuisine',
    cuisineId: dbDeal.cuisine_id || undefined,
    timeAgo: timeAgo,
    author: dbDeal.is_anonymous ? 'Anonymous' : (dbDeal.user_display_name || 'Unknown'),
    milesAway: milesAway,
    userId: dbDeal.user_id,
    userDisplayName: dbDeal.user_display_name || undefined,
    userProfilePhoto: userProfilePhoto || undefined,  // Only Cloudinary or null
    userCity: dbDeal.user_city || undefined,
    userState: dbDeal.user_state || undefined,
    restaurantAddress: dbDeal.restaurant_address,
    isAnonymous: dbDeal.is_anonymous,
    expirationDate: dbDeal.end_date || null,
  };
};

// Helper function to get user ID for a specific deal
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

// Helper function to calculate time ago
const getTimeAgo = (date: Date): string => {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return `${diffInSeconds}s ago`;
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes}m ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours}h ago`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days}d ago`;
  }
};

// Fetch user's own posts
export const fetchUserPosts = async (): Promise<DatabaseDeal[]> => {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      throw new Error('User not authenticated');
    }

    // Get user location if available, but don't fail if it's not
    // Distance will just be null for posts when location is unavailable
    const userLocation = await getUserLocation();

    // Fetch user's deals from database - NOW WITH IMAGE METADATA
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

    // Transform deals to DatabaseDeal format
    const transformedDeals: DatabaseDeal[] = deals.map(deal => {
      const template = deal.deal_template as any;
      const restaurant = template.restaurant;
      const restaurantLocation = locationMap[restaurant.restaurant_id];

      // Calculate distance
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

      // Transform deal_images array, sort by display_order (from template)
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
        image_metadata: template.image_metadata, // ✅ Add this
        deal_images: dealImages.length > 0 ? dealImages : undefined, // ✅ Add this
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
        user_state: 'CA', // Hardcoded for California (as per app's current scope)
        user_profile_metadata: template.user?.image_metadata, // ✅ Add this
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

// Delete a deal (both instance and template)
export const deleteDeal = async (dealId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: 'User not authenticated' };
    }

    // First, get the deal instance to find the template_id, verify ownership, and get image info
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

    // Verify the user owns this deal
    if ((dealInstance.deal_template as any).user_id !== userId) {
      return { success: false, error: 'Unauthorized: You can only delete your own posts' };
    }

    // Get Cloudinary public ID if image_metadata_id exists
    // Get all image metadata IDs associated with this deal
    const templateImageId = (dealInstance.deal_template as any).image_metadata_id;
    const templateId = dealInstance.template_id;

    // Fetch all images from deal_images table
    const { data: dealImages } = await supabase
      .from('deal_images')
      .select('image_metadata_id')
      .eq('deal_template_id', templateId);

    // Combine all IDs
    const allImageIds = new Set<string>();
    if (templateImageId) allImageIds.add(templateImageId);
    if (dealImages) {
      dealImages.forEach((img: any) => {
        if (img.image_metadata_id) allImageIds.add(img.image_metadata_id);
      });
    }

    // Convert to array
    const imageIdsToDelete = Array.from(allImageIds);

    if (imageIdsToDelete.length > 0) {
      try {
        // Fetch Cloudinary public IDs for ALL images
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

            // Call the edge function to delete from Cloudinary
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
        // Continue anyway - the database records are more important
      }
    }

    // Delete the deal instance (this will cascade to related records like interactions, favorites, etc.)
    const { error: deleteInstanceError } = await supabase
      .from('deal_instance')
      .delete()
      .eq('deal_id', dealId);

    if (deleteInstanceError) {
      console.error('Error deleting deal instance:', deleteInstanceError);
      return { success: false, error: 'Failed to delete deal' };
    }

    // Explicitly delete deal_images rows first (to avoid FK constraints if no cascade)
    const { error: deleteImagesError } = await supabase
      .from('deal_images')
      .delete()
      .eq('deal_template_id', dealInstance.template_id);

    if (deleteImagesError) {
      console.warn('Failed to delete deal_images rows:', deleteImagesError);
      // Attempt to continue, but template deletion might fail
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

    // Finally, cleanup image_metadata records
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

// ==================== DEAL EDITING FUNCTIONS ====================

// Interface for fetching deal data for editing
export interface DealEditData {
  templateId: string;
  dealId: string;
  title: string;
  description: string | null;
  expirationDate: string | null;
  restaurantId: string;
  restaurantName: string;
  restaurantAddress: string;
  categoryId: string | null;
  cuisineId: string | null;
  isAnonymous: boolean;
  images: Array<{
    imageMetadataId: string;
    displayOrder: number;
    isThumbnail: boolean;
    url: string; // The actual image URL for display
  }>;
}

// Fetch deal data for editing
export const fetchDealForEdit = async (dealId: string): Promise<{ success: boolean; data?: DealEditData; error?: string }> => {
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

    // Verify ownership
    if (template.user_id !== userId) {
      return { success: false, error: 'You can only edit your own posts' };
    }

    // Transform images from deal_images junction table
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

    // Fallback: If no images in deal_images, check for primary image on deal_template
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

// Interface for updating deal
export interface UpdateDealData {
  title?: string;
  description?: string;
  expirationDate?: string | null;
  isAnonymous?: boolean;
}

// Update deal text fields
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
      // Handle "Unknown" as null for database - "Unknown" is a UI-only value
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

// Add new images to an existing deal
export const addDealImages = async (
  dealId: string,
  imageUris: string[]
): Promise<{ success: boolean; newImages?: Array<{ imageMetadataId: string; url: string }>; error?: string }> => {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: 'User not authenticated' };
    }

    // Get template_id, verify ownership, and get current image count + primary image
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
        // Continue anyway - the new images will still be added
      } else {
        console.log('✅ addDealImages: Successfully migrated primary image');
        currentImageCount = 1; // Now we have 1 image in deal_images
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

      // Insert into deal_images
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

      // Get the URL for the new image
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

// Remove an image from a deal
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
    
    // Calculate total image count (deal_images + fallback primary if not already in deal_images)
    const primaryInDealImages = dealImages.some((img: any) => img.image_metadata_id === primaryImageId);
    const totalImageCount = dealImages.length + (primaryImageId && !primaryInDealImages && dealImages.length === 0 ? 1 : 0);
    
    if (totalImageCount <= 1) {
      return { success: false, error: 'Cannot remove the last image. A deal must have at least one photo.' };
    }

    // Check if we're removing an image that only exists in deal_template.image_metadata_id (not in deal_images)
    const imageInDealImages = dealImages.find((img: any) => img.image_metadata_id === imageMetadataId);
    const isRemovingPrimaryOnly = !imageInDealImages && primaryImageId === imageMetadataId;

    // Get Cloudinary public ID for deletion
    const { data: imageMetadata } = await supabase
      .from('image_metadata')
      .select('cloudinary_public_id')
      .eq('image_metadata_id', imageMetadataId)
      .single();

    if (isRemovingPrimaryOnly) {
      // The image only exists in deal_template.image_metadata_id, not in deal_images
      // We need to set a different image as the primary (but this case shouldn't happen
      // if we always migrate primary images when adding new images)
      console.log('📷 removeDealImage: Removing primary-only image:', imageMetadataId);
      
      // Clear the primary image in deal_template - the first deal_images entry will become the new primary
      if (dealImages.length > 0) {
        const newPrimaryId = dealImages[0].image_metadata_id;
        await supabase
          .from('deal_template')
          .update({ image_metadata_id: newPrimaryId })
          .eq('template_id', dealInstance.template_id);
        
        // Mark this as thumbnail in deal_images
        await supabase
          .from('deal_images')
          .update({ is_thumbnail: true })
          .eq('deal_template_id', dealInstance.template_id)
          .eq('image_metadata_id', newPrimaryId);
      }
    } else {
      // Image is in deal_images - delete it from there
      const wasThumbnail = imageInDealImages?.is_thumbnail;

      // Delete from deal_images
      const { error: deleteError } = await supabase
        .from('deal_images')
        .delete()
        .eq('deal_template_id', dealInstance.template_id)
        .eq('image_metadata_id', imageMetadataId);

      if (deleteError) {
        console.error('Error deleting deal image:', deleteError);
        return { success: false, error: 'Failed to remove image' };
      }

      // If this was the thumbnail, set a new one
      if (wasThumbnail) {
        const remainingImages = dealImages.filter((img: any) => img.image_metadata_id !== imageMetadataId);
        if (remainingImages.length > 0) {
          await supabase
            .from('deal_images')
            .update({ is_thumbnail: true })
            .eq('deal_template_id', dealInstance.template_id)
            .eq('image_metadata_id', remainingImages[0].image_metadata_id);

          // Also update the primary image in deal_template
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

// Set thumbnail/cover image for a deal
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

// Update image display order
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