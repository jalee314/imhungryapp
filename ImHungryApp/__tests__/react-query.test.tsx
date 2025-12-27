/**
 * React Query hooks tests
 *
 * Tests for the state/queries layer that wraps services with React Query.
 */

import { renderHook } from '@testing-library/react-native';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// ==========================================
// Test Setup
// ==========================================

// Create a test query client
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: Infinity,
      },
    },
  });
}

// Wrapper for testing hooks
function createWrapper() {
  const queryClient = createTestQueryClient();
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

// ==========================================
// Query Keys Tests
// ==========================================

describe('Query Keys', () => {
  describe('dealsKeys', () => {
    it('should export from the correct module', () => {
      const { dealsKeys } = require('../src/state/queries/deals');
      expect(dealsKeys).toBeDefined();
    });

    it('should have correct key structure', () => {
      const { dealsKeys } = require('../src/state/queries/deals');
      
      expect(dealsKeys.all).toEqual(['deals']);
      expect(dealsKeys.feed()).toEqual(['deals', 'feed']);
      expect(dealsKeys.detail('123')).toEqual(['deals', 'detail', '123']);
    });

    it('should create filtered feed keys', () => {
      const { dealsKeys } = require('../src/state/queries/deals');
      
      const filters = { cuisineId: 'italian' };
      expect(dealsKeys.feedFiltered(filters)).toEqual(['deals', 'feed', filters]);
    });
  });

  describe('profileKeys', () => {
    it('should export from the correct module', () => {
      const { profileKeys } = require('../src/state/queries/profile');
      expect(profileKeys).toBeDefined();
    });

    it('should have correct key structure', () => {
      const { profileKeys } = require('../src/state/queries/profile');
      
      expect(profileKeys.all).toEqual(['profile']);
      expect(profileKeys.user('user-123')).toEqual(['profile', 'user', 'user-123']);
      expect(profileKeys.posts('user-123')).toEqual(['profile', 'posts', 'user-123']);
      expect(profileKeys.currentUser()).toEqual(['profile', 'current']);
    });
  });

  describe('restaurantsKeys', () => {
    it('should export from the correct module', () => {
      const { restaurantsKeys } = require('../src/state/queries/restaurants');
      expect(restaurantsKeys).toBeDefined();
    });

    it('should have correct key structure', () => {
      const { restaurantsKeys } = require('../src/state/queries/restaurants');
      
      expect(restaurantsKeys.all).toEqual(['restaurants']);
      expect(restaurantsKeys.discover()).toEqual(['restaurants', 'discover']);
    });

    it('should create coordinate-specific keys', () => {
      const { restaurantsKeys } = require('../src/state/queries/restaurants');
      
      const coords = { lat: 34.05, lng: -118.24 };
      expect(restaurantsKeys.discoverAt(coords)).toEqual(['restaurants', 'discover', coords]);
    });
  });

  describe('favoritesKeys', () => {
    it('should export from the correct module', () => {
      const { favoritesKeys } = require('../src/state/queries/favorites');
      expect(favoritesKeys).toBeDefined();
    });

    it('should have correct key structure', () => {
      const { favoritesKeys } = require('../src/state/queries/favorites');
      
      expect(favoritesKeys.all).toEqual(['favorites']);
      expect(favoritesKeys.deals()).toEqual(['favorites', 'deals']);
      expect(favoritesKeys.restaurants()).toEqual(['favorites', 'restaurants']);
    });
  });
});

// ==========================================
// QueryProvider Tests
// ==========================================

describe('QueryProvider', () => {
  it('should export QueryProvider', () => {
    const { QueryProvider } = require('../src/state/queries/QueryProvider');
    expect(QueryProvider).toBeDefined();
    expect(typeof QueryProvider).toBe('function');
  });

  it('should export getQueryClient', () => {
    const { getQueryClient } = require('../src/state/queries/QueryProvider');
    expect(getQueryClient).toBeDefined();
    expect(typeof getQueryClient).toBe('function');
  });

  it('should return a QueryClient instance', () => {
    const { getQueryClient } = require('../src/state/queries/QueryProvider');
    const client = getQueryClient();
    expect(client).toBeDefined();
    expect(typeof client.invalidateQueries).toBe('function');
  });

  it('should export utility functions', () => {
    const { resetQueryClient, invalidateAllQueries } = require('../src/state/queries/QueryProvider');
    expect(resetQueryClient).toBeDefined();
    expect(invalidateAllQueries).toBeDefined();
  });
});

// ==========================================
// Module Exports Tests
// ==========================================

describe('State Index Exports', () => {
  it('should export all query hooks from main index', () => {
    const stateExports = require('../src/state/queries');
    
    // Provider
    expect(stateExports.QueryProvider).toBeDefined();
    
    // Deals
    expect(stateExports.useDealsQuery).toBeDefined();
    expect(stateExports.useCreateDeal).toBeDefined();
    expect(stateExports.useDeleteDeal).toBeDefined();
    
    // Profile
    expect(stateExports.useProfileQuery).toBeDefined();
    expect(stateExports.useFullProfileQuery).toBeDefined();
    expect(stateExports.useCurrentUserProfile).toBeDefined();
    
    // Restaurants
    expect(stateExports.useRestaurantsQuery).toBeDefined();
    expect(stateExports.useRestaurantsList).toBeDefined();
    
    // Favorites
    expect(stateExports.useFavoriteDealsQuery).toBeDefined();
    expect(stateExports.useFavoriteRestaurantsQuery).toBeDefined();
  });

  it('should export all query keys', () => {
    const stateExports = require('../src/state/queries');
    
    expect(stateExports.dealsKeys).toBeDefined();
    expect(stateExports.profileKeys).toBeDefined();
    expect(stateExports.restaurantsKeys).toBeDefined();
    expect(stateExports.favoritesKeys).toBeDefined();
  });
});

// ==========================================
// Hook Type Tests (compile-time verification)
// ==========================================

describe('Hook Types', () => {
  it('should have proper hook signatures', () => {
    const {
      useDealsQuery,
      useProfileQuery,
      useRestaurantsQuery,
      useFavoriteDealsQuery,
    } = require('../src/state/queries');
    
    // Verify hooks are functions
    expect(typeof useDealsQuery).toBe('function');
    expect(typeof useProfileQuery).toBe('function');
    expect(typeof useRestaurantsQuery).toBe('function');
    expect(typeof useFavoriteDealsQuery).toBe('function');
  });
});
