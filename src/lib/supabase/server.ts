import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from '@/types/database.types'
/**
 * createClient() — Server-Side Supabase Client
 *
 * Use this in:
 *   - Server Components (default in Next.js App Router)
 *   - API Routes (app/api/...)
 *   - Server Actions
 *
 * The key difference from the browser client is cookie handling.
 * Authentication sessions in Next.js are stored in cookies.
 * On the server, we need to manually read and write those cookies
 * so Supabase knows who is logged in.
 *
 * next/headers gives us access to the request cookies on the server.
 * The browser client handles this automatically, but the server
 * client needs explicit cookie management.
 *
 * This function is async because cookies() in Next.js is async.
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        // Read all cookies from the incoming request
        getAll() {
          return cookieStore.getAll()
        },
        // Write cookies back to the response (e.g. refreshing a session token)
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // setAll can be called from a Server Component where
            // setting cookies isn't allowed. This is safe to ignore
            // because middleware handles session refreshing instead.
          }
        },
      },
    }
  )
}