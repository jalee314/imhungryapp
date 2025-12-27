/**
 * Discover Feature Module
 *
 * Handles restaurant discovery functionality including:
 * - Restaurant feed/discovery
 * - Restaurant detail views
 * - Location management
 * - Map-based search
 *
 * @module features/discover
 */

// Screens
export { default as DiscoverFeed } from './screens/DiscoverFeed';
export { default as RestaurantDetailScreen } from './screens/RestaurantDetailScreen';

// Components
export { default as MapSelectionModal } from './components/MapSelectionModal';

// Hooks
export { useLocation } from './hooks/useLocation';

// Store
export { useLocationStore, useInitializeLocation } from './stores/LocationStore';
