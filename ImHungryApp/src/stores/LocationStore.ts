import { create } from 'zustand';
import { getCurrentUserLocation, checkLocationPermission } from '../services/locationService';
import { useAuthStore } from './AuthStore';
import React from 'react';

type Coordinates = { lat: number; lng: number };

// Keep the public API compatible with the previous LocationContext
interface LocationState {
  currentLocation: string;
  isLoading: boolean;
  isInitialLoad: boolean;
  selectedCoordinates: Coordinates | null;
  hasLocationSet: boolean;
  hasLocationPermission: boolean;

  // internals
  _initialized: boolean;
  _authUnsubscribe: (() => void) | null;
  _hasLoadedLocation: boolean;

  // actions
  initialize: () => void;
  cleanup: () => void;
  setCurrentLocation: (location: string) => void;
  updateLocation: (location: any) => void;
  loadCurrentLocation: () => Promise<void>;
  refreshPermissionStatus: () => Promise<void>;
}

export const useLocationStore = create<LocationState>((set, get) => ({
  currentLocation: 'Location',
  isLoading: false,
  isInitialLoad: true,
  selectedCoordinates: null,
  hasLocationSet: false,
  hasLocationPermission: false,
  _initialized: false,
  _authUnsubscribe: null,
  _hasLoadedLocation: false,

  initialize: () => {
    if (get()._initialized) return;

    // Subscribe to auth changes to manage when to load/reset location
    const unsub = useAuthStore.subscribe(async (state, prev) => {
      const authChanged =
        state.isAuthenticated !== prev.isAuthenticated || state.isLoading !== prev.isLoading;

      if (!authChanged) return;

      if (state.isAuthenticated && !state.isLoading) {
        // Load only once to prevent flashing; still mark initialLoad false
        if (!get()._hasLoadedLocation) {
          await get().loadCurrentLocation();
        } else {
          set({ isInitialLoad: false });
        }
        await get().refreshPermissionStatus();
      } else if (!state.isAuthenticated && !state.isLoading) {
        // Reset state when signed out
        set({
          currentLocation: 'Location',
          selectedCoordinates: null,
          hasLocationSet: false,
          hasLocationPermission: false,
          isInitialLoad: false,
        });
        set({ _hasLoadedLocation: false });
      }
    });

    set({ _authUnsubscribe: unsub, _initialized: true });
  },

  cleanup: () => {
    const unsub = get()._authUnsubscribe;
    unsub?.();
    set({ _authUnsubscribe: null, _initialized: false });
  },

  setCurrentLocation: (location: string) => set({ currentLocation: location }),

  updateLocation: (location: any) => {
    // State is now a 2-letter abbreviation for current location, or full state name for manual selection
    const stateValue = location?.state ?? '';
    // If state is 2 letters (abbreviation), use it directly; otherwise, extract abbreviation from full state name
    const stateAbbr = stateValue.length === 2 
      ? stateValue.toUpperCase()
      : String(stateValue).split(' ')[0].slice(0, 2).toUpperCase();
    
    const locationDisplay = stateAbbr 
      ? `${location?.city}, ${stateAbbr}`
      : location?.city || 'Unknown Location';

    set({ currentLocation: locationDisplay, hasLocationSet: true });

    if (location?.coordinates && typeof location.coordinates.lat === 'number' && typeof location.coordinates.lng === 'number') {
      set({ selectedCoordinates: { lat: location.coordinates.lat, lng: location.coordinates.lng } });
    }

    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.log('Global location updated to:', location);
    }
  },

  loadCurrentLocation: async () => {
    try {
      set({ isLoading: true });
      const start = Date.now();
      const location = await getCurrentUserLocation();
      const took = Date.now() - start;
      if (location) {
        const displayName = location.city ? `${location.city}, CA` : 'Unknown Location';
        set({
          currentLocation: displayName,
          selectedCoordinates: { lat: location.lat, lng: location.lng },
          hasLocationSet: true,
          isLoading: false,
          isInitialLoad: false,
          _hasLoadedLocation: true,
        });
        if (typeof __DEV__ !== 'undefined' && __DEV__) {
          console.log(`✅ Location loaded in ${took}ms (from database, no geocoding):`, {
            display: displayName,
            coordinates: { lat: location.lat, lng: location.lng },
          });
        }
      } else {
        if (typeof __DEV__ !== 'undefined' && __DEV__) {
          console.log(`⚠️ No location found (${took}ms)`);
        }
        set({ hasLocationSet: false, isLoading: false, isInitialLoad: false });
      }
    } catch (e) {
      console.error('Error loading current location:', e);
      set({ hasLocationSet: false, isLoading: false, isInitialLoad: false });
    }
  },

  refreshPermissionStatus: async () => {
    try {
      const hasPermission = await checkLocationPermission();
      set({ hasLocationPermission: hasPermission });
    } catch (e) {
      console.error('Error checking location permission:', e);
      set({ hasLocationPermission: false });
    }
  },
}));

// Lifecycle hook to initialize once at app start
export const useInitializeLocation = () => {
  const initialize = useLocationStore((s) => s.initialize);
  const cleanup = useLocationStore((s) => s.cleanup);
  React.useEffect(() => {
    initialize();
    return cleanup;
  }, [initialize, cleanup]);
};
