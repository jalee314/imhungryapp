import { StyleProp, StyleSheet } from 'react-native'

/**
 * Flatten a style array into a single object.
 * Useful when you need to extract specific style values.
 */
export function flatten<T>(style: StyleProp<T>): T {
    return StyleSheet.flatten(style) as T
}
