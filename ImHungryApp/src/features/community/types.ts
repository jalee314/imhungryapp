/**
 * @file Community feature types
 *
 * Shared type definitions for the decomposed Community (Featured Deals) feature sections.
 */

import { Deal } from '../../components/DealCard';

/**
 * Core community screen state.
 */
export interface CommunityState {
  deals: Deal[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
}

/**
 * Deal interaction callbacks.
 */
export interface CommunityInteractions {
  handleUpvote: (dealId: string) => void;
  handleDownvote: (dealId: string) => void;
  handleFavorite: (dealId: string) => void;
  handleDealPress: (dealId: string) => void;
}

/**
 * Full context returned by useCommunity.
 */
export interface CommunityContext {
  state: CommunityState;
  interactions: CommunityInteractions;
  onRefresh: () => Promise<void>;
  goBack: () => void;
}
