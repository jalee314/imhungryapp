/**
 * Layout/index.tsx
 *
 * Layout components for consistent screen structure.
 * Following Bluesky's Layout pattern.
 *
 * Usage:
 *   import * as Layout from '#/components/Layout'
 *
 *   <Layout.Screen>
 *     <Layout.Header.Outer>
 *       <Layout.Header.BackButton />
 *       <Layout.Header.TitleText>Settings</Layout.Header.TitleText>
 *     </Layout.Header.Outer>
 *     <Layout.Content>
 *       ...screen content...
 *     </Layout.Content>
 *   </Layout.Screen>
 */

import React, { ReactNode } from 'react'
import {
  View,
  ScrollView,
  StyleProp,
  ViewStyle,
  Pressable,
  Text as RNText,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'

import { atoms as a, useTheme, ViewStyleProp, TextStyleProp } from '#/ui'

// ==========================================
// Screen
// ==========================================

interface ScreenProps extends ViewStyleProp {
  children: ReactNode
  /** Whether to include safe area insets. Default: true */
  safe?: boolean
}

/**
 * Root screen container.
 * Handles safe area insets and provides base background.
 */
export function Screen({ children, style, safe = true }: ScreenProps) {
  const t = useTheme()
  const insets = useSafeAreaInsets()

  return (
    <View
      style={[
        a.flex_1,
        t.atoms.bg,
        safe && { paddingTop: insets.top },
        style,
      ]}
    >
      {children}
    </View>
  )
}

// ==========================================
// Content
// ==========================================

interface ContentProps extends ViewStyleProp {
  children: ReactNode
  /** Whether content should scroll. Default: true */
  scrollable?: boolean
  /** Padding preset. Default: 'base' */
  padding?: 'none' | 'compact' | 'base' | 'wide'
}

const paddingStyles = {
  none: {},
  compact: a.p_sm,
  base: a.p_lg,
  wide: a.p_xl,
}

/**
 * Main content area.
 * Can be scrollable or fixed.
 */
export function Content({
  children,
  style,
  scrollable = true,
  padding = 'base',
}: ContentProps) {
  const insets = useSafeAreaInsets()

  if (scrollable) {
    return (
      <ScrollView
        style={a.flex_1}
        contentContainerStyle={[
          paddingStyles[padding],
          { paddingBottom: insets.bottom + 20 },
          style,
        ]}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    )
  }

  return (
    <View style={[a.flex_1, paddingStyles[padding], style]}>
      {children}
    </View>
  )
}

// ==========================================
// Header
// ==========================================

/**
 * Header components for consistent screen headers.
 * Composed using dot notation: Header.Outer, Header.TitleText, etc.
 */
export const Header = {
  /**
   * Header container.
   */
  Outer: function HeaderOuter({
    children,
    style,
  }: ViewStyleProp & { children: ReactNode }) {
    const t = useTheme()

    return (
      <View
        style={[
          a.flex_row,
          a.align_center,
          a.px_lg,
          a.py_md,
          a.gap_md,
          t.atoms.bg,
          t.atoms.border_light,
          a.border_b,
          style,
        ]}
      >
        {children}
      </View>
    )
  },

  /**
   * Back button for navigation.
   */
  BackButton: function HeaderBackButton({
    onPress,
    style,
  }: ViewStyleProp & { onPress?: () => void }) {
    const navigation = useNavigation()
    const t = useTheme()

    const handlePress = () => {
      if (onPress) {
        onPress()
      } else if (navigation.canGoBack()) {
        navigation.goBack()
      }
    }

    return (
      <Pressable
        onPress={handlePress}
        style={[a.p_xs, style]}
        hitSlop={8}
        accessibilityLabel="Go back"
        accessibilityRole="button"
      >
        <Ionicons
          name="chevron-back"
          size={24}
          color={t.palette.text}
        />
      </Pressable>
    )
  },

  /**
   * Header title text.
   */
  TitleText: function HeaderTitleText({
    children,
    style,
  }: TextStyleProp & { children: ReactNode }) {
    const t = useTheme()

    return (
      <RNText
        style={[
          a.text_lg,
          a.font_semibold,
          t.atoms.text,
          a.flex_1,
          style,
        ]}
        numberOfLines={1}
      >
        {children}
      </RNText>
    )
  },

  /**
   * Header subtitle text.
   */
  SubtitleText: function HeaderSubtitleText({
    children,
    style,
  }: TextStyleProp & { children: ReactNode }) {
    const t = useTheme()

    return (
      <RNText
        style={[
          a.text_sm,
          t.atoms.text_secondary,
          style,
        ]}
        numberOfLines={1}
      >
        {children}
      </RNText>
    )
  },

  /**
   * Container for header title + subtitle.
   */
  TitleGroup: function HeaderTitleGroup({
    children,
    style,
  }: ViewStyleProp & { children: ReactNode }) {
    return (
      <View style={[a.flex_1, a.gap_2xs, style]}>
        {children}
      </View>
    )
  },

  /**
   * Spacer to push content to the right.
   */
  Spacer: function HeaderSpacer() {
    return <View style={a.flex_1} />
  },
}

// ==========================================
// Center
// ==========================================

/**
 * Center content horizontally and vertically.
 */
export function Center({
  children,
  style,
}: ViewStyleProp & { children: ReactNode }) {
  return (
    <View style={[a.flex_1, a.justify_center, a.align_center, style]}>
      {children}
    </View>
  )
}

// ==========================================
// Row & Column
// ==========================================

interface FlexProps extends ViewStyleProp {
  children: ReactNode
  /** Gap between items */
  gap?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
}

const gapStyles = {
  xs: a.gap_xs,
  sm: a.gap_sm,
  md: a.gap_md,
  lg: a.gap_lg,
  xl: a.gap_xl,
}

/**
 * Horizontal flex container.
 */
export function Row({ children, style, gap }: FlexProps) {
  return (
    <View style={[a.flex_row, gap && gapStyles[gap], style]}>
      {children}
    </View>
  )
}

/**
 * Vertical flex container.
 */
export function Column({ children, style, gap }: FlexProps) {
  return (
    <View style={[a.flex_col, gap && gapStyles[gap], style]}>
      {children}
    </View>
  )
}

// ==========================================
// Divider
// ==========================================

/**
 * Horizontal divider line.
 */
export function Divider({ style }: ViewStyleProp) {
  const t = useTheme()

  return (
    <View
      style={[
        a.w_full,
        a.border_t,
        t.atoms.border_contrast_low,
        style,
      ]}
    />
  )
}
