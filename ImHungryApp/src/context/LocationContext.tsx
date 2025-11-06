import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { getCurrentUserLocation, getCityFromCoordinates, checkLocationPermission } from '../services/locationService';
import { useAuthStore } from '../stores/AuthStore';
import * as Location from 'expo-location';

interface LocationItem {
  id: string;
  city: string;
  state: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

interface LocationContextType {
  currentLocation: string;
  setCurrentLocation: (location: string) => void;
  updateLocation: (location: LocationItem) => void;
  loadCurrentLocation: () => Promise<void>;
  isLoading: boolean;
  isInitialLoad: boolean;
  selectedCoordinates: { lat: number; lng: number } | null;
  hasLocationSet: boolean;
  hasLocationPermission: boolean;
  refreshPermissionStatus: () => Promise<void>;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

interface LocationProviderProps {
  children: ReactNode;
}

export const LocationProvider: React.FC<LocationProviderProps> = ({ children }) => {
  // Subscribe directly to the minimal auth slices to avoid unnecessary re-renders
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const authLoading = useAuthStore((s) => s.isLoading);
  const [currentLocation, setCurrentLocation] = useState<string>('Location');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [selectedCoordinates, setSelectedCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [hasLocationSet, setHasLocationSet] = useState<boolean>(false);
  const [hasLocationPermission, setHasLocationPermission] = useState<boolean>(false);
  const hasLoadedLocation = useRef(false);

  const loadCurrentLocation = async () => {
    try {
      setIsLoading(true);
      const startTime = Date.now();
      const location = await getCurrentUserLocation();
      const loadTime = Date.now() - startTime;
      
      if (location) {
        // Use city from database (much faster than reverse geocoding!)
        const displayName = location.city || 'Unknown Location';
        
        setCurrentLocation(displayName);
        // Also set the coordinates for filtering and search functionality
        setSelectedCoordinates({ lat: location.lat, lng: location.lng });
        setHasLocationSet(true);
        hasLoadedLocation.current = true;
        console.log(`✅ Location loaded in ${loadTime}ms (from database, no geocoding):`, { 
          display: displayName,
          coordinates: { lat: location.lat, lng: location.lng }
        });
      } else {
        console.log(`⚠️ No location found (${loadTime}ms)`);
        setHasLocationSet(false);
      }
    } catch (error) {
      console.error('Error loading current location:', error);
      setHasLocationSet(false);
    } finally {
      setIsLoading(false);
      setIsInitialLoad(false);
    }
  };

  const checkPermissionStatus = async () => {
    const hasPermission = await checkLocationPermission();
    setHasLocationPermission(hasPermission);
  };

  const updateLocation = (location: LocationItem) => {
    // Update the current location display - format like "Fullerton, CA"
    const locationDisplay = location.state === 'Current Location' 
      ? location.city 
      : `${location.city}, ${location.state.split(' ')[0].slice(0, 2).toUpperCase()}`;
    
    setCurrentLocation(locationDisplay);
    setHasLocationSet(true);
    
    // Store the coordinates if available
    if (location.coordinates) {
      setSelectedCoordinates(location.coordinates);
    }
    
    // Log the location update
    console.log('Global location updated to:', location);
  };

  // Load location on context initialization and when authentication state changes
  useEffect(() => {
    // Only try to load location if user is authenticated and auth loading is complete
    if (isAuthenticated && !authLoading) {
      console.log('User authenticated, checking if location needs to be loaded...');
      // Only load if we haven't already loaded a location to prevent flashing
      if (!hasLoadedLocation.current) {
        loadCurrentLocation();
      } else {
        // If location was already loaded (e.g., from a previous session), mark initial load as complete
        setIsInitialLoad(false);
      }
      // Always check permission status when authenticated
      checkPermissionStatus();
    } else if (!isAuthenticated && !authLoading) {
      // User is not authenticated, reset location state
      console.log('User not authenticated, resetting location state');
      setCurrentLocation('Location');
      setSelectedCoordinates(null);
      setHasLocationSet(false);
      setHasLocationPermission(false);
      hasLoadedLocation.current = false;
      setIsInitialLoad(false);
    }
  }, [isAuthenticated, authLoading]);

  const value: LocationContextType = {
    currentLocation,
    setCurrentLocation,
    updateLocation,
    loadCurrentLocation,
    isLoading,
    isInitialLoad,
    selectedCoordinates,
    hasLocationSet,
    hasLocationPermission,
    refreshPermissionStatus: checkPermissionStatus,
  };

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = (): LocationContextType => {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};