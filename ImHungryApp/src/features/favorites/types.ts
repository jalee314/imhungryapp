/**
 * Favorites Feature Types
 */

export interface FavoriteDeal {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
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
  logoImage: string | null;
  dealCount: number;
  distance: string;
  isFavorited: boolean;
}

export interface FavoriteDealData {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  restaurantName: string;
  restaurantAddress: string;
  distance: string;
  userId?: string;
  userDisplayName?: string;
  userProfilePhoto?: string;
  isAnonymous?: boolean;
  favoritedAt: string;
}
