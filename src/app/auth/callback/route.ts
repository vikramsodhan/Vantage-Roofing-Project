/**
 * app/auth/callback/route.ts — OAuth Callback Handler
 *
 * This route exists solely to handle the redirect back from Google
 * after a user completes the OAuth flow.
 *
 * Why this file is necessary:
 * OAuth works by redirecting the user to Google, then Google redirects
 * them back to a URL you control with a temporary one-time `code`.
 * That code must be exchanged server-side for a real Supabase session.
 * This route does that exchange. Without it, the user bounces back
 * from Google with a code in the URL and nothing handles it.
 *
 * What this route does step by step:
 * 1. Receives the temporary `code` from Google via URL param
 * 2. Exchanges it with Supabase for a real session
 * 3. Checks the user's email domain (second security layer after hd param)
 * 4. Checks if a profile exists for this user
 * 5. If first time signing in, auto-creates a profile with role = 'employee'
 * 6. Redirects to /dashboard
 *
 * Domain check here vs hd param:
 * The `hd` parameter in login.tsx restricts the Google account picker.
 * However, a technically savvy user could manipulate the OAuth request
 * and remove that parameter. This server-side check is the real enforcement
 * — it runs after the session is created and rejects anyone whose email
 * doesn't match the allowed domain, regardless of how they got here.
 */

import { getProfile } from "@/lib/supabase/getProfile"
import { createClient } from "@/lib/supabase/server"
import { NextResponse, type NextRequest } from "next/server"

const ALLOWED_DOMAIN = "vantageroofingltd.ca"
const DEV_EMAIL = process.env.NEXT_PUBLIC_DEV_EMAIL

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")

  // If no code, something went wrong with the OAuth flow
  if (!code) {
    return NextResponse.redirect(`${origin}/login?reason=no_code`)
  }

  const supabase = await createClient()

  // Exchange the temporary code for a real session.
  // This sets the session cookies so the user is logged in.
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

  if (exchangeError) {
    return NextResponse.redirect(`${origin}/login?reason=exchange_failed`)
  }

  // Get the user who just logged in
  const { data: { user } } = await supabase.auth.getUser()

  if (!user?.email) {
    return NextResponse.redirect(`${origin}/login?reason=no_user`)
  }

  // Domain check — second line of defence after the hd param
  // DEV_EMAIL bypass lets developers test with a personal Google account
  const emailDomain = user.email.split("@")[1]
  const isAllowedDomain = emailDomain === ALLOWED_DOMAIN
  const isDevBypass = DEV_EMAIL && user.email === DEV_EMAIL

  if (!isAllowedDomain && !isDevBypass) {
    // Sign them out immediately — they got through Google but not our check
    await supabase.auth.signOut()
    return NextResponse.redirect(`${origin}/login?reason=unauthorized_domain`)
  }

  // Check if a profile already exists for this user
  const existingProfile = await getProfile()

  if (existingProfile) {
    // Profile exists — check if they've been deactivated
    if (!existingProfile.is_active) {
      await supabase.auth.signOut()
      return NextResponse.redirect(`${origin}/login?reason=deactivated`)
    }
    // Active returning user — send them to the app
    return NextResponse.redirect(`${origin}/dashboard`)
  }

  // No profile — first time signing in.
  // Auto-create a profile with role = 'employee'.
  // The owner will promote people via user management if needed.
  const { error: profileError } = await supabase
    .from("profiles")
    .insert({
      id: user.id,
      full_name: user.user_metadata?.full_name ?? user.email,
      role: "employee",
      is_active: true,
    })

  if (profileError) {
    // Profile creation failed — sign them out to avoid a broken state
    // where they're authenticated but have no profile
    await supabase.auth.signOut()
    return NextResponse.redirect(`${origin}/login?reason=profile_creation_failed`)
  }

  return NextResponse.redirect(`${origin}/dashboard`)
}