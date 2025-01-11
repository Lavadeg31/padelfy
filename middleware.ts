import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  try {
    // Create a response and get the client
    const res = NextResponse.next()
    const supabase = createMiddlewareClient({ req: request, res })

    // Refresh session if expired and get session data
    const {
      data: { session },
      error
    } = await supabase.auth.getSession()

    // Debug session state
    console.log('Current path:', request.nextUrl.pathname)
    console.log('Session state:', session ? 'Logged in' : 'No session')
    console.log('Cookies:', request.cookies.getAll())

    // Handle session refresh errors
    if (error) {
      console.error('Session refresh error:', error)
    }

    // List of public paths that don't require authentication
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
      console.log('No session found, redirecting to login')
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // If session exists and trying to access login, redirect to home
    if (session && request.nextUrl.pathname === '/login') {
      console.log('Session found, redirecting to home')
      return NextResponse.redirect(new URL('/', request.url))
    }

    // Add session user to request headers for debugging
    if (session) {
      res.headers.set('x-user-id', session.user.id)
    }

    return res
  } catch (e) {
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
