/**
 * Date Utilities
 * 
 * Shared date helper functions used across services.
 * Consolidates duplicate date logic from multiple service files.
 */

/**
 * Calculate time ago from a date
 * Consolidates the getTimeAgo function that appears in multiple services
 */
export const getTimeAgo = (date: Date): string => {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return `${diffInSeconds}s ago`;
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes}m ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours}h ago`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days}d ago`;
  }
};

/**
 * Safely parse and format dates
 * Consolidates the parseDate function from dealService
 */
export const parseDate = (dateString: string | null): string | null => {
  if (!dateString || dateString === 'Unknown') {
    return null;
  }
  try {
    let date: Date;
    if (dateString.includes('T') || dateString.includes('Z')) {
      date = new Date(dateString);
    } else {
      date = new Date(dateString);
    }
    if (isNaN(date.getTime())) {
      console.error('Invalid date format:', dateString);
      return null;
    }
    return date.toISOString();
  } catch (error) {
    console.error('Error parsing date:', dateString, error);
    return null;
  }
};

/**
 * Format a date to a readable string
 */
export const formatDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

/**
 * Check if a date is in the past
 */
export const isPastDate = (date: Date | string): boolean => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.getTime() < Date.now();
};

/**
 * Check if a date is in the future
 */
export const isFutureDate = (date: Date | string): boolean => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.getTime() > Date.now();
};

