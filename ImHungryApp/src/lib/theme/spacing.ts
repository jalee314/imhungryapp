/**
 * Spacing Scale (Design Tokens)
 * 
 * Consistent spacing values based on a 4px base unit.
 * Use these instead of arbitrary pixel values.
 */

export const spacing = {
  // Base scale (4px increments)
  xs: 2,
  s: 4,
  sm: 6,
  m: 8,
  md: 10,
  l: 12,
  lg: 14,
  xl: 16,
  '2xl': 20,
  '3xl': 24,
  '4xl': 32,
  '5xl': 40,
  '6xl': 48,
  '7xl': 60,
  '8xl': 80,
  '9xl': 100,
  
  // Semantic aliases
  none: 0,
  page: 16,        // Standard page padding
  section: 24,     // Section spacing
  card: 12,        // Card internal padding
  button: 14,      // Button padding
  input: 12,       // Input padding
  modal: 16,       // Modal padding
  bottomNav: 34,   // Bottom navigation safe area
} as const;

export type SpacingToken = keyof typeof spacing;

/**
 * Get spacing value by token
 */
export const getSpacing = (token: SpacingToken): number => spacing[token];
