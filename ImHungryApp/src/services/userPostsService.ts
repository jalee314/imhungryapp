import { supabase } from '../../lib/supabase';

// Cache for user posts
const postsCache = new Map<string, {
  data: UserPost[];
  timestamp: number;
}>();

const POSTS_CACHE_DURATION = 30000; // 30 seconds cache for posts

export interface UserPost {
  id: string;
  title: string;
  restaurant: string;
  details: string;
  image: { uri: string } | any;
  votes: number;
  isUpvoted: boolean;
  isDownvoted: boolean;
  isFavorited: boolean;
  cuisine: string;
  cuisineId?: string;
  timeAgo: string;
  author: string;
  milesAway: string;
  userId?: string;
  userDisplayName?: string;
  userProfilePhoto?: string;
  restaurantAddress?: string;
  isAnonymous?: boolean;
}

/**
 * Transform database post data to UI format
 */
export const transformDealForUI = (post: any): UserPost => {
  // Process image URL
  let imageUri = null;
  if (post.image_url) {
    if (post.image_url.startsWith('http')) {
      imageUri = post.image_url;
    } else {
      const { data } = supabase.storage.from('deal-images').getPublicUrl(post.image_url);
      imageUri = data.publicUrl;
    }
  }
  
  return {
    id: post.deal_id || post.template_id,
    title: post.title,
    restaurant: Array.isArray(post.restaurant) 
      ? (post.restaurant[0]?.name || 'Unknown') 
      : (post.restaurant?.name || 'Unknown'),
    details: post.description,
    image: imageUri ? { uri: imageUri } : null,
    votes: 0,
    isUpvoted: false,
    isDownvoted: false,
    isFavorited: false,
    cuisine: 'Unknown',
    cuisineId: undefined,
    timeAgo: 'Unknown',
    author: post.user_display_name || 'Unknown',
    milesAway: 'Unknown',
    userId: post.user_id,
    userDisplayName: post.user_display_name,
    userProfilePhoto: post.user_profile_photo,
    restaurantAddress: Array.isArray(post.restaurant) 
      ? (post.restaurant[0]?.address || '') 
      : (post.restaurant?.address || ''),
    isAnonymous: false,
  };
};

/**
 * Fetch user posts with restaurant data
 */
export const fetchUserPosts = async (
  targetUserId: string, 
  limit: number = 20
): Promise<UserPost[]> => {
  try {
    // Check cache first
    const cacheKey = `${targetUserId}_${limit}`;
    const cached = postsCache.get(cacheKey);
    const now = Date.now();
    
    if (cached && (now - cached.timestamp) < POSTS_CACHE_DURATION) {
      console.log('Using cached posts for user:', targetUserId);
      return cached.data;
    }

    const { data: postsData, error: postsError } = await supabase
      .from('deal_template')
      .select(`
        template_id,
        title,
        description,
        image_url,
        created_at,
        restaurant_id,
        restaurant:restaurant_id (
          name,
          address
        )
      `)
      .eq('user_id', targetUserId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (postsError) {
      console.error('Error fetching user posts:', postsError);
      return [];
    }

    if (!postsData || postsData.length === 0) {
      console.log('No posts data found for user:', targetUserId);
      return [];
    }

    console.log('Loading posts for user:', targetUserId, 'Found posts:', postsData.length);
    
    // Transform posts to UI format
    const transformedPosts = postsData.map((post: any) => transformDealForUI({
      deal_id: post.template_id,
      template_id: post.template_id,
      title: post.title,
      description: post.description,
      image_url: post.image_url,
      created_at: post.created_at,
      restaurant: post.restaurant,
      user_display_name: '', // Will be set by caller
      user_profile_photo: null, // Will be set by caller
      user_id: targetUserId,
    }));

    // Cache the results
    postsCache.set(cacheKey, {
      data: transformedPosts,
      timestamp: now
    });

    return transformedPosts;
  } catch (error) {
    console.error('Error in fetchUserPosts:', error);
    return [];
  }
};

/**
 * Update posts with user information
 */
export const updatePostsWithUserInfo = (
  posts: UserPost[],
  userDisplayName: string,
  userProfilePhoto: string | null
): UserPost[] => {
  return posts.map(post => ({
    ...post,
    author: userDisplayName,
    userDisplayName: userDisplayName,
    userProfilePhoto: userProfilePhoto || undefined,
  }));
};

/**
 * Clear posts cache for a specific user
 */
export const clearUserPostsCache = (userId: string): void => {
  const keysToDelete = Array.from(postsCache.keys()).filter(key => key.startsWith(`${userId}_`));
  keysToDelete.forEach(key => postsCache.delete(key));
};

/**
 * Clear all posts cache
 */
export const clearAllPostsCache = (): void => {
  postsCache.clear();
};
