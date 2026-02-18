/**
 * @file Barrel re-export for all domain types.
 *
 * Prefer importing from the domain-specific module
 * (e.g. `../types/deal`, `../types/user`) when adding new code.
 * This barrel exists for backward compatibility with existing imports.
 */

// Deal
export type {
  Deal,
  DatabaseDeal,
  CreateDealData,
  RankedDealMeta,
  RestaurantDeal,
  DealCardProps,
  DealCardSkeletonProps,
} from './deal';

// User
export type {
  User,
  UserDisplayData,
  UserPost,
  UserProfileData,
  UserProfileCache,
} from './user';

// Restaurant
export type {
  Restaurant,
  GooglePlaceResult,
  RestaurantSearchResult,
  Category,
  Cuisine,
} from './restaurant';

// Image
export type {
  ImageType,
  ImageVariants,
  VariantContext,
} from './image';

// Discover
export type {
  DiscoverRestaurant,
  DiscoverResult,
} from './discover';

// Favorites
export type {
  FavoriteDeal,
  FavoriteRestaurant,
  RestaurantFavoriteResult,
} from './favorites';

// Admin
export type {
  AdminUser,
  Report,
  AdminDeal,
  UserProfile,
  AppAnalytics,
} from './admin';

// Block / Report
export type {
  ReportSubmission,
  ReasonCode,
  BlockReasonCode,
  CreateBlockData,
  BlockSubmissionResult,
} from './block';

// Service results
export type {
  PasswordResetResult,
  ProfileLoadingResult,
  CuisineUpdateResult,
} from './service-results';

// Interaction (canonical types live in features/interactions/types.ts)
export type { InteractionType, InteractionSource } from '../features/interactions/types';

// Component props
export type {
  SquareCardData,
  SquareCardProps,
  RowCardData,
  RowCardProps,
  CuisineFilterProps,
  HeaderProps,
  CalendarModalProps,
  PhotoActionModalProps,
  SkeletonLoaderProps,
  ThreeDotPopupProps,
  LocationItem,
  ListItem,
  ListSelectionModalProps,
  LocationModalProps,
} from './components';

// Navigation (UI-level)
export type {
  FeedTabNavigatorProps,
  BottomNavigationProps,
  AuthGuardProps,
} from './navigation';
