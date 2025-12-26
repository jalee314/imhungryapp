import { supabase } from '../../lib/supabase';
import { getCurrentDatabaseSessionId } from './sessionService';

// Interaction types matching your enum
export type InteractionType = 
  | 'impression'
  | 'click-open'
  | 'click-through'
  | 'upvote'
  | 'downvote'
  | 'save'
  | 'favorite'
  | 'redemption_proxy'
  | 'report'
  | 'block'
  | 'share';

// Source types for interactions
export type InteractionSource = 
  | 'feed'
  | 'search'
  | 'favorites'
  | 'profile'
  | 'discover';

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
 * Log an interaction to the database
 */
export const logInteraction = async (
  dealId: string,
  interactionType: InteractionType,
  source: InteractionSource = 'feed',
  positionInFeed?: number,
  dwellTime?: number
): Promise<boolean> => {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return false;

    const sessionId = await getCurrentDatabaseSessionId();
    if (!sessionId) {
      console.warn('No session ID available for interaction');
      return false;
    }

    const { error } = await supabase
      .from('interaction')
      .insert({
        user_id: userId,
        deal_id: dealId,
        session_id: sessionId,
        interaction_type: interactionType,
        source: source,
        position_in_feed: positionInFeed || null,
        dwell_time: dwellTime || null,
      });

    if (error) {
      console.error('Error logging interaction:', error);
      return false;
    }

    console.log(`✅ ${interactionType} logged for deal ${dealId} from ${source}`);
    return true;
  } catch (error) {
    console.error('Error in logInteraction:', error);
    return false;
  }
};

/**
 * Log a click interaction when user opens a deal
 */
export const logClick = async (dealId: string, source: InteractionSource = 'feed', positionInFeed?: number): Promise<boolean> => {
  return await logInteraction(dealId, 'click-open', source, positionInFeed);
};

/**
 * Log a share interaction when user shares a deal
 */
export const logShare = async (dealId: string, source: InteractionSource = 'feed'): Promise<boolean> => {
  return await logInteraction(dealId, 'share', source);
};

/**
 * Log a click-through interaction when user clicks directions/map
 */
export const logClickThrough = async (dealId: string, source: InteractionSource = 'feed'): Promise<boolean> => {
  return await logInteraction(dealId, 'click-through', source);
};

/**
 * Remove favorite interactions for a deal when unfavoriting
 */
export const removeFavoriteInteractions = async (dealId: string): Promise<boolean> => {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return false;

    const { error } = await supabase
      .from('interaction')
      .delete()
      .eq('user_id', userId)
      .eq('deal_id', dealId)
      .eq('interaction_type', 'favorite');

    if (error) {
      console.error('Error removing favorite interactions:', error);
      return false;
    }

    console.log(`🗑️ Favorite interactions removed for deal ${dealId}`);
    return true;
  } catch (error) {
    console.error('Error in removeFavoriteInteractions:', error);
    return false;
  }
};

/**
 * Get the view count for a deal (count of click interactions)
 */
export const getDealViewCount = async (dealId: string): Promise<number> => {
  try {
    const { count, error } = await supabase
      .from('interaction')
      .select('*', { count: 'exact', head: true })
      .eq('deal_id', dealId)
      .eq('interaction_type', 'click-open');

    if (error) {
      console.error('Error fetching view count:', error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error('Error in getDealViewCount:', error);
    return 0;
  }
};

/**
 * Get view counts for multiple deals at once (more efficient)
 */
export const getDealViewCounts = async (dealIds: string[]): Promise<Record<string, number>> => {
  try {
    if (dealIds.length === 0) return {};

    const { data, error } = await supabase
      .from('interaction')
      .select('deal_id')
      .in('deal_id', dealIds)
      .eq('interaction_type', 'click-open');

    if (error) {
      console.error('Error fetching view counts:', error);
      return {};
    }

    // Count clicks per deal
    const viewCounts: Record<string, number> = {};
    dealIds.forEach(id => viewCounts[id] = 0);
    
    data?.forEach(interaction => {
      viewCounts[interaction.deal_id] = (viewCounts[interaction.deal_id] || 0) + 1;
    });

    return viewCounts;
  } catch (error) {
    console.error('Error in getDealViewCounts:', error);
    return {};
  }
};

/**
 * Get random viewer profile photos for a deal (up to 3)
 */
export const getDealViewerPhotos = async (dealId: string, limit: number = 3): Promise<string[]> => {
  try {
    // First, get unique user_ids who viewed this deal (excluding null users)
    const { data: interactions, error: interactionError } = await supabase
      .from('interaction')
      .select('user_id')
      .eq('deal_id', dealId)
      .eq('interaction_type', 'click-open')
      .not('user_id', 'is', null);

    if (interactionError) {
      console.error('Error fetching viewer interactions:', interactionError);
      return [];
    }

    if (!interactions || interactions.length === 0) {
      return [];
    }

    // Get unique user IDs
    const uniqueUserIds = [...new Set(interactions.map(i => i.user_id).filter(Boolean))] as string[];
    
    if (uniqueUserIds.length === 0) {
      return [];
    }

    // Shuffle and take up to `limit` random users
    const shuffledUserIds = uniqueUserIds.sort(() => Math.random() - 0.5).slice(0, limit);

    // Fetch profile photos for these users
    const { data: users, error: userError } = await supabase
      .from('user')
      .select(`
        user_id,
        profile_photo,
        profile_photo_metadata_id,
        image_metadata:profile_photo_metadata_id (
          variants
        )
      `)
      .in('user_id', shuffledUserIds);

    if (userError) {
      console.error('Error fetching viewer profiles:', userError);
      return [];
    }

    // Extract profile photo URLs, preferring optimized versions
    const profilePhotos: string[] = [];
    users?.forEach(user => {
      let photoUrl: string | null = null;
      
      // Prefer small/medium optimized version for avatars from variants
      if (user.image_metadata) {
        const metadata = user.image_metadata as any;
        if (metadata.variants) {
          // variants is an object with size keys like 'small', 'medium', 'large', 'original'
          photoUrl = metadata.variants.small || metadata.variants.medium || metadata.variants.original;
        }
      }
      
      // Fallback to profile_photo field
      if (!photoUrl && user.profile_photo) {
        if (user.profile_photo.startsWith('http')) {
          photoUrl = user.profile_photo;
        } else {
          // Build storage URL
          const { data } = supabase.storage.from('profile-photos').getPublicUrl(user.profile_photo);
          photoUrl = data.publicUrl;
        }
      }
      
      if (photoUrl) {
        profilePhotos.push(photoUrl);
      }
    });

    return profilePhotos;
  } catch (error) {
    console.error('Error in getDealViewerPhotos:', error);
    return [];
  }
};
