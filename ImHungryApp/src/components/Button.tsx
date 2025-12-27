/**
 * Button.tsx
 *
 * Button component with multiple variants.
 * Following Bluesky's Button pattern.
 *
 * Usage:
 *   import { Button, ButtonText } from '#/components/Button'
 *
 *   <Button variant="primary" size="md" onPress={handlePress}>
 *     <ButtonText>Submit</ButtonText>
 *   </Button>
 */

import React, { ReactNode } from 'react'
import {
  Pressable,
  PressableProps,
  View,
  Text as RNText,
  ActivityIndicator,
  StyleProp,
  ViewStyle,
  TextStyle,
} from 'react-native'

import { atoms as a, useTheme, ViewStyleProp, TextStyleProp } from '#/ui'
import * as tokens from '#/ui/tokens'

// ==========================================
// Types
// ==========================================

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'danger'

export type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps extends Omit<PressableProps, 'style'>, ViewStyleProp {
  children: ReactNode
  /** Visual variant. Default: 'primary' */
  variant?: ButtonVariant
  /** Size preset. Default: 'md' */
  size?: ButtonSize
  /** Show loading spinner and disable button */
  loading?: boolean
  /** Full width button */
  fullWidth?: boolean
}

// ==========================================
// Style Definitions
// ==========================================

/**
 * Size-based styles
 *
 * Values matched to existing app implementation:
 * - Auth buttons: height 50, borderRadius 25
 * - Standard buttons: height ~44
 */
const sizeStyles: Record<ButtonSize, ViewStyle> = {
  sm: {
    paddingHorizontal: tokens.space.md,
    paddingVertical: tokens.space.sm,
    borderRadius: tokens.radius.sm,
    minHeight: 32,
  },
  md: {
    paddingHorizontal: tokens.space.lg,
    paddingVertical: tokens.space.md,
    borderRadius: tokens.radius.sm, // 8px - matches retryButton
    minHeight: 44,
  },
  lg: {
    paddingHorizontal: tokens.space._2xl,
    paddingVertical: tokens.space.md,
    borderRadius: 25, // Pill shape - matches auth buttons
    minHeight: 50,    // Matches auth button height
  },
}

const textSizeStyles: Record<ButtonSize, TextStyle> = {
  sm: { fontSize: tokens.fontSize.sm },
  md: { fontSize: tokens.fontSize.md },
  lg: { fontSize: tokens.fontSize.md }, // Auth buttons use 16px
}

// ==========================================
// Button Component
// ==========================================

/**
 * Primary button component.
 *
 * @example
 * <Button variant="primary" onPress={submit}>
 *   <ButtonText>Submit</ButtonText>
 * </Button>
 *
 * <Button variant="outline" size="sm" loading={isLoading}>
 *   <ButtonText>Save</ButtonText>
 * </Button>
 */
export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  disabled,
  style,
  ...props
}: ButtonProps) {
  const t = useTheme()
  const isDisabled = disabled || loading

  /**
   * Get variant-specific styles
   *
   * Colors matched to existing implementation:
   * - Primary button: #FF8C4C (primary_600)
   * - Accent button: #FFA05C (primary_500) - for retry/accent
   */
  const getVariantStyles = (pressed: boolean): ViewStyle => {
    const baseOpacity = pressed ? 0.85 : 1

    switch (variant) {
      case 'primary':
        return {
          // #FF8C4C - matches existing auth buttons, filter selections
          backgroundColor: isDisabled
            ? tokens.color.gray_300
            : tokens.color.primary_600,
          opacity: baseOpacity,
        }
      case 'secondary':
        return {
          // #FFA05C - accent/retry button color
          backgroundColor: isDisabled
            ? tokens.color.gray_300
            : tokens.color.primary_500,
          opacity: baseOpacity,
        }
      case 'outline':
        return {
          backgroundColor: pressed ? tokens.color.gray_50 : 'transparent',
          borderWidth: 1,
          borderColor: isDisabled
            ? tokens.color.gray_200
            : tokens.color.gray_300, // #D7D7D7 - matches existing borders
        }
      case 'ghost':
        return {
          backgroundColor: pressed ? tokens.color.gray_100 : 'transparent',
        }
      case 'danger':
        return {
          backgroundColor: isDisabled
            ? tokens.color.gray_300
            : tokens.color.error_500,
          opacity: baseOpacity,
        }
      default:
        return {}
    }
  }

  return (
    <Pressable
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
      style={({ pressed }) => [
        a.flex_row,
        a.align_center,
        a.justify_center,
        a.gap_sm,
        sizeStyles[size],
        getVariantStyles(pressed),
        fullWidth && a.w_full,
        style,
      ]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={
            variant === 'primary' || variant === 'danger'
              ? tokens.color.white
              : tokens.color.gray_500
          }
        />
      ) : (
        children
      )}
    </Pressable>
  )
}

// ==========================================
// ButtonText Component
// ==========================================

export interface ButtonTextProps extends TextStyleProp {
  children: ReactNode
  /** Visual variant (should match parent Button) */
  variant?: ButtonVariant
  /** Size (should match parent Button) */
  size?: ButtonSize
}

/**
 * Text component for use inside Button.
 * Automatically styles text based on variant.
 *
 * @example
 * <Button variant="primary">
 *   <ButtonText>Click Me</ButtonText>
 * </Button>
 */
export function ButtonText({
  children,
  variant = 'primary',
  size = 'md',
  style,
}: ButtonTextProps) {
  const getTextColor = (): string => {
    switch (variant) {
      case 'primary':
      case 'danger':
        return tokens.color.white
      case 'secondary':
      case 'outline':
      case 'ghost':
      default:
        return tokens.color.gray_800
    }
  }

  return (
    <RNText
      style={[
        {
          color: getTextColor(),
          fontFamily: 'Inter-SemiBold',
          fontWeight: '600',
        },
        textSizeStyles[size],
        style,
      ]}
    >
      {children}
    </RNText>
  )
}

// ==========================================
// Convenience Exports
// ==========================================

/**
 * Pre-configured primary button with text.
 */
export function PrimaryButton({
  children,
  ...props
}: Omit<ButtonProps, 'variant'> & { children: string }) {
  return (
    <Button variant="primary" {...props}>
      <ButtonText variant="primary">{children}</ButtonText>
    </Button>
  )
}

/**
 * Pre-configured secondary button with text.
 */
export function SecondaryButton({
  children,
  ...props
}: Omit<ButtonProps, 'variant'> & { children: string }) {
  return (
    <Button variant="secondary" {...props}>
      <ButtonText variant="secondary">{children}</ButtonText>
    </Button>
  )
}
