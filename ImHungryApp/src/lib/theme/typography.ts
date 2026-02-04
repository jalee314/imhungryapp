/**
 * Typography Scale (Design Tokens)
 * 
 * Font families, sizes, weights, and line heights.
 * Maps to the app's loaded fonts (Inter, Manrope, etc.)
 */

export const fontFamily = {
  regular: 'Inter',
  light: 'Inter-Light',
  medium: 'Inter-Medium',
  semiBold: 'Inter-SemiBold',
  bold: 'Inter-Bold',
  // Display fonts
  displayBold: 'Manrope-Bold',
  displayRegular: 'Manrope-Regular',
  accent: 'MuseoModerno-Bold',
} as const;

export const fontSize = {
  xs: 10,
  sm: 12,
  md: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 28,
  '4xl': 32,
} as const;

export const fontWeight = {
  light: '300' as const,
  regular: '400' as const,
  medium: '500' as const,
  semiBold: '600' as const,
  bold: '700' as const,
};

export const lineHeight = {
  tight: 1.1,
  normal: 1.4,
  relaxed: 1.6,
  loose: 1.8,
};

/**
 * Pre-defined text variants for common use cases
 */
export const textVariants = {
  // Headings
  h1: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
  },
  h2: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semiBold,
  },
  h3: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semiBold,
  },
  
  // Body text
  body: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.base,
    fontWeight: fontWeight.regular,
  },
  bodySmall: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.md,
    fontWeight: fontWeight.regular,
  },
  
  // Labels & Captions
  label: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
  },
  caption: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.regular,
  },
  
  // Buttons
  button: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.base,
    fontWeight: fontWeight.semiBold,
  },
  buttonSmall: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
  },
} as const;

export type FontFamilyToken = keyof typeof fontFamily;
export type FontSizeToken = keyof typeof fontSize;
export type TextVariant = keyof typeof textVariants;
