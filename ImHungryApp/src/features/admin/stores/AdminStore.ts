/**
 * Admin Store - Admin Feature
 * 
 * Manages admin authentication and mode state.
 */

import { create } from 'zustand';
import React from 'react';
import { supabase } from '../../../../lib/supabase';
import { adminService } from '../../../services/adminService';

type AuthUnsubscribe = { unsubscribe: () => void } | null;

interface AdminState {
  isAdmin: boolean;
  isAdminLoading: boolean;
  isAdminMode: boolean;
  navigateToProfileSettings: boolean;
  _initialized: boolean;
  _authSubscription: AuthUnsubscribe;
  initialize: () => Promise<void>;
  cleanup: () => void;
  checkAdminStatus: () => Promise<void>;
  enterAdminMode: () => void;
  exitAdminMode: () => void;
  exitAdminModeToSettings: () => void;
  clearNavigateToProfileSettings: () => void;
}

export const useAdminStore = create<AdminState>((set, get) => ({
  isAdmin: false,
  isAdminLoading: true,
  isAdminMode: false,
  navigateToProfileSettings: false,
  _initialized: false,
  _authSubscription: null,

  initialize: async () => {
    if (get()._initialized) return;

    try {
      await get().checkAdminStatus();
    } catch (e) {
      console.error('Admin initialize error:', e);
    }

    const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        set({ isAdminMode: false, isAdmin: false });
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        await get().checkAdminStatus();
      }
    });

    set({ _authSubscription: data?.subscription ?? null, _initialized: true });
  },

  cleanup: () => {
    const sub = get()._authSubscription;
    sub?.unsubscribe?.();
    set({ _authSubscription: null, _initialized: false });
  },

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

  enterAdminMode: () => set({ isAdminMode: true }),
  exitAdminMode: () => set({ isAdminMode: false }),
  exitAdminModeToSettings: () => set({ isAdminMode: false, navigateToProfileSettings: true }),
  clearNavigateToProfileSettings: () => set({ navigateToProfileSettings: false }),
}));

export const useInitializeAdmin = () => {
  const initialize = useAdminStore((s) => s.initialize);
  const cleanup = useAdminStore((s) => s.cleanup);

  React.useEffect(() => {
    initialize();
    return cleanup;
  }, [initialize, cleanup]);
};
