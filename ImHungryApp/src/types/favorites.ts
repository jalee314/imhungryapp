import type { ImageVariants } from './image';

export interface FavoriteDeal {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  imageVariants?: ImageVariants;
  restaurantName: string;
  restaurantAddress: string;
  distance: string;
  dealCount: number;
  cuisineName: string;
  categoryName: string;
  createdAt: string;
  isFavorited: boolean;
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
  createdAt: string;
}

export interface RestaurantFavoriteResult {
  success: boolean;
  error?: string;
}
