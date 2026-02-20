/**
 * Interaction Service (Facade)
 *
 * Minimal facade for interaction logging operations. This service provides
 * backward compatibility with existing callers while delegating to
 * the canonical implementation in src/features/interactions.
 *
 * For new code, use the interactions feature module directly:
 * @see src/features/interactions for centralized interaction logging utilities
 *
 * @module services/interactionService
 * @since PR-035 - Converted logging functions to thin facades
 */

import { supabase } from '../../lib/supabase';
import {
  logInteractionEvent,
  logClickEvent,
  logShareEvent,
  logClickThroughEvent,
  removeFavoriteInteractionsForDeal,
} from '../features/interactions';
import type { InteractionSource as CanonicalInteractionSource } from '../features/interactions';

// Re-export types for backward compatibility
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

export type InteractionSource = 
  | 'feed'
  | 'search'
  | 'favorites'
  | 'profile'
  | 'discover';

// ==========================================
// Interaction Logging (Facade)
// ==========================================

/**
 * Log an interaction to the database
 * Returns boolean for backward compatibility (true = success)
 * @deprecated Use logInteractionEvent from @/features/interactions directly
 */
export const logInteraction = async (
  dealId: string,
  interactionType: InteractionType,
  source: InteractionSource = 'feed',
  positionInFeed?: number,
  dwellTime?: number
): Promise<boolean> => {
  const result = await logInteractionEvent({
    dealId,
    interactionType,
    source: source as CanonicalInteractionSource,
    positionInFeed,
    dwellTime,
  });
  return result.success;
};

/**
 * Log a click interaction when user opens a deal
 * @deprecated Use logClickEvent from @/features/interactions directly
 */
export const logClick = async (
  dealId: string,
  source: InteractionSource = 'feed',
  positionInFeed?: number
): Promise<boolean> => {
  const result = await logClickEvent(dealId, source as CanonicalInteractionSource, positionInFeed);
  return result.success;
};

/**
 * Log a share interaction when user shares a deal
 * @deprecated Use logShareEvent from @/features/interactions directly
 */
export const logShare = async (
  dealId: string,
  source: InteractionSource = 'feed'
): Promise<boolean> => {
  const result = await logShareEvent(dealId, source as CanonicalInteractionSource);
  return result.success;
};

/**
 * Log a click-through interaction when user clicks directions/map
 * @deprecated Use logClickThroughEvent from @/features/interactions directly
 */
export const logClickThrough = async (
  dealId: string,
  source: InteractionSource = 'feed'
): Promise<boolean> => {
  const result = await logClickThroughEvent(dealId, source as CanonicalInteractionSource);
  return result.success;
};

/**
 * Remove favorite interactions for a deal when unfavoriting
 * @deprecated Use removeFavoriteInteractionsForDeal from @/features/interactions directly
 */
export const removeFavoriteInteractions = async (dealId: string): Promise<boolean> => {
  const result = await removeFavoriteInteractionsForDeal(dealId);
  return result.success;
};

// ==========================================
// View Count Functions (Non-duplicated)
// ==========================================

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
        const metadata = user.image_metadata;
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
