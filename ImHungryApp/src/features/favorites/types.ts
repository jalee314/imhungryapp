/**
 * @file Favorites feature types
 *
 * Shared type definitions for the decomposed Favorites feature sections.
 */

import { FavoriteDeal, FavoriteRestaurant } from '../../services/favoritesService';

/**
 * Active tab selection.
 */
export type FavoritesTab = 'restaurants' | 'deals';

/**
 * Core favorites screen state.
 */
export interface FavoritesState {
  activeTab: FavoritesTab;
  restaurants: FavoriteRestaurant[];
  deals: FavoriteDeal[];
  loading: boolean;
  restaurantsLoading: boolean;
  dealsLoading: boolean;
  refreshing: boolean;
  hasLoadedDeals: boolean;
  hasLoadedRestaurants: boolean;
}

/**
 * Interaction callbacks exposed to section components.
 */
export interface FavoritesInteractions {
  setActiveTab: (tab: FavoritesTab) => void;
  handleRestaurantPress: (restaurantId: string) => void;
  handleDealPress: (dealId: string) => void;
  handleUserPress: (userId: string) => void;
  handleUnfavorite: (id: string, type: 'restaurant' | 'deal') => void;
  handleRefresh: () => Promise<void>;
}

/**
 * Full context returned by useFavoritesScreen.
 */
export interface FavoritesContext {
  state: FavoritesState;
  interactions: FavoritesInteractions;
}
