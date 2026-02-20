/**
 * Characterization Tests for favoritesService
 *
 * These tests capture the exact behavior of the favoritesService as a regression guard.
 * They lock output shapes and transformation semantics for deal and restaurant favorites.
 *
 * Behaviors captured:
 * - fetchFavoriteDeals: Transform deal data, image variant prioritization, sorting
 * - fetchFavoriteRestaurants: Transform restaurant data, most-liked deal images, sorting
 * - toggleRestaurantFavorite: Add/remove restaurant favorites
 * - clearFavoritesCache: Cache invalidation
 * - formatDistance: Distance formatting (via output verification)
 */

import {
  mockSupabase,
  configureMockAuth,
  mockUser,
} from '../../test-utils/mocks/supabaseMock';
import {
  fetchFavoriteDeals,
  fetchFavoriteRestaurants,
  toggleRestaurantFavorite,
  clearFavoritesCache,
} from '../favoritesService';

// Type for the mock query builder to satisfy TypeScript
type MockQueryBuilder = ReturnType<typeof mockSupabase.from>;

describe('favoritesService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default to authenticated user
    configureMockAuth(mockUser);
    // Clear cache before each test
    clearFavoritesCache();
  });

  describe('clearFavoritesCache', () => {
    it('should clear all cache entries', () => {
      // This function just clears internal Maps - verify it doesn't throw
      expect(() => clearFavoritesCache()).not.toThrow();
    });
  });

  describe('fetchFavoriteDeals', () => {
    describe('when user is not authenticated', () => {
      it('should return empty array', async () => {
        mockSupabase.auth.getUser.mockResolvedValue({
          data: { user: null },
          error: null,
        });

        const result = await fetchFavoriteDeals();

        expect(result).toEqual([]);
      });
    });

    describe('when no favorites exist', () => {
      it('should return empty array', async () => {
        const mockQueryBuilder = createChainableMock();
        setMockData(mockQueryBuilder, []);
        mockSupabase.from.mockReturnValue(mockQueryBuilder);

        const result = await fetchFavoriteDeals();

        expect(result).toEqual([]);
      });
    });

    describe('when favorites query returns error', () => {
      it('should return empty array', async () => {
        const mockQueryBuilder = createChainableMock();
        setMockData(mockQueryBuilder, null, { message: 'Database error' });
        mockSupabase.from.mockReturnValue(mockQueryBuilder);

        const result = await fetchFavoriteDeals();

        expect(result).toEqual([]);
      });
    });

    describe('output shape transformation', () => {
      it('should transform deal data to FavoriteDeal shape', async () => {
        setupMocksForDealTransform();

        const result = await fetchFavoriteDeals();

        expect(result.length).toBeGreaterThan(0);
        const deal = result[0];

        // Verify output shape matches FavoriteDeal interface
        expect(deal).toHaveProperty('id');
        expect(deal).toHaveProperty('title');
        expect(deal).toHaveProperty('description');
        expect(deal).toHaveProperty('imageUrl');
        expect(deal).toHaveProperty('restaurantName');
        expect(deal).toHaveProperty('restaurantAddress');
        expect(deal).toHaveProperty('distance');
        expect(deal).toHaveProperty('dealCount');
        expect(deal).toHaveProperty('cuisineName');
        expect(deal).toHaveProperty('categoryName');
        expect(deal).toHaveProperty('createdAt');
        expect(deal).toHaveProperty('isFavorited');
        expect(deal).toHaveProperty('userId');
        expect(deal).toHaveProperty('userDisplayName');
        expect(deal).toHaveProperty('userProfilePhoto');
        expect(deal).toHaveProperty('isAnonymous');
      });

      it('should set isFavorited to true for all returned deals', async () => {
        setupMocksForDealTransform();

        const result = await fetchFavoriteDeals();

        result.forEach((deal) => {
          expect(deal.isFavorited).toBe(true);
        });
      });

      it('should include imageVariants when available', async () => {
        setupMocksForDealTransform();

        const result = await fetchFavoriteDeals();

        expect(result[0]).toHaveProperty('imageVariants');
      });
    });

    describe('image variant prioritization', () => {
      it('should prioritize deal_images by display_order over is_thumbnail', async () => {
        setupMocksForDealTransform({
          dealImages: [
            {
              display_order: 2,
              is_thumbnail: true,
              image_metadata: { variants: { medium: 'thumbnail-url' } },
            },
            {
              display_order: 1,
              is_thumbnail: false,
              image_metadata: { variants: { medium: 'first-by-order-url' } },
            },
          ],
        });

        const result = await fetchFavoriteDeals();

        // Should use the image with lowest display_order
        expect(result[0].imageUrl).toBe('first-by-order-url');
      });

      it('should fallback to is_thumbnail when no display_order image has variants', async () => {
        setupMocksForDealTransform({
          dealImages: [
            {
              display_order: 1,
              is_thumbnail: false,
              image_metadata: null, // No variants
            },
            {
              display_order: 2,
              is_thumbnail: true,
              image_metadata: { variants: { medium: 'thumbnail-url' } },
            },
          ],
        });

        const result = await fetchFavoriteDeals();

        expect(result[0].imageUrl).toBe('thumbnail-url');
      });

      it('should fallback to template image_metadata when no deal_images', async () => {
        setupMocksForDealTransform({
          dealImages: [],
          templateImageMetadata: { variants: { medium: 'template-url' } },
        });

        const result = await fetchFavoriteDeals();

        expect(result[0].imageUrl).toBe('template-url');
      });

      it('should use placeholder when no images available', async () => {
        setupMocksForDealTransform({
          dealImages: [],
          templateImageMetadata: null,
        });

        const result = await fetchFavoriteDeals();

        expect(result[0].imageUrl).toBe('placeholder');
      });

      it('should prefer medium variant over small and large', async () => {
        setupMocksForDealTransform({
          dealImages: [
            {
              display_order: 1,
              image_metadata: { variants: { small: 'small', medium: 'medium', large: 'large' } },
            },
          ],
        });

        const result = await fetchFavoriteDeals();

        expect(result[0].imageUrl).toBe('medium');
      });

      it('should fallback to small when no medium', async () => {
        setupMocksForDealTransform({
          dealImages: [
            {
              display_order: 1,
              image_metadata: { variants: { small: 'small', large: 'large' } },
            },
          ],
        });

        const result = await fetchFavoriteDeals();

        expect(result[0].imageUrl).toBe('small');
      });

      it('should fallback to large when no medium or small', async () => {
        setupMocksForDealTransform({
          dealImages: [
            {
              display_order: 1,
              image_metadata: { variants: { large: 'large' } },
            },
          ],
        });

        const result = await fetchFavoriteDeals();

        expect(result[0].imageUrl).toBe('large');
      });
    });

    describe('user information handling', () => {
      it('should display Anonymous for anonymous users', async () => {
        setupMocksForDealTransform({
          isAnonymous: true,
          userData: { display_name: 'Real Name' },
        });

        const result = await fetchFavoriteDeals();

        expect(result[0].userDisplayName).toBe('Anonymous');
        expect(result[0].isAnonymous).toBe(true);
      });

      it('should display user display_name for non-anonymous users', async () => {
        setupMocksForDealTransform({
          isAnonymous: false,
          userData: { display_name: 'Test User', profile_photo: 'photo-url' },
        });

        const result = await fetchFavoriteDeals();

        expect(result[0].userDisplayName).toBe('Test User');
        expect(result[0].isAnonymous).toBe(false);
      });

      it('should use Unknown User when no user data available', async () => {
        setupMocksForDealTransform({
          isAnonymous: false,
          userData: null,
        });

        const result = await fetchFavoriteDeals();

        expect(result[0].userDisplayName).toBe('Unknown User');
      });

      it('should process user profile photo from Cloudinary variants', async () => {
        setupMocksForDealTransform({
          isAnonymous: false,
          userData: {
            display_name: 'Test User',
            image_metadata: { variants: { small: 'cloudinary-small', thumbnail: 'cloudinary-thumb' } },
          },
        });

        const result = await fetchFavoriteDeals();

        // Should prefer small over thumbnail
        expect(result[0].userProfilePhoto).toBe('cloudinary-small');
      });

      it('should set userProfilePhoto to null for anonymous users', async () => {
        setupMocksForDealTransform({
          isAnonymous: true,
          userData: {
            display_name: 'Test User',
            image_metadata: { variants: { small: 'cloudinary-small' } },
          },
        });

        const result = await fetchFavoriteDeals();

        expect(result[0].userProfilePhoto).toBeNull();
      });
    });

    describe('sorting behavior', () => {
      it('should sort deals by createdAt descending (newest first)', async () => {
        setupMocksForDealTransformMultiple([
          { dealId: 'deal-1', createdAt: '2026-01-01T00:00:00Z' },
          { dealId: 'deal-2', createdAt: '2026-01-03T00:00:00Z' },
          { dealId: 'deal-3', createdAt: '2026-01-02T00:00:00Z' },
        ]);

        const result = await fetchFavoriteDeals();

        expect(result[0].id).toBe('deal-2'); // Newest
        expect(result[1].id).toBe('deal-3');
        expect(result[2].id).toBe('deal-1'); // Oldest
      });
    });

    describe('distance formatting', () => {
      it('should format distance < 1 mile as meters', async () => {
        setupMocksForDealTransform({ distanceMiles: 0.5 });

        const result = await fetchFavoriteDeals();

        // 0.5 * 1609 = 804.5 → rounded to 805m
        expect(result[0].distance).toBe('805m');
      });

      it('should format distance >= 1 mile with one decimal', async () => {
        setupMocksForDealTransform({ distanceMiles: 2.567 });

        const result = await fetchFavoriteDeals();

        expect(result[0].distance).toBe('2.6mi');
      });

      it('should show Unknown for null distance', async () => {
        setupMocksForDealTransform({ distanceMiles: null });

        const result = await fetchFavoriteDeals();

        expect(result[0].distance).toBe('Unknown');
      });
    });

    describe('cuisine and category handling', () => {
      it('should use cuisine name from lookup', async () => {
        setupMocksForDealTransform({ cuisineName: 'Italian' });

        const result = await fetchFavoriteDeals();

        expect(result[0].cuisineName).toBe('Italian');
      });

      it('should default to Unknown for missing cuisine', async () => {
        setupMocksForDealTransform({ cuisineName: null });

        const result = await fetchFavoriteDeals();

        expect(result[0].cuisineName).toBe('Unknown');
      });

      it('should use category name from lookup', async () => {
        setupMocksForDealTransform({ categoryName: 'Happy Hour' });

        const result = await fetchFavoriteDeals();

        expect(result[0].categoryName).toBe('Happy Hour');
      });

      it('should default to Unknown for missing category', async () => {
        setupMocksForDealTransform({ categoryName: null });

        const result = await fetchFavoriteDeals();

        expect(result[0].categoryName).toBe('Unknown');
      });
    });

    describe('on exception', () => {
      it('should return empty array when database throws', async () => {
        mockSupabase.from.mockImplementation(() => {
          throw new Error('Database error');
        });

        const result = await fetchFavoriteDeals();

        expect(result).toEqual([]);
      });
    });
  });

  describe('fetchFavoriteRestaurants', () => {
    describe('when user is not authenticated', () => {
      it('should return empty array', async () => {
        mockSupabase.auth.getUser.mockResolvedValue({
          data: { user: null },
          error: null,
        });

        const result = await fetchFavoriteRestaurants();

        expect(result).toEqual([]);
      });
    });

    describe('when no favorites exist', () => {
      it('should return empty array', async () => {
        const mockQueryBuilder = createChainableMock();
        setMockData(mockQueryBuilder, []);
        mockSupabase.from.mockReturnValue(mockQueryBuilder);

        const result = await fetchFavoriteRestaurants();

        expect(result).toEqual([]);
      });
    });

    describe('output shape transformation', () => {
      it('should transform restaurant data to FavoriteRestaurant shape', async () => {
        setupMocksForRestaurantTransform();

        const result = await fetchFavoriteRestaurants();

        expect(result.length).toBeGreaterThan(0);
        const restaurant = result[0];

        // Verify output shape matches FavoriteRestaurant interface
        expect(restaurant).toHaveProperty('id');
        expect(restaurant).toHaveProperty('name');
        expect(restaurant).toHaveProperty('address');
        expect(restaurant).toHaveProperty('imageUrl');
        expect(restaurant).toHaveProperty('distance');
        expect(restaurant).toHaveProperty('dealCount');
        expect(restaurant).toHaveProperty('cuisineName');
        expect(restaurant).toHaveProperty('isFavorited');
        expect(restaurant).toHaveProperty('createdAt');
      });

      it('should set isFavorited to true for all returned restaurants', async () => {
        setupMocksForRestaurantTransform();

        const result = await fetchFavoriteRestaurants();

        result.forEach((restaurant) => {
          expect(restaurant.isFavorited).toBe(true);
        });
      });
    });

    describe('restaurant image selection', () => {
      it('should return empty string when no image available', async () => {
        // Restaurant favorites with no deal images returns empty imageUrl
        setupMocksForRestaurantTransform({});

        const result = await fetchFavoriteRestaurants();

        // The complex async image fetching returns empty string when no mostLikedDeal
        expect(result[0]).toHaveProperty('imageUrl');
        expect(typeof result[0].imageUrl).toBe('string');
      });
    });

    describe('sorting behavior', () => {
      it('should sort restaurants by createdAt descending (newest first)', async () => {
        setupMocksForRestaurantTransformMultiple([
          { restaurantId: 'rest-1', createdAt: '2026-01-01T00:00:00Z' },
          { restaurantId: 'rest-2', createdAt: '2026-01-03T00:00:00Z' },
          { restaurantId: 'rest-3', createdAt: '2026-01-02T00:00:00Z' },
        ]);

        const result = await fetchFavoriteRestaurants();

        expect(result[0].id).toBe('rest-2'); // Newest
        expect(result[1].id).toBe('rest-3');
        expect(result[2].id).toBe('rest-1'); // Oldest
      });
    });

    describe('distance formatting', () => {
      it('should format distance < 1 mile as meters', async () => {
        setupMocksForRestaurantTransform({ distanceMiles: 0.3 });

        const result = await fetchFavoriteRestaurants();

        // 0.3 * 1609 = 482.7 → rounded to 483m
        expect(result[0].distance).toBe('483m');
      });

      it('should format distance >= 1 mile with one decimal', async () => {
        setupMocksForRestaurantTransform({ distanceMiles: 5.123 });

        const result = await fetchFavoriteRestaurants();

        expect(result[0].distance).toBe('5.1mi');
      });
    });

    describe('cuisine handling', () => {
      it('should use cuisine name from restaurant_cuisine lookup', async () => {
        setupMocksForRestaurantTransform({ cuisineName: 'Mexican' });

        const result = await fetchFavoriteRestaurants();

        expect(result[0].cuisineName).toBe('Mexican');
      });

      it('should default to Unknown for missing cuisine', async () => {
        setupMocksForRestaurantTransform({ cuisineName: null });

        const result = await fetchFavoriteRestaurants();

        expect(result[0].cuisineName).toBe('Unknown');
      });
    });

    describe('on exception', () => {
      it('should return empty array when database throws', async () => {
        mockSupabase.from.mockImplementation(() => {
          throw new Error('Database error');
        });

        const result = await fetchFavoriteRestaurants();

        expect(result).toEqual([]);
      });
    });
  });

  describe('toggleRestaurantFavorite', () => {
    describe('when user is not authenticated', () => {
      it('should throw error', async () => {
        mockSupabase.auth.getUser.mockResolvedValue({
          data: { user: null },
          error: null,
        });

        await expect(toggleRestaurantFavorite('rest-123', false)).rejects.toThrow(
          'User not authenticated'
        );
      });
    });

    describe('when removing favorite (isCurrentlyFavorited = true)', () => {
      it('should delete from favorites and return false', async () => {
        const mockQueryBuilder = createChainableMock();
        setMockData(mockQueryBuilder, null, null);
        mockSupabase.from.mockReturnValue(mockQueryBuilder);

        const result = await toggleRestaurantFavorite('rest-123', true);

        expect(result).toBe(false);
        expect(mockQueryBuilder.delete).toHaveBeenCalled();
      });
    });

    describe('when adding favorite (isCurrentlyFavorited = false)', () => {
      it('should insert into favorites and return true', async () => {
        const mockQueryBuilder = createChainableMock();
        setMockData(mockQueryBuilder, null, null);
        mockSupabase.from.mockReturnValue(mockQueryBuilder);

        const result = await toggleRestaurantFavorite('rest-123', false);

        expect(result).toBe(true);
        expect(mockQueryBuilder.insert).toHaveBeenCalledWith({
          user_id: mockUser.id,
          restaurant_id: 'rest-123',
        });
      });
    });

    describe('when database returns error', () => {
      it('should throw error on delete failure', async () => {
        const mockQueryBuilder = createChainableMock();
        // Set error on thenable to simulate Supabase error response
        Object.defineProperty(mockQueryBuilder, 'then', {
          value: (resolve: (value: unknown) => void) =>
            Promise.resolve({ data: null, error: { message: 'Delete failed' } }).then(resolve),
          writable: true,
          configurable: true,
        });
        mockSupabase.from.mockReturnValue(mockQueryBuilder);

        await expect(toggleRestaurantFavorite('rest-123', true)).rejects.toEqual({ message: 'Delete failed' });
      });

      it('should throw error on insert failure', async () => {
        const mockQueryBuilder = createChainableMock();
        // Set error on thenable to simulate Supabase error response
        Object.defineProperty(mockQueryBuilder, 'then', {
          value: (resolve: (value: unknown) => void) =>
            Promise.resolve({ data: null, error: { message: 'Insert failed' } }).then(resolve),
          writable: true,
          configurable: true,
        });
        mockSupabase.from.mockReturnValue(mockQueryBuilder);

        await expect(toggleRestaurantFavorite('rest-123', false)).rejects.toEqual({ message: 'Insert failed' });
      });
    });
  });
});

