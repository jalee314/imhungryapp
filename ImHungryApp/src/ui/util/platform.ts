/**
 * platform.ts
 *
 * Platform detection utilities.
 * Helpers for writing platform-specific code.
 */

import { Platform } from 'react-native'

// ==========================================
// Platform Detection
// ==========================================

/** True if running on iOS */
export const isIOS = Platform.OS === 'ios'

/** True if running on Android */
export const isAndroid = Platform.OS === 'android'

/** True if running on web */
export const isWeb = Platform.OS === 'web'

/** True if running on native (iOS or Android) */
export const isNative = isIOS || isAndroid

// ==========================================
// Platform-Specific Style Helpers
// ==========================================

/**
 * Return styles only for iOS.
 *
 * @example
 * <View style={[a.p_md, ios({ paddingTop: 20 })]} />
 */
export function ios<T>(style: T): T | undefined {
  return isIOS ? style : undefined
}

/**
 * Return styles only for Android.
 *
 * @example
 * <View style={[a.p_md, android({ elevation: 4 })]} />
 */
export function android<T>(style: T): T | undefined {
  return isAndroid ? style : undefined
}

/**
 * Return styles only for web.
 *
 * @example
 * <View style={[a.p_md, web({ cursor: 'pointer' })]} />
 */
export function web<T>(style: T): T | undefined {
  return isWeb ? style : undefined
}

/**
 * Return styles only for native platforms.
 *
 * @example
 * <View style={[a.p_md, native({ shadowOpacity: 0.1 })]} />
 */
export function native<T>(style: T): T | undefined {
  return isNative ? style : undefined
}

// ==========================================
// Platform-Specific Value Selection
// ==========================================

interface PlatformValues<T> {
  ios?: T
  android?: T
  web?: T
  native?: T
  default: T
}

/**
 * Select a value based on platform.
 *
 * @example
 * const hitSlop = select({
 *   ios: 44,
 *   android: 48,
 *   default: 44,
 * })
 */
export function select<T>(values: PlatformValues<T>): T {
  if (isIOS && values.ios !== undefined) return values.ios
  if (isAndroid && values.android !== undefined) return values.android
  if (isWeb && values.web !== undefined) return values.web
  if (isNative && values.native !== undefined) return values.native
  return values.default
}
