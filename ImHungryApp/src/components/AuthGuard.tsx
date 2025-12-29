import React, { ReactNode } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '#/features/auth';
import { tokens, atoms as a } from '#/ui';

interface AuthGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

const styles = StyleSheet.create({
  fallbackContainer: {
    ...a.flex_1,
    ...a.justify_center,
    ...a.align_center,
    ...a.bg_primary_100,
  },
});

export const AuthGuard: React.FC<AuthGuardProps> = ({ 
  children, 
  fallback = (
    <View style={styles.fallbackContainer}>
      <ActivityIndicator size="large" color={tokens.color.primary_500} />
    </View>
  )
}) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <>{fallback}</>;
  }

  if (!isAuthenticated) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

export default AuthGuard;
