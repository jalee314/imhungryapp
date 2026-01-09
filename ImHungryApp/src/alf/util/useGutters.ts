import { useMemo } from 'react'
import { ViewStyle } from 'react-native'
import * as tokens from '../tokens'
import { isMobile } from '../breakpoints'

export type GutterSize = 'none' | 'sm' | 'md' | 'lg' | 'xl'

/**
 * Hook that returns padding styles for consistent page gutters
 * Adapts based on screen size
 */
export function useGutters(size: GutterSize = 'md'): ViewStyle {
    return useMemo(() => {
        if (size === 'none') {
            return { paddingHorizontal: 0 }
        }

        const mobile = isMobile()

        const gutterMap: Record<GutterSize, number> = {
            none: 0,
            sm: mobile ? tokens.space.sm : tokens.space.md,
            md: mobile ? tokens.space.md : tokens.space.lg,
            lg: mobile ? tokens.space.lg : tokens.space.xl,
            xl: mobile ? tokens.space.xl : tokens.space.xxl,
        }

        return {
            paddingHorizontal: gutterMap[size],
        }
    }, [size])
}
