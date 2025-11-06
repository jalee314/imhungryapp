import { create } from 'zustand';

import { 
  getCurrentUser,
  setupAuthStateListener,
  signOut as authServiceSignOut,
  validateEmail as authServiceValidateEmail,
  signInWithPassword,
  resetPasswordWithTokens as resetPasswordWithTokensSvc,
  type AuthSubscription
} from '../services/authService';
import { completeSignup as completeSignupSvc, completeSignupSkip as completeSignupSkipSvc } from '../services/onboardingService';

import { 
  initializeAuthSession, 
  setupAppStateListener 
} from '../services/sessionService';

import type { User } from '@supabase/supabase-js';

import React from 'react';

/**
 * Auth Store Interface
 * 
 * State properties are reactive - components re-render when these change
 * Internal references (prefixed with _) are non-reactive - used for cleanup
 * Actions are functions that modify state or perform async operations
 */
interface AuthState {
  // ============================================
  // REACTIVE STATE - Components subscribe to these
  // ============================================
  
  /** Whether user is currently authenticated */
  isAuthenticated: boolean;
  
  /** Loading state during initial auth check */
  isLoading: boolean;
  
  /** Current authenticated user object from Supabase */
  user: User | null;
  
  /** Flag to pause auth event processing during password reset flow */
  isPasswordResetMode: boolean;
  
  /** Counter to prevent infinite auth event loops (max 10) */
  authEventCount: number;
  
  // ============================================
  // INTERNAL REFERENCES - Non-reactive storage
  // ============================================
  
  /** Supabase auth subscription - stored for cleanup on unmount */
  _authSubscription: AuthSubscription | null;
  
  /** App state listener cleanup function - called when store is destroyed */
  _appStateCleanup: (() => void) | null;

  /** Internal flag to prevent double-initialization */
  _initialized: boolean;
  
  // ============================================
  // ACTIONS - Public methods for components
  // ============================================
  
  /**
   * Initialize auth state and set up listeners
   * Call this once when your app starts (usually in App.tsx)
   * 
   * @example
   * useEffect(() => {
   *   useAuthStore.getState().initialize();
   * }, []);
   */
  initialize: () => Promise<void>;
  
  /**
   * Sign out current user and clear auth state
   * 
   * @throws Error if sign out fails
   * @example
   * const signOut = useAuthStore(state => state.signOut);
   * await signOut();
   */
  signOut: () => Promise<void>;
  
  /**
   * Check if an email exists in the database
   * Used during password reset flow
   * 
   * @param email - Email address to validate
   * @returns Promise<boolean> - true if email exists
   * @example
   * const validateEmail = useAuthStore(state => state.validateEmail);
   * const exists = await validateEmail('user@example.com');
   */
  validateEmail: (email: string) => Promise<boolean>;
  
  /**
   * Enable/disable password reset mode
   * When enabled, auth state changes are ignored to prevent
   * navigation interruptions during password reset flow
   * 
   * @param enabled - true to enable, false to disable
   */
  setPasswordResetMode: (enabled: boolean) => void;
  
  /**
   * Clean up subscriptions and listeners
   * Call this when app unmounts or store is destroyed
   */
  cleanup: () => void;

  // New actions
  signIn: (email: string, password: string) => Promise<void>;
  completeSignup: (userData: any, selectedCuisines: string[]) => Promise<void>;
  completeSignupSkip: (userData: any) => Promise<void>;
  resetPasswordWithTokens: (accessToken: string, refreshToken: string, newPassword: string) => Promise<{ error: any } | { error: null }>;
}

/**
 * Zustand Auth Store
 * 
 * Manages authentication state for the entire app.
 * All Supabase interactions are handled by authService.
 * This store only manages state and orchestrates service calls.
 */
