import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/database.types'

/**
 * createClient() — Browser (Client-Side) Supabase Client
 *
 * Use this in Client Components (files with 'use client' at the top).
 * This runs in the user's browser and handles:
 *   - Login / logout actions
 *   - Reading the current session on the client side
 *   - Any non-sensitive Supabase queries from the browser
 *
 * The '!' after each env variable tells TypeScript "trust me,
 * this value exists" — without it TypeScript would complain that
 * the variable might be undefined.
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )
}