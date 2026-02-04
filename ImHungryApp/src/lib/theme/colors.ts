/**
 * Color Palette (Design Tokens)
 * 
 * Semantic color names for consistent theming.
 * Inspired by Bluesky's design system approach.
 */

export const colors = {
  // Brand Colors
  primary: '#FFA05C',
  primaryDark: '#FF8C4C',
  primaryLight: '#FFE5B4',
  
  // Background Colors
  background: '#FFFFFF',
  backgroundAlt: '#F9F9F9',
  backgroundDim: '#fdfdfd',
  backgroundSkeleton: '#E1E9EE',
  
  // Text Colors
  text: '#000000',
  textLight: '#666666',
  textMuted: '#999999',
  textInverse: '#FFFFFF',
  
  // Border Colors
  border: '#E0E0E0',
  borderLight: '#D7D7D7',
  borderDark: '#bcbcbc',
  
  // Interactive Colors
  interactive: '#F0F0F0',
  interactiveHover: '#E8E8E8',
  
  // Semantic Colors
  error: '#D32F2F',
  errorLight: '#FFEBEE',
  success: '#4CAF50',
  warning: '#FF9800',
  
  // Overlay
  overlay: 'rgba(0, 0, 0, 0.8)',
  overlayLight: 'rgba(0, 0, 0, 0.5)',
  
  // Transparent
  transparent: 'transparent',
} as const;

export type ColorToken = keyof typeof colors;
