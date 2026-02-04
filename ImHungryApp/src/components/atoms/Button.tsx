/**
 * Button - Interactive Primitive Component
 * 
 * A button component with pre-defined variants using design tokens.
 * 
 * @example
 * <Button variant="primary" label="Submit" onPress={handleSubmit} />
 * <Button variant="outline" label="Cancel" onPress={handleCancel} />
 */

import React from 'react';
import { 
  TouchableOpacity, 
  TouchableOpacityProps, 
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  StyleProp,
} from 'react-native';
import { 
  colors, 
  spacing, 
  borderRadius,
  fontFamily,
  fontSize,
  fontWeight,
} from '../../lib/theme';
import { Text } from './Text';
import { Box } from './Box';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends Omit<TouchableOpacityProps, 'style'> {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

const variantStyles: Record<ButtonVariant, { container: ViewStyle; text: TextStyle }> = {
  primary: {
    container: {
      backgroundColor: colors.primary,
    },
    text: {
      color: colors.textInverse,
    },
  },
  secondary: {
    container: {
      backgroundColor: colors.interactive,
    },
    text: {
      color: colors.text,
    },
  },
  outline: {
    container: {
      backgroundColor: colors.transparent,
      borderWidth: 1,
      borderColor: colors.border,
    },
    text: {
      color: colors.text,
    },
  },
  ghost: {
    container: {
      backgroundColor: colors.transparent,
    },
    text: {
      color: colors.primary,
    },
  },
  danger: {
    container: {
      backgroundColor: colors.error,
    },
    text: {
      color: colors.textInverse,
    },
  },
};

const sizeStyles: Record<ButtonSize, { container: ViewStyle; text: TextStyle }> = {
  sm: {
    container: {
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.l,
      borderRadius: borderRadius.sm,
    },
    text: {
      fontSize: fontSize.sm,
    },
  },
  md: {
    container: {
      paddingVertical: spacing.l,
      paddingHorizontal: spacing.xl,
      borderRadius: borderRadius.md,
    },
    text: {
      fontSize: fontSize.md,
    },
  },
  lg: {
    container: {
      paddingVertical: spacing.xl,
      paddingHorizontal: spacing['3xl'],
      borderRadius: borderRadius.lg,
    },
    text: {
      fontSize: fontSize.base,
    },
  },
};

export const Button: React.FC<ButtonProps> = ({
  label,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  icon,
  iconPosition = 'left',
  style,
  textStyle,
  onPress,
  ...restProps
}) => {
  const isDisabled = disabled || loading;
  
  const containerStyle: ViewStyle = {
    ...variantStyles[variant].container,
    ...sizeStyles[size].container,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: isDisabled ? 0.5 : 1,
    ...(fullWidth && { width: '100%' }),
  };

  const labelStyle: TextStyle = {
    ...variantStyles[variant].text,
    ...sizeStyles[size].text,
    fontFamily: fontFamily.semiBold,
    fontWeight: fontWeight.semiBold,
  };

  return (
    <TouchableOpacity
      style={[containerStyle, style]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
      {...restProps}
    >
      {loading ? (
        <ActivityIndicator 
          size="small" 
          color={variantStyles[variant].text.color} 
        />
      ) : (
        <>
          {icon && iconPosition === 'left' && (
            <Box mr="sm">{icon}</Box>
          )}
          <Text style={[labelStyle, textStyle]}>{label}</Text>
          {icon && iconPosition === 'right' && (
            <Box ml="sm">{icon}</Box>
          )}
        </>
      )}
    </TouchableOpacity>
  );
};

export default Button;
