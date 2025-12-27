/**
 * Typography.tsx
 *
 * Text components with consistent styling.
 * These wrap React Native's Text with our design system.
 *
 * Usage:
 *   import { Text, H1, H2, P } from '#/components/Typography'
 *
 *   <H1>Welcome</H1>
 *   <Text style={[a.text_lg, a.font_medium]}>Subtitle</Text>
 *   <P>Body paragraph text...</P>
 */

import React, { ReactNode } from 'react'
import {
  Text as RNText,
  TextProps as RNTextProps,
  StyleProp,
  TextStyle,
} from 'react-native'

import { atoms as a, useTheme, TextStyleProp, flatten } from '#/ui'

// ==========================================
// Base Text Component
// ==========================================

export interface TextProps extends Omit<RNTextProps, 'style'>, TextStyleProp {
  children: ReactNode
}

/**
 * Base text component with theme-aware default styling.
 * Use this for most text. Apply atoms for specific styling.
 *
 * @example
 * <Text style={[a.text_lg, a.font_bold]}>Hello World</Text>
 */
export function Text({ children, style, ...props }: TextProps) {
  const t = useTheme()

  return (
    <RNText
      style={[
        a.text_md,
        t.atoms.text,
        { fontFamily: 'Inter-Regular' },
        style,
      ]}
      {...props}
    >
      {children}
    </RNText>
  )
}

// ==========================================
// Heading Components
// ==========================================

interface HeadingProps extends TextProps {
  /** Accessibility: heading level for screen readers */
  level?: 1 | 2 | 3 | 4 | 5 | 6
}

/**
 * Create a heading component with specific styling.
 */
function createHeadingComponent(
  defaultStyle: StyleProp<TextStyle>,
  defaultLevel: number
) {
  return function Heading({ children, style, level, ...props }: HeadingProps) {
    const t = useTheme()

    return (
      <RNText
        style={[
          t.atoms.text,
          { fontFamily: 'Inter-SemiBold' },
          defaultStyle,
          style,
        ]}
        accessibilityRole="header"
        {...props}
      >
        {children}
      </RNText>
    )
  }
}

/**
 * Heading 1 - Largest heading.
 * Use for main page titles.
 */
export const H1 = createHeadingComponent(
  [a.text_4xl, a.font_bold, a.leading_tight],
  1
)

/**
 * Heading 2 - Section headings.
 */
export const H2 = createHeadingComponent(
  [a.text_2xl, a.font_bold, a.leading_tight],
  2
)

/**
 * Heading 3 - Subsection headings.
 */
export const H3 = createHeadingComponent(
  [a.text_xl, a.font_semibold, a.leading_snug],
  3
)

/**
 * Heading 4 - Minor headings.
 */
export const H4 = createHeadingComponent(
  [a.text_lg, a.font_semibold, a.leading_snug],
  4
)

/**
 * Heading 5 - Small headings.
 */
export const H5 = createHeadingComponent(
  [a.text_md, a.font_semibold, a.leading_normal],
  5
)

/**
 * Heading 6 - Smallest headings.
 */
export const H6 = createHeadingComponent(
  [a.text_sm, a.font_semibold, a.leading_normal],
  6
)

// ==========================================
// Paragraph Component
// ==========================================

/**
 * Paragraph text with comfortable line height.
 * Use for body content.
 */
export function P({ children, style, ...props }: TextProps) {
  const t = useTheme()

  return (
    <RNText
      style={[
        a.text_md,
        a.leading_relaxed,
        t.atoms.text,
        { fontFamily: 'Inter-Regular' },
        style,
      ]}
      {...props}
    >
      {children}
    </RNText>
  )
}

// ==========================================
// Utility Text Components
// ==========================================

/**
 * Small/caption text.
 */
export function Caption({ children, style, ...props }: TextProps) {
  const t = useTheme()

  return (
    <RNText
      style={[
        a.text_xs,
        t.atoms.text_muted,
        { fontFamily: 'Inter-Regular' },
        style,
      ]}
      {...props}
    >
      {children}
    </RNText>
  )
}

/**
 * Label text (for form fields, etc).
 */
export function Label({ children, style, ...props }: TextProps) {
  const t = useTheme()

  return (
    <RNText
      style={[
        a.text_sm,
        a.font_medium,
        t.atoms.text_secondary,
        { fontFamily: 'Inter-Medium' },
        style,
      ]}
      {...props}
    >
      {children}
    </RNText>
  )
}

/**
 * Error message text.
 */
export function ErrorText({ children, style, ...props }: TextProps) {
  const t = useTheme()

  return (
    <RNText
      style={[
        a.text_sm,
        { color: t.palette.error, fontFamily: 'Inter-Regular' },
        style,
      ]}
      accessibilityRole="alert"
      {...props}
    >
      {children}
    </RNText>
  )
}
