/**
 * FavoritesStore Characterization Tests
 *
 * These tests document the optimistic update behavior of the FavoritesStore.
 * The store tracks local unfavorited items and newly favorited deals for instant UI updates.
 */

import { useFavoritesStore, type FavoriteDealData } from '../FavoritesStore';

describe('FavoritesStore', () => {
  const mockDealData: FavoriteDealData = {
    id: 'deal-123',
    title: 'Test Deal',
    description: 'A great deal',
    imageUrl: 'https://example.com/image.jpg',
    restaurantName: 'Test Restaurant',
    restaurantAddress: '123 Main St',
    distance: '1.2 mi',
    userId: 'user-123',
    userDisplayName: 'Test User',
    userProfilePhoto: 'https://example.com/photo.jpg',
    isAnonymous: false,
    favoritedAt: '2026-01-01T00:00:00.000Z',
  };

  beforeEach(() => {
    // Reset store state before each test
    useFavoritesStore.setState({
      unfavoritedItems: new Set<string>(),
      unfavoritedRestaurants: new Set<string>(),
      newlyFavoritedDeals: new Map<string, FavoriteDealData>(),
    });
  });

  describe('Initial State', () => {
    it('should have empty sets and maps initially', () => {
      const state = useFavoritesStore.getState();

      expect(state.unfavoritedItems.size).toBe(0);
      expect(state.unfavoritedRestaurants.size).toBe(0);
      expect(state.newlyFavoritedDeals.size).toBe(0);
    });
  });

  describe('markAsUnfavorited()', () => {
    describe('for deals', () => {
      it('should add deal id to unfavoritedItems set', () => {
        useFavoritesStore.getState().markAsUnfavorited('deal-123', 'deal');

        expect(useFavoritesStore.getState().unfavoritedItems.has('deal-123')).toBe(true);
      });

      it('should remove deal from newlyFavoritedDeals when marking as unfavorited', () => {
        // First, mark as favorited
        useFavoritesStore.getState().markAsFavorited('deal-123', 'deal', mockDealData);
        expect(useFavoritesStore.getState().newlyFavoritedDeals.has('deal-123')).toBe(true);

        // Then unfavorite it
        useFavoritesStore.getState().markAsUnfavorited('deal-123', 'deal');

        expect(useFavoritesStore.getState().newlyFavoritedDeals.has('deal-123')).toBe(false);
        expect(useFavoritesStore.getState().unfavoritedItems.has('deal-123')).toBe(true);
      });

      it('should allow multiple deals to be marked as unfavorited', () => {
        useFavoritesStore.getState().markAsUnfavorited('deal-1', 'deal');
        useFavoritesStore.getState().markAsUnfavorited('deal-2', 'deal');
        useFavoritesStore.getState().markAsUnfavorited('deal-3', 'deal');

        const state = useFavoritesStore.getState();
        expect(state.unfavoritedItems.has('deal-1')).toBe(true);
        expect(state.unfavoritedItems.has('deal-2')).toBe(true);
        expect(state.unfavoritedItems.has('deal-3')).toBe(true);
        expect(state.unfavoritedItems.size).toBe(3);
      });
    });

    describe('for restaurants', () => {
      it('should add restaurant id to unfavoritedRestaurants set', () => {
        useFavoritesStore.getState().markAsUnfavorited('restaurant-123', 'restaurant');

        expect(useFavoritesStore.getState().unfavoritedRestaurants.has('restaurant-123')).toBe(true);
      });

      it('should not affect deal sets when marking restaurant as unfavorited', () => {
        useFavoritesStore.getState().markAsUnfavorited('restaurant-123', 'restaurant');

        expect(useFavoritesStore.getState().unfavoritedItems.size).toBe(0);
      });
    });
  });

  describe('markAsFavorited()', () => {
    describe('for deals', () => {
      it('should add deal data to newlyFavoritedDeals map', () => {
        useFavoritesStore.getState().markAsFavorited('deal-123', 'deal', mockDealData);

        const state = useFavoritesStore.getState();
        expect(state.newlyFavoritedDeals.has('deal-123')).toBe(true);
        expect(state.newlyFavoritedDeals.get('deal-123')).toEqual(mockDealData);
      });

      it('should remove deal from unfavoritedItems when re-favoriting', () => {
        // First, mark as unfavorited
        useFavoritesStore.getState().markAsUnfavorited('deal-123', 'deal');
        expect(useFavoritesStore.getState().unfavoritedItems.has('deal-123')).toBe(true);

        // Then re-favorite it
        useFavoritesStore.getState().markAsFavorited('deal-123', 'deal', mockDealData);

        expect(useFavoritesStore.getState().unfavoritedItems.has('deal-123')).toBe(false);
      });

      it('should handle marking as favorited without deal data', () => {
        useFavoritesStore.getState().markAsFavorited('deal-123', 'deal');

        // Should still remove from unfavorited, but not add to newlyFavorited without data
        expect(useFavoritesStore.getState().newlyFavoritedDeals.has('deal-123')).toBe(false);
      });
    });

    describe('for restaurants', () => {
      it('should remove restaurant from unfavoritedRestaurants when re-favoriting', () => {
        // First, mark as unfavorited
        useFavoritesStore.getState().markAsUnfavorited('restaurant-123', 'restaurant');
        expect(useFavoritesStore.getState().unfavoritedRestaurants.has('restaurant-123')).toBe(true);

        // Then re-favorite it
        useFavoritesStore.getState().markAsFavorited('restaurant-123', 'restaurant');

        expect(useFavoritesStore.getState().unfavoritedRestaurants.has('restaurant-123')).toBe(false);
      });
    });
  });

  describe('isUnfavorited()', () => {
    it('should return true for unfavorited deals', () => {
      useFavoritesStore.getState().markAsUnfavorited('deal-123', 'deal');

      expect(useFavoritesStore.getState().isUnfavorited('deal-123', 'deal')).toBe(true);
    });

    it('should return false for deals not in unfavorited set', () => {
      expect(useFavoritesStore.getState().isUnfavorited('deal-123', 'deal')).toBe(false);
    });

    it('should return true for unfavorited restaurants', () => {
      useFavoritesStore.getState().markAsUnfavorited('restaurant-123', 'restaurant');

      expect(useFavoritesStore.getState().isUnfavorited('restaurant-123', 'restaurant')).toBe(true);
    });

    it('should return false for restaurants not in unfavorited set', () => {
      expect(useFavoritesStore.getState().isUnfavorited('restaurant-123', 'restaurant')).toBe(false);
    });
  });

  describe('getNewlyFavoritedDeals()', () => {
    it('should return empty array when no newly favorited deals', () => {
      const deals = useFavoritesStore.getState().getNewlyFavoritedDeals();

      expect(deals).toEqual([]);
    });

    it('should return array of all newly favorited deal data', () => {
      const deal1: FavoriteDealData = { ...mockDealData, id: 'deal-1' };
      const deal2: FavoriteDealData = { ...mockDealData, id: 'deal-2' };

      useFavoritesStore.getState().markAsFavorited('deal-1', 'deal', deal1);
      useFavoritesStore.getState().markAsFavorited('deal-2', 'deal', deal2);

      const deals = useFavoritesStore.getState().getNewlyFavoritedDeals();

      expect(deals).toHaveLength(2);
      expect(deals).toContainEqual(deal1);
      expect(deals).toContainEqual(deal2);
    });
  });

  describe('clearUnfavorited()', () => {
    it('should clear all unfavorited items', () => {
      useFavoritesStore.getState().markAsUnfavorited('deal-1', 'deal');
      useFavoritesStore.getState().markAsUnfavorited('deal-2', 'deal');

      useFavoritesStore.getState().clearUnfavorited();

      expect(useFavoritesStore.getState().unfavoritedItems.size).toBe(0);
    });

    it('should clear all unfavorited restaurants', () => {
      useFavoritesStore.getState().markAsUnfavorited('restaurant-1', 'restaurant');
      useFavoritesStore.getState().markAsUnfavorited('restaurant-2', 'restaurant');

      useFavoritesStore.getState().clearUnfavorited();

      expect(useFavoritesStore.getState().unfavoritedRestaurants.size).toBe(0);
    });

    it('should not affect newlyFavoritedDeals', () => {
      useFavoritesStore.getState().markAsFavorited('deal-1', 'deal', mockDealData);

      useFavoritesStore.getState().clearUnfavorited();

      expect(useFavoritesStore.getState().newlyFavoritedDeals.size).toBe(1);
    });
  });

  describe('clearNewlyFavorited()', () => {
    it('should clear all newly favorited deals', () => {
      useFavoritesStore.getState().markAsFavorited('deal-1', 'deal', mockDealData);
      useFavoritesStore.getState().markAsFavorited('deal-2', 'deal', { ...mockDealData, id: 'deal-2' });

      useFavoritesStore.getState().clearNewlyFavorited();

      expect(useFavoritesStore.getState().newlyFavoritedDeals.size).toBe(0);
    });

    it('should not affect unfavoritedItems', () => {
      useFavoritesStore.getState().markAsUnfavorited('deal-1', 'deal');

      useFavoritesStore.getState().clearNewlyFavorited();

      expect(useFavoritesStore.getState().unfavoritedItems.size).toBe(1);
    });
  });

  describe('Optimistic Update Flow', () => {
    it('should support toggle favorite on -> off -> on pattern', () => {
      // User favorites a deal
      useFavoritesStore.getState().markAsFavorited('deal-123', 'deal', mockDealData);
      expect(useFavoritesStore.getState().newlyFavoritedDeals.has('deal-123')).toBe(true);
      expect(useFavoritesStore.getState().isUnfavorited('deal-123', 'deal')).toBe(false);

      // User unfavorites it
      useFavoritesStore.getState().markAsUnfavorited('deal-123', 'deal');
      expect(useFavoritesStore.getState().newlyFavoritedDeals.has('deal-123')).toBe(false);
      expect(useFavoritesStore.getState().isUnfavorited('deal-123', 'deal')).toBe(true);

      // User re-favorites it
      useFavoritesStore.getState().markAsFavorited('deal-123', 'deal', mockDealData);
      expect(useFavoritesStore.getState().newlyFavoritedDeals.has('deal-123')).toBe(true);
      expect(useFavoritesStore.getState().isUnfavorited('deal-123', 'deal')).toBe(false);
    });
  });
});
