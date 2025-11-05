import { useAuthStore } from '../store/useAuthStore';

export const useAuth = () => {
    const store = useAuthStore();

    const {
        isAuthenticated,
        isLoading,
        user,
        isPasswordResetMode,,
        signOut,
        validateEmail,
        setPasswordResetMode,
    } = useAuthStore(state => ({
        isAuthenticated: state.isAuthenticated,
        isLoading: state.isLoading,
        user: state.user,
        isPasswordResetMode: state.isPasswordResetMode,
        signOut: state.signOut,
        validateEmail: state.validateEmail,
        setPasswordResetMode: state.setPasswordResetMode,
    }));

    return {
    isAuthenticated,
    isLoading,
    user,
    isPasswordResetMode,
    signOut,
    validateEmail,
    setPasswordResetMode,
  };
};
