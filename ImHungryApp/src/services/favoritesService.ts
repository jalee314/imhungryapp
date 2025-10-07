import { supabase } from '../../lib/supabase';
import { getCurrentUserLocation } from './locationService';

// Simple cache to avoid redundant queries
const cache = {
  restaurants: new Map<string, FavoriteRestaurant[]>(),
  deals: new Map<string, FavoriteDeal[]>(),
  lastFetch: new Map<string, number>(),
  CACHE_DURATION: 30000, // 30 seconds
};

export interface FavoriteDeal {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  restaurantName: string;
  restaurantAddress: string;
  distance: string;
  dealCount: number;
  cuisineName: string;
  categoryName: string;
  createdAt: string;
  isFavorited: boolean;
  // User information
  userId?: string;
  userDisplayName?: string;
  userProfilePhoto?: string;
  isAnonymous: boolean;
}

export interface FavoriteRestaurant {
  id: string;
  name: string;
  address: string;
  imageUrl: string;
  distance: string;
  dealCount: number;
  cuisineName: string;
  isFavorited: boolean;
}

/**
 * Get the current authenticated user's ID
 */
const getCurrentUserId = async (): Promise<string | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id || null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

/**
 * Fetch user's favorite deals
 */
export const fetchFavoriteDeals = async (): Promise<FavoriteDeal[]> => {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return [];

    // Check cache first
    const cacheKey = `deals_${userId}`;
    const now = Date.now();
    const lastFetch = cache.lastFetch.get(cacheKey) || 0;
    
    if (now - lastFetch < cache.CACHE_DURATION && cache.deals.has(cacheKey)) {
      return cache.deals.get(cacheKey)!;
    }

    const userLocation = await getCurrentUserLocation();

    // Get favorite deal IDs first
    const { data: favoriteData, error: favoriteError } = await supabase
      .from('favorite')
      .select('deal_id, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (favoriteError) {
      console.error('Error fetching favorites:', favoriteError);
      return [];
    }

    if (!favoriteData || favoriteData.length === 0) {
      return [];
    }

    // Filter out null values from dealIds
    const dealIds = favoriteData.map(fav => fav.deal_id).filter((id): id is string => id !== null);

    // Get deal details with all related data using separate queries
    const { data: deals, error: dealsError } = await supabase
      .from('deal_instance')
      .select('deal_id, template_id, start_date, end_date')
      .in('deal_id', dealIds);

    if (dealsError) {
      console.error('Error fetching deal details:', dealsError);
      return [];
    }

    // Get all template data in one batch query - NOW WITH IMAGE METADATA
    const templateIds = [...new Set(deals.map(d => d.template_id))];
    const { data: templatesData } = await supabase
      .from('deal_template')
      .select(`
        template_id,
        title, 
        description, 
        image_url,
        image_metadata_id,
        restaurant_id, 
        cuisine_id, 
        category_id,
        user_id,
        is_anonymous,
        image_metadata:image_metadata_id (
          variants
        ),
        user:user_id (
          display_name,
          profile_photo,
          profile_photo_metadata_id,
          image_metadata:profile_photo_metadata_id (
            variants
          )
        )
      `)
      .in('template_id', templateIds);

    const templatesMap = new Map(templatesData?.map(t => [t.template_id, t]) || []);

    // Get all restaurant data in one batch query
    const restaurantIds = [...new Set(templatesData?.map(t => t.restaurant_id).filter(Boolean))];
    const { data: restaurantsData } = await supabase
      .from('restaurant')
      .select('restaurant_id, name, address')
      .in('restaurant_id', restaurantIds);

    const restaurantsMap = new Map(restaurantsData?.map(r => [r.restaurant_id, r]) || []);

    // Get all cuisine data in one batch query
    const cuisineIds = [...new Set(templatesData?.map(t => t.cuisine_id).filter(Boolean))];
    const { data: cuisinesData } = await supabase
      .from('cuisine')
      .select('cuisine_id, cuisine_name')
      .in('cuisine_id', cuisineIds);

    const cuisinesMap = new Map(cuisinesData?.map(c => [c.cuisine_id, c]) || []);

    // Get all category data in one batch query
    const categoryIds = [...new Set(templatesData?.map(t => t.category_id).filter(Boolean))];
    const { data: categoriesData } = await supabase
      .from('category')
      .select('category_id, category_name')
      .in('category_id', categoryIds);

    const categoriesMap = new Map(categoriesData?.map(c => [c.category_id, c]) || []);

    // Get restaurant coordinates for distance calculation
    let restaurantLocations: Record<string, { lat: number; lng: number }> = {};
    if (userLocation && restaurantIds.length > 0) {
      const { data: restaurantCoords } = await supabase
        .from('restaurants_with_coords')
        .select('restaurant_id, lat, lng')
        .in('restaurant_id', restaurantIds);

      restaurantCoords?.forEach(restaurant => {
        if (restaurant.lat && restaurant.lng) {
          restaurantLocations[restaurant.restaurant_id] = {
            lat: parseFloat(restaurant.lat),
            lng: parseFloat(restaurant.lng)
          };
        }
      });
    }

    // Get deal counts for all restaurants in one query
    const { data: dealCountsData } = await supabase
      .rpc('get_deal_counts_for_restaurants', { r_ids: restaurantIds });

    const dealCountsMap = new Map(dealCountsData?.map((dc: any) => [dc.restaurant_id, dc.deal_count]) || []);

    const favoriteDeals: FavoriteDeal[] = [];

    for (const deal of deals || []) {
      const template = templatesMap.get(deal.template_id);
      if (!template) continue;

      const restaurant = restaurantsMap.get(template.restaurant_id);
      if (!restaurant) continue;

      // Calculate distance
      let distance = 'Unknown';
      if (userLocation && restaurantLocations[restaurant.restaurant_id]) {
        const coords = restaurantLocations[restaurant.restaurant_id];
        const distanceKm = calculateDistance(
          userLocation.lat,
          userLocation.lng,
          coords.lat,
          coords.lng
        );
        distance = distanceKm < 1 
          ? `${Math.round(distanceKm * 1000)}m` 
          : `${distanceKm.toFixed(1)}mi`;
      }

      // UPDATED: Handle image URL - use Cloudinary or use 'placeholder' string
      let imageUrl = 'placeholder'; // Default to placeholder
      if (template.image_metadata?.variants) {
        // Use Cloudinary variants (new deals)
        const variants = template.image_metadata.variants;
        imageUrl = variants.medium || variants.small || variants.large || 'placeholder';
      }
      // OLD Supabase storage images will just use 'placeholder'

      // Process user data with Cloudinary support
      const userData = Array.isArray(template.user) ? template.user[0] : template.user;
      let userProfilePhotoUrl = null;
      if (userData && !template.is_anonymous) {
        // Try Cloudinary first
        if (userData.image_metadata?.variants) {
          userProfilePhotoUrl = userData.image_metadata.variants.small || userData.image_metadata.variants.thumbnail || null;
        }
        // If no Cloudinary, leave as null (don't use old Supabase storage)
      }

      const favoriteRecord = favoriteData.find(fav => fav.deal_id === deal.deal_id);

      favoriteDeals.push({
        id: deal.deal_id,
        title: template.title,
        description: template.description || '',
        imageUrl,
        restaurantName: restaurant.name,
        restaurantAddress: restaurant.address,
        distance,
        dealCount: Number(dealCountsMap.get(restaurant.restaurant_id)) || 0,
        cuisineName: cuisinesMap.get(template.cuisine_id)?.cuisine_name || 'Unknown',
        categoryName: categoriesMap.get(template.category_id)?.category_name || 'Unknown',
        createdAt: favoriteRecord?.created_at || new Date().toISOString(),
        isFavorited: true,
        userId: template.user_id,
        userDisplayName: template.is_anonymous ? 'Anonymous' : (userData?.display_name || 'Unknown User'),
        userProfilePhoto: userProfilePhotoUrl,
        isAnonymous: template.is_anonymous,
      });
    }

    // Cache the results
    cache.deals.set(cacheKey, favoriteDeals);
    cache.lastFetch.set(cacheKey, now);

    return favoriteDeals;
  } catch (error) {
    console.error('Error in fetchFavoriteDeals:', error);
    return [];
  }
};

