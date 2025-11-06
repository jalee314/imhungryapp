import { useAuthStore } from '../stores/AuthStore';

// Overloads for better DX: either pass a selector or get the default shape
export function useAuth<T>(selector: (state: any) => T, equality?: (a: T, b: T) => boolean): T;
export function useAuth(): {
    isAuthenticated: boolean;
    isLoading: boolean;
    user: any;
    isPasswordResetMode: boolean;
    signOut: () => Promise<void>;
    validateEmail: (email: string) => Promise<boolean>;
    setPasswordResetMode: (enabled: boolean) => void;
};
export function useAuth<T>(selector?: (state: any) => T) {
    if (selector) {
        // Pass selector straight to the store
        return useAuthStore(selector as any) as unknown as T;
    }
    // Default selection via individual subscriptions to avoid unnecessary renders
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
