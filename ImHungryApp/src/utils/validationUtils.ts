/**
 * Validation Utilities
 * 
 * Shared validation helper functions used across the application.
 */

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate username format
 * - 3-20 characters
 * - Alphanumeric, underscores, hyphens only
 */
export const isValidUsername = (username: string): boolean => {
  const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/;
  return usernameRegex.test(username);
};

/**
 * Validate password strength
 * - At least 8 characters
 * - Contains at least one letter and one number
 */
export const isValidPassword = (password: string): boolean => {
  if (password.length < 8) return false;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  return hasLetter && hasNumber;
};

/**
 * Validate required string field
 */
export const isRequiredField = (value: string | null | undefined): boolean => {
  return !!value && value.trim().length > 0;
};

/**
 * Validate URL format
 */
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Sanitize string input (remove extra whitespace)
 */
export const sanitizeString = (input: string): string => {
  return input.trim().replace(/\s+/g, ' ');
};

