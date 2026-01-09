/**
 * String formatting utilities
 * 
 * Generic string manipulation functions that don't depend on business logic.
 */

// ============================================
// DISTANCE FORMATTING
// ============================================

/**
 * Format distance in miles to human-readable string
 */
export function formatDistance(miles: number): string {
    if (miles < 0) return ''
    if (miles < 0.1) return 'nearby'
    if (miles < 1) return `${Math.round(miles * 5280)} ft`
    return `${miles.toFixed(1)} mi`
}

// ============================================
// TEXT MANIPULATION
// ============================================

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number, ellipsis = '...'): string {
    if (!text || text.length <= maxLength) return text
    return text.slice(0, maxLength - ellipsis.length) + ellipsis
}

/**
 * Capitalize first letter of string
 */
export function capitalizeFirst(str: string): string {
    if (!str) return ''
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

/**
 * Capitalize first letter of each word
 */
export function capitalizeWords(str: string): string {
    if (!str) return ''
    return str
        .split(' ')
        .map(word => capitalizeFirst(word))
        .join(' ')
}

// ============================================
// PLURALIZATION
// ============================================

/**
 * Simple pluralization
 */
export function pluralize(count: number, singular: string, plural?: string): string {
    if (count === 1) return singular
    return plural ?? `${singular}s`
}

/**
 * Format count with label, e.g., "5 deals" or "1 deal"
 */
export function formatCount(count: number, singular: string, plural?: string): string {
    return `${count} ${pluralize(count, singular, plural)}`
}

// ============================================
// SANITIZATION
// ============================================

/**
 * Remove extra whitespace and trim
 */
export function cleanWhitespace(str: string): string {
    return str.replace(/\s+/g, ' ').trim()
}

/**
 * Normalize string for comparison (lowercase, trimmed, no extra spaces)
 */
export function normalizeForComparison(str: string): string {
    return cleanWhitespace(str.toLowerCase())
}
