import { useLocationStore } from '../stores/LocationStore';

export function useLocation<T>(selector: (state: any) => T, equality?: (a: T, b: T) => boolean): T;
export function useLocation(): {
  currentLocation: string;
  isLoading: boolean;
  isInitialLoad: boolean;
  selectedCoordinates: { lat: number; lng: number } | null;
  hasLocationSet: boolean;
  hasLocationPermission: boolean;
  setCurrentLocation: (location: string) => void;
  updateLocation: (location: any) => void;
  loadCurrentLocation: () => Promise<void>;
  refreshPermissionStatus: () => Promise<void>;
};
export function useLocation<T>(selector?: (state: any) => T) {
  if (selector) {
    return useLocationStore(selector as any) as unknown as T;
  }
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
