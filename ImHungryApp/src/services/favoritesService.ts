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

    const dealIds = favoriteData.map(fav => fav.deal_id);

    // Get deal details with all related data using separate queries
    const { data: deals, error: dealsError } = await supabase
      .from('deal_instance')
      .select('deal_id, template_id, start_date, end_date')
      .in('deal_id', dealIds);

    if (dealsError) {
      console.error('Error fetching deal details:', dealsError);
      return [];
    }

    // Get all template data in one batch query
    const templateIds = [...new Set(deals.map(d => d.template_id))];
    const { data: templatesData } = await supabase
      .from('deal_template')
      .select(`
        template_id,
        title, 
        description, 
        image_url, 
        restaurant_id, 
        cuisine_id, 
        category_id,
        user_id,
        is_anonymous,
        user:user_id (
          display_name,
          profile_photo
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

      // Process image URL
      let imageUrl = '';
      if (template.image_url) {
        if (template.image_url.startsWith('http')) {
          imageUrl = template.image_url;
        } else {
          const { data } = supabase.storage
            .from('deal-images')
            .getPublicUrl(template.image_url);
          imageUrl = data.publicUrl;
        }
      }

      // Process user data
      const userData = Array.isArray(template.user) ? template.user[0] : template.user;
      let userProfilePhotoUrl = null;
      if (userData?.profile_photo && !template.is_anonymous) {
        if (userData.profile_photo.startsWith('http')) {
          userProfilePhotoUrl = userData.profile_photo;
        } else {
          const { data } = supabase.storage
            .from('avatars')
            .getPublicUrl(userData.profile_photo);
          userProfilePhotoUrl = data.publicUrl;
        }
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
    
    if (now - lastFetch < cache.CACHE_DURATION && cache.restaurants.has(cacheKey)) {
      return cache.restaurants.get(cacheKey)!;
    }

    const userLocation = await getCurrentUserLocation();

    // Get favorite deal IDs first
    const { data: favoriteData, error: favoriteError } = await supabase
      .from('favorite')
      .select('deal_id')
      .eq('user_id', userId);

    if (favoriteError) {
      console.error('Error fetching favorites:', favoriteError);
      return [];
    }

    if (!favoriteData || favoriteData.length === 0) {
      return [];
    }

    const dealIds = favoriteData.map(fav => fav.deal_id);

    // Get deal details to get restaurant information
    const { data: deals, error: dealsError } = await supabase
      .from('deal_instance')
      .select('template_id')
      .in('deal_id', dealIds);

    if (dealsError) {
      console.error('Error fetching deal details:', dealsError);
      return [];
    }

    const templateIds = [...new Set((deals || []).map(deal => deal.template_id))];

    // Get template details to get restaurant IDs
    const { data: templates, error: templatesError } = await supabase
      .from('deal_template')
      .select('template_id, restaurant_id, cuisine_id')
      .in('template_id', templateIds);

    if (templatesError) {
      console.error('Error fetching templates:', templatesError);
      return [];
    }

    const restaurantIds = [...new Set((templates || []).map(template => template.restaurant_id))];
    const cuisineIds = [...new Set((templates || []).map(template => template.cuisine_id).filter(Boolean))];

    // Execute all queries in parallel for much better performance
    const [
      restaurantCoordsResult,
      restaurantsResult,
      cuisinesResult,
      dealCountsResult
    ] = await Promise.all([
      // Get restaurant coordinates for distance calculation
      userLocation && restaurantIds.length > 0 
        ? supabase
            .from('restaurants_with_coords')
            .select('restaurant_id, lat, lng')
            .in('restaurant_id', restaurantIds)
        : Promise.resolve({ data: [] }),
      
      // Get all restaurant details in one batch query
      supabase
        .from('restaurant')
        .select('restaurant_id, name, address, image_url')
        .in('restaurant_id', restaurantIds),
      
      // Get all cuisine details in one batch query
      cuisineIds.length > 0
        ? supabase
            .from('cuisine')
            .select('cuisine_id, cuisine_name')
            .in('cuisine_id', cuisineIds)
        : Promise.resolve({ data: [] }),
      
      // Get deal counts for all restaurants in one query
      supabase
        .rpc('get_deal_counts_for_restaurants', { r_ids: restaurantIds })
    ]);

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
    const cuisinesMap = new Map(cuisinesResult.data?.map(c => [c.cuisine_id, c]) || []);
    const dealCountsMap = new Map(dealCountsResult.data?.map((dc: any) => [dc.restaurant_id, dc.deal_count]) || []);

    // Group by restaurant and get unique restaurants
    const restaurantMap = new Map<string, FavoriteRestaurant>();

    for (const template of templates || []) {
      const restaurantId = template.restaurant_id;

      if (!restaurantMap.has(restaurantId)) {
        const restaurantData = restaurantsMap.get(restaurantId);
        if (!restaurantData) continue;

        const cuisineData = cuisinesMap.get(template.cuisine_id);

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
        if (restaurantData.image_url) {
          if (restaurantData.image_url.startsWith('http')) {
            imageUrl = restaurantData.image_url;
          } else {
            const { data } = supabase.storage
              .from('restaurant-images')
              .getPublicUrl(restaurantData.image_url);
            imageUrl = data.publicUrl;
          }
        }

        restaurantMap.set(restaurantId, {
          id: restaurantId,
          name: restaurantData.name,
          address: restaurantData.address,
          imageUrl,
          distance,
          dealCount: Number(dealCountsMap.get(restaurantId)) || 0,
          cuisineName: cuisineData?.cuisine_name || 'Unknown',
          isFavorited: true,
        });
      }
    }

    const restaurants = Array.from(restaurantMap.values());
    
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