/**
 * flatten.ts
 *
 * Style flattening utility.
 * Re-exports React Native's StyleSheet.flatten for convenience.
 */

import { StyleSheet, StyleProp, ViewStyle, TextStyle, ImageStyle } from 'react-native'

/**
 * Flatten a style array into a single style object.
 * Useful when you need to read computed style values.
 *
 * @example
 * const style = flatten([a.flex_1, a.p_md, { backgroundColor: 'red' }])
 * console.log(style.padding) // 12
 */
export const flatten = StyleSheet.flatten

/**
 * Type-safe flatten for view styles.
 */
export function flattenViewStyle(style: StyleProp<ViewStyle>): ViewStyle {
  return StyleSheet.flatten(style) ?? {}
}

/**
 * Type-safe flatten for text styles.
 */
export function flattenTextStyle(style: StyleProp<TextStyle>): TextStyle {
  return StyleSheet.flatten(style) ?? {}
}

/**
 * Type-safe flatten for image styles.
 */
export function flattenImageStyle(style: StyleProp<ImageStyle>): ImageStyle {
  return StyleSheet.flatten(style) ?? {}
}
