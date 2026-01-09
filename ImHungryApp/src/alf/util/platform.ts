import { Platform } from 'react-native'

/**
 * Returns styles only for web platform
 */
export function web<T extends object>(styles: T): T | undefined {
    return Platform.OS === 'web' ? styles : undefined
}

/**
 * Returns styles only for native platforms (iOS/Android)
 */
export function native<T extends object>(styles: T): T | undefined {
    return Platform.OS !== 'web' ? styles : undefined
}

/**
 * Returns styles only for iOS platform
 */
export function ios<T extends object>(styles: T): T | undefined {
    return Platform.OS === 'ios' ? styles : undefined
}

/**
 * Returns styles only for Android platform
 */
export function android<T extends object>(styles: T): T | undefined {
    return Platform.OS === 'android' ? styles : undefined
}

/**
 * Platform-specific style helper
 * Returns the appropriate style based on the current platform
 */
export function platform<T extends object>(options: {
    web?: T
    ios?: T
    android?: T
    native?: T
    default?: T
}): T | undefined {
    if (Platform.OS === 'web' && options.web) {
        return options.web
    }
    if (Platform.OS === 'ios' && options.ios) {
        return options.ios
    }
    if (Platform.OS === 'android' && options.android) {
        return options.android
    }
    if (Platform.OS !== 'web' && options.native) {
        return options.native
    }
    return options.default
}

/**
 * Check if running on web
 */
export const isWeb = Platform.OS === 'web'

/**
 * Check if running on iOS
 */
export const isIOS = Platform.OS === 'ios'

/**
 * Check if running on Android
 */
export const isAndroid = Platform.OS === 'android'

/**
 * Check if running on native (iOS or Android)
 */
export const isNative = Platform.OS !== 'web'
