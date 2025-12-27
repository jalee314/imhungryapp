/**
 * Profile Feature Module
 *
 * Handles user profile functionality including:
 * - Profile viewing and editing
 * - Settings pages (FAQ, Privacy, Terms, Contact)
 * - Blocked users management
 * - Cuisine preferences
 * - Favorites management
 *
 * @module features/profile
 */

// Screens
export { default as ProfilePage } from './screens/ProfilePage';
export { default as ProfileEdit } from './screens/ProfileEdit';
export { default as BlockedUsersPage } from './screens/BlockedUsersPage';
export { default as ContactUsPage } from './screens/ContactUsPage';
export { default as FAQPage } from './screens/FAQPage';
export { default as TermsConditionsPage } from './screens/TermsConditionsPage';
export { default as PrivacyPolicyPage } from './screens/PrivacyPolicyPage';
export { default as CuisineEdit } from './screens/CuisineEdit';
export { default as FavoritesPage } from './screens/FavoritesPage';

// Hooks
export { useProfile } from './hooks/useProfile';
export { useProfileEdit } from './hooks/useProfileEdit';
export { useFavorites } from './hooks/useFavorites';
export type { FavoriteDealData } from './hooks/useFavorites';

// Store
export { useFavoritesStore } from './stores/FavoritesStore';
