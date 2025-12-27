/**
 * ui/index.tsx
 *
 * Main entry point for the ImHungry UI style system.
 * Inspired by Bluesky's ALF (Application Layout Framework).
 *
 * This is a STYLE SYSTEM, not a component library.
 * Components live in src/components/.
 *
 * Usage:
 *   import { atoms as a, useTheme } from '#/ui'
 *
 *   function MyComponent() {
 *     const t = useTheme()
 *     return (
 *       <View style={[a.flex_row, a.gap_md, t.atoms.bg]}>
 *         <Text style={[a.text_lg, t.atoms.text]}>Hello</Text>
 *       </View>
 *     )
 *   }
 */

import React, { createContext, useContext, useMemo, ReactNode } from 'react'
import { StyleProp, ViewStyle, TextStyle } from 'react-native'

import { Theme, ThemeName, themes, lightTheme } from './themes'
import { atoms } from './atoms'

// ==========================================
// Re-exports
// ==========================================

// Atoms (style primitives)
export { atoms, atoms as a } from './atoms'

// Tokens (design values)
export * as tokens from './tokens'

// Themes
export { themes, lightTheme, darkTheme } from './themes'
export type { Theme, ThemeName } from './themes'

// Breakpoints
export { useBreakpoints, breakpoints, isBreakpoint, getResponsiveValue } from './breakpoints'
export type { Breakpoint, BreakpointState } from './breakpoints'

// Fonts
export { fontFamily, getFontStyle, getFontScaleMultiplier } from './fonts'
export type { FontFamily, FontScale } from './fonts'

// Utilities
export { flatten, flattenViewStyle, flattenTextStyle } from './util/flatten'
export { isIOS, isAndroid, isWeb, isNative, ios, android, web, native, select } from './util/platform'
export { useGutters, getGutterValue } from './util/useGutters'
export type { Gutter, Gutters } from './util/useGutters'

// ==========================================
// Style Prop Types
// ==========================================

/** Style prop type for Views */
export interface ViewStyleProp {
  style?: StyleProp<ViewStyle>
}

/** Style prop type for Text */
export interface TextStyleProp {
  style?: StyleProp<TextStyle>
}

// ==========================================
// Theme Context
// ==========================================

interface UIContextValue {
  themeName: ThemeName
  theme: Theme
  setTheme: (name: ThemeName) => void
}

const UIContext = createContext<UIContextValue | null>(null)

// ==========================================
// Theme Provider
// ==========================================

interface ThemeProviderProps {
  children: ReactNode
  /** Initial theme name. Defaults to 'light'. */
  theme?: ThemeName
}

/**
 * ThemeProvider wraps your app to provide theme context.
 *
 * @example
 * // In App.tsx
 * <ThemeProvider theme="light">
 *   <Shell />
 * </ThemeProvider>
 */
export function ThemeProvider({ children, theme: initialTheme = 'light' }: ThemeProviderProps) {
  const [themeName, setThemeName] = React.useState<ThemeName>(initialTheme)

  const value = useMemo<UIContextValue>(
    () => ({
      themeName,
      theme: themes[themeName],
      setTheme: setThemeName,
    }),
    [themeName]
  )

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>
}

// ==========================================
// Hooks
// ==========================================

/**
 * Access the full UI context including theme switching.
 * Most components should use useTheme() instead.
 */
export function useUI(): UIContextValue {
  const context = useContext(UIContext)
  if (!context) {
    // Return default theme if provider not found
    // This allows components to work outside of ThemeProvider (e.g., in tests)
    return {
      themeName: 'light',
      theme: lightTheme,
      setTheme: () => {
        console.warn('ThemeProvider not found. Theme switching disabled.')
      },
    }
  }
  return context
}

/**
 * Get the current theme.
 * This is the most common hook for accessing theme styles.
 *
 * @example
 * function MyComponent() {
 *   const t = useTheme()
 *   return (
 *     <View style={[a.p_md, t.atoms.bg]}>
 *       <Text style={t.atoms.text}>Hello</Text>
 *     </View>
 *   )
 * }
 */
export function useTheme(): Theme {
  const { theme } = useUI()
  return theme
}

/**
 * Get the current theme name.
 *
 * @example
 * const themeName = useThemeName() // 'light' or 'dark'
 */
export function useThemeName(): ThemeName {
  const { themeName } = useUI()
  return themeName
}

/**
 * Get the theme setter function.
 *
 * @example
 * const setTheme = useSetTheme()
 * setTheme('dark')
 */
export function useSetTheme(): (name: ThemeName) => void {
  const { setTheme } = useUI()
  return setTheme
}

// ==========================================
// Theme Selector Utility
// ==========================================

/**
 * Select a value based on current theme.
 * Useful for conditional styling.
 *
 * @example
 * const iconColor = themeSelect(t, {
 *   light: '#000000',
 *   dark: '#FFFFFF',
 * })
 */
export function themeSelect<T>(
  theme: Theme,
  values: { light: T; dark: T }
): T {
  return values[theme.name]
}
