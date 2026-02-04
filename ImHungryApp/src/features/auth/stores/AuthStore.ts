/**
 * Auth Store - Zustand State Management
 * 
 * Centralized authentication state for the entire app.
 * Located in features/auth for domain co-location.
 */

import { create } from 'zustand';
import {
  getCurrentUser,
  setupAuthStateListener,
  signOut as authServiceSignOut,
  validateEmail as authServiceValidateEmail,
  signInWithPassword,
  resetPasswordWithTokens as resetPasswordWithTokensSvc,
  type AuthSubscription,
} from '../../../services/authService';
import { completeSignup as completeSignupSvc, completeSignupSkip as completeSignupSkipSvc } from '../../../services/onboardingService';
import { initializeAuthSession, setupAppStateListener } from '../../../services/sessionService';
import type { User } from '@supabase/supabase-js';
import React from 'react';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  isPasswordResetMode: boolean;
  authEventCount: number;
  _authSubscription: AuthSubscription | null;
  _appStateCleanup: (() => void) | null;
  _initialized: boolean;
  initialize: () => Promise<void>;
  signOut: () => Promise<void>;
  validateEmail: (email: string) => Promise<boolean>;
  setPasswordResetMode: (enabled: boolean) => void;
  cleanup: () => void;
  signIn: (email: string, password: string) => Promise<void>;
  completeSignup: (userData: any, selectedCuisines: string[]) => Promise<void>;
  completeSignupSkip: (userData: any) => Promise<void>;
  resetPasswordWithTokens: (accessToken: string, refreshToken: string, newPassword: string) => Promise<{ error: any } | { error: null }>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  isAuthenticated: false,
  isLoading: true,
  user: null,
  isPasswordResetMode: false,
  authEventCount: 0,
  _authSubscription: null,
  _appStateCleanup: null,
  _initialized: false,
  
  initialize: async () => {
    if (get()._initialized) {
      return;
    }
    try {
      const isAuth = await initializeAuthSession();
      set({ isAuthenticated: isAuth });
      
      if (isAuth) {
        const user = await getCurrentUser();
        set({ user });
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      set({ isAuthenticated: false, user: null });
    } finally {
      set({ isLoading: false });
    }
    
    const subscription = setupAuthStateListener(async (event, session) => {
      const currentState = get();
      
      const newCount = currentState.authEventCount + 1;
      console.log(`Auth event: ${event} (count: ${newCount})`);
      
      if (newCount > 10) {
        console.warn('Too many auth events detected, ignoring to prevent infinite loop');
        return;
      }
      
      set({ authEventCount: newCount });
      
      if (currentState.isPasswordResetMode) {
        console.log('Password reset mode active, ignoring auth event:', event);
        return;
      }
      
      const newAuthState = !!session;
      set({ 
        isAuthenticated: newAuthState,
        user: session?.user || null
      });
      
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
    
    set({ _authSubscription: subscription });
    const cleanup = setupAppStateListener();
    set({ _appStateCleanup: cleanup, _initialized: true });
  },
  
  signOut: async () => {
    try {
      await authServiceSignOut();
      set({ 
        isAuthenticated: false,
        user: null
      });
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  },
  
  validateEmail: async (email: string): Promise<boolean> => {
    return authServiceValidateEmail(email);
  },
  
  setPasswordResetMode: (enabled: boolean) => {
    console.log('Setting password reset mode:', enabled);
    set({ 
      isPasswordResetMode: enabled,
      ...(enabled && { authEventCount: 0 })
    });
  },
  
  cleanup: () => {
    const state = get();
    state._authSubscription?.unsubscribe();
    state._appStateCleanup?.();
    set({ _authSubscription: null, _appStateCleanup: null, _initialized: false });
    console.log('🧹 Auth store cleaned up');
  },
  
  signIn: async (email: string, password: string) => {
    const { error } = await signInWithPassword(email, password);
    if (error) {
      throw error;
    }
  },
  
  completeSignup: async (userData: any, selectedCuisines: string[]) => {
    await completeSignupSvc(userData, selectedCuisines);
  },
  
  completeSignupSkip: async (userData: any) => {
    await completeSignupSkipSvc(userData);
  },
  
  resetPasswordWithTokens: async (accessToken: string, refreshToken: string, newPassword: string) => {
    return resetPasswordWithTokensSvc(accessToken, refreshToken, newPassword);
  },
}));

/**
 * Hook to initialize auth at app startup
 */
export const useInitializeAuth = () => {
  const initialize = useAuthStore(state => state.initialize);
  const cleanup = useAuthStore(state => state.cleanup);
  
  React.useEffect(() => {
    initialize();
    return cleanup;
  }, [initialize, cleanup]);
};
