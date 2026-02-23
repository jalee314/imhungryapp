/**
 * LocationStore Characterization Tests
 *
 * These tests document the current behavior of the LocationStore.
 * The store manages user location state and syncs with auth state.
 */

import { useAuthStore } from '../AuthStore';
import { useLocationStore } from '../LocationStore';

// Mock services that LocationStore depends on
jest.mock('../../services/locationService', () => ({
  getCurrentUserLocation: jest.fn(),
  checkLocationPermission: jest.fn(),
}));

// Mock AuthStore subscription
jest.mock('../AuthStore', () => ({
  useAuthStore: {
    subscribe: jest.fn(() => jest.fn()),
    getState: jest.fn(() => ({
      isAuthenticated: false,
      isLoading: true,
    })),
  },
}));

import {
  getCurrentUserLocation,
  checkLocationPermission,
} from '../../services/locationService';

describe('LocationStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useLocationStore.setState({
      currentLocation: 'Location',
      isLoading: false,
      isInitialLoad: true,
      selectedCoordinates: null,
      hasLocationSet: false,
      hasLocationPermission: false,
      _initialized: false,
      _authUnsubscribe: null,
      _hasLoadedLocation: false,
    });

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const state = useLocationStore.getState();

      expect(state.currentLocation).toBe('Location');
      expect(state.isLoading).toBe(false);
      expect(state.isInitialLoad).toBe(true);
      expect(state.selectedCoordinates).toBe(null);
      expect(state.hasLocationSet).toBe(false);
      expect(state.hasLocationPermission).toBe(false);
      expect(state._initialized).toBe(false);
    });
  });

  describe('initialize()', () => {
    it('should subscribe to auth store changes', () => {
      useLocationStore.getState().initialize();

      expect(useAuthStore.subscribe).toHaveBeenCalled();
    });

    it('should set _initialized to true', () => {
      useLocationStore.getState().initialize();

      expect(useLocationStore.getState()._initialized).toBe(true);
    });

    it('should only initialize once (idempotent)', () => {
      useLocationStore.getState().initialize();
      useLocationStore.getState().initialize();
      useLocationStore.getState().initialize();

      expect(useAuthStore.subscribe).toHaveBeenCalledTimes(1);
    });

    it('should store unsubscribe function', () => {
      const mockUnsubscribe = jest.fn();
      (useAuthStore.subscribe as jest.Mock).mockReturnValue(mockUnsubscribe);

      useLocationStore.getState().initialize();

      expect(useLocationStore.getState()._authUnsubscribe).toBe(mockUnsubscribe);
    });
  });

  describe('cleanup()', () => {
    it('should call auth unsubscribe function', () => {
      const mockUnsubscribe = jest.fn();
      useLocationStore.setState({ _authUnsubscribe: mockUnsubscribe, _initialized: true });

      useLocationStore.getState().cleanup();

      expect(mockUnsubscribe).toHaveBeenCalled();
    });

    it('should reset _initialized to false', () => {
      useLocationStore.setState({ _initialized: true });

      useLocationStore.getState().cleanup();

      expect(useLocationStore.getState()._initialized).toBe(false);
    });

    it('should clear _authUnsubscribe reference', () => {
      useLocationStore.setState({ _authUnsubscribe: jest.fn(), _initialized: true });

      useLocationStore.getState().cleanup();

      expect(useLocationStore.getState()._authUnsubscribe).toBe(null);
    });
  });

  describe('setCurrentLocation()', () => {
    it('should update currentLocation', () => {
      useLocationStore.getState().setCurrentLocation('San Francisco, CA');

      expect(useLocationStore.getState().currentLocation).toBe('San Francisco, CA');
    });
  });

  describe('updateLocation()', () => {
    it('should format city and state abbreviation correctly', () => {
      useLocationStore.getState().updateLocation({
        city: 'San Francisco',
        state: 'CA',
      });

      expect(useLocationStore.getState().currentLocation).toBe('San Francisco, CA');
    });

    it('should handle full state name by extracting abbreviation', () => {
      useLocationStore.getState().updateLocation({
        city: 'San Francisco',
        state: 'California',
      });

      // Current behavior: takes first 2 chars of first word
      expect(useLocationStore.getState().currentLocation).toBe('San Francisco, CA');
    });

    it('should handle city-only location', () => {
      useLocationStore.getState().updateLocation({
        city: 'San Francisco',
        state: '',
      });

      expect(useLocationStore.getState().currentLocation).toBe('San Francisco');
    });

    it('should set hasLocationSet to true', () => {
      useLocationStore.getState().updateLocation({ city: 'Test City', state: 'CA' });

      expect(useLocationStore.getState().hasLocationSet).toBe(true);
    });

    it('should update coordinates when provided', () => {
      useLocationStore.getState().updateLocation({
        city: 'San Francisco',
        state: 'CA',
        coordinates: { lat: 37.7749, lng: -122.4194 },
      });

      expect(useLocationStore.getState().selectedCoordinates).toEqual({
        lat: 37.7749,
        lng: -122.4194,
      });
    });

    it('should not update coordinates when not provided', () => {
      useLocationStore.getState().updateLocation({
        city: 'San Francisco',
        state: 'CA',
      });

      expect(useLocationStore.getState().selectedCoordinates).toBe(null);
    });

    it('should handle missing city with Unknown Location fallback', () => {
      useLocationStore.getState().updateLocation({
        city: '',
        state: '',
      });

      expect(useLocationStore.getState().currentLocation).toBe('Unknown Location');
    });
  });

  describe('loadCurrentLocation()', () => {
    it('should set isLoading to true while loading', async () => {
      (getCurrentUserLocation as jest.Mock).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(null), 100))
      );

      const loadPromise = useLocationStore.getState().loadCurrentLocation();

      // Check immediately - should be loading
      expect(useLocationStore.getState().isLoading).toBe(true);

      await loadPromise;
    });

    it('should update location when user has saved location', async () => {
      (getCurrentUserLocation as jest.Mock).mockResolvedValue({
        city: 'San Francisco',
        state: 'CA',
        lat: 37.7749,
        lng: -122.4194,
      });

      await useLocationStore.getState().loadCurrentLocation();

      const state = useLocationStore.getState();
      expect(state.currentLocation).toBe('San Francisco, CA');
      expect(state.selectedCoordinates).toEqual({ lat: 37.7749, lng: -122.4194 });
      expect(state.hasLocationSet).toBe(true);
    });

    it('should set isLoading to false after loading completes', async () => {
      (getCurrentUserLocation as jest.Mock).mockResolvedValue(null);

      await useLocationStore.getState().loadCurrentLocation();

      expect(useLocationStore.getState().isLoading).toBe(false);
    });

    it('should set isInitialLoad to false after loading', async () => {
      (getCurrentUserLocation as jest.Mock).mockResolvedValue(null);

      await useLocationStore.getState().loadCurrentLocation();

      expect(useLocationStore.getState().isInitialLoad).toBe(false);
    });

    it('should set _hasLoadedLocation to true on success', async () => {
      (getCurrentUserLocation as jest.Mock).mockResolvedValue({
        city: 'Test',
        state: 'CA',
        lat: 0,
        lng: 0,
      });

      await useLocationStore.getState().loadCurrentLocation();

      expect(useLocationStore.getState()._hasLoadedLocation).toBe(true);
    });

    it('should handle no location found', async () => {
      (getCurrentUserLocation as jest.Mock).mockResolvedValue(null);

      await useLocationStore.getState().loadCurrentLocation();

      expect(useLocationStore.getState().hasLocationSet).toBe(false);
    });

    it('should handle errors gracefully', async () => {
      (getCurrentUserLocation as jest.Mock).mockRejectedValue(new Error('Network error'));

      await useLocationStore.getState().loadCurrentLocation();

      expect(useLocationStore.getState().hasLocationSet).toBe(false);
      expect(useLocationStore.getState().isLoading).toBe(false);
    });
  });

  describe('refreshPermissionStatus()', () => {
    it('should update hasLocationPermission to true when granted', async () => {
      (checkLocationPermission as jest.Mock).mockResolvedValue(true);

      await useLocationStore.getState().refreshPermissionStatus();

      expect(useLocationStore.getState().hasLocationPermission).toBe(true);
    });

    it('should update hasLocationPermission to false when denied', async () => {
      (checkLocationPermission as jest.Mock).mockResolvedValue(false);

      await useLocationStore.getState().refreshPermissionStatus();

      expect(useLocationStore.getState().hasLocationPermission).toBe(false);
    });

    it('should handle errors by setting permission to false', async () => {
      (checkLocationPermission as jest.Mock).mockRejectedValue(new Error('Permission error'));

      await useLocationStore.getState().refreshPermissionStatus();

      expect(useLocationStore.getState().hasLocationPermission).toBe(false);
    });
  });
});
