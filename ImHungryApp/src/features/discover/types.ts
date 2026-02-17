/**
 * @file Discover feature types
 *
 * Shared type definitions for the decomposed Discover (restaurant search) feature sections.
 */

import { DiscoverRestaurant } from '../../services/discoverService';

/**
 * Core discover screen state.
 */
export interface DiscoverState {
  searchQuery: string;
  loading: boolean;
  restaurants: DiscoverRestaurant[];
  filteredRestaurants: DiscoverRestaurant[];
  error: string | null;
}

/**
 * Interaction callbacks exposed to section components.
 */
export interface DiscoverInteractions {
  handleSearchChange: (text: string) => void;
  handleClearSearch: () => void;
  handleRowCardPress: (id: string) => void;
  handleRetry: () => void;
}

/**
 * Full context returned by useDiscover.
 */
export interface DiscoverContext {
  state: DiscoverState;
  interactions: DiscoverInteractions;
}
