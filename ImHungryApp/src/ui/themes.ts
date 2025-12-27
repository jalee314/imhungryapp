/**
 * themes.ts
 *
 * Theme definitions for the ImHungry app.
 * Currently supports light theme only (dark theme can be added later).
 *
 * Usage:
 *   const t = useTheme()
 *   <View style={[a.flex_1, t.atoms.bg]} />
 *
 * Theme atoms are styles that change based on the active theme.
 * Static styles go in atoms.ts, theme-dependent styles go here.
 */

import * as tokens from './tokens'

// ==========================================
// Theme Type Definition
// ==========================================

export type ThemeName = 'light' | 'dark'

export interface Theme {
  name: ThemeName

  /**
   * Raw color palette for direct access when needed.
   * Prefer using atoms when possible for consistency.
   */
  palette: {
    // Brand
    primary: string
    primary_light: string
    primary_dark: string

    // Background
    background: string
    background_secondary: string

    // Text
    text: string
    text_secondary: string
    text_muted: string
    text_inverted: string

    // Borders
    border: string
    border_light: string

    // Semantic
    success: string
    warning: string
    error: string

    // Special
    white: string
    black: string

    // Contrast shades (for skeletons, overlays, etc.)
    contrast_25: string
    contrast_50: string
    contrast_100: string
    contrast_200: string
    contrast_300: string
  }

  /**
   * Pre-built style objects for common theme-dependent styles.
   * Use these directly in style arrays.
   */
  atoms: {
    // Backgrounds
    bg: { backgroundColor: string }
    bg_secondary: { backgroundColor: string }
    bg_contrast_25: { backgroundColor: string }
    bg_contrast_50: { backgroundColor: string }
    bg_contrast_100: { backgroundColor: string }
    bg_contrast_200: { backgroundColor: string }
    bg_contrast_300: { backgroundColor: string }

    // Text colors
    text: { color: string }
    text_secondary: { color: string }
    text_muted: { color: string }
    text_inverted: { color: string }
    text_contrast_low: { color: string }
    text_contrast_medium: { color: string }
    text_contrast_high: { color: string }

    // Border colors
    border: { borderColor: string }
    border_light: { borderColor: string }
    border_contrast_low: { borderColor: string }
    border_contrast_medium: { borderColor: string }
    border_contrast_high: { borderColor: string }

    // Shadows (theme-aware)
    shadow_sm: {
      shadowColor: string
      shadowOffset: { width: number; height: number }
      shadowOpacity: number
      shadowRadius: number
      elevation: number
    }
    shadow_md: {
      shadowColor: string
      shadowOffset: { width: number; height: number }
      shadowOpacity: number
      shadowRadius: number
      elevation: number
    }
    shadow_lg: {
      shadowColor: string
      shadowOffset: { width: number; height: number }
      shadowOpacity: number
      shadowRadius: number
      elevation: number
    }
  }
}

// ==========================================
// Light Theme
// ==========================================

export const lightTheme: Theme = {
  name: 'light',

  palette: {
    // Brand
    primary: tokens.color.primary_500,        // #FFA05C - accent color
    primary_light: tokens.color.primary_100,  // #FFE5B4 - peach background
    primary_dark: tokens.color.primary_600,   // #FF8C4C - button/selection bg

    // Background
    background: tokens.color.white,
    background_secondary: tokens.color.gray_100, // #F7F4F4 - card bg

    // Text - exact values from existing SignUp, DealCard, etc.
    text: tokens.color.text_primary,           // #181619
    text_secondary: tokens.color.gray_700,     // #404040
    text_muted: tokens.color.gray_500,         // #757575
    text_inverted: tokens.color.white,

    // Borders - exact values from DealCard, CuisineFilter, Header
    border: tokens.color.gray_300,             // #D7D7D7 - default border
    border_light: tokens.color.gray_200,       // #DEDEDE - light border

    // Semantic
    success: tokens.color.success_500,
    warning: tokens.color.warning_500,
    error: tokens.color.error_500,

    // Special
    white: tokens.color.white,
    black: tokens.color.black,

    // Contrast shades
    contrast_25: tokens.color.gray_25,
    contrast_50: tokens.color.gray_50,
    contrast_100: tokens.color.gray_100,
    contrast_200: tokens.color.gray_200,
    contrast_300: tokens.color.gray_300,
  },

  atoms: {
    // Backgrounds
    bg: { backgroundColor: tokens.color.white },
    bg_secondary: { backgroundColor: tokens.color.gray_100 },  // #F7F4F4
    bg_contrast_25: { backgroundColor: tokens.color.gray_25 },
    bg_contrast_50: { backgroundColor: tokens.color.gray_50 },
    bg_contrast_100: { backgroundColor: tokens.color.gray_100 },
    bg_contrast_200: { backgroundColor: tokens.color.gray_200 },
    bg_contrast_300: { backgroundColor: tokens.color.gray_300 },

    // Text colors - using exact existing values
    text: { color: tokens.color.text_primary },          // #181619
    text_secondary: { color: tokens.color.gray_700 },    // #404040
    text_muted: { color: tokens.color.gray_500 },        // #757575
    text_inverted: { color: tokens.color.white },
    text_contrast_low: { color: tokens.color.gray_400 }, // #999999
    text_contrast_medium: { color: tokens.color.gray_600 }, // #666666
    text_contrast_high: { color: tokens.color.gray_800 },   // #333333

    // Border colors - exact values from existing components
    border: { borderColor: tokens.color.gray_300 },      // #D7D7D7
    border_light: { borderColor: tokens.color.gray_200 }, // #DEDEDE
    border_contrast_low: { borderColor: tokens.color.gray_200 },
    border_contrast_medium: { borderColor: tokens.color.gray_300 },
    border_contrast_high: { borderColor: tokens.color.gray_700 },

    // Shadows
    shadow_sm: tokens.shadow.sm,
    shadow_md: tokens.shadow.md,
    shadow_lg: tokens.shadow.lg,
  },
}

