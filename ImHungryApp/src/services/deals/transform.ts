/**
 * @file Deal transformation utilities
 * Functions for transforming deal data between formats
 */

import type { Deal } from '../../types/deal';
import { supabase } from '../../../lib/supabase';
import { getUserVoteStates, calculateVoteCounts } from '../voteService';
import { getTimeAgo } from './utils';
import { DatabaseDeal } from './types';

/**
 * Add vote information (counts, user vote state) to deals
 */
export const addVotesToDeals = async (deals: DatabaseDeal[]): Promise<DatabaseDeal[]> => {
  try {
    if (deals.length === 0) return deals;

    const dealIds = deals.map(deal => deal.deal_id);

    const [voteStates, voteCounts] = await Promise.all([
      getUserVoteStates(dealIds),
      calculateVoteCounts(dealIds)
    ]);

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
    return deals;
  }
};

/**
 * Add distance information to deals using custom coordinates
 */
export const addDistancesToDeals = async (
  deals: DatabaseDeal[],
  customCoordinates?: { lat: number; lng: number }
): Promise<DatabaseDeal[]> => {
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
    return deals;
  }
};

/**
 * Transform database deal representation to UI-friendly Deal format
 */
export const transformDealForUI = (dbDeal: DatabaseDeal): Deal => {
  const timeAgo = getTimeAgo(new Date(dbDeal.created_at));

  // Handle image source - ONLY use Cloudinary or placeholder
  // PRIORITY: 1. First image by display_order, 2. is_thumbnail flag, 3. Primary image from deal_template
  let imageSource;
  let imageVariants = undefined;

  // Sort deal_images by display_order and get the first one
  const sortedDealImages = [...(dbDeal.deal_images || [])].sort((a, b) => 
    (a.display_order ?? 999) - (b.display_order ?? 999)
  );
  const firstImageByOrder = sortedDealImages.find(img => img.variants);
  const thumbnailImage = !firstImageByOrder 
    ? dbDeal.deal_images?.find(img => img.is_thumbnail && img.variants) 
    : null;

  if (firstImageByOrder?.variants) {
    imageSource = require('../../../img/default-rest.png');
    imageVariants = firstImageByOrder.variants;
  } else if (thumbnailImage?.variants) {
    imageSource = require('../../../img/default-rest.png');
    imageVariants = thumbnailImage.variants;
  } else if (dbDeal.image_metadata?.variants) {
    imageSource = require('../../../img/default-rest.png');
    imageVariants = dbDeal.image_metadata.variants;
  } else {
    imageSource = require('../../../img/default-rest.png');
    imageVariants = undefined;
  }

  // Get user profile photo
  let userProfilePhoto = null;
  if (dbDeal.user_profile_metadata?.variants?.small) {
    userProfilePhoto = dbDeal.user_profile_metadata.variants.small;
  } else if (dbDeal.user_profile_metadata?.variants?.thumbnail) {
    userProfilePhoto = dbDeal.user_profile_metadata.variants.thumbnail;
  }

  // Format distance
  let milesAway = '?mi';
  if (dbDeal.distance_miles !== null && dbDeal.distance_miles !== undefined) {
    milesAway = `${Math.round(dbDeal.distance_miles * 10) / 10}mi`;
  }

  // Extract image URLs from deal_images for carousel
  let images: string[] | undefined = undefined;
  if (sortedDealImages && sortedDealImages.length > 0) {
    images = sortedDealImages
      .filter(img => img.variants)
      .map(img => img.variants?.large || img.variants?.medium || img.variants?.original || '')
      .filter(url => url !== '');
  }

  return {
    id: dbDeal.deal_id,
    title: dbDeal.title,
    restaurant: dbDeal.restaurant_name,
    details: dbDeal.description || '',
    image: imageSource,
    imageVariants: imageVariants,
    images: images,
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
    userProfilePhoto: userProfilePhoto || undefined,
    userCity: dbDeal.user_city || undefined,
    userState: dbDeal.user_state || undefined,
    restaurantAddress: dbDeal.restaurant_address,
    isAnonymous: dbDeal.is_anonymous,
    expirationDate: dbDeal.end_date || null,
  };
};
