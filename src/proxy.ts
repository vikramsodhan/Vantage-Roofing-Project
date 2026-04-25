import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * middleware.ts — Route Protection & Session Management
 *
 * This file runs on EVERY request before it reaches any page or API route.
 * Think of it as a security guard at the door — it checks credentials
 * before letting anyone through.
 *
 * It does three things:
 *   1. Refreshes the user's session token if it's about to expire
 *   2. Checks if the user is logged in — redirects to /login if not
 *   3. Checks if the user is active — signs out deactivated users immediately
 *
 * Why handle session refresh here? Because Supabase sessions expire
 * after a period of time. Middleware runs on every request, making it
 * the perfect place to silently refresh tokens before they expire,
 * keeping the user logged in without interruption.
 */
export async function proxy(request: NextRequest) {
  // Start by passing the request through unchanged.
  // We'll modify this response if we need to set cookies or redirect.
  let supabaseResponse = NextResponse.next({ request })

  // Create a Supabase client that can read/write cookies on the request/response.
  // This is slightly different from the server client in server.ts because
  // middleware has its own cookie API separate from next/headers.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: getUser() validates the session with Supabase's servers.
  // Never use getSession() for security checks — it only reads the local
  // cookie without verifying it's still valid on the server.
  const { data: { user } } = await supabase.auth.getUser()

  const isPublicRoute =
  request.nextUrl.pathname.startsWith('/login') ||
  request.nextUrl.pathname.startsWith('/auth')

  // Redirect authenticated users away from login/auth pages
  if (user && isPublicRoute) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // If a user is logged in, check if they are still active.
  // This is what enforces the is_active flag — the moment an owner
  // deactivates someone, their next request hits this check and
  // they are immediately signed out.
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_active')
      .eq('id', user.id)
      .single()

    if (!profile?.is_active) {
      // Sign them out and redirect with a reason in the URL
      // so the login page can show a helpful message

      await supabase.auth.signOut()
      return NextResponse.redirect(
        new URL('/login?reason=deactivated', request.url)
      )
    }
  }

  // If no user is logged in, redirect to login.
  // We exclude /login and /auth paths so they don't get caught in
  // a redirect loop (middleware would redirect → /login → middleware
  // → /login forever without this check).
  if (!user && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // All checks passed — let the request through
  return supabaseResponse
}

/**
 * config.matcher — Which routes does middleware run on?
 *
 * This regex matches everything EXCEPT:
 *   - _next/static  (Next.js bundled JS/CSS files)
 *   - _next/image   (Next.js image optimization)
 *   - favicon.ico   (browser tab icon)
 *   - image files   (.svg, .png, .jpg, etc.)
 *
 * We exclude these because they're static assets — no auth check needed,
 * and running middleware on them would slow things down unnecessarily.
 */
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}