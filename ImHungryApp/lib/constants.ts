/**
 * Global Constants for ImHungri Application
 */

export const CACHE = {
    DEALS_KEY: 'cached_deals',
    DEALS_TIMESTAMP_KEY: 'cached_deals_timestamp',
    DURATION_MS: 5 * 60 * 1000, // 5 minutes
} as const

export const LOCATION = {
    MAX_DISTANCE_MILES: 20,
    EARTH_RADIUS_MILES: 3958.8,
} as const

export const IMAGE = {
    VARIANT_THRESHOLDS: {
        profile: {
            thumbnail: 100,
            small: 200,
            medium: 400,
            large: 800
        },
        deal: {
            thumbnail: 200,
            small: 400,
            medium: 800,
            large: 1200
        },
        restaurant: {
            thumbnail: 100,
            small: 200,
            medium: 400,
            large: 800
        },
        franchise_logo: {
            thumbnail: 100,
            small: 200,
            medium: 400,
            large: 800
        }
    }
} as const

export const AUTH = {
    EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    PASSWORD_RESET_REDIRECT: 'https://imhungri.netlify.app/',
} as const

export const UI = {
    MAX_CONTENT_WIDTH: 560,
} as const

export const STATE_ABBREVIATIONS: Record<string, string> = {
    'alabama': 'AL', 'alaska': 'AK', 'arizona': 'AZ', 'arkansas': 'AR', 'california': 'CA',
    'colorado': 'CO', 'connecticut': 'CT', 'delaware': 'DE', 'florida': 'FL', 'georgia': 'GA',
    'hawaii': 'HI', 'idaho': 'ID', 'illinois': 'IL', 'indiana': 'IN', 'iowa': 'IA',
    'kansas': 'KS', 'kentucky': 'KY', 'louisiana': 'LA', 'maine': 'ME', 'maryland': 'MD',
    'massachusetts': 'MA', 'michigan': 'MI', 'minnesota': 'MN', 'mississippi': 'MS', 'missouri': 'MO',
    'montana': 'MT', 'nebraska': 'NE', 'nevada': 'NV', 'new hampshire': 'NH', 'new jersey': 'NJ',
    'new mexico': 'NM', 'new york': 'NY', 'north carolina': 'NC', 'north dakota': 'ND', 'ohio': 'OH',
    'oklahoma': 'OK', 'oregon': 'OR', 'pennsylvania': 'PA', 'rhode island': 'RI', 'south carolina': 'SC',
    'south dakota': 'SD', 'tennessee': 'TN', 'texas': 'TX', 'utah': 'UT', 'vermont': 'VT',
    'virginia': 'VA', 'washington': 'WA', 'west virginia': 'WV', 'wisconsin': 'WI', 'wyoming': 'WY',
    'district of columbia': 'DC', 'puerto rico': 'PR', 'guam': 'GU', 'virgin islands': 'VI'
} as const
