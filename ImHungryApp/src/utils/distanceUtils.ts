/**
 * Distance Utilities
 * 
 * Shared distance calculation helper functions.
 * Extracted from locationService for reusability.
 */

import type { Coordinates } from '../types/common';

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
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance;
};

/**
 * Convert degrees to radians
 */
const toRad = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};

/**
 * Format distance for display
 */
export const formatDistance = (miles: number | null | undefined): string => {
  if (miles === null || miles === undefined) {
    return '?mi';
  }
  return `${Math.round(miles * 10) / 10}mi`;
};

/**
 * Calculate distance between two coordinate objects
 */
export const calculateDistanceBetweenCoords = (
  coord1: Coordinates,
  coord2: Coordinates
): number => {
  return calculateDistance(coord1.lat, coord1.lng, coord2.lat, coord2.lng);
};

