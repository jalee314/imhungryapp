// ==========================================
// Core Domain Types
// ==========================================

// Deal Types
export interface Deal {
  id: string;
  title: string;
  restaurant: string;
  details: string;
  image: string | any;
  imageVariants?: ImageVariants;
  votes: number;
  isUpvoted: boolean;
  isDownvoted: boolean;
  isFavorited: boolean;
  cuisine?: string;
  cuisineId?: string;
  dealType?: string; // e.g., "BOGO", "50% Off", "Happy Hour"
  timeAgo: string;
  author?: string;
  milesAway?: string;
  userId?: string;
  userDisplayName?: string;
  userProfilePhoto?: string;
  restaurantAddress?: string;
  isAnonymous?: boolean;
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
  restaurant_id: string;
  image_metadata?: {
    variants: ImageVariants;
    image_type: ImageType;
  };
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
  imageUri: string | null;
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

// User Types
export interface User {
  user_id: string;
  display_name: string;
  email: string;
  profile_photo: string | null;
  location_city: string | null;
  first_name: string;
  last_name: string;
  phone_number: string | null;
  location_lat: number | null;
  location_long: number | null;
}

export interface UserDisplayData {
  username: string;
  profilePicture: string | null;
  city: string;
  state: string;
}

export interface UserPost {
  id: string;
  title: string;
  restaurant: string;
  details: string;
  image: { uri: string } | any;
  imageVariants?: any;
  votes: number;
  isUpvoted: boolean;
  isDownvoted: boolean;
  isFavorited: boolean;
  cuisine: string;
  cuisineId?: string;
  timeAgo: string;
  author: string;
  milesAway: string;
  userId?: string;
  userDisplayName?: string;
  userProfilePhoto?: string;
  restaurantAddress?: string;
  isAnonymous?: boolean;
}

export interface UserProfileData {
  profile: any;
  photoUrl: string | null;
  dealCount: number;
  userData: {
    username: string;
    profilePicture: string | null;
    city: string;
    state: string;
  };
}

export interface UserProfileCache {
  profile: any;
  photoUrl: string | null;
  dealCount: number;
  userData: {
    username: string;
    profilePicture: string | null;
    city: string;
    state: string;
  };
  userPosts: UserPost[];
}

// Restaurant Types
export interface Restaurant {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  imageMetadataId?: string;
  brandId?: string;
}

export interface GooglePlaceResult {
  google_place_id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  distance_miles: number;
  types: string[];
}

export interface RestaurantSearchResult {
  success: boolean;
  restaurants: GooglePlaceResult[];
  count: number;
  error?: string;
}

export interface DiscoverRestaurant {
  restaurant_id: string;
  name: string;
  address: string;
  logo_image?: string;
  deal_count: number;
  distance_miles: number;
  lat: number;
  lng: number;
}

export interface DiscoverResult {
  success: boolean;
  restaurants: DiscoverRestaurant[];
  count: number;
  error?: string;
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

// Category and Cuisine Types
export interface Category {
  id: string;
  name: string;
}

export interface Cuisine {
  id: string;
  name: string;
}

// ==========================================
// Favorites Types
// ==========================================

export interface FavoriteDeal {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  imageVariants?: any;
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
// Admin Types
// ==========================================

export interface AdminUser {
  user_id: string;
  display_name: string;
  email: string;
  is_admin: boolean;
}

export interface Report {
  report_id: string;
  deal_id: string;
  reporter_user_id: string;
  uploader_user_id: string;
  reason_code_id: string;
  reason_text: string | null;
  status: 'pending' | 'review' | 'resolved';
  created_at: string;
  updated_at: string;
  resolved_by: string | null;
  resolution_action: string | null;
  deal?: {
    title: string;
    description: string;
    image_url?: string;
    restaurant_name?: string;
  };
  reporter?: {
    display_name: string;
  };
  uploader?: {
    display_name: string;
  };
  reason_code?: {
    reason_code: string;
    description: string;
  };
}

export interface AdminDeal {
  deal_instance_id: string;
  deal_template_id: string;
  title: string;
  description: string;
  image_url: string | null;
  expiration_date: string | null;
  restaurant_name: string;
  restaurant_address: string;
  uploader_user_id: string;
  category_name: string | null;
  cuisine_name: string | null;
  created_at: string;
}

export interface UserProfile {
  user_id: string;
  display_name: string;
  email: string;
  profile_photo: string | null;
  location_city: string | null;
  is_admin: boolean;
  is_banned: boolean;
  is_suspended: boolean;
  suspension_until: string | null;
  ban_reason: string | null;
  suspended_reason: string | null;
  warning_count: number;
  created_at: string;
}

export interface AppAnalytics {
  totalUsers: number;
  totalDeals: number;
  totalReports: number;
  pendingReports: number;
  mostActiveUsers: Array<{
    user_id: string;
    display_name: string;
    deal_count: number;
  }>;
  mostPopularDeals: Array<{
    deal_instance_id: string;
    title: string;
    interaction_count: number;
  }>;
  recentSignups: number;
  dealsThisWeek: number;
}

// ==========================================
// Report & Block Types
// ==========================================

export interface ReportSubmission {
  dealId: string;
  reporterUserId: string;
  uploaderUserId: string;
  reasonCodeId: string;
  reasonText?: string;
}

export interface ReasonCode {
  reason_code_id: string;
  reason_code: string;
  description: string;
}

export interface BlockReasonCode {
  reason_code_id: string;
  reason_code: string | number;
  description: string | null;
}

export interface CreateBlockData {
  blockerUserId: string;
  blockedUserId: string;
  reasonCodeId: string;
  reasonText?: string;
}

export interface BlockSubmissionResult {
  success: boolean;
  error?: string;
  blockId?: string;
}

// ==========================================
// Service Result Types
// ==========================================

export interface PasswordResetResult {
  success: boolean;
  message: string;
  errorType?: 'EMAIL_NOT_FOUND' | 'SUPABASE_ERROR' | 'UNKNOWN_ERROR';
}

export interface ProfileLoadingResult {
  profile: any;
  photoUrl: string | null;
  dealCount: number;
  userData: {
    username: string;
    profilePicture: string | null;
    city: string;
    state: string;
  };
  userPosts: UserPost[];
  currentUserPhotoUrl?: string | null;
}

export interface CuisineUpdateResult {
  success: boolean;
  processed: number;
  updated: number;
  skipped: number;
  errors: number;
  summary: string;
  details: Array<{
    restaurant_id: string;
    name: string;
    google_place_id: string | null;
    types: string[];
    detected_cuisine: string | null;
    updated: boolean;
  }>;
}

// ==========================================
// Component Props Types
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
// Context Types
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

// Deprecated: AdminContext replaced by Zustand store (useAdminStore). Types removed.

// ==========================================
// Navigation Types
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

// ==========================================
// Modal Types
// ==========================================

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