/**
 * Fetch user's favorite restaurants (restaurants with favorited deals)
 */
export const fetchFavoriteRestaurants = async (): Promise<FavoriteRestaurant[]> => {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return [];

    // Check cache first
    const cacheKey = `restaurants_${userId}`;
    const now = Date.now();
    const lastFetch = cache.lastFetch.get(cacheKey) || 0;
    
    console.log('🔍 Cache check:', {
      cacheKey,
      now,
      lastFetch,
      cacheAge: now - lastFetch,
      cacheDuration: cache.CACHE_DURATION,
      hasCachedData: cache.restaurants.has(cacheKey)
    });
    
    if (now - lastFetch < cache.CACHE_DURATION && cache.restaurants.has(cacheKey)) {
      const cachedData = cache.restaurants.get(cacheKey)!;
      console.log('📦 Returning cached data:', cachedData);
      return cachedData;
    }
    
    console.log('🔄 Cache miss or expired, fetching fresh data');
    
    // Clear cache to force fresh fetch
    cache.restaurants.delete(cacheKey);
    cache.lastFetch.delete(cacheKey);

    const userLocation = await getCurrentUserLocation();

    // Get ONLY directly favorited restaurants (not restaurants with favorited deals)
    const { data: favoriteData, error: favoriteError } = await supabase
      .from('favorite')
      .select('restaurant_id, created_at')
      .eq('user_id', userId)
      .not('restaurant_id', 'is', null);

    if (favoriteError) {
      console.error('Error fetching favorites:', favoriteError);
      return [];
    }

    console.log('🔍 Raw favorite data:', favoriteData);
    console.log('🔍 Favorite data length:', favoriteData?.length || 0);

    if (!favoriteData || favoriteData.length === 0) {
      console.log('❌ No favorite data found');
      return [];
    }

    // Log each favorite entry to see the structure
    favoriteData.forEach((fav, index) => {
      console.log(`📝 Favorite ${index + 1}:`, {
        restaurant_id: fav.restaurant_id,
        created_at: fav.created_at
      });
    });

    // Get ONLY directly favorited restaurants
    const directRestaurantIds = favoriteData
      .map(fav => fav.restaurant_id)
      .filter((id): id is string => id !== null);

    console.log('🏪 Direct restaurant IDs:', directRestaurantIds);

    if (directRestaurantIds.length === 0) {
      console.log('❌ No directly favorited restaurants found');
      return [];
    }

    const allRestaurantIds = directRestaurantIds;
    console.log('🍽️ Restaurant IDs to fetch:', allRestaurantIds);

    console.log('🔍 About to fetch restaurant details for IDs:', allRestaurantIds);

    // Execute all queries in parallel for much better performance
    const [
      restaurantCoordsResult,
      restaurantsResult,
      cuisinesResult,
      dealCountsResult
    ] = await Promise.all([
      // Get restaurant coordinates for distance calculation
      userLocation && allRestaurantIds.length > 0 
        ? supabase
            .from('restaurants_with_coords')
            .select('restaurant_id, lat, lng')
            .in('restaurant_id', allRestaurantIds)
        : Promise.resolve({ data: [] }),
      
      // Get all restaurant details in one batch query
      supabase
        .from('restaurant')
        .select('restaurant_id, name, address, restaurant_image_metadata') // Changed
        .in('restaurant_id', allRestaurantIds),
      
      // Get cuisine details for restaurants
      allRestaurantIds.length > 0
        ? supabase
            .from('restaurant_cuisine')
            .select(`
              restaurant_id,
              cuisine!inner(
                cuisine_id,
                cuisine_name
              )
            `)
            .in('restaurant_id', allRestaurantIds)
        : Promise.resolve({ data: [] }),
      
      // Get deal counts for all restaurants (simplified approach)
      allRestaurantIds.length > 0
        ? supabase
            .from('deal_template')
            .select('restaurant_id')
            .in('restaurant_id', allRestaurantIds)
            .then(result => {
              // Count deals per restaurant
              const counts: any[] = [];
              const dealCounts: Record<string, number> = {};
              result.data?.forEach(deal => {
                dealCounts[deal.restaurant_id] = (dealCounts[deal.restaurant_id] || 0) + 1;
              });
              Object.entries(dealCounts).forEach(([restaurant_id, deal_count]) => {
                counts.push({ restaurant_id, deal_count });
              });
              return { data: counts, error: null };
            })
        : Promise.resolve({ data: [] })
    ]);

    console.log('🔍 Restaurant coords result:', restaurantCoordsResult);
    console.log('🔍 Restaurants result:', restaurantsResult);
    console.log('🔍 Cuisines result:', cuisinesResult);
    console.log('🔍 Deal counts result:', dealCountsResult);

    // Process restaurant coordinates
    const restaurantLocations: Record<string, { lat: number; lng: number }> = {};
    restaurantCoordsResult.data?.forEach(restaurant => {
      if (restaurant.lat && restaurant.lng) {
        restaurantLocations[restaurant.restaurant_id] = {
          lat: parseFloat(restaurant.lat),
          lng: parseFloat(restaurant.lng)
        };
      }
    });

    // Create maps for quick lookup
    const restaurantsMap = new Map(restaurantsResult.data?.map(r => [r.restaurant_id, r]) || []);
    
    // Process cuisine data from restaurant_cuisine table
    const cuisinesMap = new Map();
    cuisinesResult.data?.forEach((item: any) => {
      const cuisine = Array.isArray(item.cuisine) ? item.cuisine[0] : item.cuisine;
      cuisinesMap.set(item.restaurant_id, cuisine);
    });
    
    const dealCountsMap = new Map(dealCountsResult.data?.map((dc: any) => [dc.restaurant_id, dc.deal_count]) || []);
    
    console.log('🔍 Restaurants map size:', restaurantsMap.size);
    console.log('🔍 Restaurants map keys:', Array.from(restaurantsMap.keys()));
    console.log('🔍 Cuisines map size:', cuisinesMap.size);
    console.log('🔍 Deal counts map size:', dealCountsMap.size);

    // Create favorite restaurants from all restaurant IDs
    const restaurants: FavoriteRestaurant[] = [];

    for (const restaurantId of allRestaurantIds) {
      console.log(`🔍 Processing restaurant ID: ${restaurantId}`);
      const restaurantData = restaurantsMap.get(restaurantId);
      console.log(`🔍 Restaurant data for ${restaurantId}:`, restaurantData);
      if (!restaurantData) {
        console.log(`❌ No restaurant data found for ${restaurantId}`);
        continue;
      }

      // Find cuisine for this restaurant
      let cuisineName = 'Unknown';
      const cuisineData = cuisinesMap.get(restaurantId);
      if (cuisineData) {
        cuisineName = cuisineData.cuisine_name;
      }

      // Calculate distance if user location is available
      let distance = 'Unknown';
      if (userLocation && restaurantLocations[restaurantId]) {
        const coords = restaurantLocations[restaurantId];
        const distanceKm = calculateDistance(
          userLocation.lat,
          userLocation.lng,
          coords.lat,
          coords.lng
        );
        distance = distanceKm < 1 
          ? `${Math.round(distanceKm * 1000)}m` 
          : `${distanceKm.toFixed(1)}mi`;
      }

      // Process restaurant image URL - add Supabase storage prefix if needed
      let imageUrl = '';
      if (restaurantData.restaurant_image_metadata) {
        // This is a UUID reference to image_metadata table
        // You'll need to fetch the variants from image_metadata table
        // For now, if you want a quick fix, you can treat it as a URL
        if (typeof restaurantData.restaurant_image_metadata === 'string' && 
            restaurantData.restaurant_image_metadata.startsWith('http')) {
          imageUrl = restaurantData.restaurant_image_metadata;
        } else {
          // TODO: Query image_metadata table to get variants
          // const { data: metadata } = await supabase
          //   .from('image_metadata')
          //   .select('variants')
          //   .eq('image_metadata_id', restaurantData.restaurant_image_metadata)
          //   .single();
          // Then use imageProcessingService to get optimal variant
        }
      }

      restaurants.push({
        id: restaurantId,
        name: restaurantData.name,
        address: restaurantData.address,
        imageUrl,
        distance,
        dealCount: Number(dealCountsMap.get(restaurantId)) || 0,
        cuisineName,
        isFavorited: true,
      });
    }
    
    console.log('✅ Final restaurants:', restaurants);

    // Cache the results
    cache.restaurants.set(cacheKey, restaurants);
    cache.lastFetch.set(cacheKey, now);

    return restaurants;
  } catch (error) {
    console.error('Error in fetchFavoriteRestaurants:', error);
    return [];
  }
};