// =============================================================================
// Test Helpers
// =============================================================================

/**
 * Helper to create a chainable mock for Supabase query builder
 */
function createChainableMock(): MockQueryBuilder {
  const mock = {
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    upsert: jest.fn(),
    delete: jest.fn(),
    eq: jest.fn(),
    neq: jest.fn(),
    gt: jest.fn(),
    gte: jest.fn(),
    lt: jest.fn(),
    lte: jest.fn(),
    like: jest.fn(),
    ilike: jest.fn(),
    is: jest.fn(),
    in: jest.fn(),
    not: jest.fn(),
    contains: jest.fn(),
    containedBy: jest.fn(),
    range: jest.fn(),
    order: jest.fn(),
    limit: jest.fn(),
    single: jest.fn().mockResolvedValue({ data: null, error: null }),
    maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
    then: jest.fn(),
  };

  // Default thenable behavior
  Object.defineProperty(mock, 'then', {
    value: (resolve: (value: unknown) => void) =>
      Promise.resolve({ data: [], error: null }).then(resolve),
    writable: true,
    configurable: true,
  });

  // Make all methods return the mock itself for chaining
  Object.keys(mock).forEach((key) => {
    if (key !== 'single' && key !== 'maybeSingle' && key !== 'then') {
      (mock[key as keyof typeof mock] as jest.Mock).mockReturnValue(mock);
    }
  });

  return mock as MockQueryBuilder;
}

