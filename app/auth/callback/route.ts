import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = createRouteHandlerClient({ cookies })
    try {
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      if (error) {
        console.error('Error exchanging code for session:', error)
        const redirectUrl = process.env.NODE_ENV === 'production'
          ? 'https://padel.larsv.tech/login?error=verification_failed'
          : `${requestUrl.origin}/login?error=verification_failed`
        return NextResponse.redirect(redirectUrl)
      }
    } catch (error) {
      console.error('Error in callback:', error)
      const redirectUrl = process.env.NODE_ENV === 'production'
        ? 'https://padel.larsv.tech/login?error=verification_failed'
        : `${requestUrl.origin}/login?error=verification_failed`
      return NextResponse.redirect(redirectUrl)
    }
  }

  // URL to redirect to after sign in process completes
  const redirectUrl = process.env.NODE_ENV === 'production'
    ? 'https://padel.larsv.tech'
    : requestUrl.origin
  return NextResponse.redirect(redirectUrl)
} 
