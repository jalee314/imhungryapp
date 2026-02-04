/**
 * Feed Feature Types
 */

export interface Deal {
  id: string;
  title: string;
  restaurant: string;
  details: string;
  image: string | any;
  imageVariants?: ImageVariants;
  votes: number;
  isUpvoted: boolean;
  isDownvoted: boolean;
  isFavorited: boolean;
  cuisine?: string;
  cuisineId?: string;
  dealType?: string;
  timeAgo: string;
  author?: string;
  milesAway?: string;
  userId?: string;
  userDisplayName?: string;
  userProfilePhoto?: string;
  restaurantAddress?: string;
  isAnonymous?: boolean;
}

export interface DatabaseDeal {
  deal_id: string;
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
  image_metadata?: {
    variants: ImageVariants;
    image_type: ImageType;
  };
  user_profile_metadata?: {
    variants: ImageVariants;
  };
  distance_miles?: number | null;
  votes?: number;
  is_upvoted?: boolean;
  is_downvoted?: boolean;
  is_favorited?: boolean;
}

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

export interface Category {
  id: string;
  name: string;
}

export interface Cuisine {
  id: string;
  name: string;
}

export interface Restaurant {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  imageMetadataId?: string;
  brandId?: string;
}

export interface ImageVariants {
  original?: string;
  large?: string;
  medium?: string;
  small?: string;
  thumbnail?: string;
}

export type ImageType = 'profile_image' | 'deal_image' | 'restaurant_image' | 'franchise_logo_image';

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

export interface DealCardProps {
  deal: Deal;
  variant?: 'horizontal' | 'vertical';
  onUpvote?: (dealId: string) => void;
  onDownvote?: (dealId: string) => void;
  onFavorite?: (dealId: string) => void;
  onPress?: (dealId: string) => void;
  hideAuthor?: boolean;
  showDelete?: boolean;
  onDelete?: (dealId: string) => void;
}
