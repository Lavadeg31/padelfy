import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// Make the route dynamic
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
    
    if (!code) {
      throw new Error('No code provided')
    }

    const supabase = createRouteHandlerClient({ cookies })
    
    // Exchange the code for a session
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      console.error('Error exchanging code for session:', error)
      throw error
    }

    // Get the site URL
    const siteUrl = process.env.NODE_ENV === 'production'
      ? 'https://padel.larsv.tech'
      : requestUrl.origin

    // Redirect to home page
    return NextResponse.redirect(`${siteUrl}/`)
  } catch (error) {
    console.error('Callback error:', error)
    
    // Get the site URL for error redirect
    const siteUrl = process.env.NODE_ENV === 'production'
      ? 'https://padel.larsv.tech'
      : new URL(request.url).origin

    // Redirect to login with error
    return NextResponse.redirect(`${siteUrl}/login?error=verification_failed`)
  }
} 