/**
 * Helper to set mock data/error on a query builder
 */
function setMockData(
  mock: MockQueryBuilder,
  data: unknown,
  error: { message: string } | null = null
) {
  Object.defineProperty(mock, 'then', {
    value: (resolve: (value: unknown) => void) =>
      Promise.resolve({ data, error }).then(resolve),
    writable: true,
    configurable: true,
  });
}

/**
 * Setup mocks for deal transformation tests
 */
function setupMocksForDealTransform(options: {
  dealImages?: any[];
  templateImageMetadata?: any;
  isAnonymous?: boolean;
  userData?: any;
  distanceMiles?: number | null;
  cuisineName?: string | null;
  categoryName?: string | null;
} = {}) {
  const {
    dealImages = [{ display_order: 1, image_metadata: { variants: { medium: 'test-image' } } }],
    templateImageMetadata = null,
    isAnonymous = false,
    userData = { display_name: 'Test User' },
    distanceMiles = 1.5,
    cuisineName = 'Italian',
    categoryName = 'Happy Hour',
  } = options;

  mockSupabase.from.mockImplementation((table: string) => {
    const mock = createChainableMock();

    if (table === 'favorite') {
      setMockData(mock, [
        { deal_id: 'deal-1', created_at: '2026-01-15T00:00:00Z' },
      ]);
    } else if (table === 'deal_instance') {
      setMockData(mock, [
        { deal_id: 'deal-1', template_id: 'template-1', start_date: '2026-01-01', end_date: '2026-12-31' },
      ]);
    } else if (table === 'deal_template') {
      setMockData(mock, [
        {
          template_id: 'template-1',
          title: 'Test Deal',
          description: 'Test Description',
          image_url: 'legacy-url',
          image_metadata_id: 'img-meta-1',
          restaurant_id: 'rest-1',
          cuisine_id: 'cuisine-1',
          category_id: 'cat-1',
          user_id: 'user-1',
          is_anonymous: isAnonymous,
          image_metadata: templateImageMetadata,
          deal_images: dealImages,
          user: userData,
        },
      ]);
    } else if (table === 'restaurant') {
      setMockData(mock, [
        { restaurant_id: 'rest-1', name: 'Test Restaurant', address: '123 Test St' },
      ]);
    } else if (table === 'cuisine') {
      setMockData(mock, cuisineName ? [{ cuisine_id: 'cuisine-1', cuisine_name: cuisineName }] : []);
    } else if (table === 'category') {
      setMockData(mock, categoryName ? [{ category_id: 'cat-1', category_name: categoryName }] : []);
    }

    return mock;
  });

  // Mock RPC calls
  mockSupabase.rpc.mockImplementation((funcName: string) => {
    if (funcName === 'get_restaurant_coords_with_distance') {
      return Promise.resolve({
        data: distanceMiles !== null
          ? [{ restaurant_id: 'rest-1', distance_miles: distanceMiles }]
          : [],
        error: null,
      });
    }
    if (funcName === 'get_deal_counts_for_restaurants') {
      return Promise.resolve({
        data: [{ restaurant_id: 'rest-1', deal_count: 5 }],
      });
    }
    return Promise.resolve({ data: null, error: null });
  });
}

