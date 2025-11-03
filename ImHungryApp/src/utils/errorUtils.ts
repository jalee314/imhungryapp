/**
 * Error Handling Utilities
 * 
 * Centralized error handling for consistent error messages and logging
 * across all services.
 */

import type { ServiceResponse } from '../types/common';

/**
 * Standard error response structure
 */
export interface ErrorResponse {
  success: false;
  error: string;
  errorCode?: string;
  details?: any;
}

/**
 * Handle Supabase database errors with consistent messaging
 */
export const handleDatabaseError = (
  error: any,
  context: string
): ErrorResponse => {
  console.error(`Database error in ${context}:`, error);
  
  // Map common PostgreSQL error codes to user-friendly messages
  const errorCode = error.code || error.error_code;
  
  const errorMessages: Record<string, string> = {
    '23505': 'This record already exists',
    '23503': 'Referenced record not found',
    '23502': 'Required field is missing',
    '42P01': 'Database table not found',
    'PGRST116': 'No data found',
    '42501': 'Permission denied',
  };
  
  const userMessage = errorMessages[errorCode] || error.message || 'Database operation failed';
  
  return {
    success: false,
    error: userMessage,
    errorCode,
    details: error.details || error.hint
  };
};

/**
 * Handle unexpected errors with logging
 */
export const handleUnexpectedError = (
  error: any,
  context: string
): ErrorResponse => {
  console.error(`Unexpected error in ${context}:`, error);
  
  return {
    success: false,
    error: 'An unexpected error occurred. Please try again.',
    details: error.message || String(error)
  };
};

/**
 * Handle authentication errors
 */
export const handleAuthError = (
  error: any,
  context: string
): ErrorResponse => {
  console.error(`Auth error in ${context}:`, error);
  
  const authErrorMessages: Record<string, string> = {
    'invalid_credentials': 'Invalid email or password',
    'email_not_confirmed': 'Please verify your email address',
    'user_not_found': 'No account found with this email',
    'invalid_grant': 'Session expired. Please log in again',
  };
  
  const errorMessage = error.error || error.message || '';
  const userMessage = authErrorMessages[errorMessage] || 'Authentication failed';
  
  return {
    success: false,
    error: userMessage,
    errorCode: errorMessage
  };
};

/**
 * Handle validation errors
 */
export const handleValidationError = (
  message: string,
  field?: string
): ErrorResponse => {
  return {
    success: false,
    error: message,
    errorCode: 'VALIDATION_ERROR',
    details: field ? { field } : undefined
  };
};

/**
 * Create success response
 */
export const createSuccessResponse = <T = any>(
  data?: T
): ServiceResponse<T> => {
  return {
    success: true,
    data
  };
};

/**
 * Create error response
 */
export const createErrorResponse = (
  error: string,
  errorCode?: string
): ServiceResponse => {
  return {
    success: false,
    error,
    ...(errorCode && { errorCode })
  };
};

/**
 * Wrap async function with error handling
 */
export const withErrorHandling = async <T>(
  fn: () => Promise<T>,
  context: string
): Promise<ServiceResponse<T>> => {
  try {
    const result = await fn();
    return createSuccessResponse(result);
  } catch (error: any) {
    if (error.code || error.error_code) {
      return handleDatabaseError(error, context);
    }
    return handleUnexpectedError(error, context);
  }
};

/**
 * Check if error is a "not found" error
 */
export const isNotFoundError = (error: any): boolean => {
  return error?.code === 'PGRST116' || error?.status === 404;
};

/**
 * Check if error is a permission error
 */
export const isPermissionError = (error: any): boolean => {
  return error?.code === '42501' || error?.status === 403;
};

/**
 * Log error with context for debugging
 */
export const logError = (
  context: string,
  error: any,
  additionalInfo?: Record<string, any>
): void => {
  console.error(`[${context}] Error:`, {
    message: error.message || String(error),
    code: error.code || error.error_code,
    details: error.details || error.hint,
    ...additionalInfo
  });
};

