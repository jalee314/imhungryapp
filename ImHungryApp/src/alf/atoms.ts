import { StyleProp, ViewStyle, TextStyle } from 'react-native'
import * as tokens from './tokens'

/**
 * An (mostly-complete) set of style definitions that match Tailwind CSS selectors.
 * These are static and reused throughout the app.
 *
 * Usage:
 *   import { atoms } from '#/alf'
 *   <View style={[atoms.flex_row]} />
 */
export const atoms = {
    /*
     * Positioning
     */
    absolute: {
        position: 'absolute',
    },
    relative: {
        position: 'relative',
    },
    inset_0: {
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },

    /*
     * Width
     */
    w_full: {
        width: '100%',
    },
    w_auto: {
        width: 'auto',
    },

    /*
     * Height
     */
    h_full: {
        height: '100%',
    },
    h_auto: {
        height: 'auto',
    },

    /*
     * Flex
     */
    flex: {
        display: 'flex',
    },
    flex_1: {
        flex: 1,
    },
    flex_grow: {
        flexGrow: 1,
    },
    flex_shrink: {
        flexShrink: 1,
    },
    flex_shrink_0: {
        flexShrink: 0,
    },
    flex_row: {
        flexDirection: 'row',
    },
    flex_col: {
        flexDirection: 'column',
    },
    flex_row_reverse: {
        flexDirection: 'row-reverse',
    },
    flex_col_reverse: {
        flexDirection: 'column-reverse',
    },
    flex_wrap: {
        flexWrap: 'wrap',
    },
    flex_nowrap: {
        flexWrap: 'nowrap',
    },

    /*
     * Align Items
     */
    align_start: {
        alignItems: 'flex-start',
    },
    align_end: {
        alignItems: 'flex-end',
    },
    align_center: {
        alignItems: 'center',
    },
    align_baseline: {
        alignItems: 'baseline',
    },
    align_stretch: {
        alignItems: 'stretch',
    },

    /*
     * Justify Content
     */
    justify_start: {
        justifyContent: 'flex-start',
    },
    justify_end: {
        justifyContent: 'flex-end',
    },
    justify_center: {
        justifyContent: 'center',
    },
    justify_between: {
        justifyContent: 'space-between',
    },
    justify_around: {
        justifyContent: 'space-around',
    },
    justify_evenly: {
        justifyContent: 'space-evenly',
    },

    /*
     * Self Alignment
     */
    self_auto: {
        alignSelf: 'auto',
    },
    self_start: {
        alignSelf: 'flex-start',
    },
    self_end: {
        alignSelf: 'flex-end',
    },
    self_center: {
        alignSelf: 'center',
    },
    self_stretch: {
        alignSelf: 'stretch',
    },

    /*
     * Gap
     */
    gap_0: {
        gap: 0,
    },
    gap_2xs: {
        gap: 2,
    },
    gap_xs: {
        gap: tokens.space.xs,
    },
    gap_sm: {
        gap: tokens.space.sm,
    },
    gap_md: {
        gap: tokens.space.md,
    },
    gap_lg: {
        gap: tokens.space.lg,
    },
    gap_xl: {
        gap: tokens.space.xl,
    },
    gap_xxl: {
        gap: tokens.space.xxl,
    },
    gap_xxxl: {
        gap: tokens.space.xxxl,
    },

    /*
     * Padding - All sides
     */
    p_0: {
        padding: 0,
    },
    p_2xs: {
        padding: 2,
    },
    p_xs: {
        padding: tokens.space.xs,
    },
    p_sm: {
        padding: tokens.space.sm,
    },
    p_md: {
        padding: tokens.space.md,
    },
    p_lg: {
        padding: tokens.space.lg,
    },
    p_xl: {
        padding: tokens.space.xl,
    },
    p_xxl: {
        padding: tokens.space.xxl,
    },
    p_xxxl: {
        padding: tokens.space.xxxl,
    },

    /*
     * Padding - Horizontal
     */
    px_0: {
        paddingHorizontal: 0,
    },
    px_2xs: {
        paddingHorizontal: 2,
    },
    px_xs: {
        paddingHorizontal: tokens.space.xs,
    },
    px_sm: {
        paddingHorizontal: tokens.space.sm,
    },
    px_md: {
        paddingHorizontal: tokens.space.md,
    },
    px_lg: {
        paddingHorizontal: tokens.space.lg,
    },
    px_xl: {
        paddingHorizontal: tokens.space.xl,
    },
    px_xxl: {
        paddingHorizontal: tokens.space.xxl,
    },
    px_xxxl: {
        paddingHorizontal: tokens.space.xxxl,
    },

    /*
     * Padding - Vertical
     */
    py_0: {
        paddingVertical: 0,
    },
    py_2xs: {
        paddingVertical: 2,
    },
    py_xs: {
        paddingVertical: tokens.space.xs,
    },
    py_sm: {
        paddingVertical: tokens.space.sm,
    },
    py_md: {
        paddingVertical: tokens.space.md,
    },
    py_lg: {
        paddingVertical: tokens.space.lg,
    },
    py_xl: {
        paddingVertical: tokens.space.xl,
    },
    py_xxl: {
        paddingVertical: tokens.space.xxl,
    },
    py_xxxl: {
        paddingVertical: tokens.space.xxxl,
    },

    /*
     * Padding - Top
     */
    pt_0: {
        paddingTop: 0,
    },
    pt_2xs: {
        paddingTop: 2,
    },
    pt_xs: {
        paddingTop: tokens.space.xs,
    },
    pt_sm: {
        paddingTop: tokens.space.sm,
    },
    pt_md: {
        paddingTop: tokens.space.md,
    },
    pt_lg: {
        paddingTop: tokens.space.lg,
    },
    pt_xl: {
        paddingTop: tokens.space.xl,
    },
    pt_xxl: {
        paddingTop: tokens.space.xxl,
    },
    pt_xxxl: {
        paddingTop: tokens.space.xxxl,
    },

    /*
     * Padding - Bottom
     */
    pb_0: {
        paddingBottom: 0,
    },
    pb_2xs: {
        paddingBottom: 2,
    },
    pb_xs: {
        paddingBottom: tokens.space.xs,
    },
    pb_sm: {
        paddingBottom: tokens.space.sm,
    },
    pb_md: {
        paddingBottom: tokens.space.md,
    },
    pb_lg: {
        paddingBottom: tokens.space.lg,
    },
    pb_xl: {
        paddingBottom: tokens.space.xl,
    },
    pb_xxl: {
        paddingBottom: tokens.space.xxl,
    },
    pb_xxxl: {
        paddingBottom: tokens.space.xxxl,
    },

    /*
     * Padding - Left
     */
    pl_0: {
        paddingLeft: 0,
    },
    pl_2xs: {
        paddingLeft: 2,
    },
    pl_xs: {
        paddingLeft: tokens.space.xs,
    },
    pl_sm: {
        paddingLeft: tokens.space.sm,
    },
    pl_md: {
        paddingLeft: tokens.space.md,
    },
    pl_lg: {
        paddingLeft: tokens.space.lg,
    },
    pl_xl: {
        paddingLeft: tokens.space.xl,
    },
    pl_xxl: {
        paddingLeft: tokens.space.xxl,
    },
    pl_xxxl: {
        paddingLeft: tokens.space.xxxl,
    },

    /*
     * Padding - Right
     */
    pr_0: {
        paddingRight: 0,
    },
    pr_2xs: {
        paddingRight: 2,
    },
    pr_xs: {
        paddingRight: tokens.space.xs,
    },
    pr_sm: {
        paddingRight: tokens.space.sm,
    },
    pr_md: {
        paddingRight: tokens.space.md,
    },
    pr_lg: {
        paddingRight: tokens.space.lg,
    },
    pr_xl: {
        paddingRight: tokens.space.xl,
    },
    pr_xxl: {
        paddingRight: tokens.space.xxl,
    },
    pr_xxxl: {
        paddingRight: tokens.space.xxxl,
    },

    /*
     * Margin - All sides
     */
    m_0: {
        margin: 0,
    },
    m_auto: {
        margin: 'auto',
    },
    m_2xs: {
        margin: 2,
    },
    m_xs: {
        margin: tokens.space.xs,
    },
    m_sm: {
        margin: tokens.space.sm,
    },
    m_md: {
        margin: tokens.space.md,
    },
    m_lg: {
        margin: tokens.space.lg,
    },
    m_xl: {
        margin: tokens.space.xl,
    },
    m_xxl: {
        margin: tokens.space.xxl,
    },
    m_xxxl: {
        margin: tokens.space.xxxl,
    },

    /*
     * Margin - Horizontal
     */
    mx_0: {
        marginHorizontal: 0,
    },
    mx_auto: {
        marginHorizontal: 'auto',
    },
    mx_2xs: {
        marginHorizontal: 2,
    },
    mx_xs: {
        marginHorizontal: tokens.space.xs,
    },
    mx_sm: {
        marginHorizontal: tokens.space.sm,
    },
    mx_md: {
        marginHorizontal: tokens.space.md,
    },
    mx_lg: {
        marginHorizontal: tokens.space.lg,
    },
    mx_xl: {
        marginHorizontal: tokens.space.xl,
    },
    mx_xxl: {
        marginHorizontal: tokens.space.xxl,
    },
    mx_xxxl: {
        marginHorizontal: tokens.space.xxxl,
    },

    /*
     * Margin - Vertical
     */
    my_0: {
        marginVertical: 0,
    },
    my_auto: {
        marginVertical: 'auto',
    },
    my_2xs: {
        marginVertical: 2,
    },
    my_xs: {
        marginVertical: tokens.space.xs,
    },
    my_sm: {
        marginVertical: tokens.space.sm,
    },
    my_md: {
        marginVertical: tokens.space.md,
    },
    my_lg: {
        marginVertical: tokens.space.lg,
    },
    my_xl: {
        marginVertical: tokens.space.xl,
    },
    my_xxl: {
        marginVertical: tokens.space.xxl,
    },
    my_xxxl: {
        marginVertical: tokens.space.xxxl,
    },

    /*
     * Margin - Top
     */
    mt_0: {
        marginTop: 0,
    },
    mt_auto: {
        marginTop: 'auto',
    },
    mt_2xs: {
        marginTop: 2,
    },
    mt_xs: {
        marginTop: tokens.space.xs,
    },
    mt_sm: {
        marginTop: tokens.space.sm,
    },
    mt_md: {
        marginTop: tokens.space.md,
    },
    mt_lg: {
        marginTop: tokens.space.lg,
    },
    mt_xl: {
        marginTop: tokens.space.xl,
    },
    mt_xxl: {
        marginTop: tokens.space.xxl,
    },
    mt_xxxl: {
        marginTop: tokens.space.xxxl,
    },

    /*
     * Margin - Bottom
     */
    mb_0: {
        marginBottom: 0,
    },
    mb_auto: {
        marginBottom: 'auto',
    },
    mb_2xs: {
        marginBottom: 2,
    },
    mb_xs: {
        marginBottom: tokens.space.xs,
    },
    mb_sm: {
        marginBottom: tokens.space.sm,
    },
    mb_md: {
        marginBottom: tokens.space.md,
    },
    mb_lg: {
        marginBottom: tokens.space.lg,
    },
    mb_xl: {
        marginBottom: tokens.space.xl,
    },
    mb_xxl: {
        marginBottom: tokens.space.xxl,
    },
    mb_xxxl: {
        marginBottom: tokens.space.xxxl,
    },

    /*
     * Margin - Left
     */
    ml_0: {
        marginLeft: 0,
    },
    ml_auto: {
        marginLeft: 'auto',
    },
    ml_2xs: {
        marginLeft: 2,
    },
    ml_xs: {
        marginLeft: tokens.space.xs,
    },
    ml_sm: {
        marginLeft: tokens.space.sm,
    },
    ml_md: {
        marginLeft: tokens.space.md,
    },
    ml_lg: {
        marginLeft: tokens.space.lg,
    },
    ml_xl: {
        marginLeft: tokens.space.xl,
    },
    ml_xxl: {
        marginLeft: tokens.space.xxl,
    },
    ml_xxxl: {
        marginLeft: tokens.space.xxxl,
    },

    /*
     * Margin - Right
     */
    mr_0: {
        marginRight: 0,
    },
    mr_auto: {
        marginRight: 'auto',
    },
    mr_2xs: {
        marginRight: 2,
    },
    mr_xs: {
        marginRight: tokens.space.xs,
    },
    mr_sm: {
        marginRight: tokens.space.sm,
    },
    mr_md: {
        marginRight: tokens.space.md,
    },
    mr_lg: {
        marginRight: tokens.space.lg,
    },
    mr_xl: {
        marginRight: tokens.space.xl,
    },
    mr_xxl: {
        marginRight: tokens.space.xxl,
    },
    mr_xxxl: {
        marginRight: tokens.space.xxxl,
    },

    /*
     * Border Radius
     */
    rounded_0: {
        borderRadius: 0,
    },
    rounded_2xs: {
        borderRadius: 2,
    },
    rounded_xs: {
        borderRadius: tokens.borderRadius.xs,
    },
    rounded_sm: {
        borderRadius: tokens.borderRadius.sm,
    },
    rounded_md: {
        borderRadius: tokens.borderRadius.md,
    },
    rounded_lg: {
        borderRadius: tokens.borderRadius.lg,
    },
    rounded_xl: {
        borderRadius: tokens.borderRadius.xl,
    },
    rounded_full: {
        borderRadius: 999,
    },

    /*
     * Border Width
     */
    border_0: {
        borderWidth: 0,
    },
    border: {
        borderWidth: 1,
    },
    border_t: {
        borderTopWidth: 1,
    },
    border_b: {
        borderBottomWidth: 1,
    },
    border_l: {
        borderLeftWidth: 1,
    },
    border_r: {
        borderRightWidth: 1,
    },

    /*
     * Overflow
     */
    overflow_hidden: {
        overflow: 'hidden',
    },
    overflow_visible: {
        overflow: 'visible',
    },
    overflow_scroll: {
        overflow: 'scroll',
    },

    /*
     * Opacity
     */
    opacity_0: {
        opacity: 0,
    },
    opacity_25: {
        opacity: 0.25,
    },
    opacity_50: {
        opacity: 0.5,
    },
    opacity_75: {
        opacity: 0.75,
    },
    opacity_100: {
        opacity: 1,
    },

    /*
     * Z-Index
     */
    z_0: {
        zIndex: 0,
    },
    z_10: {
        zIndex: 10,
    },
    z_20: {
        zIndex: 20,
    },
    z_30: {
        zIndex: 30,
    },
    z_40: {
        zIndex: 40,
    },
    z_50: {
        zIndex: 50,
    },

    /*
     * Pointer Events
     */
    pointer_events_none: {
        pointerEvents: 'none',
    },
    pointer_events_auto: {
        pointerEvents: 'auto',
    },
    pointer_events_box_none: {
        pointerEvents: 'box-none',
    },

    /*
     * Text Alignment
     */
    text_left: {
        textAlign: 'left',
    },
    text_center: {
        textAlign: 'center',
    },
    text_right: {
        textAlign: 'right',
    },

    /*
     * Font Size
     */
    text_2xs: {
        fontSize: 9,
    },
    text_xs: {
        fontSize: tokens.fontSize.xs,
    },
    text_sm: {
        fontSize: tokens.fontSize.sm,
    },
    text_md: {
        fontSize: tokens.fontSize.md,
    },
    text_lg: {
        fontSize: tokens.fontSize.lg,
    },
    text_xl: {
        fontSize: tokens.fontSize.xl,
    },
    text_2xl: {
        fontSize: tokens.fontSize.xxl,
    },
    text_3xl: {
        fontSize: tokens.fontSize.xxxl,
    },
    text_4xl: {
        fontSize: 30,
    },
    text_5xl: {
        fontSize: 36,
    },

    /*
     * Font Weight
     */
    font_normal: {
        fontWeight: 'normal',
    },
    font_medium: {
        fontWeight: '500',
    },
    font_semibold: {
        fontWeight: '600',
    },
    font_bold: {
        fontWeight: 'bold',
    },

    /*
     * Line Height
     */
    leading_none: {
        lineHeight: 1,
    },
    leading_tight: {
        lineHeight: 1.25,
    },
    leading_snug: {
        lineHeight: 1.375,
    },
    leading_normal: {
        lineHeight: 1.5,
    },
    leading_relaxed: {
        lineHeight: 1.625,
    },

    /*
     * Text Transform
     */
    uppercase: {
        textTransform: 'uppercase',
    },
    lowercase: {
        textTransform: 'lowercase',
    },
    capitalize: {
        textTransform: 'capitalize',
    },

    /*
     * Text Decoration
     */
    underline: {
        textDecorationLine: 'underline',
    },
    line_through: {
        textDecorationLine: 'line-through',
    },
    no_underline: {
        textDecorationLine: 'none',
    },

    /*
     * Theme-independent background colors
     */
    bg_transparent: {
        backgroundColor: 'transparent',
    },

    /*
     * Aspect Ratios
     */
    aspect_square: {
        aspectRatio: 1,
    },
    aspect_video: {
        aspectRatio: 16 / 9,
    },

    /*
     * User Select (for web compatibility)
     */
    select_none: {
        userSelect: 'none',
    },

    /*
     * Cursor (for web compatibility)
     */
    cursor_pointer: {
        cursor: 'pointer',
    },
    cursor_default: {
        cursor: 'default',
    },

    /*
     * App-specific Background Colors
     */
    bg_brand: {
        backgroundColor: tokens.color.brand.primary,
    },
    bg_brand_light: {
        backgroundColor: tokens.color.brand.primary_light,
    },
    bg_white: {
        backgroundColor: tokens.color.white,
    },
    bg_black: {
        backgroundColor: tokens.color.gray['0'],
    },

    /*
     * App-specific Text Colors
     */
    text_brand: {
        color: tokens.color.brand.primary,
    },
    text_white: {
        color: tokens.color.white,
    },
    text_black: {
        color: tokens.color.gray['0'],
    },
} as const

export type Atom = keyof typeof atoms
export type AtomStyle = (typeof atoms)[Atom]
export type StylePropView = StyleProp<ViewStyle>
export type StylePropText = StyleProp<TextStyle>
