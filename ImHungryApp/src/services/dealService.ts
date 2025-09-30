import { supabase } from '../../lib/supabase';
import * as FileSystem from 'expo-file-system';
import { toByteArray } from 'base64-js';
import { getCurrentUserLocation, calculateDistance, getRestaurantLocationsBatch } from './locationService';
import { getUserVoteStates, calculateVoteCounts } from './voteService';


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

// Upload image to Supabase storage
const uploadDealImage = async (imageUri: string): Promise<string | null> => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('User not authenticated:', authError);
      return null;
    }
    

    const fileExt = imageUri.split('.').pop() || 'jpg';
    const fileName = `deal_${Date.now()}.${fileExt}`;
    

    const base64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const byteArray = toByteArray(base64);
    
    const { data, error } = await supabase.storage
      .from('deal-images')
      .upload(`public/${fileName}`, byteArray, {
        contentType: `image/${fileExt}`,
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      return null;
    } else if (data) {
      return data.path;
    }
    
    return null;
  } catch (error) {
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

// Create deal template and instance
export const createDeal = async (dealData: CreateDealData): Promise<{ success: boolean; error?: string }> => {
  try {

    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: 'No authenticated user found' };
    }

    let imageUrl: string | null = null;
    if (dealData.imageUri) {
      imageUrl = await uploadDealImage(dealData.imageUri);
      if (!imageUrl) {
        return { success: false, error: 'Failed to upload image' };
      }
    }

    const { data: restaurant, error: restaurantError } = await supabase
      .from('restaurant')
      .select('brand_id')
      .eq('restaurant_id', dealData.restaurantId)
      .single();

    if (restaurantError) {
      console.error('Error fetching restaurant:', restaurantError);
      return { success: false, error: 'Failed to fetch restaurant information' };
    }

    const dealTemplateData = {
      restaurant_id: dealData.restaurantId,
      user_id: userId, // Always track the user_id, even for anonymous posts
      title: dealData.title,
      description: dealData.description || null,
      image_url: imageUrl,
      category_id: dealData.categoryId,
      cuisine_id: dealData.cuisineId,
      is_anonymous: dealData.isAnonymous, // This flag controls client-side display
    };


    // Insert the deal template. The database trigger will handle creating the instances.
    const { error: templateError } = await supabase
      .from('deal_template')
      .insert(dealTemplateData);

    if (templateError) {
      return { success: false, error: 'Failed to create deal template' };
    }
    return { success: true };
  } catch (error) {
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

// Interface for deal data from database
export interface DatabaseDeal {
  deal_id: string;
  template_id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  restaurant_name: string;
  restaurant_address: string;
  cuisine_name: string | null;
  category_name: string | null;
  created_at: string;
  start_date: string;
  end_date: string | null;
  is_anonymous: boolean;
  user_id: string;
  user_display_name: string | null;
  user_profile_photo: string | null;
  votes: number;
  is_upvoted: boolean;
  is_downvoted: boolean;
  is_favorited: boolean;
  distance_miles: number | null;
  restaurant_id: string;
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

// Fetch deals from database with ranking
export const fetchRankedDeals = async (): Promise<DatabaseDeal[]> => {
  try {
    // Get ranked deal IDs
    const rankedIds = await getRankedDealIds();
    
    if (rankedIds.length === 0) {
      return [];
    }

    // Get user location
    const userLocation = await getCurrentUserLocation();

    // Fetch deal data
    const { data: deals, error } = await supabase
      .from('deal_instance')
      .select(`
        deal_id,
        template_id,
        start_date,
        end_date,
        is_anonymous,
        created_at,
        deal_template!inner(
          title,
          description,
          image_url,
          user_id,
          restaurant!inner(
            restaurant_id,
            name,
            address
          ),
          cuisine(
            cuisine_name
          ),
          category(
            category_name
          ),
          user(
            display_name,
            profile_photo
          )
        )
      `)
      .in('deal_id', rankedIds)
      .order('created_at', { ascending: false });

    if (error) {
      return [];
    }
    
    // Batch fetch vote states and vote counts
    const dealIds = deals.map(deal => deal.deal_id);
    const [voteStates, voteCounts] = await Promise.all([
      getUserVoteStates(dealIds),
      calculateVoteCounts(dealIds)
    ]);

    // Batch fetch restaurant locations
    const restaurantIds = [...new Set(deals.map(deal => deal.deal_template.restaurant.restaurant_id))];
    let restaurantLocations: Record<string, { lat: number; lng: number }> = {};
    
    if (userLocation && restaurantIds.length > 0) {
      restaurantLocations = await getRestaurantLocationsBatch(restaurantIds);
    }

    // Transform deals with all data
    const transformedDeals: DatabaseDeal[] = deals.map((deal) => {
      let distance_miles: number | null = null;
      
      if (userLocation) {
        const restaurantLocation = restaurantLocations[deal.deal_template.restaurant.restaurant_id];
        if (restaurantLocation) {
          distance_miles = calculateDistance(
            userLocation.lat,
            userLocation.lng,
            restaurantLocation.lat,
            restaurantLocation.lng
          );
        }
      }

      const voteState = voteStates[deal.deal_id] || { isUpvoted: false, isDownvoted: false, isFavorited: false };
      const voteCount = voteCounts[deal.deal_id] || 0;

      return {
        deal_id: deal.deal_id,
        template_id: deal.template_id,
        title: deal.deal_template.title,
        description: deal.deal_template.description,
        image_url: deal.deal_template.image_url,
        restaurant_name: deal.deal_template.restaurant.name,
        restaurant_address: deal.deal_template.restaurant.address,
        restaurant_id: deal.deal_template.restaurant.restaurant_id,
        cuisine_name: deal.deal_template.cuisine?.cuisine_name || null,
        category_name: deal.deal_template.category?.category_name || null,
        created_at: deal.created_at,
        start_date: deal.start_date,
        end_date: deal.end_date,
        is_anonymous: deal.is_anonymous,
        user_display_name: deal.deal_template.user?.display_name || null,
        user_profile_photo: deal.deal_template.user?.profile_photo || null,
        votes: voteCount, // Real vote count from database
        is_upvoted: voteState.isUpvoted,
        is_downvoted: voteState.isDownvoted,
        is_favorited: voteState.isFavorited,
        distance_miles
      };
    });

    // Sort by ranking order
    const rankedDeals = rankedIds
      .map(id => transformedDeals.find(deal => deal.deal_id === id))
      .filter(deal => deal !== undefined) as DatabaseDeal[];

    return rankedDeals;
  } catch (error) {
    return [];
  }
};

// Transform database deal to Deal interface for components
export const transformDealForUI = (dbDeal: DatabaseDeal): Deal => {
  
  // Calculate time ago
  const timeAgo = getTimeAgo(new Date(dbDeal.created_at));
  
  // Handle image URL
  let imageSource = require('../../img/albert.webp'); // Default image
  if (dbDeal.image_url) {
    if (dbDeal.image_url.startsWith('http')) {
      imageSource = { uri: dbDeal.image_url };
    } else {
      const { data } = supabase.storage
        .from('deal-images')
        .getPublicUrl(dbDeal.image_url);
      imageSource = { uri: data.publicUrl };
    }
  }

  // Handle user profile photo
  let userProfilePhotoUrl = null;
  if (dbDeal.user_profile_photo) {
    if (dbDeal.user_profile_photo.startsWith('http')) {
      userProfilePhotoUrl = dbDeal.user_profile_photo;
    } else {
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(dbDeal.user_profile_photo);
      userProfilePhotoUrl = data.publicUrl;
    }
  }

  const transformedDeal = {
    id: dbDeal.deal_id,
    title: dbDeal.title,
    restaurant: dbDeal.restaurant_name,
    details: dbDeal.description || '',
    image: imageSource,
    votes: dbDeal.votes,
    isUpvoted: dbDeal.is_upvoted,
    isDownvoted: dbDeal.is_downvoted,
    isFavorited: dbDeal.is_favorited,
    cuisine: dbDeal.cuisine_name || undefined,
    timeAgo: timeAgo,
    author: dbDeal.is_anonymous ? 'Anonymous' : (dbDeal.user_display_name || 'Unknown'),
    milesAway: dbDeal.distance_miles ? `${dbDeal.distance_miles.toFixed(1)}mi` : '?mi',
    // Add new fields
    userId: dbDeal.user_id,
    userDisplayName: dbDeal.user_display_name || undefined,
    userProfilePhoto: userProfilePhotoUrl || undefined,
    restaurantAddress: dbDeal.restaurant_address,
    isAnonymous: dbDeal.is_anonymous,
  };


  return transformedDeal;
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

    const userId = data.deal_template[0]?.user_id;
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


