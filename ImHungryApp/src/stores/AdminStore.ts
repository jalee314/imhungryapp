import { create } from 'zustand';
import React from 'react';
import { supabase } from '../../lib/supabase';
import { adminService } from '../services/adminService';

type AuthUnsubscribe = { unsubscribe: () => void } | null;

interface AdminState {
  // Reactive state
  isAdmin: boolean;
  isAdminLoading: boolean;
  isAdminMode: boolean;
  navigateToProfileSettings: boolean;

  // Internals
  _initialized: boolean;
  _authSubscription: AuthUnsubscribe;

  // Actions
  initialize: () => Promise<void>;
  cleanup: () => void;
  checkAdminStatus: () => Promise<void>;
  enterAdminMode: () => void;
  exitAdminMode: () => void;
  exitAdminModeToSettings: () => void;
  clearNavigateToProfileSettings: () => void;
}

export const useAdminStore = create<AdminState>((set, get) => ({
  // Initial state
  isAdmin: false,
  isAdminLoading: true,
  isAdminMode: false,
  navigateToProfileSettings: false,
  _initialized: false,
  _authSubscription: null,

  // Initialize: check status and set up auth listener
  initialize: async () => {
    if (get()._initialized) return;

    try {
      await get().checkAdminStatus();
    } catch (e) {
      console.error('Admin initialize error:', e);
    }

    // Listen for auth state changes to update admin flags
    const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        // On sign out, ensure admin mode is off and admin flag false
        set({ isAdminMode: false, isAdmin: false });
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        // On sign in or token refresh, re-check admin status
        await get().checkAdminStatus();
      }
    });

    set({ _authSubscription: data?.subscription ?? null, _initialized: true });
  },

  // Cleanup
  cleanup: () => {
    const sub = get()._authSubscription;
    sub?.unsubscribe?.();
    set({ _authSubscription: null, _initialized: false });
  },

  // Check if current user is admin
  checkAdminStatus: async () => {
    set({ isAdminLoading: true });
    try {
      const isAdmin = await adminService.isAdmin();
      set({ isAdmin });
    } catch (error) {
      console.error('Error checking admin status:', error);
      set({ isAdmin: false });
    } finally {
      set({ isAdminLoading: false });
    }
  },

  // Toggle admin mode manually from UI
  enterAdminMode: () => set({ isAdminMode: true }),
  exitAdminMode: () => set({ isAdminMode: false }),
  exitAdminModeToSettings: () => set({ isAdminMode: false, navigateToProfileSettings: true }),
  clearNavigateToProfileSettings: () => set({ navigateToProfileSettings: false }),
}));

// React hook to initialize admin store lifecycle once at app start
export const useInitializeAdmin = () => {
  const initialize = useAdminStore((s) => s.initialize);
  const cleanup = useAdminStore((s) => s.cleanup);

  React.useEffect(() => {
    initialize();
    return cleanup;
  }, [initialize, cleanup]);
};
