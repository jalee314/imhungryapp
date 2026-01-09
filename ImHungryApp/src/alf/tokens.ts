export const color = {
    brand: {
        primary: '#FF8C4C',
        primary_light: '#FFA05C',
    },
    gray: {
        '0': '#000000',
        '100': '#181619',
        '200': '#1D1B20',
        '300': '#333333',
        '400': '#404040',
        '500': '#666666',
        '600': '#757575',
        '700': '#999999',
        '800': '#CCCCCC',
        '900': '#D7D7D7',
        '950': '#DEDEDE',
    },
    white: '#FFFFFF',
    white_transparent: '#ffffffed',
    error: 'red',
} as const

export const space = {
    zero: 0,
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
} as const

export const fontSize = {
    xs: 10,
    sm: 11,
    md: 12,
    lg: 14,
    xl: 16,
    xxl: 18,
    xxxl: 24,
} as const

export const borderRadius = {
    none: 0,
    xs: 4,
    sm: 8,
    md: 10,
    lg: 20,
    xl: 25,
    full: 30,
} as const

export const border = {
    width: {
        hairline: 0.5,
        thin: 1,
    },
} as const

export const tokens = {
    color,
    space,
    fontSize,
    borderRadius,
    border,
} as const

export type ColorToken = keyof typeof color
export type SpaceToken = keyof typeof space
export type FontSizeToken = keyof typeof fontSize
export type BorderRadiusToken = keyof typeof borderRadius
