/**
 * Discover Feature Types
 */

export interface DiscoverRestaurant {
  restaurant_id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  logo_image: string | null;
  deal_count: number;
  distance_miles: number;
  brand_id?: string;
}

export interface RestaurantDeal {
  deal_id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  image_metadata?: {
    variants?: {
      original?: string;
      large?: string;
      medium?: string;
      small?: string;
      thumbnail?: string;
    };
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

export interface RowCardData {
  id: string;
  title: string;
  subtitle: string;
  image: { uri: string } | number;
  distance: string;
  dealCount?: number;
  isFavorited?: boolean;
}
