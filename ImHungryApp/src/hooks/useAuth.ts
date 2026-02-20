import { useAuthStore } from '../stores/AuthStore';

/**
 * Convenience hook for AuthStore.
 * Subscribes to individual slices to avoid unnecessary re-renders.
 */
export function useAuth() {
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
    const isLoading = useAuthStore((s) => s.isLoading);
    const user = useAuthStore((s) => s.user);
    const isPasswordResetMode = useAuthStore((s) => s.isPasswordResetMode);
    const signOut = useAuthStore((s) => s.signOut);
    const signIn = useAuthStore((s) => s.signIn);
    const completeSignup = useAuthStore((s) => s.completeSignup);
    const completeSignupSkip = useAuthStore((s) => s.completeSignupSkip);
    const resetPasswordWithTokens = useAuthStore((s) => s.resetPasswordWithTokens);
    const validateEmail = useAuthStore((s) => s.validateEmail);
    const setPasswordResetMode = useAuthStore((s) => s.setPasswordResetMode);

    return {
        isAuthenticated,
        isLoading,
        user,
        isPasswordResetMode,
        signOut,
        signIn,
        completeSignup,
        completeSignupSkip,
        resetPasswordWithTokens,
        validateEmail,
        setPasswordResetMode,
    };
}
