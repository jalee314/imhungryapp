// ==========================================
// Common/Shared Types
// ==========================================

import React from 'react';

// ==========================================
// Image Processing Types
// ==========================================

export type ImageType = 'profile_image' | 'deal_image' | 'restaurant_image' | 'franchise_logo_image';

export interface ImageVariants {
  original?: string;
  large?: string;
  medium?: string;
  small?: string;
  thumbnail?: string;
}

export interface VariantContext {
  devicePixelRatio?: number;
  screenWidth?: number;
  componentType: 'profile' | 'deal' | 'restaurant' | 'franchise_logo';
  displaySize: { width: number; height: number };
  networkType?: 'slow-2g' | '2g' | '3g' | '4g' | 'wifi';
}

// ==========================================
// Interaction & Analytics Types
// ==========================================

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
// Service Result Types
// ==========================================

export interface PasswordResetResult {
  success: boolean;
  message: string;
  errorType?: 'EMAIL_NOT_FOUND' | 'SUPABASE_ERROR' | 'UNKNOWN_ERROR';
}

// ==========================================
// Favorites Types
// ==========================================

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
}

export interface RestaurantFavoriteResult {
  success: boolean;
  error?: string;
}

// ==========================================
// Location Types
// ==========================================

export interface LocationItem {
  id: string;
  name: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}

export interface LocationContextType {
  currentLocation: LocationItem | null;
  setCurrentLocation: (location: LocationItem) => void;
  searchLocation: (query: string) => Promise<LocationItem[]>;
  resetToUserLocation: () => Promise<void>;
}

export interface LocationProviderProps {
  children: React.ReactNode;
}

// ==========================================
// Context Types
// ==========================================

export interface FavoritesContextType {
  favorites: Set<string>;
  toggleFavorite: (dealId: string) => Promise<void>;
}

export interface DealUpdateContextType {
  triggerDealUpdate: () => void;
  dealUpdateTrigger: number;
}

export interface AuthContextType {
  user: any | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, userData: any) => Promise<void>;
  signOut: () => Promise<void>;
  loading: boolean;
}

export interface AuthProviderProps {
  children: React.ReactNode;
}
