/**
 * UI Module
 * 
 * Central export point for the UI system including:
 * - ALF: Atomic Layout Framework (tokens, themes, atoms)
 * - Primitives: Core UI components (ThemeProvider, Box, Text, Pressable)
 * 
 * Usage:
 * ```tsx
 * // Import from specific modules for tree-shaking
 * import { BRAND, SPACING } from '@/ui/alf';
 * import { Box, Text, useTheme } from '@/ui/primitives';
 * 
 * // Or import everything from the ui module
 * import { tokens, themes, Box, Text, ThemeProvider } from '@/ui';
 * ```
 */

// ============================================================================
// ALF (ATOMIC LAYOUT FRAMEWORK)
// ============================================================================

// Re-export all ALF modules
export * from './alf';

// ============================================================================
// PRIMITIVES
// ============================================================================

// Re-export all primitive components
export * from './primitives';
