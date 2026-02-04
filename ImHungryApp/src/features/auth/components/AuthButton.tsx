/**
 * AuthButton - Primary button for authentication screens
 */

import React from 'react';
import { ActivityIndicator } from 'react-native';
import { Text, Pressable } from '../../../components/atoms';
import { colors, spacing, borderRadius } from '../../../lib/theme';

interface AuthButtonProps {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
}

export const AuthButton: React.FC<AuthButtonProps> = ({
  label,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
}) => {
  const isPrimary = variant === 'primary';
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
      height={52}
      rounded="md"
      justifyCenter
      alignCenter
      px="xl"
      bg={isPrimary ? 'primary' : 'background'}
      style={[
        !isPrimary && {
          borderWidth: 1,
          borderColor: colors.primary,
        },
        isDisabled && { opacity: 0.6 },
      ]}
    >
      {loading ? (
        <ActivityIndicator 
          size="small" 
          color={isPrimary ? colors.background : colors.primary} 
        />
      ) : (
        <Text
          variant="body"
          weight="semiBold"
          color={isPrimary ? 'background' : 'primary'}
          textAlign="center"
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
};
