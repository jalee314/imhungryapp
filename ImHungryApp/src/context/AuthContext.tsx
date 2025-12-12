/*

import React, { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { supabase } from '../../lib/supabase';
import { initializeAuthSession, setupAppStateListener } from '../services/sessionService';
import { checkEmailExists } from '../services/userService';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: any;
  signOut: () => Promise<void>;
  validateEmail: (email: string) => Promise<boolean>;
  setPasswordResetMode: (enabled: boolean) => void;
  isPasswordResetMode: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [isPasswordResetMode, setIsPasswordResetMode] = useState(false);
  const isPasswordResetModeRef = useRef(false);
  const [authEventCount, setAuthEventCount] = useState(0);

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const isAuth = await initializeAuthSession();
        setIsAuthenticated(isAuth);
        
        if (isAuth) {
          const { data: { user } } = await supabase.auth.getUser();
          setUser(user);
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Prevent infinite loops by tracking auth events
      setAuthEventCount(prev => {
        const newCount = prev + 1;
        console.log(`Auth event: ${event} (count: ${newCount})`);
        
        // If we're getting too many events, ignore them
        if (newCount > 10) {
          console.warn('Too many auth events detected, ignoring to prevent infinite loop');
          return prev; // Don't increment further
        }
        return newCount;
      });
      
      // Don't react to auth changes during password reset mode
      // Use ref to avoid stale closure
      if (isPasswordResetModeRef.current) {
        console.log('Password reset mode active, ignoring auth event:', event);
        return;
      }
      
      const newAuthState = !!session;
      setIsAuthenticated(newAuthState);
      setUser(session?.user || null);
      
      if (session && event === 'SIGNED_IN') {
        await initializeAuthSession();
      }
      
      if (event === 'SIGNED_OUT') {
        console.log('User signed out, clearing auth state');
        setIsAuthenticated(false);
        setUser(null);
      }
    });

    // Setup app state listener
    const cleanup = setupAppStateListener();

    return () => {
      subscription.unsubscribe();
      cleanup();
    };
  }, []);

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setIsAuthenticated(false);
      setUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const validateEmail = async (email: string): Promise<boolean> => {
    try {
      return await checkEmailExists(email);
    } catch (error) {
      console.error('Error validating email:', error);
      return false;
    }
  };

  const setPasswordResetMode = (enabled: boolean) => {
    console.log('Setting password reset mode:', enabled);
    setIsPasswordResetMode(enabled);
    isPasswordResetModeRef.current = enabled;
    
    // Reset auth event count when entering password reset mode
    if (enabled) {
      setAuthEventCount(0);
    }
  };

  const value: AuthContextType = {
    isAuthenticated,
    isLoading,
    user,
    signOut,
    validateEmail,
    setPasswordResetMode,
    isPasswordResetMode,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
*/