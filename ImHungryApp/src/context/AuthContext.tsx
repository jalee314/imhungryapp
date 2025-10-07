import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '../../lib/supabase';
import { initializeAuthSession, setupAppStateListener } from '../services/sessionService';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: any;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

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
      const newAuthState = !!session;
      setIsAuthenticated(newAuthState);
      setUser(session?.user || null);
      
      if (session && event === 'SIGNED_IN') {
        await initializeAuthSession();
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

  const value: AuthContextType = {
    isAuthenticated,
    isLoading,
    user,
    signOut,
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
