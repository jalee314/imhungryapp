/**
 * @file Profile feature types
 *
 * Shared type definitions for the decomposed Profile feature sections and hooks.
 */

import type { UserPost } from '../../services/userPostsService';
import type { ProfileRecord, ProfileUserData } from '../../services/userProfileService';

// ============================================================================
// Params
// ============================================================================

export interface ProfileParams {
  navigation: ProfileNavigation;
  route: ProfileRoute;
}

export interface ProfileNavigation {
  navigate: (screen: string, params?: unknown) => void;
  goBack: () => void;
  canGoBack: () => boolean;
}

export interface ProfileRoute {
  params?: {
    viewUser?: boolean;
    userId?: string;
    [key: string]: unknown;
  };
}

// ============================================================================
// Profile Data
// ============================================================================

export interface ProfileDataState {
  profile: ProfileRecord | null;
  userData: ProfileUserData | null;
  photoUrl: string | null;
  currentUserPhotoUrl: string | null;
  dealCount: number;
  hasData: boolean;
}

export interface ProfileDataActions {
  setProfile: React.Dispatch<React.SetStateAction<ProfileRecord | null>>;
  setPhotoUrl: React.Dispatch<React.SetStateAction<string | null>>;
  setCurrentUserPhotoUrl: React.Dispatch<React.SetStateAction<string | null>>;
  setDealCount: React.Dispatch<React.SetStateAction<number>>;
  refreshProfile: () => Promise<void>;
  loadProfileData: () => Promise<void>;
}

// ============================================================================
// Posts
// ============================================================================

export interface ProfilePostsState {
  userPosts: UserPost[];
  postsLoading: boolean;
  postsInitialized: boolean;
  postsError: string | null;
}

export interface ProfilePostsActions {
  setUserPosts: React.Dispatch<React.SetStateAction<UserPost[]>>;
  loadUserPosts: () => Promise<void>;
}

// ============================================================================
// Interactions
// ============================================================================

export interface ProfileInteractionHandlers {
  onUpvote: (dealId: string) => void;
  onDownvote: (dealId: string) => void;
  onFavorite: (dealId: string) => void;
  onDealPress: (dealId: string) => void;
  onDeletePost: (dealId: string) => void;
}

// ============================================================================
// Profile Actions
// ============================================================================

export interface ProfileActionHandlers {
  onEditProfile: () => void;
  onProfilePhotoPress: () => void;
  onProfileTabReselect: () => void;
  onShareProfile: () => void;
  onGoBack: () => void;
}

// ============================================================================
// Modals
// ============================================================================

export interface ProfileModalState {
  showLogoutModal: boolean;
  showDeleteModal: boolean;
}

export interface ProfileModalHandlers {
  openLogoutModal: () => void;
  closeLogoutModal: () => void;
  confirmLogout: () => Promise<void>;
  openDeleteModal: () => void;
  closeDeleteModal: () => void;
  confirmDeleteAccount: () => Promise<void>;
}

// ============================================================================
// Aggregated (full hook result — same as legacy UseProfileResult)
// ============================================================================

export interface UseProfileResult {
  // Data
  profile: ProfileRecord | null;
  photoUrl: string | null;
  dealCount: number;
  userPosts: UserPost[];
  hasData: boolean;
  activeTab: 'posts' | 'settings';
  postsLoading: boolean;
  postsInitialized: boolean;
  postsError: string | null;
  displayName: string;
  joinDateText: string;
  locationCity: string;
  isViewingOtherUser: boolean;
  // UI state
  showLogoutModal: boolean;
  showDeleteModal: boolean;
  // Handlers
  setActiveTab: (tab: 'posts' | 'settings') => void;
  onRetryLoadPosts: () => void;
  onUpvote: (dealId: string) => void;
  onDownvote: (dealId: string) => void;
  onFavorite: (dealId: string) => void;
  onDealPress: (dealId: string) => void;
  onDeletePost: (dealId: string) => void;
  onEditProfile: () => void;
  onProfilePhotoPress: () => void;
  onProfileTabReselect: () => void;
  onShareProfile: () => void;
  onGoBack: () => void;
  openLogoutModal: () => void;
  closeLogoutModal: () => void;
  confirmLogout: () => Promise<void>;
  openDeleteModal: () => void;
  closeDeleteModal: () => void;
  confirmDeleteAccount: () => Promise<void>;
}
