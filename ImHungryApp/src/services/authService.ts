import { supabase } from '../../lib/supabase';
import { checkEmailExists } from './userService';

export interface PasswordResetResult {
  success: boolean;
  message: string;
  errorType?: 'EMAIL_NOT_FOUND' | 'SUPABASE_ERROR' | 'UNKNOWN_ERROR';
}

/**
 * Sends a password reset email after validating that the email exists in the system
 * 
 * SECURITY ENHANCEMENT: This function first checks if the email exists in our database
 * before sending a password reset email. This prevents information disclosure attacks
 * where an attacker could determine which emails are registered by observing whether
 * a "password reset email sent" message appears.
 * 
 * @param email - The email address to send the reset link to
 * @param redirectTo - Optional redirect URL for the reset link
 * @returns Promise<PasswordResetResult> - Result of the password reset attempt
 */
export const sendPasswordResetEmail = async (
  email: string, 
  redirectTo?: string
): Promise<PasswordResetResult> => {
  try {
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        success: false,
        message: 'Please enter a valid email address.',
        errorType: 'UNKNOWN_ERROR'
      };
    }

    // Check if the email exists in our system
    const emailExists = await checkEmailExists(email);

    if (!emailExists) {
      return {
        success: false,
        message: 'No account found with this email address. Please check your email or sign up for a new account.',
        errorType: 'EMAIL_NOT_FOUND'
      };
    }

    // If email exists, proceed with password reset
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectTo || 'https://imhungri.netlify.app/',
    });

    if (error) {
      console.error('Supabase password reset error:', error);
      return {
        success: false,
        message: error.message || 'Failed to send password reset email.',
        errorType: 'SUPABASE_ERROR'
      };
    }

    return {
      success: true,
      message: 'We\'ve sent you a password reset link. Please check your email and follow the instructions.'
    };

  } catch (error) {
    console.error('Password reset error:', error);
    return {
      success: false,
      message: 'An unexpected error occurred. Please try again.',
      errorType: 'UNKNOWN_ERROR'
    };
  }
};

/**
 * Validates if an email exists in the system (exported for convenience)
 * @param email - The email address to check
 * @returns Promise<boolean> - true if email exists, false otherwise
 */
export const validateEmailExists = checkEmailExists;