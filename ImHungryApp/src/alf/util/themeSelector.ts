import { ThemeName } from '../themes'

/**
 * Select a value based on the current theme
 */
export function select<T>(themeName: ThemeName, options: { light: T; dark: T }): T {
    return options[themeName]
}

/**
 * Alias for backwards compatibility
 */
export const themeSelect = select
