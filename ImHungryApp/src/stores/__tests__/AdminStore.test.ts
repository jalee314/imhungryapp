/**
 * AdminStore Characterization Tests
 *
 * These tests document the current behavior of the AdminStore.
 * The store manages admin status and admin mode state.
 */

import { act } from '@testing-library/react-native';

import { adminService } from '../../services/adminService';
import { mockSupabase } from '../../test-utils/mocks/supabaseMock';
import { useAdminStore } from '../AdminStore';

// Mock admin service
jest.mock('../../services/adminService', () => ({
  adminService: {
    isAdmin: jest.fn(),
  },
}));

// Get the supabase mock from the global mock (already set up in jest.setup.ts)
const supabase = mockSupabase;

describe('AdminStore', () => {
  const mockUnsubscribe = jest.fn();

  beforeEach(() => {
    // Reset store state before each test
    useAdminStore.setState({
      isAdmin: false,
      isAdminLoading: true,
      isAdminMode: false,
      navigateToProfileSettings: false,
      _initialized: false,
      _authSubscription: null,
    });

    // Reset all mocks
    jest.clearAllMocks();

    // Re-setup the onAuthStateChange mock after clearing
    (supabase.auth.onAuthStateChange as jest.Mock).mockImplementation((_callback) => ({
      data: {
        subscription: {
          unsubscribe: mockUnsubscribe,
        },
      },
    }));
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const state = useAdminStore.getState();

      expect(state.isAdmin).toBe(false);
      expect(state.isAdminLoading).toBe(true);
      expect(state.isAdminMode).toBe(false);
      expect(state.navigateToProfileSettings).toBe(false);
      expect(state._initialized).toBe(false);
    });
  });

  describe('initialize()', () => {
    it('should check admin status', async () => {
      (adminService.isAdmin as jest.Mock).mockResolvedValue(false);

      await act(async () => {
        await useAdminStore.getState().initialize();
      });

      expect(adminService.isAdmin).toHaveBeenCalled();
    });

    it('should set isAdmin to true when user is admin', async () => {
      (adminService.isAdmin as jest.Mock).mockResolvedValue(true);

      await act(async () => {
        await useAdminStore.getState().initialize();
      });

      expect(useAdminStore.getState().isAdmin).toBe(true);
    });

    it('should set isAdmin to false when user is not admin', async () => {
      (adminService.isAdmin as jest.Mock).mockResolvedValue(false);

      await act(async () => {
        await useAdminStore.getState().initialize();
      });

      expect(useAdminStore.getState().isAdmin).toBe(false);
    });

    it('should set up auth state listener', async () => {
      (adminService.isAdmin as jest.Mock).mockResolvedValue(false);

      await act(async () => {
        await useAdminStore.getState().initialize();
      });

      expect(supabase.auth.onAuthStateChange).toHaveBeenCalled();
    });

    it('should set _initialized to true', async () => {
      (adminService.isAdmin as jest.Mock).mockResolvedValue(false);

      await act(async () => {
        await useAdminStore.getState().initialize();
      });

      expect(useAdminStore.getState()._initialized).toBe(true);
    });

    it('should only initialize once (idempotent)', async () => {
      (adminService.isAdmin as jest.Mock).mockResolvedValue(false);

      await act(async () => {
        await useAdminStore.getState().initialize();
        await useAdminStore.getState().initialize();
        await useAdminStore.getState().initialize();
      });

      expect(adminService.isAdmin).toHaveBeenCalledTimes(1);
    });

    it('should set isAdminLoading to false after checking', async () => {
      (adminService.isAdmin as jest.Mock).mockResolvedValue(false);

      await act(async () => {
        await useAdminStore.getState().initialize();
      });

      expect(useAdminStore.getState().isAdminLoading).toBe(false);
    });

    it('should handle admin check errors gracefully', async () => {
      (adminService.isAdmin as jest.Mock).mockRejectedValue(new Error('Network error'));

      await act(async () => {
        await useAdminStore.getState().initialize();
      });

      // Should still complete initialization
      expect(useAdminStore.getState()._initialized).toBe(true);
    });
  });

  describe('cleanup()', () => {
    it('should unsubscribe from auth changes', async () => {
      const mockUnsubscribe = jest.fn();
      (supabase.auth.onAuthStateChange as jest.Mock).mockReturnValue({
        data: { subscription: { unsubscribe: mockUnsubscribe } },
      });

      (adminService.isAdmin as jest.Mock).mockResolvedValue(false);

      await act(async () => {
        await useAdminStore.getState().initialize();
      });

      useAdminStore.getState().cleanup();

      expect(mockUnsubscribe).toHaveBeenCalled();
    });

    it('should reset _initialized to false', () => {
      useAdminStore.setState({ _initialized: true });

      useAdminStore.getState().cleanup();

      expect(useAdminStore.getState()._initialized).toBe(false);
    });
  });

  describe('checkAdminStatus()', () => {
    it('should set isAdminLoading to true while checking', async () => {
      useAdminStore.setState({ isAdminLoading: false });
      (adminService.isAdmin as jest.Mock).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(false), 100))
      );

      const checkPromise = useAdminStore.getState().checkAdminStatus();

      expect(useAdminStore.getState().isAdminLoading).toBe(true);

      await checkPromise;
    });

    it('should update isAdmin based on service response', async () => {
      (adminService.isAdmin as jest.Mock).mockResolvedValue(true);

      await act(async () => {
        await useAdminStore.getState().checkAdminStatus();
      });

      expect(useAdminStore.getState().isAdmin).toBe(true);
    });

    it('should set isAdminLoading to false after checking', async () => {
      (adminService.isAdmin as jest.Mock).mockResolvedValue(false);

      await act(async () => {
        await useAdminStore.getState().checkAdminStatus();
      });

      expect(useAdminStore.getState().isAdminLoading).toBe(false);
    });

    it('should set isAdmin to false on error', async () => {
      useAdminStore.setState({ isAdmin: true });
      (adminService.isAdmin as jest.Mock).mockRejectedValue(new Error('Error'));

      await act(async () => {
        await useAdminStore.getState().checkAdminStatus();
      });

      expect(useAdminStore.getState().isAdmin).toBe(false);
    });
  });

  describe('enterAdminMode()', () => {
    it('should set isAdminMode to true', () => {
      useAdminStore.getState().enterAdminMode();

      expect(useAdminStore.getState().isAdminMode).toBe(true);
    });
  });

  describe('exitAdminMode()', () => {
    it('should set isAdminMode to false', () => {
      useAdminStore.setState({ isAdminMode: true });

      useAdminStore.getState().exitAdminMode();

      expect(useAdminStore.getState().isAdminMode).toBe(false);
    });
  });

  describe('exitAdminModeToSettings()', () => {
    it('should set isAdminMode to false', () => {
      useAdminStore.setState({ isAdminMode: true });

      useAdminStore.getState().exitAdminModeToSettings();

      expect(useAdminStore.getState().isAdminMode).toBe(false);
    });

    it('should set navigateToProfileSettings to true', () => {
      useAdminStore.getState().exitAdminModeToSettings();

      expect(useAdminStore.getState().navigateToProfileSettings).toBe(true);
    });
  });

  describe('clearNavigateToProfileSettings()', () => {
    it('should set navigateToProfileSettings to false', () => {
      useAdminStore.setState({ navigateToProfileSettings: true });

      useAdminStore.getState().clearNavigateToProfileSettings();

      expect(useAdminStore.getState().navigateToProfileSettings).toBe(false);
    });
  });

  describe('Auth State Change Handling', () => {
    it('should register callback for auth state changes', async () => {
      (adminService.isAdmin as jest.Mock).mockResolvedValue(false);

      await act(async () => {
        await useAdminStore.getState().initialize();
      });

      const callback = (supabase.auth.onAuthStateChange as jest.Mock).mock.calls[0][0];
      expect(typeof callback).toBe('function');
    });
  });
});
