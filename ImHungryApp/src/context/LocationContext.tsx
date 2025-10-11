import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getCurrentUserLocation, getCityFromCoordinates } from '../services/locationService';
import { useAuth } from './AuthContext';
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
  selectedCoordinates: { lat: number; lng: number } | null;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

interface LocationProviderProps {
  children: ReactNode;
}

export const LocationProvider: React.FC<LocationProviderProps> = ({ children }) => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [currentLocation, setCurrentLocation] = useState<string>('Location');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCoordinates, setSelectedCoordinates] = useState<{ lat: number; lng: number } | null>(null);

  // Helper function to get full location display "City, State" format
  const getFullLocationDisplay = async (latitude: number, longitude: number): Promise<string> => {
    try {
      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });
      
      if (reverseGeocode && reverseGeocode.length > 0) {
        const location = reverseGeocode[0];
        const city = location.city || location.subregion || 'Unknown City';
        const state = location.region || location.isoCountryCode || 'CA';
        
        // Format state abbreviation if it's a full state name
        let stateAbbr = state;
        if (state.length > 2) {
          // For common states, convert to abbreviation
          const stateMap: { [key: string]: string } = {
            'California': 'CA',
            'New York': 'NY',
            'Texas': 'TX',
            'Florida': 'FL',
            // Add more as needed
          };
          stateAbbr = stateMap[state] || state.substring(0, 2).toUpperCase();
        }
        
        return `${city}, ${stateAbbr}`;
      }
    } catch (error) {
      console.warn('Failed to get full location display:', error);
    }
    return 'Unknown Location';
  };

  const loadCurrentLocation = async () => {
    try {
      setIsLoading(true);
      const location = await getCurrentUserLocation();
      if (location) {
        // Get a properly formatted "City, State" display
        const displayName = await getFullLocationDisplay(location.lat, location.lng);
        
        setCurrentLocation(displayName);
        // Also set the coordinates for filtering and search functionality
        setSelectedCoordinates({ lat: location.lat, lng: location.lng });
        console.log('Loaded user location from database:', { 
          display: displayName,
          coordinates: { lat: location.lat, lng: location.lng }
        });
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

  // Load location on context initialization and when authentication state changes
  useEffect(() => {
    // Only try to load location if user is authenticated and auth loading is complete
    if (isAuthenticated && !authLoading) {
      console.log('User authenticated, loading location from database...');
      loadCurrentLocation();
    } else if (!isAuthenticated && !authLoading) {
      // User is not authenticated, reset location state
      console.log('User not authenticated, resetting location state');
      setCurrentLocation('Location');
      setSelectedCoordinates(null);
    }
  }, [isAuthenticated, authLoading]);

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