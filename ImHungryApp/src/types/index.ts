// ==========================================
// Types Index - Re-exports all domain types
// ==========================================
// This file re-exports all types from domain-specific files
// for backward compatibility and convenience.

// Deal types
export type {
  Deal,
  DatabaseDeal,
  CreateDealData,
  RankedDealMeta,
  DealVote,
} from './deals';

// User types
export type {
  User,
  UserDisplayData,
  UserPost,
  UserProfileData,
  UserProfileCache,
  UserProfile,
  ProfileLoadingResult,
} from './user';

// Restaurant types
export type {
  Restaurant,
  GooglePlaceResult,
  RestaurantSearchResult,
  DiscoverRestaurant,
  DiscoverResult,
  RestaurantDeal,
} from './restaurant';

// Cuisine types
export type {
  Category,
  Cuisine,
  CuisinePreference,
  CuisineUpdateResult,
} from './cuisine';

// Admin types
export type {
  AdminUser,
  Report,
  AdminDeal,
  AppAnalytics,
  ReportSubmission,
  ReasonCode,
  BlockReasonCode,
  CreateBlockData,
  BlockSubmissionResult,
} from './admin';

// Common types
export type {
  ImageType,
  ImageVariants,
  VariantContext,
  InteractionType,
  InteractionSource,
  PasswordResetResult,
  FavoriteDeal,
  FavoriteRestaurant,
  RestaurantFavoriteResult,
  LocationItem,
  LocationContextType,
  LocationProviderProps,
  FavoritesContextType,
  DealUpdateContextType,
  AuthContextType,
  AuthProviderProps,
} from './common';

// Component props types
export type {
  DealCardProps,
  SquareCardData,
  SquareCardProps,
  RowCardData,
  RowCardProps,
  CuisineFilterProps,
  HeaderProps,
  DealCardSkeletonProps,
  SkeletonLoaderProps,
  ThreeDotPopupProps,
  CalendarModalProps,
  PhotoActionModalProps,
  ListItem,
  ListSelectionModalProps,
  LocationModalProps,
  FeedTabNavigatorProps,
  BottomNavigationProps,
  AuthGuardProps,
} from './components';
