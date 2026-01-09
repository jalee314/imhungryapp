/**
 * Font scale options
 */
export type FontScale = '-2' | '-1' | '0' | '1' | '2'

/**
 * Font family options
 */
export type FontFamily = 'system' | 'theme'

// In-memory storage (replace with AsyncStorage in production)
let _fontScale: FontScale = '0'
let _fontFamily: FontFamily = 'system'

/**
 * Get current font scale setting
 */
export function getFontScale(): FontScale {
    return _fontScale
}

/**
 * Set font scale setting (persists to storage)
 */
export function setFontScale(scale: FontScale): void {
    _fontScale = scale
    // TODO: Persist to AsyncStorage
}

/**
 * Get current font family setting
 */
export function getFontFamily(): FontFamily {
    return _fontFamily
}

/**
 * Set font family setting (persists to storage)
 */
export function setFontFamily(family: FontFamily): void {
    _fontFamily = family
    // TODO: Persist to AsyncStorage
}

/**
 * Compute font scale multiplier from font scale setting
 * Maps the scale setting to an actual multiplier value
 */
export function computeFontScaleMultiplier(scale: FontScale): number {
    const multipliers: Record<FontScale, number> = {
        '-2': 0.85,
        '-1': 0.92,
        '0': 1.0,
        '1': 1.1,
        '2': 1.2,
    }
    return multipliers[scale]
}
