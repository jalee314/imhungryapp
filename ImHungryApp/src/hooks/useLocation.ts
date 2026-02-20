import { useLocationStore } from '../stores/LocationStore';

/**
 * Convenience hook for LocationStore.
 * Subscribes to individual slices to avoid unnecessary re-renders.
 */
export function useLocation() {
  const currentLocation = useLocationStore((s) => s.currentLocation);
  const isLoading = useLocationStore((s) => s.isLoading);
  const isInitialLoad = useLocationStore((s) => s.isInitialLoad);
  const selectedCoordinates = useLocationStore((s) => s.selectedCoordinates);
  const hasLocationSet = useLocationStore((s) => s.hasLocationSet);
  const hasLocationPermission = useLocationStore((s) => s.hasLocationPermission);
  const setCurrentLocation = useLocationStore((s) => s.setCurrentLocation);
  const updateLocation = useLocationStore((s) => s.updateLocation);
  const loadCurrentLocation = useLocationStore((s) => s.loadCurrentLocation);
  const refreshPermissionStatus = useLocationStore((s) => s.refreshPermissionStatus);

  return {
    currentLocation,
    isLoading,
    isInitialLoad,
    selectedCoordinates,
    hasLocationSet,
    hasLocationPermission,
    setCurrentLocation,
    updateLocation,
    loadCurrentLocation,
    refreshPermissionStatus,
  };
}
