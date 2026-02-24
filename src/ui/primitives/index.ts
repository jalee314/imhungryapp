/**
 * UI Primitives
 * 
 * Core UI components built on top of the ALF design tokens and themes.
 * These primitives provide a consistent, theme-aware foundation for building UI.
 * 
 * Usage:
 * ```tsx
 * import { ThemeProvider, Box, Text, Pressable, useTheme } from '@/ui/primitives';
 * 
 * // Wrap app with ThemeProvider
 * <ThemeProvider>
 *   <Box p="lg" bg="background">
 *     <Text size="xl" weight="bold">Hello</Text>
 *     <Pressable bg="primary" p="md" rounded="lg" onPress={handlePress}>
 *       <Text color="textInverted">Button</Text>
 *     </Pressable>
 *   </Box>
 * </ThemeProvider>
 * ```
 */

// ============================================================================
// THEME PROVIDER
// ============================================================================

export {
  ThemeProvider,
  useTheme,
  useThemePalette,
  useThemeSafe,
  default as ThemeProviderDefault,
} from './ThemeProvider';

export type {
  ThemeContextValue,
  ThemeProviderProps,
} from './ThemeProvider';

// ============================================================================
// PRIMITIVES
// ============================================================================

export { Box, default as BoxDefault } from './Box';
export type { BoxProps } from './Box';

export { Text, default as TextDefault } from './Text';
export type { TextPrimitiveProps } from './Text';

export { Pressable, default as PressableDefault } from './Pressable';
export type { PressablePrimitiveProps } from './Pressable';

// ============================================================================
// RE-EXPORTS FROM ALF
// ============================================================================

// Re-export commonly used token types for convenience
export type {
  SpacingKey,
  FontSizeKey,
  FontWeightKey,
  RadiusKey,
} from '../alf/tokens';

// Re-export theme types
export type {
  Theme,
  ThemePalette,
  ThemeName,
  PaletteKey,
} from '../alf/themes';
