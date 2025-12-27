/**
 * Auth Feature Module
 *
 * Handles authentication flow including:
 * - User registration (sign up)
 * - User login (sign in)
 * - Password reset
 * - Onboarding steps (username, photo, location, cuisines)
 * - Auth state management
 *
 * @module features/auth
 */

// Screens
export { default as LandingScreen } from './screens/LandingScreen';
export { default as SignUp } from './screens/SignUp';
export { default as LogIn } from './screens/LogIn';
export { default as ForgotPassword } from './screens/ForgotPassword';
export { default as ResetPassword } from './screens/ResetPassword';
export { default as UsernameScreen } from './screens/UsernameScreen';
export { default as ProfilePhoto } from './screens/ProfilePhoto';
export { default as LocationPermissions } from './screens/LocationPermissions';
export { default as InstantNotifications } from './screens/InstantNotifications';
export { default as CuisinePreferences } from './screens/CuisinePreferences';

// Components
export { default as AuthGuard } from './components/AuthGuard';

// Hooks
export { useAuth } from './hooks/useAuth';

// Store (for direct access when needed)
export { useAuthStore, useInitializeAuth } from './stores/AuthStore';
