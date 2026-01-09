/**
 * Generic reusable hooks - not tied to any specific business logic
 * 
 * These hooks can be used anywhere in the app and don't depend on
 * stores, services, or app-specific types.
 */

import { useState, useCallback, useRef, useEffect } from 'react'

// ============================================
// useDisclosure - For modals, drawers, etc.
// ============================================

export interface UseDisclosureReturn {
    isOpen: boolean
    open: () => void
    close: () => void
    toggle: () => void
    setIsOpen: (value: boolean) => void
}

export function useDisclosure(initialOpen = false): UseDisclosureReturn {
    const [isOpen, setIsOpen] = useState(initialOpen)

    const open = useCallback(() => setIsOpen(true), [])
    const close = useCallback(() => setIsOpen(false), [])
    const toggle = useCallback(() => setIsOpen(prev => !prev), [])

    return { isOpen, open, close, toggle, setIsOpen }
}

// ============================================
// useToggle - Simple boolean toggle
// ============================================

export function useToggle(initialValue = false): [boolean, () => void, (value: boolean) => void] {
    const [value, setValue] = useState(initialValue)
    const toggle = useCallback(() => setValue(prev => !prev), [])
    return [value, toggle, setValue]
}

// ============================================
// useLoading - Async operation loading state
// ============================================

export interface UseLoadingReturn {
    isLoading: boolean
    setLoading: (value: boolean) => void
    withLoading: <T>(fn: () => Promise<T>) => Promise<T>
}

export function useLoading(initialLoading = false): UseLoadingReturn {
    const [isLoading, setLoading] = useState(initialLoading)

    const withLoading = useCallback(async <T>(fn: () => Promise<T>): Promise<T> => {
        setLoading(true)
        try {
            return await fn()
        } finally {
            setLoading(false)
        }
    }, [])

    return { isLoading, setLoading, withLoading }
}

// ============================================
// useDebounce - Debounce rapidly changing values
// ============================================

export function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState(value)

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedValue(value)
        }, delay)

        return () => clearTimeout(timer)
    }, [value, delay])

    return debouncedValue
}

// ============================================
// usePrevious - Track previous value
// ============================================

export function usePrevious<T>(value: T): T | undefined {
    const ref = useRef<T | undefined>(undefined)

    useEffect(() => {
        ref.current = value
    }, [value])

    return ref.current
}

// ============================================
// useIsMounted - Check if component is mounted
// ============================================

export function useIsMounted(): () => boolean {
    const isMountedRef = useRef(false)

    useEffect(() => {
        isMountedRef.current = true
        return () => {
            isMountedRef.current = false
        }
    }, [])

    return useCallback(() => isMountedRef.current, [])
}