/**
 * Toggle restaurant favorite status
 */
export const toggleRestaurantFavorite = async (
  restaurantId: string, 
  isCurrentlyFavorited: boolean
): Promise<boolean> => {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      throw new Error('User not authenticated');
    }

    if (isCurrentlyFavorited) {
      // Remove from favorites
      const { error } = await supabase
        .from('favorite')
        .delete()
        .eq('user_id', userId)
        .eq('restaurant_id', restaurantId);
      
      if (error) throw error;
      return false;
    } else {
      // Add to favorites
      const { error } = await supabase
        .from('favorite')
        .insert({
          user_id: userId,
          restaurant_id: restaurantId,
        });
      
      if (error) throw error;
      return true;
    }
  } catch (error) {
    console.error('Error toggling restaurant favorite:', error);
    throw error;
  }
};

/**
 * Clear cache for a specific user (useful when favorites change)
 * Optimized for speed - no async operations
 */
export const clearFavoritesCache = (): void => {
  try {
    // Clear all cache entries immediately (synchronous)
    cache.deals.clear();
    cache.restaurants.clear();
    cache.lastFetch.clear();
  } catch (error) {
    console.error('Error clearing favorites cache:', error);
  }
};

/**
 * Calculate distance between two coordinates using Haversine formula
 */
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};