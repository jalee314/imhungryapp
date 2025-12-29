/**
 * atoms.ts
 *
 * Style primitives (atomic CSS) for the ImHungry app.
 * Inspired by Bluesky's ALF pattern and Tailwind CSS naming.
 *
 * Usage:
 *   import { atoms as a } from '#/ui'
 *   <View style={[a.flex_row, a.gap_md, a.p_lg]} />
 *
 * These are static styles that don't change with theme.
 * For theme-dependent styles (colors), use useTheme().
 */

import { StyleSheet } from 'react-native'
import * as tokens from './tokens'

export const atoms = StyleSheet.create({
  // ==========================================
  // Flexbox - Direction
  // ==========================================
  flex_row: { flexDirection: 'row' },
  flex_col: { flexDirection: 'column' },
  flex_row_reverse: { flexDirection: 'row-reverse' },
  flex_col_reverse: { flexDirection: 'column-reverse' },

  // ==========================================
  // Flexbox - Grow/Shrink
  // ==========================================
  flex_1: { flex: 1 },
  flex_0: { flex: 0 },
  flex_grow: { flexGrow: 1 },
  flex_shrink: { flexShrink: 1 },
  flex_shrink_0: { flexShrink: 0 },

  // ==========================================
  // Flexbox - Wrap
  // ==========================================
  flex_wrap: { flexWrap: 'wrap' },
  flex_nowrap: { flexWrap: 'nowrap' },

  // ==========================================
  // Alignment - Items (cross axis)
  // ==========================================
  align_start: { alignItems: 'flex-start' },
  align_center: { alignItems: 'center' },
  align_end: { alignItems: 'flex-end' },
  align_stretch: { alignItems: 'stretch' },
  align_baseline: { alignItems: 'baseline' },
  // Tailwind-style aliases
  items_start: { alignItems: 'flex-start' },
  items_center: { alignItems: 'center' },
  items_end: { alignItems: 'flex-end' },
  items_stretch: { alignItems: 'stretch' },
  items_baseline: { alignItems: 'baseline' },

  // ==========================================
  // Alignment - Self
  // ==========================================
  self_start: { alignSelf: 'flex-start' },
  self_center: { alignSelf: 'center' },
  self_end: { alignSelf: 'flex-end' },
  self_stretch: { alignSelf: 'stretch' },

  // ==========================================
  // Justify Content (main axis)
  // ==========================================
  justify_start: { justifyContent: 'flex-start' },
  justify_center: { justifyContent: 'center' },
  justify_end: { justifyContent: 'flex-end' },
  justify_between: { justifyContent: 'space-between' },
  justify_around: { justifyContent: 'space-around' },
  justify_evenly: { justifyContent: 'space-evenly' },

  // ==========================================
  // Gap (using 4px grid)
  // ==========================================
  gap_2xs: { gap: tokens.space._2xs },
  gap_xs: { gap: tokens.space.xs },
  gap_sm: { gap: tokens.space.sm },
  gap_md: { gap: tokens.space.md },
  gap_lg: { gap: tokens.space.lg },
  gap_xl: { gap: tokens.space.xl },
  gap_2xl: { gap: tokens.space._2xl },
  gap_3xl: { gap: tokens.space._3xl },

  // ==========================================
  // Padding - All sides
  // ==========================================
  p_0: { padding: 0 },
  p_2xs: { padding: tokens.space._2xs },
  p_xs: { padding: tokens.space.xs },
  p_sm: { padding: tokens.space.sm },
  p_md: { padding: tokens.space.md },
  p_lg: { padding: tokens.space.lg },
  p_xl: { padding: tokens.space.xl },
  p_2xl: { padding: tokens.space._2xl },
  p_3xl: { padding: tokens.space._3xl },

  // ==========================================
  // Padding - Horizontal (left + right)
  // ==========================================
  px_0: { paddingHorizontal: 0 },
  px_2xs: { paddingHorizontal: tokens.space._2xs },
  px_xs: { paddingHorizontal: tokens.space.xs },
  px_sm: { paddingHorizontal: tokens.space.sm },
  px_md: { paddingHorizontal: tokens.space.md },
  px_lg: { paddingHorizontal: tokens.space.lg },
  px_xl: { paddingHorizontal: tokens.space.xl },
  px_2xl: { paddingHorizontal: tokens.space._2xl },

  // ==========================================
  // Padding - Vertical (top + bottom)
  // ==========================================
  py_0: { paddingVertical: 0 },
  py_2xs: { paddingVertical: tokens.space._2xs },
  py_xs: { paddingVertical: tokens.space.xs },
  py_sm: { paddingVertical: tokens.space.sm },
  py_md: { paddingVertical: tokens.space.md },
  py_lg: { paddingVertical: tokens.space.lg },
  py_xl: { paddingVertical: tokens.space.xl },
  py_2xl: { paddingVertical: tokens.space._2xl },

  // ==========================================
  // Padding - Individual sides
  // ==========================================
  pt_0: { paddingTop: 0 },
  pt_xs: { paddingTop: tokens.space.xs },
  pt_sm: { paddingTop: tokens.space.sm },
  pt_md: { paddingTop: tokens.space.md },
  pt_lg: { paddingTop: tokens.space.lg },
  pt_xl: { paddingTop: tokens.space.xl },
  pt_2xl: { paddingTop: tokens.space._2xl },

  pb_0: { paddingBottom: 0 },
  pb_xs: { paddingBottom: tokens.space.xs },
  pb_sm: { paddingBottom: tokens.space.sm },
  pb_md: { paddingBottom: tokens.space.md },
  pb_lg: { paddingBottom: tokens.space.lg },
  pb_xl: { paddingBottom: tokens.space.xl },
  pb_2xl: { paddingBottom: tokens.space._2xl },

  pl_0: { paddingLeft: 0 },
  pl_xs: { paddingLeft: tokens.space.xs },
  pl_sm: { paddingLeft: tokens.space.sm },
  pl_md: { paddingLeft: tokens.space.md },
  pl_lg: { paddingLeft: tokens.space.lg },
  pl_xl: { paddingLeft: tokens.space.xl },

  pr_0: { paddingRight: 0 },
  pr_xs: { paddingRight: tokens.space.xs },
  pr_sm: { paddingRight: tokens.space.sm },
  pr_md: { paddingRight: tokens.space.md },
  pr_lg: { paddingRight: tokens.space.lg },
  pr_xl: { paddingRight: tokens.space.xl },

  // ==========================================
  // Margin - All sides
  // ==========================================
  m_0: { margin: 0 },
  m_xs: { margin: tokens.space.xs },
  m_sm: { margin: tokens.space.sm },
  m_md: { margin: tokens.space.md },
  m_lg: { margin: tokens.space.lg },
  m_xl: { margin: tokens.space.xl },
  m_auto: { margin: 'auto' as any },

  // ==========================================
  // Margin - Horizontal
  // ==========================================
  mx_0: { marginHorizontal: 0 },
  mx_xs: { marginHorizontal: tokens.space.xs },
  mx_sm: { marginHorizontal: tokens.space.sm },
  mx_md: { marginHorizontal: tokens.space.md },
  mx_lg: { marginHorizontal: tokens.space.lg },
  mx_auto: { marginHorizontal: 'auto' as any },

  // ==========================================
  // Margin - Vertical
  // ==========================================
  my_0: { marginVertical: 0 },
  my_xs: { marginVertical: tokens.space.xs },
  my_sm: { marginVertical: tokens.space.sm },
  my_md: { marginVertical: tokens.space.md },
  my_lg: { marginVertical: tokens.space.lg },

  // ==========================================
  // Margin - Individual sides
  // ==========================================
  mt_0: { marginTop: 0 },
  mt_xs: { marginTop: tokens.space.xs },
  mt_sm: { marginTop: tokens.space.sm },
  mt_md: { marginTop: tokens.space.md },
  mt_lg: { marginTop: tokens.space.lg },
  mt_xl: { marginTop: tokens.space.xl },

  mb_0: { marginBottom: 0 },
  mb_xs: { marginBottom: tokens.space.xs },
  mb_sm: { marginBottom: tokens.space.sm },
  mb_md: { marginBottom: tokens.space.md },
  mb_lg: { marginBottom: tokens.space.lg },
  mb_xl: { marginBottom: tokens.space.xl },

  ml_0: { marginLeft: 0 },
  ml_xs: { marginLeft: tokens.space.xs },
  ml_sm: { marginLeft: tokens.space.sm },
  ml_md: { marginLeft: tokens.space.md },
  ml_lg: { marginLeft: tokens.space.lg },

  mr_0: { marginRight: 0 },
  mr_xs: { marginRight: tokens.space.xs },
  mr_sm: { marginRight: tokens.space.sm },
  mr_md: { marginRight: tokens.space.md },
  mr_lg: { marginRight: tokens.space.lg },

  // ==========================================
  // Width & Height
  // ==========================================
  w_full: { width: '100%' },
  w_auto: { width: 'auto' },
  h_full: { height: '100%' },
  h_auto: { height: 'auto' },
  min_h_0: { minHeight: 0 },

  // ==========================================
  // Position
  // ==========================================
  relative: { position: 'relative' },
  absolute: { position: 'absolute' },

  // ==========================================
  // Inset (for absolute positioning)
  // ==========================================
  inset_0: { top: 0, right: 0, bottom: 0, left: 0 },
  top_0: { top: 0 },
  right_0: { right: 0 },
  bottom_0: { bottom: 0 },
  left_0: { left: 0 },

  // ==========================================
  // Border Width
  // ==========================================
  border: { borderWidth: 1 },
  border_0: { borderWidth: 0 },
  border_t: { borderTopWidth: 1 },
  border_b: { borderBottomWidth: 1 },
  border_l: { borderLeftWidth: 1 },
  border_r: { borderRightWidth: 1 },

  // ==========================================
  // Border Radius
  // ==========================================
  rounded_none: { borderRadius: tokens.radius.none },
  rounded_xs: { borderRadius: tokens.radius.xs },
  rounded_sm: { borderRadius: tokens.radius.sm },
  rounded_md: { borderRadius: tokens.radius.md },
  rounded_lg: { borderRadius: tokens.radius.lg },
  rounded_xl: { borderRadius: tokens.radius.xl },
  rounded_full: { borderRadius: tokens.radius.full },

  // ==========================================
  // Font Size
  // ==========================================
  text_2xs: { fontSize: tokens.fontSize._2xs },
  text_xs: { fontSize: tokens.fontSize.xs },
  text_sm: { fontSize: tokens.fontSize.sm },
  text_md: { fontSize: tokens.fontSize.md },
  text_lg: { fontSize: tokens.fontSize.lg },
  text_xl: { fontSize: tokens.fontSize.xl },
  text_2xl: { fontSize: tokens.fontSize._2xl },
  text_3xl: { fontSize: tokens.fontSize._3xl },
  text_4xl: { fontSize: tokens.fontSize._4xl },
  text_5xl: { fontSize: tokens.fontSize._5xl },

  // ==========================================
  // Font Weight
  // ==========================================
  font_light: { fontWeight: tokens.fontWeight.light },
  font_normal: { fontWeight: tokens.fontWeight.normal },
  font_medium: { fontWeight: tokens.fontWeight.medium },
  font_semibold: { fontWeight: tokens.fontWeight.semibold },
  font_bold: { fontWeight: tokens.fontWeight.bold },

  // ==========================================
  // Line Height
  // ==========================================
  leading_none: { lineHeight: tokens.lineHeight.none },
  leading_tight: { lineHeight: tokens.lineHeight.tight },
  leading_snug: { lineHeight: tokens.lineHeight.snug },
  leading_normal: { lineHeight: tokens.lineHeight.normal },
  leading_relaxed: { lineHeight: tokens.lineHeight.relaxed },

  // ==========================================
  // Text Align
  // ==========================================
  text_left: { textAlign: 'left' },
  text_center: { textAlign: 'center' },
  text_right: { textAlign: 'right' },

  // ==========================================
  // Text Transform
  // ==========================================
  uppercase: { textTransform: 'uppercase' },
  lowercase: { textTransform: 'lowercase' },
  capitalize: { textTransform: 'capitalize' },

  // ==========================================
  // Overflow
  // ==========================================
  overflow_hidden: { overflow: 'hidden' },
  overflow_visible: { overflow: 'visible' },
  overflow_scroll: { overflow: 'scroll' },

  // ==========================================
  // Opacity
  // ==========================================
  opacity_0: { opacity: 0 },
  opacity_25: { opacity: 0.25 },
  opacity_50: { opacity: 0.5 },
  opacity_75: { opacity: 0.75 },
  opacity_100: { opacity: 1 },

  // ==========================================
  // Z-Index
  // ==========================================
  z_0: { zIndex: tokens.zIndex.base },
  z_10: { zIndex: tokens.zIndex.dropdown },
  z_20: { zIndex: tokens.zIndex.sticky },
  z_30: { zIndex: tokens.zIndex.fixed },
  z_40: { zIndex: tokens.zIndex.modal },
  z_50: { zIndex: tokens.zIndex.popover },

  // ==========================================
  // Background Colors
  // ==========================================
  bg_white: { backgroundColor: tokens.color.white },
  bg_black: { backgroundColor: tokens.color.black },
  bg_transparent: { backgroundColor: tokens.color.transparent },
  bg_primary_100: { backgroundColor: tokens.color.primary_100 },
  bg_primary_500: { backgroundColor: tokens.color.primary_500 },
  bg_primary_600: { backgroundColor: tokens.color.primary_600 },
  bg_gray_50: { backgroundColor: tokens.color.gray_50 },
  bg_gray_100: { backgroundColor: tokens.color.gray_100 },
  bg_gray_200: { backgroundColor: tokens.color.gray_200 },

  // ==========================================
  // Border Colors
  // ==========================================
  border_gray_200: { borderColor: tokens.color.gray_200 },
  border_gray_300: { borderColor: tokens.color.gray_300 },
  border_gray_500: { borderColor: tokens.color.gray_500 },
  border_primary_500: { borderColor: tokens.color.primary_500 },
  border_primary_600: { borderColor: tokens.color.primary_600 },
  border_transparent: { borderColor: tokens.color.transparent },
  border_white: { borderColor: tokens.color.white },
  border_black: { borderColor: tokens.color.black },

  // ==========================================
  // Text Colors
  // ==========================================
  text_white: { color: tokens.color.white },
  text_black: { color: tokens.color.black },
  text_primary_500: { color: tokens.color.primary_500 },
  text_primary_600: { color: tokens.color.primary_600 },
  text_gray_400: { color: tokens.color.gray_400 },
  text_gray_500: { color: tokens.color.gray_500 },
  text_gray_600: { color: tokens.color.gray_600 },
  text_gray_700: { color: tokens.color.gray_700 },
  text_gray_800: { color: tokens.color.gray_800 },
})

// Export atoms as 'a' shorthand (Bluesky convention)
export { atoms as a }
