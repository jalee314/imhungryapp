/**
 * Favorites Navigation Parity Tests (Phase 7)
 *
 * Locks the route payload contracts for Favorites navigation handlers so the
 * Phase 6 decomposition does not drift behavior across releases.
 */

import type { NavigationProp } from '@react-navigation/native';
import { renderHook, act } from '@testing-library/react-native';

import type { FavoriteDeal, FavoriteRestaurant } from '../../../types/favorites';
import {
  type FavoritesNavigationRoutes,
  useFavoritesNavigationHandlers,
} from '../navigation';

const createFavoriteDeal = (overrides: Partial<FavoriteDeal> = {}): FavoriteDeal => ({
  id: 'deal-1',
  title: 'Taco Tuesday',
  description: 'Half off tacos',
  imageUrl: 'https://img.example/taco.jpg',
  restaurantName: 'Casa Del Taco',
  restaurantAddress: '123 Food Ave',
  distance: '2.5mi',
  dealCount: 4,
  cuisineName: 'Mexican',
  categoryName: 'Happy Hour',
  createdAt: '2026-02-23T00:00:00Z',
  isFavorited: true,
  userId: 'user-1',
  userDisplayName: 'foodfan',
  userProfilePhoto: 'https://img.example/pfp.jpg',
  isAnonymous: false,
  ...overrides,
});

const createFavoriteRestaurant = (
  overrides: Partial<FavoriteRestaurant> = {},
): FavoriteRestaurant => ({
  id: 'rest-1',
  name: 'Casa Del Taco',
  address: '123 Food Ave',
  imageUrl: 'https://img.example/rest.jpg',
  distance: '2.5mi',
  dealCount: 4,
  cuisineName: 'Mexican',
  isFavorited: true,
  createdAt: '2026-02-23T00:00:00Z',
  ...overrides,
});

const createNavigation = () => {
  const navigate = jest.fn();
  const navigation = {
    navigate,
  } as unknown as NavigationProp<FavoritesNavigationRoutes>;
  return {
    navigation,
    navigate,
  };
};

describe('Favorites Navigation Parity (Phase 7)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('handleRestaurantPress should navigate with mapped payload', () => {
    const { navigation, navigate } = createNavigation();
    const restaurants = [createFavoriteRestaurant()];
    const deals: FavoriteDeal[] = [];

    const { result } = renderHook(() =>
      useFavoritesNavigationHandlers({ deals, restaurants, navigation }),
    );

    act(() => {
      result.current.handleRestaurantPress('rest-1');
    });

    expect(navigate).toHaveBeenCalledWith('RestaurantDetail', {
      restaurant: {
        restaurant_id: 'rest-1',
        name: 'Casa Del Taco',
        address: '123 Food Ave',
        logo_image: 'https://img.example/rest.jpg',
        deal_count: 4,
        distance_miles: 2.5,
        lat: 0,
        lng: 0,
      },
    });
  });

  it('handleRestaurantPress should preserve existing meter parsing behavior', () => {
    const { navigation, navigate } = createNavigation();
    const restaurants = [createFavoriteRestaurant({ distance: '805m' })];
    const deals: FavoriteDeal[] = [];

    const { result } = renderHook(() =>
      useFavoritesNavigationHandlers({ deals, restaurants, navigation }),
    );

    act(() => {
      result.current.handleRestaurantPress('rest-1');
    });

    expect(navigate).toHaveBeenCalledWith('RestaurantDetail', {
      restaurant: expect.objectContaining({
        distance_miles: 805,
      }),
    });
  });

  it('handleRestaurantPress should no-op when restaurant is missing', () => {
    const { navigation, navigate } = createNavigation();
    const restaurants = [createFavoriteRestaurant()];
    const deals: FavoriteDeal[] = [];

    const { result } = renderHook(() =>
      useFavoritesNavigationHandlers({ deals, restaurants, navigation }),
    );

    act(() => {
      result.current.handleRestaurantPress('missing');
    });

    expect(navigate).not.toHaveBeenCalled();
  });

  it('handleDealPress should navigate with mapped deal payload', () => {
    const { navigation, navigate } = createNavigation();
    const deals = [createFavoriteDeal()];
    const restaurants: FavoriteRestaurant[] = [];

    const { result } = renderHook(() =>
      useFavoritesNavigationHandlers({ deals, restaurants, navigation }),
    );

    act(() => {
      result.current.handleDealPress('deal-1');
    });

    expect(navigate).toHaveBeenCalledWith('DealDetail', {
      deal: expect.objectContaining({
        id: 'deal-1',
        title: 'Taco Tuesday',
        restaurant: 'Casa Del Taco',
        details: 'Half off tacos',
        image: { uri: 'https://img.example/taco.jpg' },
        votes: 0,
        isUpvoted: false,
        isDownvoted: false,
        isFavorited: true,
        cuisine: 'Mexican',
        timeAgo: 'Unknown',
        author: 'foodfan',
        milesAway: '2.5mi',
        userId: 'user-1',
        userDisplayName: 'foodfan',
        userProfilePhoto: 'https://img.example/pfp.jpg',
        restaurantAddress: '123 Food Ave',
        isAnonymous: false,
      }),
    });
  });

  it('handleDealPress should use bundled default image when imageUrl is empty', () => {
    const { navigation, navigate } = createNavigation();
    const deals = [createFavoriteDeal({ imageUrl: '' })];
    const restaurants: FavoriteRestaurant[] = [];

    const { result } = renderHook(() =>
      useFavoritesNavigationHandlers({ deals, restaurants, navigation }),
    );

    act(() => {
      result.current.handleDealPress('deal-1');
    });

    const payload = navigate.mock.calls[0]?.[1] as { deal: { image: unknown } };
    expect(payload.deal.image).toBeDefined();
    if (typeof payload.deal.image === 'object' && payload.deal.image !== null) {
      expect((payload.deal.image as { uri?: string }).uri).toBeUndefined();
    }
  });

  it('handleDealPress should no-op when deal is missing', () => {
    const { navigation, navigate } = createNavigation();
    const deals = [createFavoriteDeal()];
    const restaurants: FavoriteRestaurant[] = [];

    const { result } = renderHook(() =>
      useFavoritesNavigationHandlers({ deals, restaurants, navigation }),
    );

    act(() => {
      result.current.handleDealPress('missing');
    });

    expect(navigate).not.toHaveBeenCalled();
  });

  it('handleUserPress should navigate when matching deal user has display name', () => {
    const { navigation, navigate } = createNavigation();
    const deals = [createFavoriteDeal({ userId: 'user-1', userDisplayName: 'foodfan' })];
    const restaurants: FavoriteRestaurant[] = [];

    const { result } = renderHook(() =>
      useFavoritesNavigationHandlers({ deals, restaurants, navigation }),
    );

    act(() => {
      result.current.handleUserPress('user-1');
    });

    expect(navigate).toHaveBeenCalledWith('UserProfile', {
      viewUser: true,
      username: 'foodfan',
      userId: 'user-1',
    });
  });

  it('handleUserPress should no-op when display name is missing', () => {
    const { navigation, navigate } = createNavigation();
    const deals = [createFavoriteDeal({ userDisplayName: undefined })];
    const restaurants: FavoriteRestaurant[] = [];

    const { result } = renderHook(() =>
      useFavoritesNavigationHandlers({ deals, restaurants, navigation }),
    );

    act(() => {
      result.current.handleUserPress('user-1');
    });

    expect(navigate).not.toHaveBeenCalled();
  });
});
