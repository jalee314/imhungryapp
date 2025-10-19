import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { adminService } from '../services/adminService';
import { supabase } from '../../lib/supabase';

interface AdminContextType {
  isAdmin: boolean;
  isAdminLoading: boolean;
  isAdminMode: boolean;
  checkAdminStatus: () => Promise<void>;
  enterAdminMode: () => void;
  exitAdminMode: () => void;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

interface AdminProviderProps {
  children: ReactNode;
}

export const AdminProvider: React.FC<AdminProviderProps> = ({ children }) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAdminLoading, setIsAdminLoading] = useState(true);
  const [isAdminMode, setIsAdminMode] = useState(false);

  const checkAdminStatus = async () => {
    setIsAdminLoading(true);
    try {
      const adminStatus = await adminService.isAdmin();
      setIsAdmin(adminStatus);
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
    } finally {
      setIsAdminLoading(false);
    }
  };

  const enterAdminMode = () => {
    console.log('Entering admin mode');
    setIsAdminMode(true);
  };

  const exitAdminMode = () => {
    console.log('Exiting admin mode');
    setIsAdminMode(false);
  };

  useEffect(() => {
    checkAdminStatus();

    // Listen for auth state changes to exit admin mode on sign out
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        exitAdminMode();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const value: AdminContextType = {
    isAdmin,
    isAdminLoading,
    isAdminMode,
    checkAdminStatus,
    enterAdminMode,
    exitAdminMode,
  };

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = (): AdminContextType => {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};