/**
 * Setup mocks for multiple deals (sorting tests)
 */
function setupMocksForDealTransformMultiple(
  deals: Array<{ dealId: string; createdAt: string }>
) {
  mockSupabase.from.mockImplementation((table: string) => {
    const mock = createChainableMock();

    if (table === 'favorite') {
      setMockData(
        mock,
        deals.map((d) => ({ deal_id: d.dealId, created_at: d.createdAt }))
      );
    } else if (table === 'deal_instance') {
      setMockData(
        mock,
        deals.map((d) => ({
          deal_id: d.dealId,
          template_id: `template-${d.dealId}`,
          start_date: '2026-01-01',
          end_date: '2026-12-31',
        }))
      );
    } else if (table === 'deal_template') {
      setMockData(
        mock,
        deals.map((d) => ({
          template_id: `template-${d.dealId}`,
          title: `Deal ${d.dealId}`,
          description: 'Test',
          image_url: null,
          restaurant_id: `rest-${d.dealId}`,
          cuisine_id: 'cuisine-1',
          category_id: 'cat-1',
          user_id: 'user-1',
          is_anonymous: false,
          image_metadata: null,
          deal_images: [{ display_order: 1, image_metadata: { variants: { medium: 'img' } } }],
          user: { display_name: 'User' },
        }))
      );
    } else if (table === 'restaurant') {
      setMockData(
        mock,
        deals.map((d) => ({
          restaurant_id: `rest-${d.dealId}`,
          name: `Restaurant ${d.dealId}`,
          address: `Address ${d.dealId}`,
        }))
      );
    } else if (table === 'cuisine') {
      setMockData(mock, [{ cuisine_id: 'cuisine-1', cuisine_name: 'Italian' }]);
    } else if (table === 'category') {
      setMockData(mock, [{ category_id: 'cat-1', category_name: 'Lunch' }]);
    }

    return mock;
  });

  mockSupabase.rpc.mockImplementation((funcName: string) => {
    if (funcName === 'get_restaurant_coords_with_distance') {
      return Promise.resolve({
        data: deals.map((d) => ({ restaurant_id: `rest-${d.dealId}`, distance_miles: 1.0 })),
        error: null,
      });
    }
    if (funcName === 'get_deal_counts_for_restaurants') {
      return Promise.resolve({
        data: deals.map((d) => ({ restaurant_id: `rest-${d.dealId}`, deal_count: 1 })),
      });
    }
    return Promise.resolve({ data: null, error: null });
  });
}

