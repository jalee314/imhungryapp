/**
 * ALF Atoms
 * 
 * Atomic style primitives that can be composed to build component styles.
 * These are small, single-purpose style objects following the atomic CSS methodology.
 * 
 * Inspired by Bluesky's ALF (Atomic Layout Framework).
 */

import { StyleSheet, ViewStyle, TextStyle, ImageStyle } from 'react-native';

import {
  SPACING,
  FONT_SIZE,
  FONT_WEIGHT,
  LINE_HEIGHT,
  RADIUS,
  BORDER_WIDTH,
} from './tokens';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

type AnyStyle = ViewStyle | TextStyle | ImageStyle;

// ============================================================================
// FLEX ATOMS
// ============================================================================

export const flex = StyleSheet.create({
  /** flex: 1 */
  flex1: { flex: 1 },
  /** flex: 2 */
  flex2: { flex: 2 },
  /** flex: 0 */
  flex0: { flex: 0 },
  /** flexGrow: 1 */
  grow: { flexGrow: 1 },
  /** flexShrink: 1 */
  shrink: { flexShrink: 1 },
  /** flexShrink: 0 */
  shrink0: { flexShrink: 0 },
});

export const flexDirection = StyleSheet.create({
  /** flexDirection: 'row' */
  row: { flexDirection: 'row' },
  /** flexDirection: 'row-reverse' */
  rowReverse: { flexDirection: 'row-reverse' },
  /** flexDirection: 'column' */
  col: { flexDirection: 'column' },
  /** flexDirection: 'column-reverse' */
  colReverse: { flexDirection: 'column-reverse' },
});

export const flexWrap = StyleSheet.create({
  /** flexWrap: 'wrap' */
  wrap: { flexWrap: 'wrap' },
  /** flexWrap: 'nowrap' */
  nowrap: { flexWrap: 'nowrap' },
  /** flexWrap: 'wrap-reverse' */
  wrapReverse: { flexWrap: 'wrap-reverse' },
});

// ============================================================================
// ALIGNMENT ATOMS
// ============================================================================

export const align = StyleSheet.create({
  /** alignItems: 'flex-start' */
  start: { alignItems: 'flex-start' },
  /** alignItems: 'center' */
  center: { alignItems: 'center' },
  /** alignItems: 'flex-end' */
  end: { alignItems: 'flex-end' },
  /** alignItems: 'stretch' */
  stretch: { alignItems: 'stretch' },
  /** alignItems: 'baseline' */
  baseline: { alignItems: 'baseline' },
});

export const justify = StyleSheet.create({
  /** justifyContent: 'flex-start' */
  start: { justifyContent: 'flex-start' },
  /** justifyContent: 'center' */
  center: { justifyContent: 'center' },
  /** justifyContent: 'flex-end' */
  end: { justifyContent: 'flex-end' },
  /** justifyContent: 'space-between' */
  between: { justifyContent: 'space-between' },
  /** justifyContent: 'space-around' */
  around: { justifyContent: 'space-around' },
  /** justifyContent: 'space-evenly' */
  evenly: { justifyContent: 'space-evenly' },
});

export const alignSelf = StyleSheet.create({
  /** alignSelf: 'auto' */
  auto: { alignSelf: 'auto' },
  /** alignSelf: 'flex-start' */
  start: { alignSelf: 'flex-start' },
  /** alignSelf: 'center' */
  center: { alignSelf: 'center' },
  /** alignSelf: 'flex-end' */
  end: { alignSelf: 'flex-end' },
  /** alignSelf: 'stretch' */
  stretch: { alignSelf: 'stretch' },
});

// ============================================================================
// LAYOUT ATOMS
// ============================================================================

export const position = StyleSheet.create({
  /** position: 'relative' */
  relative: { position: 'relative' },
  /** position: 'absolute' */
  absolute: { position: 'absolute' },
});

export const overflow = StyleSheet.create({
  /** overflow: 'visible' */
  visible: { overflow: 'visible' },
  /** overflow: 'hidden' */
  hidden: { overflow: 'hidden' },
  /** overflow: 'scroll' */
  scroll: { overflow: 'scroll' },
});

export const display = StyleSheet.create({
  /** display: 'flex' */
  flex: { display: 'flex' },
  /** display: 'none' */
  none: { display: 'none' },
});

// ============================================================================
// SIZING ATOMS
// ============================================================================

export const width = StyleSheet.create({
  /** width: '100%' */
  full: { width: '100%' },
  /** width: '50%' */
  half: { width: '50%' },
  /** width: 'auto' */
  auto: { width: 'auto' },
});

export const height = StyleSheet.create({
  /** height: '100%' */
  full: { height: '100%' },
  /** height: '50%' */
  half: { height: '50%' },
  /** height: 'auto' */
  auto: { height: 'auto' },
});

// ============================================================================
// SPACING ATOMS (MARGIN)
// ============================================================================

const createSpacingAtoms = (property: string) => {
  const styles: Record<string, AnyStyle> = {};
  
  Object.entries(SPACING).forEach(([key, value]) => {
    styles[key] = { [property]: value } as AnyStyle;
  });
  
  return StyleSheet.create(styles);
};

/** Margin atoms: m.xs, m.sm, m.md, etc. */
export const m = createSpacingAtoms('margin');
/** Margin top atoms */
export const mt = createSpacingAtoms('marginTop');
/** Margin bottom atoms */
export const mb = createSpacingAtoms('marginBottom');
/** Margin left atoms */
export const ml = createSpacingAtoms('marginLeft');
/** Margin right atoms */
export const mr = createSpacingAtoms('marginRight');
/** Margin horizontal atoms */
export const mx = createSpacingAtoms('marginHorizontal');
/** Margin vertical atoms */
export const my = createSpacingAtoms('marginVertical');

