// ==========================================
// Component Props Types
// ==========================================

import React from 'react';
import { Deal } from './deals';
import { ImageVariants, LocationItem } from './common';

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
  image: string | any;
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
  image: string | any;
  distance?: string;
  dealCount?: number;
  views?: number;
  postedDate?: string;
  expiresIn?: string;
  userId?: string;
  userProfilePhoto?: string;
  userDisplayName?: string;
}

export interface RowCardProps {
  data: RowCardData;
  variant: 'explore-deal-card' | 'rest-deal' | 'favorites-deal-card';
  onPress?: (id: string) => void;
  onUserPress?: (userId: string) => void;
  style?: any;
}

// ==========================================
// UI Component Props
// ==========================================

export interface CuisineFilterProps {
  selectedCuisine: string | null;
  onSelectCuisine: (cuisineId: string | null) => void;
}

export interface HeaderProps {
  title: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
}

export interface DealCardSkeletonProps {
  variant?: 'horizontal' | 'vertical';
}

export interface SkeletonLoaderProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  style?: any;
}

export interface ThreeDotPopupProps {
  visible: boolean;
  onClose: () => void;
  options: Array<{
    label: string;
    onPress: () => void;
    icon?: string;
    danger?: boolean;
  }>;
  anchorPosition?: { x: number; y: number };
}

// ==========================================
// Modal Props
// ==========================================

export interface CalendarModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectDate: (date: string) => void;
}

export interface PhotoActionModalProps {
  visible: boolean;
  onClose: () => void;
  onTakePhoto: () => void;
  onChooseFromGallery: () => void;
}

export interface ListItem {
  id: string;
  name: string;
  icon?: string;
}

export interface ListSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  items: ListItem[];
  selectedItem: string | null;
  onSelectItem: (itemId: string) => void;
  title?: string;
}

export interface LocationModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectLocation: (location: LocationItem) => void;
  currentLocation: LocationItem | null;
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
