import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getCurrentUserLocation, getCityFromCoordinates } from '../services/locationService';

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
  selectedCoordinates: { lat: number; lng: number } | null;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

interface LocationProviderProps {
  children: ReactNode;
}

export const LocationProvider: React.FC<LocationProviderProps> = ({ children }) => {
  const [currentLocation, setCurrentLocation] = useState<string>('Location');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCoordinates, setSelectedCoordinates] = useState<{ lat: number; lng: number } | null>(null);

  const loadCurrentLocation = async () => {
    try {
      setIsLoading(true);
      const location = await getCurrentUserLocation();
      if (location) {
        const cityName = location.city || await getCityFromCoordinates(location.lat, location.lng);
        // Format as "City, ST" (e.g., "Fullerton, CA")
        setCurrentLocation(`${cityName}, CA`);
      }
    } catch (error) {
      console.error('Error loading current location:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateLocation = (location: LocationItem) => {
    // Update the current location display - format like "Fullerton, CA"
    const locationDisplay = location.state === 'Current Location' 
      ? location.city 
      : `${location.city}, ${location.state.split(' ')[0].slice(0, 2).toUpperCase()}`;
    
    setCurrentLocation(locationDisplay);
    
    // Store the coordinates if available
    if (location.coordinates) {
      setSelectedCoordinates(location.coordinates);
    }
    
    // Log the location update
    console.log('Global location updated to:', location);
  };

  // Load location on context initialization
  useEffect(() => {
    loadCurrentLocation();
  }, []);

  const value: LocationContextType = {
    currentLocation,
    setCurrentLocation,
    updateLocation,
    loadCurrentLocation,
    isLoading,
    selectedCoordinates,
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