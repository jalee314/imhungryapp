/**
 * AuthStore Characterization Tests
 *
 * These tests document the current behavior of the AuthStore before refactoring.
 * They serve as a safety net to ensure refactors don't change observable behavior.
 */

import { useAuthStore } from '../AuthStore';

import { act } from '@testing-library/react-native';

// Mock services that AuthStore depends on
jest.mock('../../services/authService', () => ({
  getCurrentUser: jest.fn(),
  setupAuthStateListener: jest.fn(() => ({ unsubscribe: jest.fn() })),
  signOut: jest.fn(),
  validateEmail: jest.fn(),
  signInWithPassword: jest.fn(),
  resetPasswordWithTokens: jest.fn(),
}));

jest.mock('../../services/onboardingService', () => ({
  completeSignup: jest.fn(),
  completeSignupSkip: jest.fn(),
}));

jest.mock('../../services/sessionService', () => ({
  initializeAuthSession: jest.fn(),
  setupAppStateListener: jest.fn(() => jest.fn()),
}));

// Import mocks after mocking
import {
  getCurrentUser,
  setupAuthStateListener,
  signOut as authServiceSignOut,
  validateEmail,
  signInWithPassword,
  resetPasswordWithTokens,
} from '../../services/authService';
import { completeSignup, completeSignupSkip } from '../../services/onboardingService';
import { initializeAuthSession, setupAppStateListener } from '../../services/sessionService';

