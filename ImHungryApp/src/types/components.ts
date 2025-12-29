// ==========================================
// Component Props Types
// ==========================================

import React from 'react';
import { ImageSourcePropType, ViewStyle, ImageStyle, TextStyle } from 'react-native';
import { Deal } from './deals';
import { ImageVariants } from './common';

// ==========================================
// Location Types (used in components)
// ==========================================

export interface LocationItem {
  id: string;
  city: string;
  state: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

// ==========================================
// Card Component Props
// ==========================================

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

export interface SquareCardData {
  id: string;
  title: string;
  subtitle: string;
  image: string | ImageSourcePropType;
  distance?: string;
  dealCount?: number;
}

export interface SquareCardProps {
  data: SquareCardData;
  onPress?: (id: string) => void;
}

export interface RowCardData {
  id: string;
  title: string;
  subtitle: string;
  image: string | ImageSourcePropType;
  distance?: string;
  dealCount?: number;
  views?: number;
  postedDate?: string;
  expiresIn?: string;
  userId?: string;
  userProfilePhoto?: string;
  userDisplayName?: string;
}

export type RowCardVariant = 'explore-deal-card' | 'rest-deal' | 'favorites-deal-card';

export interface RowCardProps {
  data: RowCardData;
  variant: RowCardVariant;
  onPress?: (id: string) => void;
  onUserPress?: (userId: string) => void;
  style?: ViewStyle;
}

// ==========================================
// UI Component Props
// ==========================================

export interface CuisineFilterProps {
  filters: string[];
  selectedFilter?: string;
  selectedFilters?: string[];
  multiSelect?: boolean;
  onFilterSelect: (filter: string) => void;
  onFiltersSelect?: (filters: string[]) => void;
  style?: ViewStyle;
  showAllOption?: boolean;
}

export interface HeaderProps {
  onLocationPress?: () => void;
  currentLocation?: string;
  paddingHorizontal?: number;
}

export interface DealCardSkeletonProps {
  variant?: 'horizontal' | 'vertical';
}

export interface SkeletonLoaderProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  style?: ViewStyle;
}

export interface ThreeDotPopupProps {
  visible: boolean;
  onClose: () => void;
  onReport: () => void;
  onBlock: () => void;
}

export interface VoteButtonsProps {
  votes: number;
  isUpvoted: boolean;
  isDownvoted: boolean;
  onUpvote: () => void;
  onDownvote: () => void;
}

// ==========================================
// Modal Props
// ==========================================

export interface CalendarModalProps {
  visible: boolean;
  onClose: () => void;
  onDateSelect: (date: string) => void;
}

export interface PhotoActionModalProps {
  visible: boolean;
  onClose: () => void;
  onTakePhoto: () => void;
  onSelectFromGallery: () => void;
}

export interface ListItem {
  id: string;
  name: string;
  image?: string;
}

export interface ListSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  items: ListItem[];
  selectedItem: string | null;
  onSelectItem: (item: ListItem) => void;
  title: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  emptyMessage?: string;
}

export interface LocationModalProps {
  visible: boolean;
  onClose: () => void;
  onLocationUpdate: (location: LocationItem) => void;
}

export interface MapSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  restaurantName: string;
  restaurantAddress: string;
  restaurantLat?: number;
  restaurantLng?: number;
}

// ==========================================
// Navigation Props
// ==========================================

export interface FeedTabNavigatorProps {
  initialTab?: 'community' | 'deals' | 'discover';
}

export interface BottomNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export interface AuthGuardProps {
  children: React.ReactNode;
}
