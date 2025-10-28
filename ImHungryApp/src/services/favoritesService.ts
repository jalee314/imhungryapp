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
  imageVariants?: any; // Cloudinary variants for proper skeleton loading
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
      let imageVariants = undefined; // Store variants for skeleton loading
      const imageMetadata = Array.isArray(template.image_metadata) ? template.image_metadata[0] : template.image_metadata;
      if (imageMetadata?.variants) {
        // Use Cloudinary variants (new deals)
        const variants = imageMetadata.variants;
        imageUrl = variants.medium || variants.small || variants.large || 'placeholder';
        imageVariants = variants; // Preserve variants for skeleton loading
      }
      // OLD Supabase storage images will just use 'placeholder'

      // Process user data with Cloudinary support
      const userData = Array.isArray(template.user) ? template.user[0] : template.user;
      let userProfilePhotoUrl = null;
      if (userData && !template.is_anonymous) {
        // Try Cloudinary first
        const userImageMetadata = Array.isArray(userData.image_metadata) ? userData.image_metadata[0] : userData.image_metadata;
        if (userImageMetadata?.variants) {
          userProfilePhotoUrl = userImageMetadata.variants.small || userImageMetadata.variants.thumbnail || null;
        }
        // If no Cloudinary, leave as null (don't use old Supabase storage)
      }

      const favoriteRecord = favoriteData.find(fav => fav.deal_id === deal.deal_id);

      favoriteDeals.push({
        id: deal.deal_id,
        title: template.title,
        description: template.description || '',
        imageUrl,
        imageVariants, // Include variants for skeleton loading
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

    if (!favoriteData || favoriteData.length === 0) {
      return [];
    }

    // Get ONLY directly favorited restaurants
    const directRestaurantIds = favoriteData
      .map(fav => fav.restaurant_id)
      .filter((id): id is string => id !== null);

    if (directRestaurantIds.length === 0) {
      return [];
    }

    const allRestaurantIds = directRestaurantIds;

    // Execute all queries in parallel for much better performance
    const [
      restaurantCoordsResult,
      restaurantsResult,
      cuisinesResult,
      dealCountsResult,
      mostLikedDealsResult
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
        : Promise.resolve({ data: [] }),
      
      // Get the most liked deal with an image for each restaurant to use as thumbnail
      allRestaurantIds.length > 0
        ? (async () => {
            try {
              // Step 1: Get all deal templates for these restaurants (with or without image_metadata_id)
              const { data: dealTemplates, error: templateError } = await supabase
                .from('deal_template')
                .select(`
                  template_id,
                  restaurant_id,
                  image_url,
                  image_metadata_id,
                  image_metadata:image_metadata_id (
                    variants
                  )
                `)
                .in('restaurant_id', allRestaurantIds);

              if (templateError) {
                console.error('❌ Error fetching deal templates:', templateError);
                return { data: [], error: templateError };
              }

              if (!dealTemplates || dealTemplates.length === 0) {
                return { data: [], error: null };
              }

              // Step 2: Get deal instances for these templates
              const templateIds = dealTemplates.map(t => t.template_id);
              const { data: dealInstances, error: instanceError } = await supabase
                .from('deal_instance')
                .select('deal_id, template_id')
                .in('template_id', templateIds);

              if (instanceError) {
                console.error('❌ Error fetching deal instances:', instanceError);
                return { data: [], error: instanceError };
              }

              // Create a map of template_id -> deal_id
              const templateToDealMap: Record<string, string> = {};
              dealInstances?.forEach(instance => {
                if (!templateToDealMap[instance.template_id]) {
                  templateToDealMap[instance.template_id] = instance.deal_id;
                }
              });

              // Step 3: Count upvotes for all deal_ids
              const dealIds = Object.values(templateToDealMap);
              
              if (dealIds.length === 0) {
                return { data: [], error: null };
              }

              const { data: upvotes, error: voteError } = await supabase
                .from('interaction')
                .select('deal_id')
                .in('deal_id', dealIds)
                .eq('interaction_type', 'upvote');

              if (voteError) {
                console.error('❌ Error fetching upvotes:', voteError);
              }

              // Count upvotes per deal_id
              const upvoteCounts: Record<string, number> = {};
              upvotes?.forEach(vote => {
                upvoteCounts[vote.deal_id] = (upvoteCounts[vote.deal_id] || 0) + 1;
              });

              // Step 4: For each restaurant, find the deal with most upvotes
              const mostLikedByRestaurant: Record<string, any> = {};
              
              dealTemplates.forEach(template => {
                const restaurantId = template.restaurant_id;
                const dealId = templateToDealMap[template.template_id];
                const upvoteCount = dealId ? (upvoteCounts[dealId] || 0) : 0;
                
                if (!mostLikedByRestaurant[restaurantId] || 
                    upvoteCount > mostLikedByRestaurant[restaurantId].upvote_count) {
                  mostLikedByRestaurant[restaurantId] = {
                    restaurant_id: restaurantId,
                    template_id: template.template_id,
                    image_url: template.image_url,
                    image_metadata_id: template.image_metadata_id,
                    image_metadata: template.image_metadata,
                    upvote_count: upvoteCount
                  };
                }
              });

              return { data: Object.values(mostLikedByRestaurant), error: null };
            } catch (error) {
              console.error('❌ Error in most liked deals query:', error);
              return { data: [], error: error };
            }
          })()
        : Promise.resolve({ data: [] })
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
    
    // Process cuisine data from restaurant_cuisine table
    const cuisinesMap = new Map();
    cuisinesResult.data?.forEach((item: any) => {
      const cuisine = Array.isArray(item.cuisine) ? item.cuisine[0] : item.cuisine;
      cuisinesMap.set(item.restaurant_id, cuisine);
    });
    
    const dealCountsMap = new Map(dealCountsResult.data?.map((dc: any) => [dc.restaurant_id, dc.deal_count]) || []);
    
    // Create a map of most liked deals for each restaurant
    const mostLikedDealsMap = new Map();
    mostLikedDealsResult.data?.forEach((deal: any) => {
      mostLikedDealsMap.set(deal.restaurant_id, deal);
    });

    // Create favorite restaurants from all restaurant IDs
    const restaurants: FavoriteRestaurant[] = [];

    for (const restaurantId of allRestaurantIds) {
      const restaurantData = restaurantsMap.get(restaurantId);
      if (!restaurantData) {
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

      // Use the image from the most liked deal at this restaurant as the thumbnail
      let imageUrl = '';
      const mostLikedDeal = mostLikedDealsMap.get(restaurantId);
      
      if (mostLikedDeal) {
        // Handle image_metadata - might be an array or object
        const imageMetadata = Array.isArray(mostLikedDeal.image_metadata) 
          ? mostLikedDeal.image_metadata[0] 
          : mostLikedDeal.image_metadata;
        
        // Try to get image from Cloudinary variants first (for new deals)
        if (imageMetadata?.variants) {
          const variants = imageMetadata.variants;
          imageUrl = variants.medium || variants.small || variants.large || '';
        }
        // Fallback to image_url if no variants (older deals might still use this)
        else if (mostLikedDeal.image_url) {
          imageUrl = mostLikedDeal.image_url;
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