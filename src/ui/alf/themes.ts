/**
 * ALF Themes
 * 
 * Theme definitions that map tokens to semantic color roles.
 * Components should use theme values, not raw tokens directly.
 * 
 * Inspired by Bluesky's ALF (Atomic Layout Framework).
 */

import {
  BRAND,
  GRAY,
  SEMANTIC,
  STATIC,
  SPACING,
  FONT_SIZE,
  FONT_WEIGHT,
  LINE_HEIGHT,
  RADIUS,
  SHADOW,
} from './tokens';

// ============================================================================
// THEME INTERFACE
// ============================================================================

/**
 * Color palette for a theme
 */
export interface ThemePalette {
  /** Primary brand color */
  primary: string;
  /** Lighter variant of primary */
  primaryLight: string;
  /** Darker variant of primary */
  primaryDark: string;
  
  /** Default background color */
  background: string;
  /** Elevated/card background */
  backgroundElevated: string;
  /** Subtle background for contrast */
  backgroundSubtle: string;
  
  /** Primary text color */
  text: string;
  /** Secondary/muted text */
  textMuted: string;
  /** Subtle/disabled text */
  textSubtle: string;
  /** Inverted text (for primary buttons, etc.) */
  textInverted: string;
  
  /** Default border color */
  border: string;
  /** Subtle border (dividers) */
  borderSubtle: string;
  /** Focused/active border */
  borderFocused: string;
  
  /** Success state color */
  success: string;
  /** Warning state color */
  warning: string;
  /** Error state color */
  error: string;
  /** Info state color */
  info: string;
  
  /** Overlay background (modals, etc.) */
  overlay: string;
  /** Skeleton/placeholder background */
  skeleton: string;
  /** Interactive press/hover state */
  pressedBackground: string;
}

/**
 * Complete theme definition
 */
export interface Theme {
  /** Theme identifier */
  name: 'light' | 'dark';
  /** Color palette */
  palette: ThemePalette;
}

// ============================================================================
// LIGHT THEME
// ============================================================================

export const lightTheme: Theme = {
  name: 'light',
  palette: {
    // Brand
    primary: BRAND.primary,
    primaryLight: BRAND.primaryLight,
    primaryDark: BRAND.primaryDark,
    
    // Backgrounds
    background: STATIC.white,
    backgroundElevated: STATIC.white,
    backgroundSubtle: GRAY[100],
    
    // Text
    text: GRAY[900],
    textMuted: GRAY[700],
    textSubtle: GRAY[500],
    textInverted: STATIC.white,
    
    // Borders
    border: GRAY[300],
    borderSubtle: GRAY[200],
    borderFocused: BRAND.primary,
    
    // Semantic
    success: SEMANTIC.success,
    warning: SEMANTIC.warning,
    error: SEMANTIC.error,
    info: SEMANTIC.info,
    
    // UI States
    overlay: 'rgba(0, 0, 0, 0.5)',
    skeleton: GRAY[200],
    pressedBackground: GRAY[100],
  },
};

// ============================================================================
// DARK THEME
// ============================================================================

export const darkTheme: Theme = {
  name: 'dark',
  palette: {
    // Brand
    primary: BRAND.primary,
    primaryLight: BRAND.primaryLight,
    primaryDark: BRAND.primaryDark,
    
    // Backgrounds
    background: GRAY[1000],
    backgroundElevated: GRAY[900],
    backgroundSubtle: GRAY[800],
    
    // Text
    text: GRAY[50],
    textMuted: GRAY[400],
    textSubtle: GRAY[500],
    textInverted: GRAY[900],
    
    // Borders
    border: GRAY[700],
    borderSubtle: GRAY[800],
    borderFocused: BRAND.primary,
    
    // Semantic
    success: SEMANTIC.successLight,
    warning: SEMANTIC.warningLight,
    error: SEMANTIC.errorLight,
    info: SEMANTIC.infoLight,
    
    // UI States
    overlay: 'rgba(0, 0, 0, 0.7)',
    skeleton: GRAY[800],
    pressedBackground: GRAY[800],
  },
};

// ============================================================================
// DEFAULT THEME
// ============================================================================

/**
 * Default theme used when no theme context is available
 */
export const defaultTheme = lightTheme;

// ============================================================================
// THEME UTILITIES
// ============================================================================

/**
 * Get theme by name
 */
export function getTheme(name: 'light' | 'dark'): Theme {
  return name === 'dark' ? darkTheme : lightTheme;
}

/**
 * Theme-aware style helpers available in themes
 * These are shortcuts for common patterns
 */
export const themeHelpers = {
  spacing: SPACING,
  fontSize: FONT_SIZE,
  fontWeight: FONT_WEIGHT,
  lineHeight: LINE_HEIGHT,
  radius: RADIUS,
  shadow: SHADOW,
} as const;

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type ThemeName = Theme['name'];
export type PaletteKey = keyof ThemePalette;
