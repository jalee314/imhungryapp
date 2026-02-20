import { supabase } from '../../../lib/supabase';
import type { RowCardData } from '../../components/RowCard';
import type { Deal } from '../../types/deal';

interface ImageVariants {
  original?: string;
  large?: string;
  medium?: string;
  small?: string;
  thumbnail?: string;
}

export interface RestaurantDealLike {
  deal_id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  image_metadata?: {
    variants?: ImageVariants;
  };
  created_at: string;
  end_date: string | null;
  views: number;
  votes: number;
  is_upvoted: boolean;
  is_downvoted: boolean;
  is_favorited: boolean;
  user_id: string | null;
  user_display_name: string | null;
  user_profile_photo: string | null;
  is_anonymous: boolean;
}

interface RestaurantContext {
  name: string;
  address: string;
  distance_miles: number;
}

const getPublicAvatarUrl = (path: string): string => (
  supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl
);

const getPublicDealImageUrl = (path: string): string => (
  supabase.storage.from('deal-images').getPublicUrl(path).data.publicUrl
);

const getPrimaryDealImage = (deal: RestaurantDealLike) => {
  if (deal.image_metadata?.variants?.medium) {
    return deal.image_metadata.variants.medium;
  }
  if (deal.image_metadata?.variants?.small) {
    return deal.image_metadata.variants.small;
  }
  if (deal.image_metadata?.variants?.large) {
    return deal.image_metadata.variants.large;
  }
  if (deal.image_url?.startsWith('http')) {
    return deal.image_url;
  }
  if (deal.image_url) {
    return getPublicDealImageUrl(deal.image_url);
  }
  return require('../../../img/gallery.jpg');
};

const formatExpiration = (endDate: string | null) => {
  if (!endDate) return 'No expiration';

  const end = new Date(endDate);
  const now = new Date();
  const diffTime = end.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return 'Expired';
  if (diffDays === 1) return '1 day';
  return `${diffDays} days`;
};

const formatMonthDay = (dateString: string): string => {
  const date = new Date(dateString);
  const month = (date.getMonth() + 1).toString();
  const day = date.getDate().toString();
  return `${month}/${day}`;
};

export const formatRestaurantDistance = (distance: number): string => (
  Math.round(distance).toString()
);

export const formatTimeAgo = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return date.toLocaleDateString();
};

export const toDealForDetail = (
  deal: RestaurantDealLike,
  restaurant: RestaurantContext,
  cuisineName: string
): Deal => ({
  id: deal.deal_id,
  title: deal.title,
  restaurant: restaurant.name,
  details: deal.description || '',
  image: getPrimaryDealImage(deal),
  imageVariants: deal.image_metadata?.variants,
  votes: deal.votes,
  isUpvoted: deal.is_upvoted,
  isDownvoted: deal.is_downvoted,
  isFavorited: deal.is_favorited,
  cuisine: cuisineName,
  timeAgo: formatTimeAgo(deal.created_at),
  author: deal.user_display_name || 'Anonymous',
  milesAway: `${formatRestaurantDistance(restaurant.distance_miles)}mi`,
  userId: deal.user_display_name || undefined,
  userDisplayName: deal.user_display_name || undefined,
  userProfilePhoto: deal.user_profile_photo
    ? (deal.user_profile_photo.startsWith('http')
      ? deal.user_profile_photo
      : getPublicAvatarUrl(deal.user_profile_photo))
    : undefined,
  restaurantAddress: restaurant.address,
  isAnonymous: deal.is_anonymous,
});

export const toRowCardData = (deal: RestaurantDealLike): RowCardData => {
  const image = deal.image_metadata?.variants?.small
    ? { uri: deal.image_metadata.variants.small }
    : deal.image_metadata?.variants?.thumbnail
      ? { uri: deal.image_metadata.variants.thumbnail }
      : deal.image_metadata?.variants?.medium
        ? { uri: deal.image_metadata.variants.medium }
        : deal.image_url
          ? { uri: deal.image_url.startsWith('http') ? deal.image_url : getPublicDealImageUrl(deal.image_url) }
          : require('../../../img/gallery.jpg');

  return {
    id: deal.deal_id,
    title: deal.title,
    subtitle: '',
    image,
    postedDate: formatMonthDay(deal.created_at),
    expiresIn: formatExpiration(deal.end_date),
    views: deal.views,
    userId: deal.user_id || undefined,
    userDisplayName: deal.user_display_name || undefined,
    userProfilePhoto: deal.user_profile_photo || undefined,
  };
};
