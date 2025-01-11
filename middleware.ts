import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  try {
    const res = NextResponse.next()
    const supabase = createMiddlewareClient({ req: request, res })

    // Refresh session if expired
    const { data: { session }, error } = await supabase.auth.getSession()

    // Handle session refresh errors
    if (error) {
      console.error('Session refresh error:', error)
    }

    // If no session and trying to access protected route, redirect to login
    if (!session && 
        !request.nextUrl.pathname.startsWith('/login') && 
        !request.nextUrl.pathname.startsWith('/auth/callback') &&
        !request.nextUrl.pathname.startsWith('/_next') &&
        !request.nextUrl.pathname.startsWith('/api') &&
        request.nextUrl.pathname !== '/') {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // If session exists and trying to access login, redirect to home
    if (session && request.nextUrl.pathname.startsWith('/login')) {
      return NextResponse.redirect(new URL('/', request.url))
    }

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
