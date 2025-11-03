/**
 * Common Type Definitions
 * 
 * Shared types used across the application.
 */

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Standard service response wrapper
 */
export interface ServiceResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string | string[];
}

/**
 * Coordinates for location-based features
 */
export interface Coordinates {
  lat: number;
  lng: number;
}

/**
 * Vote state for a user on a deal
 */
export interface VoteState {
  isUpvoted: boolean;
  isDownvoted: boolean;
  isFavorited: boolean;
}

/**
 * Interaction types
 */
export type InteractionType = 'upvote' | 'downvote' | 'favorite' | 'click';

/**
 * Pagination parameters
 */
export interface PaginationParams {
  offset?: number;
  limit?: number;
}

/**
 * Date range filter
 */
export interface DateRange {
  startDate: string;
  endDate: string;
}

