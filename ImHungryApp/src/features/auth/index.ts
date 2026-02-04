/**
 * Auth Feature - Public API
 * 
 * This is the main entry point for the auth feature.
 * Import from here instead of reaching into internal modules.
 * 
 * @example
 * import { useAuth, useInitializeAuth } from '@/features/auth';
 */

// Hooks
export { useAuth } from './hooks/useAuth';

// Store
export { useAuthStore, useInitializeAuth } from './stores/AuthStore';

// Components
export {
  AuthInput,
  AuthButton,
  AuthErrorMessage,
  LegalLinks,
} from './components';

// Types
export type {
  AuthUser,
  AuthContextType,
  AuthProviderProps,
  PasswordResetResult,
  SignUpData,
  OnboardingUserData,
} from './types';
