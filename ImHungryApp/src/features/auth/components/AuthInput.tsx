/**
 * AuthInput - Styled input component for authentication screens
 */

import React from 'react';
import { TextInput } from 'react-native-paper';
import { colors, typography } from '../../../lib/theme';

interface AuthInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'number-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  error?: boolean;
  disabled?: boolean;
  right?: React.ReactNode;
  style?: any;
}

export const AuthInput: React.FC<AuthInputProps> = ({
  label,
  value,
  onChangeText,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
  error = false,
  disabled = false,
  right,
  style,
}) => {
  return (
    <TextInput
      label={label}
      value={value}
      onChangeText={onChangeText}
      mode="outlined"
      secureTextEntry={secureTextEntry}
      keyboardType={keyboardType}
      autoCapitalize={autoCapitalize}
      error={error}
      disabled={disabled}
      right={right}
      style={[
        {
          backgroundColor: colors.background,
          fontFamily: typography.fontFamily.regular,
          fontSize: typography.fontSize.md,
        },
        style,
      ]}
      outlineStyle={{
        borderRadius: 10,
      }}
      activeOutlineColor={colors.primary}
      outlineColor="#D5D5D5"
    />
  );
};
