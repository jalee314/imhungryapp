import { useAdminStore } from '../stores/AdminStore';

/**
 * Convenience hook for AdminStore.
 * Subscribes to individual slices to avoid unnecessary re-renders.
 */
export function useAdmin() {
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
