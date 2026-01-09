import React from 'react'

import {
    computeFontScaleMultiplier,
    getFontFamily,
    getFontScale,
    setFontFamily as persistFontFamily,
    setFontScale as persistFontScale,
    FontScale,
    FontFamily,
} from './fonts'
import { themes, Theme, ThemeName } from './themes'

// Re-export atoms
export { atoms } from './atoms'
export { atoms as a } from './atoms'

// Re-export breakpoints
export * from './breakpoints'

// Re-export fonts
export * from './fonts'

// Re-export tokens
export * as tokens from './tokens'

// Re-export themes
export { themes, Theme, ThemeName, Palette } from './themes'

// Re-export utilities
export * from './util/flatten'
export * from './util/platform'
export * from './util/themeSelector'
export * from './util/useGutters'

// Re-export types from atoms
export type { Atom, AtomStyle, StylePropView, StylePropText } from './atoms'

/**
 * Style prop types for convenience
 */
import { StyleProp, ViewStyle, TextStyle } from 'react-native'
export type ViewStyleProp = StyleProp<ViewStyle>
export type TextStyleProp = StyleProp<TextStyle>

/**
 * ALF Context type definition
 */
export type Alf = {
    themeName: ThemeName
    theme: Theme
    themes: typeof themes
    fonts: {
        scale: FontScale
        scaleMultiplier: number
        family: FontFamily
        setFontScale: (fontScale: FontScale) => void
        setFontFamily: (fontFamily: FontFamily) => void
    }
    /**
     * Feature flags or other gated options
     */
    flags: Record<string, boolean>
}

/*
 * ALF Context
 */
export const Context = React.createContext<Alf>({
    themeName: 'dark',
    theme: themes.dark,
    themes,
    fonts: {
        scale: getFontScale(),
        scaleMultiplier: computeFontScaleMultiplier(getFontScale()),
        family: getFontFamily(),
        setFontScale: () => { },
        setFontFamily: () => { },
    },
    flags: {},
})
Context.displayName = 'AlfContext'

/**
 * Theme Provider component
 * Wrap your app with this to enable theming
 */
export function ThemeProvider({
    children,
    theme: themeName,
}: React.PropsWithChildren<{ theme: ThemeName }>) {
    const [fontScale, setFontScale] = React.useState<FontScale>(() =>
        getFontScale(),
    )
    const [fontScaleMultiplier, setFontScaleMultiplier] = React.useState(() =>
        computeFontScaleMultiplier(fontScale),
    )
    const setFontScaleAndPersist = React.useCallback<Alf['fonts']['setFontScale']>(
        (fs) => {
            setFontScale(fs)
            persistFontScale(fs)
            setFontScaleMultiplier(computeFontScaleMultiplier(fs))
        },
        [],
    )

    const [fontFamily, setFontFamily] = React.useState<FontFamily>(() =>
        getFontFamily(),
    )
    const setFontFamilyAndPersist = React.useCallback<Alf['fonts']['setFontFamily']>(
        (ff) => {
            setFontFamily(ff)
            persistFontFamily(ff)
        },
        [],
    )

    const value = React.useMemo<Alf>(
        () => ({
            themes,
            themeName: themeName,
            theme: themes[themeName],
            fonts: {
                scale: fontScale,
                scaleMultiplier: fontScaleMultiplier,
                family: fontFamily,
                setFontScale: setFontScaleAndPersist,
                setFontFamily: setFontFamilyAndPersist,
            },
            flags: {},
        }),
        [
            themeName,
            fontScale,
            setFontScaleAndPersist,
            fontFamily,
            setFontFamilyAndPersist,
            fontScaleMultiplier,
        ],
    )

    return <Context.Provider value={value}>{children}</Context.Provider>
}

/**
 * Get full ALF context
 */
export function useAlf(): Alf {
    return React.useContext(Context)
}

/**
 * Get current theme or a specific theme by name
 */
export function useTheme(themeName?: ThemeName): Theme {
    const alf = useAlf()
    return React.useMemo(() => {
        return themeName ? alf.themes[themeName] : alf.theme
    }, [themeName, alf])
}

/**
 * Get the current theme's palette
 */
export function usePalette() {
    const theme = useTheme()
    return theme.palette
}

/**
 * Get the current theme name
 */
export function useThemeName(): ThemeName {
    const alf = useAlf()
    return alf.themeName
}

/**
 * Check if using dark theme
 */
export function useIsDark(): boolean {
    const themeName = useThemeName()
    return themeName === 'dark'
}

/**
 * Get color scheme for system-aware components
 */
export function useColorScheme(): 'light' | 'dark' {
    return useThemeName()
}
