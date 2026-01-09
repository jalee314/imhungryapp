import * as tokens from './tokens'

/**
 * Theme type definition
 */
export type ThemeName = 'light' | 'dark'

export type Palette = {
    primary: string
    primaryLight: string
    background: string
    backgroundSecondary: string
    text: string
    textSecondary: string
    textMuted: string
    border: string
    borderLight: string
    white: string
    black: string
    error: string
    success: string
    warning: string
}

export type Theme = {
    name: ThemeName
    palette: Palette
}

/**
 * Light theme palette
 */
export const lightPalette: Palette = {
    primary: tokens.color.brand.primary,
    primaryLight: tokens.color.brand.primary_light,
    background: tokens.color.white,
    backgroundSecondary: tokens.color.gray['950'],
    text: tokens.color.gray['0'],
    textSecondary: tokens.color.gray['500'],
    textMuted: tokens.color.gray['600'],
    border: tokens.color.gray['800'],
    borderLight: tokens.color.gray['900'],
    white: tokens.color.white,
    black: tokens.color.gray['0'],
    error: '#EF4444',
    success: '#22C55E',
    warning: '#F59E0B',
}

/**
 * Dark theme palette
 */
export const darkPalette: Palette = {
    primary: tokens.color.brand.primary,
    primaryLight: tokens.color.brand.primary_light,
    background: tokens.color.gray['100'],
    backgroundSecondary: tokens.color.gray['200'],
    text: tokens.color.white,
    textSecondary: tokens.color.gray['700'],
    textMuted: tokens.color.gray['600'],
    border: tokens.color.gray['400'],
    borderLight: tokens.color.gray['300'],
    white: tokens.color.white,
    black: tokens.color.gray['0'],
    error: '#F87171',
    success: '#4ADE80',
    warning: '#FBBF24',
}

/**
 * Light theme
 */
export const light: Theme = {
    name: 'light',
    palette: lightPalette,
}

/**
 * Dark theme
 */
export const dark: Theme = {
    name: 'dark',
    palette: darkPalette,
}

/**
 * All available themes
 */
export const themes = {
    light,
    dark,
    lightPalette,
    darkPalette,
} as const