// ==========================================
// Dark Theme (placeholder for future)
// ==========================================

export const darkTheme: Theme = {
  name: 'dark',

  palette: {
    // Brand
    primary: tokens.color.primary_400,
    primary_light: tokens.color.primary_700,
    primary_dark: tokens.color.primary_300,

    // Background
    background: tokens.color.gray_900,
    background_secondary: tokens.color.gray_800,

    // Text
    text: tokens.color.gray_50,
    text_secondary: tokens.color.gray_300,
    text_muted: tokens.color.gray_500,
    text_inverted: tokens.color.gray_900,

    // Borders
    border: tokens.color.gray_700,
    border_light: tokens.color.gray_800,

    // Semantic
    success: tokens.color.success_500,
    warning: tokens.color.warning_500,
    error: tokens.color.error_500,

    // Special
    white: tokens.color.white,
    black: tokens.color.black,

    // Contrast shades (inverted for dark mode)
    contrast_25: tokens.color.gray_800,
    contrast_50: tokens.color.gray_700,
    contrast_100: tokens.color.gray_600,
    contrast_200: tokens.color.gray_500,
    contrast_300: tokens.color.gray_400,
  },

  atoms: {
    // Backgrounds
    bg: { backgroundColor: tokens.color.gray_900 },
    bg_secondary: { backgroundColor: tokens.color.gray_800 },
    bg_contrast_25: { backgroundColor: tokens.color.gray_800 },
    bg_contrast_50: { backgroundColor: tokens.color.gray_700 },
    bg_contrast_100: { backgroundColor: tokens.color.gray_600 },
    bg_contrast_200: { backgroundColor: tokens.color.gray_500 },
    bg_contrast_300: { backgroundColor: tokens.color.gray_400 },

    // Text colors
    text: { color: tokens.color.gray_50 },
    text_secondary: { color: tokens.color.gray_300 },
    text_muted: { color: tokens.color.gray_500 },
    text_inverted: { color: tokens.color.gray_900 },
    text_contrast_low: { color: tokens.color.gray_500 },
    text_contrast_medium: { color: tokens.color.gray_400 },
    text_contrast_high: { color: tokens.color.gray_200 },

    // Border colors
    border: { borderColor: tokens.color.gray_700 },
    border_light: { borderColor: tokens.color.gray_800 },
    border_contrast_low: { borderColor: tokens.color.gray_800 },
    border_contrast_medium: { borderColor: tokens.color.gray_700 },
    border_contrast_high: { borderColor: tokens.color.gray_600 },

    // Shadows (less visible in dark mode)
    shadow_sm: {
      ...tokens.shadow.sm,
      shadowOpacity: 0.3,
    },
    shadow_md: {
      ...tokens.shadow.md,
      shadowOpacity: 0.4,
    },
    shadow_lg: {
      ...tokens.shadow.lg,
      shadowOpacity: 0.5,
    },
  },
}

// ==========================================
// Theme Registry
// ==========================================

export const themes = {
  light: lightTheme,
  dark: darkTheme,
} as const
