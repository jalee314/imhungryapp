import React, { ReactNode } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext';

interface AuthGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ 
  children, 
  fallback = (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFE5B4' }}>
      <ActivityIndicator size="large" color="#FFA05C" />
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
