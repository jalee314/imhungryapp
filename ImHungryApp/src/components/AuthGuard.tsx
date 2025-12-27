import React, { ReactNode } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '#/features/auth';
import { tokens } from '#/ui';

interface AuthGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ 
  children, 
  fallback = (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: tokens.color.primary_100 }}>
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