describe('AuthStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useAuthStore.setState({
      isAuthenticated: false,
      isLoading: true,
      user: null,
      isPasswordResetMode: false,
      authEventCount: 0,
      _authSubscription: null,
      _appStateCleanup: null,
      _initialized: false,
    });

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const state = useAuthStore.getState();

      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(true);
      expect(state.user).toBe(null);
      expect(state.isPasswordResetMode).toBe(false);
      expect(state.authEventCount).toBe(0);
      expect(state._initialized).toBe(false);
    });
  });

  describe('initialize()', () => {
    it('should set isLoading to false after initialization', async () => {
      (initializeAuthSession as jest.Mock).mockResolvedValue(false);

      await act(async () => {
        await useAuthStore.getState().initialize();
      });

      expect(useAuthStore.getState().isLoading).toBe(false);
    });

    it('should set isAuthenticated based on session check', async () => {
      (initializeAuthSession as jest.Mock).mockResolvedValue(true);
      (getCurrentUser as jest.Mock).mockResolvedValue({ id: 'user-123' });

      await act(async () => {
        await useAuthStore.getState().initialize();
      });

      expect(useAuthStore.getState().isAuthenticated).toBe(true);
    });

    it('should fetch user when authenticated', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      (initializeAuthSession as jest.Mock).mockResolvedValue(true);
      (getCurrentUser as jest.Mock).mockResolvedValue(mockUser);

      await act(async () => {
        await useAuthStore.getState().initialize();
      });

      expect(getCurrentUser).toHaveBeenCalled();
      expect(useAuthStore.getState().user).toEqual(mockUser);
    });

    it('should not fetch user when not authenticated', async () => {
      (initializeAuthSession as jest.Mock).mockResolvedValue(false);

      await act(async () => {
        await useAuthStore.getState().initialize();
      });

      expect(getCurrentUser).not.toHaveBeenCalled();
      expect(useAuthStore.getState().user).toBe(null);
    });

    it('should set up auth state listener', async () => {
      (initializeAuthSession as jest.Mock).mockResolvedValue(false);

      await act(async () => {
        await useAuthStore.getState().initialize();
      });

      expect(setupAuthStateListener).toHaveBeenCalled();
    });

    it('should set up app state listener', async () => {
      (initializeAuthSession as jest.Mock).mockResolvedValue(false);

      await act(async () => {
        await useAuthStore.getState().initialize();
      });

      expect(setupAppStateListener).toHaveBeenCalled();
    });

    it('should only initialize once (idempotent)', async () => {
      (initializeAuthSession as jest.Mock).mockResolvedValue(false);

      await act(async () => {
        await useAuthStore.getState().initialize();
        await useAuthStore.getState().initialize();
        await useAuthStore.getState().initialize();
      });

      // Should only call once despite multiple initialize() calls
      expect(initializeAuthSession).toHaveBeenCalledTimes(1);
    });

    it('should mark _initialized as true after initialization', async () => {
      (initializeAuthSession as jest.Mock).mockResolvedValue(false);

      await act(async () => {
        await useAuthStore.getState().initialize();
      });

      expect(useAuthStore.getState()._initialized).toBe(true);
    });

    it('should handle initialization errors gracefully', async () => {
      (initializeAuthSession as jest.Mock).mockRejectedValue(new Error('Network error'));

      await act(async () => {
        await useAuthStore.getState().initialize();
      });

      expect(useAuthStore.getState().isAuthenticated).toBe(false);
      expect(useAuthStore.getState().user).toBe(null);
      expect(useAuthStore.getState().isLoading).toBe(false);
    });
  });

  describe('signOut()', () => {
    it('should call auth service signOut', async () => {
      (authServiceSignOut as jest.Mock).mockResolvedValue(undefined);

      await act(async () => {
        await useAuthStore.getState().signOut();
      });

      expect(authServiceSignOut).toHaveBeenCalled();
    });

    it('should clear auth state after sign out', async () => {
      // Set authenticated state
      useAuthStore.setState({
        isAuthenticated: true,
        user: { id: 'user-123' } as any,
      });

      (authServiceSignOut as jest.Mock).mockResolvedValue(undefined);

      await act(async () => {
        await useAuthStore.getState().signOut();
      });

      expect(useAuthStore.getState().isAuthenticated).toBe(false);
      expect(useAuthStore.getState().user).toBe(null);
    });

    it('should throw error if sign out fails', async () => {
      const error = new Error('Sign out failed');
      (authServiceSignOut as jest.Mock).mockRejectedValue(error);

      await expect(useAuthStore.getState().signOut()).rejects.toThrow('Sign out failed');
    });
  });

  describe('signIn()', () => {
    it('should call signInWithPassword service', async () => {
      (signInWithPassword as jest.Mock).mockResolvedValue({ error: null });

      await act(async () => {
        await useAuthStore.getState().signIn('test@example.com', 'password123');
      });

      expect(signInWithPassword).toHaveBeenCalledWith('test@example.com', 'password123');
    });

    it('should throw error if sign in has error', async () => {
      const authError = { message: 'Invalid credentials' };
      (signInWithPassword as jest.Mock).mockResolvedValue({ error: authError });

      await expect(
        useAuthStore.getState().signIn('test@example.com', 'wrong-password')
      ).rejects.toEqual(authError);
    });
  });

  describe('setPasswordResetMode()', () => {
    it('should set password reset mode to true', () => {
      useAuthStore.getState().setPasswordResetMode(true);

      expect(useAuthStore.getState().isPasswordResetMode).toBe(true);
    });

    it('should set password reset mode to false', () => {
      useAuthStore.setState({ isPasswordResetMode: true });

      useAuthStore.getState().setPasswordResetMode(false);

      expect(useAuthStore.getState().isPasswordResetMode).toBe(false);
    });

    it('should reset authEventCount when enabling reset mode', () => {
      useAuthStore.setState({ authEventCount: 5 });

      useAuthStore.getState().setPasswordResetMode(true);

      expect(useAuthStore.getState().authEventCount).toBe(0);
    });

    it('should not reset authEventCount when disabling reset mode', () => {
      useAuthStore.setState({ authEventCount: 5, isPasswordResetMode: true });

      useAuthStore.getState().setPasswordResetMode(false);

      expect(useAuthStore.getState().authEventCount).toBe(5);
    });
  });

  describe('validateEmail()', () => {
    it('should call auth service validateEmail', async () => {
      (validateEmail as jest.Mock).mockResolvedValue(true);

      const result = await useAuthStore.getState().validateEmail('test@example.com');

      expect(validateEmail).toHaveBeenCalledWith('test@example.com');
      expect(result).toBe(true);
    });
  });

  describe('cleanup()', () => {
    it('should unsubscribe auth listener', async () => {
      const mockUnsubscribe = jest.fn();
      useAuthStore.setState({
        _authSubscription: { unsubscribe: mockUnsubscribe } as any,
        _initialized: true,
      });

      useAuthStore.getState().cleanup();

      expect(mockUnsubscribe).toHaveBeenCalled();
    });

    it('should call app state cleanup', () => {
      const mockCleanup = jest.fn();
      useAuthStore.setState({
        _appStateCleanup: mockCleanup,
        _initialized: true,
      });

      useAuthStore.getState().cleanup();

      expect(mockCleanup).toHaveBeenCalled();
    });

    it('should reset _initialized to false', () => {
      useAuthStore.setState({ _initialized: true });

      useAuthStore.getState().cleanup();

      expect(useAuthStore.getState()._initialized).toBe(false);
    });
  });

  describe('completeSignup()', () => {
    it('should call onboarding service completeSignup', async () => {
      const userData = { email: 'test@example.com' };
      const cuisines = ['Italian', 'Mexican'];

      await useAuthStore.getState().completeSignup(userData, cuisines);

      expect(completeSignup).toHaveBeenCalledWith(userData, cuisines);
    });
  });

  describe('completeSignupSkip()', () => {
    it('should call onboarding service completeSignupSkip', async () => {
      const userData = { email: 'test@example.com' };

      await useAuthStore.getState().completeSignupSkip(userData);

      expect(completeSignupSkip).toHaveBeenCalledWith(userData);
    });
  });

  describe('resetPasswordWithTokens()', () => {
    it('should call auth service resetPasswordWithTokens', async () => {
      (resetPasswordWithTokens as jest.Mock).mockResolvedValue({ error: null });

      const result = await useAuthStore.getState().resetPasswordWithTokens(
        'access-token',
        'refresh-token',
        'newPassword123'
      );

      expect(resetPasswordWithTokens).toHaveBeenCalledWith(
        'access-token',
        'refresh-token',
        'newPassword123'
      );
      expect(result).toEqual({ error: null });
    });
  });
});
