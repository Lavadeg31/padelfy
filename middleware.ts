import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  try {
    const res = NextResponse.next()
    const supabase = createMiddlewareClient({ req: request, res })

    // Refresh session if expired
    const { data: { session } } = await supabase.auth.getSession()

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
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // If session exists and trying to access login, redirect to home
    if (session && request.nextUrl.pathname === '/login') {
      return NextResponse.redirect(new URL('/', request.url))
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
