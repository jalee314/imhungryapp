/**
 * src/lib - Infrastructure Layer
 * 
 * Generic utilities and helpers that don't depend on business logic.
 * Following Bluesky's social-app architecture patterns.
 */

// API
export { Agent, agent } from './api'

// Hooks
export {
    useDisclosure,
    useToggle,
    useLoading,
    useDebounce,
    usePrevious,
    useIsMounted,
    type UseDisclosureReturn,
    type UseLoadingReturn,
} from './hooks'

// Strings
export {
    formatDistance,
    truncate,
    capitalizeFirst,
    capitalizeWords,
    pluralize,
    formatCount,
    cleanWhitespace,
    normalizeForComparison,
} from './strings/formatting'
