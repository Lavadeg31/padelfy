import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  try {
    const res = NextResponse.next()
    const supabase = createMiddlewareClient({ req: request, res })

    // Get the session cookie directly
    const authCookie = request.cookies.get('sb-xwerwkxdpnhquvjrkxfy-auth-token')
    console.log('Auth Cookie Present:', !!authCookie?.value)

    // Refresh session if expired
    const { data: { session }, error } = await supabase.auth.getSession()

    // Log detailed session info
    console.log('Auth State:', {
      path: request.nextUrl.pathname,
      hasAuthCookie: !!authCookie?.value,
      hasSession: !!session,
      sessionError: error?.message || null,
      userId: session?.user?.id || null,
      cookieValue: authCookie?.value ? 'present' : 'missing'
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

    // Check if the current path is public
    const isPublicPath = publicPaths.some(path => 
      request.nextUrl.pathname.startsWith(path)
    )

    // If no session and trying to access protected route, redirect to login
    if (!session && !isPublicPath) {
      console.log('Redirecting to login:', {
        from: request.nextUrl.pathname,
        reason: 'No active session',
        hasAuthCookie: !!authCookie
      })
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // If session exists and trying to access login, redirect to home
    if (session && request.nextUrl.pathname.startsWith('/login')) {
      return NextResponse.redirect(new URL('/', request.url))
    }

    // Copy the session cookie to the response
    if (authCookie?.value) {
      res.cookies.set('sb-xwerwkxdpnhquvjrkxfy-auth-token', authCookie.value, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/'
      })
    }

    return res
  } catch (e) {
    console.error('Middleware error:', e)
    return NextResponse.redirect(new URL('/login', request.url))
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
} 
