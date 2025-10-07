import { Deal } from '../components/DealCard';
import { supabase } from '../../lib/supabase';
import * as FileSystem from 'expo-file-system';
import { toByteArray } from 'base64-js';
import { getCurrentUserLocation, calculateDistance, getRestaurantLocationsBatch } from './locationService';
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
  imageUri: string | null;
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

    let metadataId: string | null = null;
    if (dealData.imageUri) {
      metadataId = await uploadDealImage(dealData.imageUri);
      if (!metadataId) {
        return { success: false, error: 'Failed to upload image' };
      }
    }

    const dealTemplateData = {
      restaurant_id: dealData.restaurantId,
      user_id: userId,
      title: dealData.title,
      description: dealData.description || null,
      image_metadata_id: metadataId, // Use metadata ID instead of image_url
      category_id: dealData.categoryId,
      cuisine_id: dealData.cuisineId,
      is_anonymous: dealData.isAnonymous,
      source_type: 'community_uploaded',
    };

    console.log('📝 Attempting to insert deal template:', dealTemplateData);

    // Insert ONLY the deal template (database trigger will create instance)
    const { data, error: templateError } = await supabase
      .from('deal_template')
      .insert(dealTemplateData)
      .select();

    if (templateError) {
      console.error('❌ Deal template error:', templateError);
      console.error('Error details:', {
        message: templateError.message,
        details: templateError.details,
        hint: templateError.hint,
        code: templateError.code,
      });
      return { 
        success: false, 
        error: `Failed to create deal: ${templateError.message}` 
      };
    }

    console.log('✅ Deal template created successfully:', data);
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
export interface RankedDealIds {
  deal_ids: string[];
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
  restaurant_id: string;
  // Add image metadata
  image_metadata?: {
    variants: ImageVariants;
    image_type: ImageType;
  };
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

// Call the ranking function to get ranked deal IDs
const getRankedDealIds = async (): Promise<string[]> => {
  try {
    const location = await getUserLocation();
    if (!location) {
      return [];
    }

    const { data, error } = await supabase.functions.invoke('ranking_posts', {
      body: {
        user_id: await getCurrentUserId(),
        location: {
          latitude: location.lat,
          longitude: location.lng
        }
      }
    });

    if (error) {
      return [];
    }

    if (!data || !Array.isArray(data)) {
      return [];
    }

    // Extract deal IDs from the response
    return data.map((item: any) => item.deal_id).filter(Boolean);
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
    // Get location for distance calculation
    let locationToUse: { lat: number; lng: number } | null = null;
    
    if (customCoordinates) {
      console.log('📍 Using custom coordinates for distance calculation:', customCoordinates);
      locationToUse = customCoordinates;
    } else {
      // Get user location
      const userLocation = await getCurrentUserLocation();
      if (!userLocation) {
        console.log('No user location available for distance calculation');
        return deals; // Return deals without distance if no user location
      }
      locationToUse = userLocation;
    }

    // Get all restaurant locations
    const restaurantIds = deals.map(deal => deal.restaurant_id);
    const locationMap = await getRestaurantLocationsBatch(restaurantIds);

    // Add distance to each deal
    return deals.map(deal => {
      const restaurantLocation = locationMap[deal.restaurant_id];
      let distanceMiles = null;
      
      if (restaurantLocation) {
        distanceMiles = calculateDistance(
          locationToUse!.lat,
          locationToUse!.lng,
          restaurantLocation.lat,
          restaurantLocation.lng
        );
      }

      return {
        ...deal,
        distance_miles: distanceMiles
      };
    });
  } catch (error) {
    console.error('Error adding distances to deals:', error);
    return deals; // Return deals without distance if error
  }
};

// Update fetchRankedDeals to use the correct tables from your current schema
export const fetchRankedDeals = async (): Promise<DatabaseDeal[]> => {
  try {
    const rankedIds = await getRankedDealIds();

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
            image_metadata:profile_photo_metadata_id (
              variants
            )
          )
        )
      `)
      .in('deal_id', rankedIds);

    if (error) throw error;

    // Transform the nested data structure
    const transformedDeals = deals?.map(deal => ({
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
      restaurant_id: (deal.deal_template as any).restaurant_id,
      // Add image metadata with fallback
      image_metadata: (deal.deal_template as any).image_metadata || null,
      // Add user profile image metadata
      user_profile_metadata: (deal.deal_template as any).user?.image_metadata || null
    })) || [];

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
  let imageSource;
  let imageVariants = undefined;
  
  if (dbDeal.image_metadata?.variants) {
    // Use Cloudinary variants (new deals)
    console.log('✅ Using Cloudinary for deal:', dbDeal.title);
    imageSource = require('../../img/albert.webp'); // Fallback for Image component
    imageVariants = dbDeal.image_metadata.variants; // OptimizedImage will use this
  } else {
    // Old deal without Cloudinary → use placeholder instead of slow Supabase Storage
    console.log('⚠️ Old deal, using placeholder:', dbDeal.title);
    imageSource = require('../../img/albert.webp');
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

  return {
    id: dbDeal.deal_id,
    title: dbDeal.title,
    restaurant: dbDeal.restaurant_name,
    details: dbDeal.description || '',
    image: imageSource,
    imageVariants: imageVariants,  // Only set if Cloudinary variants exist
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
    restaurantAddress: dbDeal.restaurant_address,
    isAnonymous: dbDeal.is_anonymous,
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

    const userLocation = await getUserLocation();
    if (!userLocation) {
      throw new Error('Unable to get user location');
    }

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

      return {
        deal_id: deal.deal_id,
        template_id: deal.template_id,
        title: template.title,
        description: template.description,
        image_url: template.image_url,
        image_metadata: template.image_metadata, // ✅ Add this
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

    // First, get the deal instance to find the template_id and verify ownership
    const { data: dealInstance, error: fetchError } = await supabase
      .from('deal_instance')
      .select(`
        template_id,
        deal_template!inner(
          user_id,
          image_url
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

    // Delete the image from storage if it exists
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

    // Delete the deal template
    const { error: deleteTemplateError } = await supabase
      .from('deal_template')
      .delete()
      .eq('template_id', dealInstance.template_id);

    if (deleteTemplateError) {
      console.error('Error deleting deal template:', deleteTemplateError);
      return { success: false, error: 'Failed to delete deal template' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in deleteDeal:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
};


