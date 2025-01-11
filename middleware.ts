import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  try {
    // Log all cookies for debugging
    console.log('Request cookies:', {
      all: request.cookies.getAll(),
      supabase: request.cookies.get('sb-xwerwkxdpnhquvjrkxfy-auth-token'),
      path: request.nextUrl.pathname
    })

    const res = NextResponse.next()
    const supabase = createMiddlewareClient({ req: request, res })

    // Refresh session if expired
    const { data: { session }, error } = await supabase.auth.getSession()

    // Log session state
    console.log('Session state:', {
      hasSession: !!session,
      error: error?.message,
      path: request.nextUrl.pathname,
      userId: session?.user?.id
    })

    // Handle session refresh errors
    if (error) {
      console.error('Session refresh error:', error)
    }

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

    // Check if the current path is public
    const isPublicPath = publicPaths.some(path => 
      request.nextUrl.pathname.startsWith(path)
    )

    // If no session and trying to access protected route, redirect to login
    if (!session && !isPublicPath) {
      console.log('No session, redirecting to login from:', request.nextUrl.pathname)
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // If session exists and trying to access login, redirect to home
    if (session && request.nextUrl.pathname.startsWith('/login')) {
      return NextResponse.redirect(new URL('/', request.url))
    }

    // Add debug headers to response
    res.headers.set('x-session-status', session ? 'active' : 'none')
    res.headers.set('x-path-type', isPublicPath ? 'public' : 'protected')

    // Important: return the response with the refreshed session cookie
    return res
  } catch (e) {
    // If there's an error, redirect to login
    console.error('Middleware error:', e)
    return NextResponse.redirect(new URL('/login', request.url))
  }
}

// Update matcher to include all routes that need session checking
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
} 
