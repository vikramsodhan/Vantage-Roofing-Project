"use client"

/**
 * app/login/page.tsx — Login Page
 *
 * CLIENT COMPONENT because it handles a button click.
 *
 * Google-only login. Email/password has been removed entirely.
 *
 * The `hd` parameter (hosted domain) tells Google to restrict the
 * account picker to only show @vantageroofingltd.ca accounts.
 * Users with other email domains see an error from Google directly
 * and never reach your app.
 *
 * Dev bypass: if NEXT_PUBLIC_DEV_EMAIL is set in .env.local, that
 * email is allowed through regardless of domain. This lets you test
 * with your personal Google account during development without
 * needing a @vantageroofingltd.ca account.
 * In production on Vercel, don't set NEXT_PUBLIC_DEV_EMAIL and the
 * domain restriction enforces fully.
 */

import { useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"


const IS_DEV_MODE = process.env.NEXT_PUBLIC_DEV_MODE === "true"

export default function LoginPage() {
  const searchParams = useSearchParams()
  const reason = searchParams.get('reason')
  const router = useRouter()
  const supabase = createClient()

  // Google OAuth State
  const [oAuthloading, setOAuthLoading] = useState(false)
  const [oAutherror, setOAuthError] = useState<string | null>(null)

  // Dev email/password state (not used in production)
  const [devEmail, setDevEmail] = useState("")
  const [devPassword, setDevPassword] = useState("")
  const [devLoading, setDevLoading] = useState(false)
  const [devError, setDevError] = useState<string | null>(null)
 
  async function handleGoogleLogin() {
    setOAuthLoading(true)
    setOAuthError(null)
 
    const isDev = process.env.NODE_ENV === "development"
 
    const test = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          ...(isDev ? {} : { hd: "vantageroofingltd.ca" }),
        },
      },
    })

    const error = test.error
 
    if (error) {
      setOAuthError(error.message)
      setOAuthLoading(false)
    }
  }

  async function handleDevLogin() {
    if (!devEmail.trim() || !devPassword.trim()) {
      setDevError("Email and password are required.")
      return
    }


    setDevLoading(true)
    setDevError(null)

    const { error } = await supabase.auth.signInWithPassword({
      email: devEmail.trim(),
      password: devPassword.trim(),
    })

    if (error) {
      setDevError(error.message)
      setDevLoading(false)
      return
    }
    
    router.push("/")
  }

  function getReasonMessage() {
    switch (reason) {
      case 'deactivated':
        return 'Your account has been deactivated. Please contact your administrator.'
      case 'no_code':
        return 'Received no code from Google. Please try signing in again.'
      case 'exchange_failed':
        return 'Code exchange failed. Please try signing in again.'
      case 'no_user':
        return 'No user email address received. Please try signing in again.'
      case 'unauthorized_domain':
        return 'Your email domain is not allowed. Please use your @vantageroofingltd.ca account.'
      case 'profile_creation_failed':
        return 'Failed to create user profile. Please contact your administrator.'
      default:
        return null
    }
  }

  const reasonMessage = getReasonMessage()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Vantage Roofing</CardTitle>
          <CardDescription>Sign in to continue</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {reasonMessage && (
            <div className="bg-destructive/10 text-destructive border border-destructive/20 rounded-lg px-4 py-3 text-sm">
              {reasonMessage}
            </div>
          )}

          {oAutherror && (
            <p className="text-sm text-red-600 text-center">{oAutherror}</p>
          )}
          <Button
            onClick={handleGoogleLogin}
            disabled={oAuthloading}
            variant="outline"
            className="w-full"
          >
            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            {oAuthloading ? "Redirecting..." : "Sign in with Google"}
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            Access restricted to @vantageroofingltd.ca accounts
          </p>
                    {/* Dev-only email/password form — never visible in production */}
          {
            IS_DEV_MODE && (
              <>
                <div className="relative my-2">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-white px-2 text-orange-500 font-medium">
                      Dev only
                    </span>
                  </div>
                </div>
                <div className="space-y-3">
                <div className="space-y-1">
                  <label htmlFor="dev-email" className="text-xs text-muted-foreground">
                    Email
                  </label>
                  <Input
                    id="dev-email"
                    type="email"
                    value={devEmail}
                    onChange={(e) => setDevEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleDevLogin()}
                    placeholder="dev@example.com"
                    disabled={devLoading}
                    className="h-8 text-sm"
                  />
                </div>
                  <div className="space-y-1">
                  <label htmlFor="dev-password" className="text-xs text-muted-foreground">
                    Password
                  </label>
                  <Input
                    id="dev-password"
                    type="password"
                    value={devPassword}
                    onChange={(e) => setDevPassword(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleDevLogin()}
                    placeholder="••••••••"
                    disabled={devLoading}
                    className="h-8 text-sm"
                  />
                </div>

                {devError && (
                  <p className="text-xs text-red-600">{devError}</p>
                )}

                <Button
                  onClick={handleDevLogin}
                  disabled={devLoading}
                  variant="secondary"
                  className="w-full h-8 text-sm"
                >
                  {devLoading ? "Signing in..." : "Sign in (Dev)"}
                </Button>
              </div>
            </>
          )}

        </CardContent>
      </Card>
    </div>
  )
}