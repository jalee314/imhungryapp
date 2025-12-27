/**
 * Deals Feature Module
 *
 * Handles deal-related functionality including:
 * - Deal feed display
 * - Deal detail views
 * - Deal reporting and blocking
 * - Community uploaded deals
 * - Deal state management
 *
 * @module features/deals
 */

// Screens
export { default as Feed } from './screens/Feed';
export { default as DealDetailScreen } from './screens/DealDetailScreen';
export { default as CommunityUploadedScreen } from './screens/CommunityUploadedScreen';
export { default as ReportContentScreen } from './screens/ReportContentScreen';
export { default as BlockUserScreen } from './screens/BlockUserScreen';

// Components
export { default as FeedTabNavigator } from './components/FeedTabNavigator';
export { default as ThreeDotPopup } from './components/ThreeDotPopup';

// Hooks
export { useDealUpdate } from './hooks/useDealUpdate';

// Store
export { useDealUpdateStore } from './stores/DealUpdateStore';
