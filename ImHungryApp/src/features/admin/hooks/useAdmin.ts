import { useAdminStore } from '../stores/AdminStore';

// Overloads: allow custom selector or default bundle
export function useAdmin<T>(selector: (state: any) => T, equality?: (a: T, b: T) => boolean): T;

export function useAdmin(): {
  isAdmin: boolean;
  isAdminLoading: boolean;
  isAdminMode: boolean;
  checkAdminStatus: () => Promise<void>;
  enterAdminMode: () => void;
  exitAdminMode: () => void;
};
export function useAdmin<T>(selector?: (state: any) => T) {
  if (selector) {
    return useAdminStore(selector as any) as unknown as T;
  }
  // Default: subscribe to individual slices to avoid unstable snapshots
  const isAdmin = useAdminStore((s) => s.isAdmin);
  const isAdminLoading = useAdminStore((s) => s.isAdminLoading);
  const isAdminMode = useAdminStore((s) => s.isAdminMode);
  const checkAdminStatus = useAdminStore((s) => s.checkAdminStatus);
  const enterAdminMode = useAdminStore((s) => s.enterAdminMode);
  const exitAdminMode = useAdminStore((s) => s.exitAdminMode);

  return {
    isAdmin,
    isAdminLoading,
    isAdminMode,
    checkAdminStatus,
    enterAdminMode,
    exitAdminMode,
  };
}
