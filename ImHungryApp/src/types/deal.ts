import type { ImageVariants, ImageType } from './image';

export interface Deal {
  id: string;
  title: string;
  restaurant: string;
  details: string;
  image: string | any;
  imageVariants?: any;
  images?: string[];
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
  userCity?: string;
  userState?: string;
  restaurantAddress?: string;
  isAnonymous?: boolean;
  expirationDate?: string | null;
  uploaderUserId?: string;
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
  user_city?: string | null;
  user_state?: string | null;
  restaurant_id: string;
  image_metadata?: {
    variants: ImageVariants;
    image_type: ImageType;
  };
  deal_images?: Array<{
    image_metadata_id: string;
    display_order: number;
    is_thumbnail: boolean;
    variants: ImageVariants;
  }>;
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
  imageUris: string[];
  thumbnailIndex: number;
  expirationDate: string | null;
  restaurantId: string;
  categoryId: string | null;
  cuisineId: string | null;
  isAnonymous: boolean;
}

export interface RankedDealMeta {
  deal_id: string;
  distance?: number | null;
}

export interface RestaurantDeal {
  deal_id: string;
  template_id: string;
  title: string;
  description: string;
  image_url: string | null;
  created_at: string;
  start_date: string;
  end_date: string | null;
  votes: number;
  is_upvoted: boolean;
  is_downvoted: boolean;
  is_favorited: boolean;
  image_variants?: ImageVariants;
}

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

export interface DealCardSkeletonProps {
  variant?: 'horizontal' | 'vertical';
}