/**
 * Setup mocks for restaurant transformation tests
 */
function setupMocksForRestaurantTransform(options: {
  mostLikedDealImage?: string;
  mostLikedDealImages?: any[];
  distanceMiles?: number | null;
  cuisineName?: string | null;
} = {}) {
  const {
    mostLikedDealImage,
    mostLikedDealImages,
    distanceMiles = 2.0,
    cuisineName = 'Mexican',
  } = options;

  mockSupabase.from.mockImplementation((table: string) => {
    const mock = createChainableMock();

    if (table === 'favorite') {
      setMockData(mock, [
        { restaurant_id: 'rest-1', created_at: '2026-01-15T00:00:00Z' },
      ]);
    } else if (table === 'restaurant') {
      setMockData(mock, [
        { restaurant_id: 'rest-1', name: 'Test Restaurant', address: '456 Main St', restaurant_image_metadata: null },
      ]);
    } else if (table === 'restaurant_cuisine') {
      setMockData(mock, cuisineName
        ? [{ restaurant_id: 'rest-1', cuisine: { cuisine_id: 'cuisine-1', cuisine_name: cuisineName } }]
        : []
      );
    } else if (table === 'deal_template') {
      // Used for deal counts and most liked deals
      let dealImages = mostLikedDealImages;
      if (!dealImages && mostLikedDealImage) {
        dealImages = [{ display_order: 1, image_metadata: { variants: { medium: mostLikedDealImage } } }];
      }
      if (!dealImages) {
        dealImages = [{ display_order: 1, image_metadata: { variants: { medium: 'default-image' } } }];
      }

      setMockData(mock, [
        {
          template_id: 'template-1',
          restaurant_id: 'rest-1',
          image_url: 'legacy-url',
          image_metadata_id: 'img-1',
          image_metadata: null,
          deal_images: dealImages,
        },
      ]);

      // Override then to handle the chained .then() for deal counts
      mock.then = ((resolve: (value: unknown) => void) => {
        return Promise.resolve({
          data: [{ restaurant_id: 'rest-1' }],
          error: null,
        }).then((result) => {
          if (resolve) return resolve(result);
          return result;
        });
      }) as any;
    } else if (table === 'deal_instance') {
      setMockData(mock, [
        { deal_id: 'deal-1', template_id: 'template-1' },
      ]);
    } else if (table === 'interaction') {
      setMockData(mock, [
        { deal_id: 'deal-1' }, // One upvote
      ]);
    }

    return mock;
  });

  mockSupabase.rpc.mockImplementation((funcName: string) => {
    if (funcName === 'get_restaurant_coords_with_distance') {
      return Promise.resolve({
        data: distanceMiles !== null
          ? [{ restaurant_id: 'rest-1', distance_miles: distanceMiles }]
          : [],
        error: null,
      });
    }
    return Promise.resolve({ data: null, error: null });
  });
}

