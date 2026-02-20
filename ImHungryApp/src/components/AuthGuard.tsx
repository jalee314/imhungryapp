import React, { ReactNode } from 'react';
import { View, ActivityIndicator } from 'react-native';

import { useAuth } from '../hooks/useAuth';
import { BRAND } from '../ui/alf';

interface AuthGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

const authGuardFallbackStyle = {
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: BRAND.peach,
};

export const AuthGuard: React.FC<AuthGuardProps> = ({
  children,
  fallback = (
    <View style={authGuardFallbackStyle}>
      <ActivityIndicator size="large" color={BRAND.accent} />
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