export const useAuthStore = create<AuthState>((set, get) => ({
  // ============================================
  // INITIAL STATE
  // ============================================
  isAuthenticated: false,
  isLoading: true,
  user: null,
  isPasswordResetMode: false,
  authEventCount: 0,
  _authSubscription: null,
  _appStateCleanup: null,
  _initialized: false,
  
  // ============================================
  // INITIALIZE - Set up auth and listeners
  // ============================================
  initialize: async () => {
    // Prevent multiple registrations that can cause duplicate events and re-renders
    if (get()._initialized) {
      return;
    }
    // Step 1: Check initial auth status via sessionService
    try {
      const isAuth = await initializeAuthSession();
      set({ isAuthenticated: isAuth });
      
      if (isAuth) {
        // Get user from authService (not directly from supabase)
        const user = await getCurrentUser();
        set({ user });
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      set({ isAuthenticated: false, user: null });
    } finally {
      set({ isLoading: false });
    }
    
    // Step 2: Set up auth state listener via authService
    const subscription = setupAuthStateListener(async (event, session) => {
    const currentState = get();
      
      // Prevent infinite loops
      const newCount = currentState.authEventCount + 1;
      console.log(`Auth event: ${event} (count: ${newCount})`);
      
      if (newCount > 10) {
        console.warn('Too many auth events detected, ignoring to prevent infinite loop');
        return;
      }
      
      set({ authEventCount: newCount });
      
      // Don't react during password reset mode
      if (currentState.isPasswordResetMode) {
        console.log('Password reset mode active, ignoring auth event:', event);
        return;
      }
      
      // Update auth state
      const newAuthState = !!session;
      set({ 
        isAuthenticated: newAuthState,
        user: session?.user || null
      });
      
      // Handle specific events
      if (session && event === 'SIGNED_IN') {
        await initializeAuthSession();
      }
      
      if (event === 'SIGNED_OUT') {
        console.log('User signed out, clearing auth state');
        set({ 
          isAuthenticated: false,
          user: null
        });
      }
    });
    
    // Store subscription for cleanup
    set({ _authSubscription: subscription });
    
    // Step 3: Set up app state listener via sessionService
    const cleanup = setupAppStateListener();
    set({ _appStateCleanup: cleanup, _initialized: true });
  },
  
  // ============================================
  // SIGN OUT
  // ============================================
  signOut: async () => {
    try {
      // Call authService instead of supabase directly
      await authServiceSignOut();
      
      // Clear local state
      set({ 
        isAuthenticated: false,
        user: null
      });
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  },
  
  // ============================================
  // VALIDATE EMAIL
  // ============================================
  validateEmail: async (email: string): Promise<boolean> => {
    // Delegate to authService
    return authServiceValidateEmail(email);
  },
  
  // ============================================
  // PASSWORD RESET MODE
  // ============================================
  setPasswordResetMode: (enabled: boolean) => {
    console.log('Setting password reset mode:', enabled);
    
    set({ 
      isPasswordResetMode: enabled,
      ...(enabled && { authEventCount: 0 })
    });
  },
  
  // ============================================
  // CLEANUP
  // ============================================
  cleanup: () => {
    const state = get();
    
    // Unsubscribe from auth changes
    state._authSubscription?.unsubscribe();
    
    // Clean up app state listener
    state._appStateCleanup?.();
    
    // Reset internal flags
    set({ _authSubscription: null, _appStateCleanup: null, _initialized: false });
    console.log('🧹 Auth store cleaned up');
  },

  // ============================================
  // SIGN IN
  // ============================================
  signIn: async (email: string, password: string) => {
    const { error } = await signInWithPassword(email, password);
    if (error) {
      throw error;
    }
  },

  // ============================================
  // COMPLETE SIGNUP
  // ============================================
  completeSignup: async (userData: any, selectedCuisines: string[]) => {
    await completeSignupSvc(userData, selectedCuisines);
  },

  // ============================================
  // COMPLETE SIGNUP (SKIP)
  // ============================================
  completeSignupSkip: async (userData: any) => {
    await completeSignupSkipSvc(userData);
  },

  // ============================================
  // RESET PASSWORD WITH TOKENS
  // ============================================
  resetPasswordWithTokens: async (accessToken: string, refreshToken: string, newPassword: string) => {
    return resetPasswordWithTokensSvc(accessToken, refreshToken, newPassword);
  },
}));

/**
 * React hook to initialize auth when app mounts
 * Use this in your root App.tsx component
 * 
 * @example
 * function App() {
 *   useInitializeAuth();
 *   return <YourAppContent />;
 * }
 */
export const useInitializeAuth = () => {
  const initialize = useAuthStore(state => state.initialize);
  const cleanup = useAuthStore(state => state.cleanup);
  
  React.useEffect(() => {
    initialize();
    return cleanup;
  }, [initialize, cleanup]);
};