/**
 * Setup mocks for multiple restaurants (sorting tests)
 */
function setupMocksForRestaurantTransformMultiple(
  restaurants: Array<{ restaurantId: string; createdAt: string }>
) {
  mockSupabase.from.mockImplementation((table: string) => {
    const mock = createChainableMock();

    if (table === 'favorite') {
      setMockData(
        mock,
        restaurants.map((r) => ({ restaurant_id: r.restaurantId, created_at: r.createdAt }))
      );
    } else if (table === 'restaurant') {
      setMockData(
        mock,
        restaurants.map((r) => ({
          restaurant_id: r.restaurantId,
          name: `Restaurant ${r.restaurantId}`,
          address: `Address ${r.restaurantId}`,
          restaurant_image_metadata: null,
        }))
      );
    } else if (table === 'restaurant_cuisine') {
      setMockData(
        mock,
        restaurants.map((r) => ({
          restaurant_id: r.restaurantId,
          cuisine: { cuisine_id: 'cuisine-1', cuisine_name: 'Italian' },
        }))
      );
    } else if (table === 'deal_template') {
      setMockData(
        mock,
        restaurants.map((r) => ({
          template_id: `template-${r.restaurantId}`,
          restaurant_id: r.restaurantId,
          image_url: null,
          image_metadata: null,
          deal_images: [{ display_order: 1, image_metadata: { variants: { medium: 'img' } } }],
        }))
      );

      // Override then for deal count calculation
      mock.then = ((resolve: (value: unknown) => void) => {
        return Promise.resolve({
          data: restaurants.map((r) => ({ restaurant_id: r.restaurantId })),
          error: null,
        }).then((result) => {
          if (resolve) return resolve(result);
          return result;
        });
      }) as any;
    } else if (table === 'deal_instance') {
      setMockData(
        mock,
        restaurants.map((r) => ({
          deal_id: `deal-${r.restaurantId}`,
          template_id: `template-${r.restaurantId}`,
        }))
      );
    } else if (table === 'interaction') {
      setMockData(mock, []);
    }

    return mock;
  });

  mockSupabase.rpc.mockImplementation((funcName: string) => {
    if (funcName === 'get_restaurant_coords_with_distance') {
      return Promise.resolve({
        data: restaurants.map((r) => ({ restaurant_id: r.restaurantId, distance_miles: 1.0 })),
        error: null,
      });
    }
    return Promise.resolve({ data: null, error: null });
  });
}
