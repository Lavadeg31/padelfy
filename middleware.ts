import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  try {
    // Create a new response
    const res = NextResponse.next()
    
    // Create the Supabase client
    const supabase = createMiddlewareClient({ req: request, res })

    // Try to get the session
    const {
      data: { session },
      error: sessionError
    } = await supabase.auth.getSession()

    // Log session state for debugging
    console.log('Auth Check:', {
      path: request.nextUrl.pathname,
      hasSession: !!session,
      sessionError: sessionError?.message,
      cookies: request.cookies.getAll().map(c => c.name)
    })

    // List of paths that don't require authentication
    const publicPaths = [
      '/login',
      '/auth/callback',
      '/_next',
      '/api',
      '/public',
      '/static',
      '/favicon.ico'
    ]

    const isPublicPath = publicPaths.some(path => 
      request.nextUrl.pathname.startsWith(path)
    )

    // If there's a session error, clear the session and redirect to login
    if (sessionError) {
      console.error('Session error:', sessionError)
      const response = NextResponse.redirect(new URL('/login', request.url))
      await supabase.auth.signOut()
      return response
    }

    // Handle protected routes
    if (!session && !isPublicPath) {
      console.log('No session, redirecting to login')
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Handle login page access when already logged in
    if (session && request.nextUrl.pathname === '/login') {
      console.log('Session exists, redirecting to home')
      return NextResponse.redirect(new URL('/', request.url))
    }

    // Add the user session to the response
    return res
  } catch (e) {
    console.error('Middleware error:', e)
    // On error, redirect to login and clear the session
    const response = NextResponse.redirect(new URL('/login', request.url))
    const supabase = createMiddlewareClient({ req: request, res: response })
    await supabase.auth.signOut()
    return response
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
} 
