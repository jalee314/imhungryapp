import { supabase } from '../../lib/supabase';
import * as Location from 'expo-location';
import { getCurrentUserId } from '../utils/authUtils';
import { calculateDistance as calcDistance, formatDistance } from '../utils/distanceUtils';
import type { Coordinates } from '../types/common';

interface UserLocation {
  lat: number;
  lng: number;
  city?: string;
}

/**
 * Get current user's location from database
 * Now includes city to avoid expensive reverse geocoding
 */
export const getCurrentUserLocation = async (): Promise<UserLocation | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('No authenticated user found');
      return null;
    }

    console.log('Fetching location for user:', user.id);

    // Query to extract lat/lng/city from PostGIS geography column
    const { data: userData, error } = await supabase
      .rpc('get_user_location_coords', { user_uuid: user.id });

    if (error) {
      console.error('Error fetching user location:', error);
      return null;
    }

    if (!userData || userData.length === 0) {
      console.log('No location data found for user');
      return null;
    }

    const locationData = userData[0];

    if (!locationData.lat || !locationData.lng) {
      console.error('No coordinates found in location data');
      return null;
    }

    console.log('✅ Location found (with city from DB):', { 
      lat: locationData.lat, 
      lng: locationData.lng,
      city: locationData.city 
    });
    
    return {
      lat: locationData.lat,
      lng: locationData.lng,
      city: locationData.city // Now includes city from database!
    };
  } catch (error) {
    console.error('Error getting user location:', error);
    return null;
  }
};

/**
 * Calculate distance between two points using Haversine formula
 * Re-exported from distanceUtils for backwards compatibility
 * @deprecated Import directly from '../utils/distanceUtils' instead
 */
export const calculateDistance = calcDistance;

/**
 * Batch fetch restaurant locations for multiple restaurants
 */
export const getRestaurantLocationsBatch = async (
  restaurantIds: string[]
): Promise<Record<string, { lat: number; lng: number }>> => {
  try {
    if (restaurantIds.length === 0) return {};

    // Use the PostGIS view to get coordinates
    const { data, error } = await supabase
      .from('restaurants_with_coords')
      .select('restaurant_id, lat, lng')
      .in('restaurant_id', restaurantIds);

    if (error) {
      console.error('Error fetching restaurant locations:', error);
      return {};
    }

    const locations: Record<string, { lat: number; lng: number }> = {};
    
    data?.forEach(restaurant => {
      if (restaurant.lat && restaurant.lng) {
        locations[restaurant.restaurant_id] = {
          lat: parseFloat(restaurant.lat),
          lng: parseFloat(restaurant.lng)
        };
      }
    });

    return locations;
  } catch (error) {
    console.error('Error in getRestaurantLocationsBatch:', error);
    return {};
  }
};

/**
 * Check if location permission is granted without requesting it
 */
export const checkLocationPermission = async (): Promise<boolean> => {
  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Error checking location permission:', error);
    return false;
  }
};

/**
 * Get detailed location permission status
 */
export const getLocationPermissionStatus = async (): Promise<{
  isGranted: boolean;
  isDenied: boolean;
  canAskAgain: boolean;
  status: string;
}> => {
  try {
    const permissionResult = await Location.getForegroundPermissionsAsync();
    return {
      isGranted: permissionResult.status === 'granted',
      isDenied: permissionResult.status === 'denied',
      canAskAgain: permissionResult.canAskAgain !== false,
      status: permissionResult.status
    };
  } catch (error) {
    console.error('Error getting location permission status:', error);
    return {
      isGranted: false,
      isDenied: false,
      canAskAgain: true,
      status: 'undetermined'
    };
  }
};

/**
 * Request device location permission
 */
export const requestLocationPermission = async (): Promise<boolean> => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Error requesting location permission:', error);
    return false;
  }
};

/**
 * Get device's current location
 */
export const getDeviceLocation = async (): Promise<{ latitude: number; longitude: number } | null> => {
  try {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      console.log('Location permission denied');
      return null;
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
      timeInterval: 10000,
      distanceInterval: 1,
    });

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };
  } catch (error) {
    console.error('Error getting device location:', error);
    return null;
  }
};

/**
 * Get city name from coordinates using reverse geocoding
 */
export const getCityFromCoordinates = async (latitude: number, longitude: number): Promise<string> => {
  try {
    const reverseGeocode = await Location.reverseGeocodeAsync({
      latitude,
      longitude,
    });
    
    if (reverseGeocode && reverseGeocode.length > 0) {
      const location = reverseGeocode[0];
      return location.city || location.subregion || location.region || 'Unknown City';
    }
  } catch (error) {
    console.warn('Failed to get city from coordinates:', error);
  }
  return 'Unknown City';
};

/**
 * Get coordinates from city name using forward geocoding
 */
export const getCoordinatesFromCity = async (cityName: string, state: string = 'California'): Promise<{ lat: number; lng: number } | null> => {
  try {
    const geocode = await Location.geocodeAsync(`${cityName}, ${state}, USA`);
    
    if (geocode && geocode.length > 0) {
      const location = geocode[0];
      return {
        lat: location.latitude,
        lng: location.longitude
      };
    }
  } catch (error) {
    console.warn('Failed to get coordinates from city:', error);
  }
  return null;
};

/**
 * Update user's location in database
 */
export const updateUserLocation = async (
  latitude: number,
  longitude: number,
  city?: string
): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    // Validate coordinates
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      console.error('Invalid coordinates:', { latitude, longitude });
      return false;
    }

    // Call the database function to update location
    const { error } = await supabase.rpc('update_user_location', {
      user_uuid: user.id,
      lat: latitude,
      lng: longitude,
      city: city || null
    });

    if (error) {
      console.error('Error updating user location:', error);
      return false;
    }

    console.log('Location updated successfully');
    return true;
  } catch (error) {
    console.error('Error in updateUserLocation:', error);
    return false;
  }
};
