import { supabase } from '../../lib/supabase';
import { checkEmailExists } from './userService';
import type { User, AuthChangeEvent, Session } from '@supabase/supabase-js';

// ============================================
// TYPES
// ============================================

export interface PasswordResetResult {
  success: boolean;
  message: string;
  errorType?: 'EMAIL_NOT_FOUND' | 'SUPABASE_ERROR' | 'UNKNOWN_ERROR';
}

export interface AuthSessionResult {
  isAuthenticated: boolean;
  user: User | null;
}

// Type for auth state change callback
export type AuthStateChangeCallback = (event: AuthChangeEvent, session: Session | null) => void | Promise<void>;

// Type for the subscription object
export type AuthSubscription = ReturnType<typeof supabase.auth.onAuthStateChange>['data']['subscription'];

// ============================================
// GET CURRENT USER
// ============================================

/**
 * Get the currently authenticated user
 * @returns Promise<User | null> - The authenticated user or null
 */
export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error('Error getting current user:', error);
      return null;
    }
    
    return user;
  } catch (error) {
    console.error('Error in getCurrentUser:', error);
    return null;
  }
};

// ============================================
// GET CURRENT SESSION
// ============================================

/**
 * Get the current auth session
 * @returns Promise<AuthSessionResult> - Session information
 */
export const getCurrentSession = async (): Promise<AuthSessionResult> => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Error getting session:', error);
      return { isAuthenticated: false, user: null };
    }
    
    return {
      isAuthenticated: !!session,
      user: session?.user || null
    };
  } catch (error) {
    console.error('Error in getCurrentSession:', error);
    return { isAuthenticated: false, user: null };
  }
};

// ============================================
// SIGN OUT
// ============================================

/**
 * Sign out the current user
 * @throws Error if sign out fails
 */
export const signOut = async (): Promise<void> => {
  const { error } = await supabase.auth.signOut();
  
  if (error) {
    console.error('Error signing out:', error);
    throw error;
  }
  
  console.log('✅ User signed out successfully');
};

// ============================================
// AUTH STATE CHANGE LISTENER
// ============================================

/**
 * Set up a listener for auth state changes
 * Returns a subscription object that can be unsubscribed later
 * 
 * @param callback - Function to call when auth state changes
 * @returns AuthSubscription - Subscription object with unsubscribe method
 * 
 * @example
 * const subscription = setupAuthStateListener(async (event, session) => {
 *   console.log('Auth event:', event);
 *   // Handle auth changes
 * });
 * 
 * // Later, cleanup:
 * subscription.unsubscribe();
 */
export const setupAuthStateListener = (
  callback: AuthStateChangeCallback
): AuthSubscription => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(callback);
  return subscription;
};

// ============================================
// VALIDATE EMAIL EXISTS
// ============================================

/**
 * Check if an email exists in the system
 * @param email - The email address to validate
 * @returns Promise<boolean> - true if email exists
 */
export const validateEmail = async (email: string): Promise<boolean> => {
  try {
    return await checkEmailExists(email);
  } catch (error) {
    console.error('Error validating email:', error);
    return false;
  }
};

// Re-export for backward compatibility
export const validateEmailExists = validateEmail;

// ============================================
// PASSWORD RESET
// ============================================

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

// ============================================
// SIGN IN WITH PASSWORD
// ============================================

/**
 * Sign in a user with email and password
 * Returns { data, error } like Supabase
 */
export const signInWithPassword = async (email: string, password: string) => {
  return supabase.auth.signInWithPassword({ email, password });
};

// ============================================
// SIGN UP (thin wrapper)
// ============================================

/**
 * Thin wrapper over supabase.auth.signUp so service/hook can centralize calls
 */
export const signUp = async (
  params: Parameters<typeof supabase.auth.signUp>[0]
) => {
  return supabase.auth.signUp(params);
};

// ============================================
// PASSWORD RESET HELPERS
// ============================================

/**
 * Set a temporary session using access/refresh tokens
 */
export const setSessionWithTokens = async (access_token: string, refresh_token: string) => {
  return supabase.auth.setSession({ access_token, refresh_token });
};

/**
 * Update the current user's password
 */
export const updateUserPassword = async (newPassword: string) => {
  return supabase.auth.updateUser({ password: newPassword });
};

/**
 * Sign out locally (clear session without network propagation)
 */
export const signOutLocal = async () => {
  return supabase.auth.signOut({ scope: 'local' as any });
};

/**
 * Full password reset sequence: set session, update password, sign out locally
 */
export const resetPasswordWithTokens = async (
  accessToken: string,
  refreshToken: string,
  newPassword: string
) => {
  const { error: sessionError } = await setSessionWithTokens(accessToken, refreshToken);
  if (sessionError) return { error: sessionError } as const;

  const { error: updateError } = await updateUserPassword(newPassword);
  if (updateError) {
    await signOutLocal();
    return { error: updateError } as const;
  }

  await signOutLocal();
  return { error: null } as const;
};