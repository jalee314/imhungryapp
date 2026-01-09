/**
 * Agent class - Centralized API wrapper for Supabase
 * 
 * Following Bluesky's social-app pattern, this class provides a unified
 * interface for all API interactions. Instead of importing supabase directly
 * in services, use this Agent class for better testability and consistency.
 */

import { supabase, clearAuthStorage } from '../../../lib/supabase'
import type { User, Session } from '@supabase/supabase-js'

export class Agent {
    private client = supabase

    // ============================================
    // AUTH METHODS
    // ============================================

    async getCurrentUser(): Promise<User | null> {
        const { data: { user } } = await this.client.auth.getUser()
        return user
    }

    async getCurrentSession(): Promise<Session | null> {
        const { data: { session } } = await this.client.auth.getSession()
        return session
    }

    async signInWithPassword(email: string, password: string) {
        return this.client.auth.signInWithPassword({ email, password })
    }

    async signUp(params: Parameters<typeof supabase.auth.signUp>[0]) {
        return this.client.auth.signUp(params)
    }

    async signOut() {
        return this.client.auth.signOut()
    }

    async clearAuthStorage() {
        return clearAuthStorage()
    }

    // ============================================
    // DATABASE QUERY HELPERS
    // ============================================

    /**
     * Get a typed query builder for any table
     */
    from<T extends string>(table: T) {
        return this.client.from(table)
    }

    /**
     * Call a Supabase Edge Function
     */
    async callFunction<T = unknown>(
        functionName: string,
        body?: Record<string, unknown>
    ): Promise<{ data: T | null; error: Error | null }> {
        const { data, error } = await this.client.functions.invoke(functionName, {
            body,
        })
        return { data: data as T | null, error }
    }

    // ============================================
    // STORAGE HELPERS
    // ============================================

    storage(bucketName: string) {
        return this.client.storage.from(bucketName)
    }

    // ============================================
    // RAW CLIENT ACCESS (escape hatch)
    // ============================================

    /**
     * Direct access to supabase client for advanced use cases.
     * Prefer using the methods above when possible.
     */
    get raw() {
        return this.client
    }
}

// Export a singleton instance for convenience
export const agent = new Agent()

// Also export the class for testing or multiple instances
export default Agent