// ============================================================================
// SPACING ATOMS (PADDING)
// ============================================================================

/** Padding atoms: p.xs, p.sm, p.md, etc. */
export const p = createSpacingAtoms('padding');
/** Padding top atoms */
export const pt = createSpacingAtoms('paddingTop');
/** Padding bottom atoms */
export const pb = createSpacingAtoms('paddingBottom');
/** Padding left atoms */
export const pl = createSpacingAtoms('paddingLeft');
/** Padding right atoms */
export const pr = createSpacingAtoms('paddingRight');
/** Padding horizontal atoms */
export const px = createSpacingAtoms('paddingHorizontal');
/** Padding vertical atoms */
export const py = createSpacingAtoms('paddingVertical');

// ============================================================================
// GAP ATOMS
// ============================================================================

/** Gap atoms: gap.xs, gap.sm, gap.md, etc. */
export const gap = createSpacingAtoms('gap');
/** Row gap atoms */
export const rowGap = createSpacingAtoms('rowGap');
/** Column gap atoms */
export const colGap = createSpacingAtoms('columnGap');

// ============================================================================
// BORDER ATOMS
// ============================================================================

export const rounded = StyleSheet.create({
  none: { borderRadius: RADIUS.none },
  xs: { borderRadius: RADIUS.xs },
  sm: { borderRadius: RADIUS.sm },
  md: { borderRadius: RADIUS.md },
  lg: { borderRadius: RADIUS.lg },
  xl: { borderRadius: RADIUS.xl },
  '2xl': { borderRadius: RADIUS['2xl'] },
  full: { borderRadius: RADIUS.full },
});

export const border = StyleSheet.create({
  none: { borderWidth: BORDER_WIDTH.none },
  hairline: { borderWidth: BORDER_WIDTH.hairline },
  thin: { borderWidth: BORDER_WIDTH.thin },
  medium: { borderWidth: BORDER_WIDTH.medium },
  thick: { borderWidth: BORDER_WIDTH.thick },
});

// ============================================================================
// TYPOGRAPHY ATOMS
// ============================================================================

export const text = StyleSheet.create({
  '2xs': { fontSize: FONT_SIZE['2xs'] },
  xs: { fontSize: FONT_SIZE.xs },
  sm: { fontSize: FONT_SIZE.sm },
  md: { fontSize: FONT_SIZE.md },
  lg: { fontSize: FONT_SIZE.lg },
  xl: { fontSize: FONT_SIZE.xl },
  '2xl': { fontSize: FONT_SIZE['2xl'] },
  '3xl': { fontSize: FONT_SIZE['3xl'] },
  '4xl': { fontSize: FONT_SIZE['4xl'] },
  '5xl': { fontSize: FONT_SIZE['5xl'] },
});

export const font = StyleSheet.create({
  regular: { fontWeight: FONT_WEIGHT.regular },
  medium: { fontWeight: FONT_WEIGHT.medium },
  semibold: { fontWeight: FONT_WEIGHT.semibold },
  bold: { fontWeight: FONT_WEIGHT.bold },
});

export const leading = StyleSheet.create({
  tight: { lineHeight: undefined }, // Will be computed based on fontSize
  normal: { lineHeight: undefined },
  relaxed: { lineHeight: undefined },
});

export const textAlign = StyleSheet.create({
  left: { textAlign: 'left' },
  center: { textAlign: 'center' },
  right: { textAlign: 'right' },
  auto: { textAlign: 'auto' },
});

// ============================================================================
// COMMON PATTERNS
// ============================================================================

/**
 * Common layout patterns that combine multiple atoms
 */
export const atoms = StyleSheet.create({
  /** Centered flex container */
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  /** Row with centered items */
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  /** Row with space between */
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  /** Column layout */
  col: {
    flexDirection: 'column',
  },
  /** Full screen container */
  screen: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  /** Card-like container */
  card: {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
  },
  /** Clickable/pressable area */
  pressable: {
    cursor: 'pointer',
  } as ViewStyle,
  /** Absolutely positioned fill */
  absoluteFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});

// ============================================================================
// ATOM FACTORY FUNCTIONS
// ============================================================================

/**
 * Create a custom spacing value style
 */
export function spacing(value: number): ViewStyle {
  return { margin: value };
}

/**
 * Calculate line height based on font size
 */
export function lineHeight(fontSize: number, multiplier: keyof typeof LINE_HEIGHT = 'normal'): number {
  return Math.round(fontSize * LINE_HEIGHT[multiplier]);
}

/**
 * Create inset style (padding shorthand)
 */
export function inset(
  top: number,
  right: number = top,
  bottom: number = top,
  left: number = right
): ViewStyle {
  return {
    paddingTop: top,
    paddingRight: right,
    paddingBottom: bottom,
    paddingLeft: left,
  };
}

// ============================================================================
// STYLE COMPOSITION UTILITY
// ============================================================================

/**
 * Safely flatten and compose multiple style objects
 * Similar to StyleSheet.compose but handles arrays
 */
export function compose<T extends AnyStyle>(...styles: (T | null | undefined | false)[]): T {
  const filtered = styles.filter(Boolean) as T[];
  return Object.assign({}, ...filtered);
}
