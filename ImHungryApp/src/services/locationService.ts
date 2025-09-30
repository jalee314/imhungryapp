import { supabase } from '../../lib/supabase';
import * as Location from 'expo-location';

interface UserLocation {
  lat: number;
  lng: number;
  city?: string;
}

/**
 * Get current user's location from database
 */
export const getCurrentUserLocation = async (): Promise<UserLocation | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('No authenticated user found');
      return null;
    }

    console.log('Fetching location for user:', user.id);

    // Query to extract lat/lng from PostGIS geography column
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

    console.log('Location found:', { lat: locationData.lat, lng: locationData.lng });
    return {
      lat: locationData.lat,
      lng: locationData.lng,
      city: locationData.city
    };
  } catch (error) {
    console.error('Error getting user location:', error);
    return null;
  }
};

/**
 * Calculate distance between two points using Haversine formula
 * Returns distance in miles
 */
export const calculateDistance = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number => {
  const R = 3958.8; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance;
};

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
      accuracy: Location.Accuracy.Balanced,
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
