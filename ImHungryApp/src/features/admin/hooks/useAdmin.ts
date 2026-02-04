/**
 * useAdmin Hook - Admin Feature
 * 
 * Access admin state and actions.
 */

import { useAdminStore } from '../stores/AdminStore';

export function useAdmin<T>(selector: (state: any) => T, equality?: (a: T, b: T) => boolean): T;
export function useAdmin(): {
  isAdmin: boolean;
  isAdminLoading: boolean;
  isAdminMode: boolean;
  navigateToProfileSettings: boolean;
  checkAdminStatus: () => Promise<void>;
  enterAdminMode: () => void;
  exitAdminMode: () => void;
  exitAdminModeToSettings: () => void;
  clearNavigateToProfileSettings: () => void;
};

export function useAdmin<T>(selector?: (state: any) => T) {
  if (selector) {
    return useAdminStore(selector as any) as unknown as T;
  }
  
  const isAdmin = useAdminStore((s) => s.isAdmin);
  const isAdminLoading = useAdminStore((s) => s.isAdminLoading);
  const isAdminMode = useAdminStore((s) => s.isAdminMode);
  const navigateToProfileSettings = useAdminStore((s) => s.navigateToProfileSettings);
  const checkAdminStatus = useAdminStore((s) => s.checkAdminStatus);
  const enterAdminMode = useAdminStore((s) => s.enterAdminMode);
  const exitAdminMode = useAdminStore((s) => s.exitAdminMode);
  const exitAdminModeToSettings = useAdminStore((s) => s.exitAdminModeToSettings);
  const clearNavigateToProfileSettings = useAdminStore((s) => s.clearNavigateToProfileSettings);

  return {
    isAdmin,
    isAdminLoading,
    isAdminMode,
    navigateToProfileSettings,
    checkAdminStatus,
    enterAdminMode,
    exitAdminMode,
    exitAdminModeToSettings,
    clearNavigateToProfileSettings,
  };
}
