/**
 * TextField.tsx
 *
 * Text input field component.
 *
 * Usage:
 *   import { TextField } from '#/components/forms'
 *
 *   <TextField
 *     label="Email"
 *     placeholder="Enter your email"
 *     value={email}
 *     onChangeText={setEmail}
 *     error={errors.email}
 *   />
 */

import React, { forwardRef, useState } from 'react'
import {
  View,
  TextInput,
  TextInputProps,
  Text as RNText,
  Pressable,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'

import { atoms as a, useTheme, ViewStyleProp } from '#/ui'
import * as tokens from '#/ui/tokens'

// ==========================================
// Types
// ==========================================

export interface TextFieldProps extends Omit<TextInputProps, 'style'>, ViewStyleProp {
  /** Label text above the input */
  label?: string
  /** Error message to display */
  error?: string
  /** Helper text below the input */
  helperText?: string
  /** Show password toggle for secure text entry */
  showPasswordToggle?: boolean
}

// ==========================================
// Component
// ==========================================

/**
 * Text input field with label and error handling.
 */
export const TextField = forwardRef<TextInput, TextFieldProps>(function TextField(
  {
    label,
    error,
    helperText,
    showPasswordToggle,
    secureTextEntry,
    style,
    ...props
  },
  ref
) {
  const t = useTheme()
  const [isSecure, setIsSecure] = useState(secureTextEntry)
  const [isFocused, setIsFocused] = useState(false)

  const hasError = !!error

  const toggleSecure = () => setIsSecure((prev) => !prev)

  return (
    <View style={[a.w_full, style]}>
      {/* Label */}
      {label && (
        <RNText
          style={[
            a.text_sm,
            a.font_medium,
            a.mb_xs,
            t.atoms.text_secondary,
            { fontFamily: 'Inter-Medium' },
          ]}
        >
          {label}
        </RNText>
      )}

      {/* Input Container */}
      <View
        style={[
          a.flex_row,
          a.align_center,
          a.rounded_md,
          a.border,
          a.px_md,
          {
            backgroundColor: tokens.color.white,
            borderColor: hasError
              ? tokens.color.error_500
              : isFocused
              ? tokens.color.primary_500
              : tokens.color.gray_200,
            minHeight: 48,
          },
        ]}
      >
        <TextInput
          ref={ref}
          style={[
            a.flex_1,
            a.py_sm,
            t.atoms.text,
            { fontFamily: 'Inter-Regular', fontSize: tokens.fontSize.md },
          ]}
          placeholderTextColor={tokens.color.gray_400}
          secureTextEntry={showPasswordToggle ? isSecure : secureTextEntry}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />

        {/* Password Toggle */}
        {showPasswordToggle && (
          <Pressable onPress={toggleSecure} hitSlop={8}>
            <Ionicons
              name={isSecure ? 'eye-outline' : 'eye-off-outline'}
              size={20}
              color={tokens.color.gray_400}
            />
          </Pressable>
        )}
      </View>

      {/* Error or Helper Text */}
      {(error || helperText) && (
        <RNText
          style={[
            a.text_xs,
            a.mt_xs,
            {
              fontFamily: 'Inter-Regular',
              color: hasError ? tokens.color.error_500 : tokens.color.gray_500,
            },
          ]}
        >
          {error || helperText}
        </RNText>
      )}
    </View>
  )
})
