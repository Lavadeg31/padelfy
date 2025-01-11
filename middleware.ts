import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  try {
    // Create a new response
    const res = NextResponse.next()
    
    // Create the Supabase client
    const supabase = createMiddlewareClient({ req: request, res })

    // Refresh the session
    const { data: { session }, error } = await supabase.auth.getSession()

    // Debug info
    console.log('Middleware Check:', {
      path: request.nextUrl.pathname,
      hasSession: !!session,
      cookies: request.cookies.getAll().map(c => c.name)
    })

    // List of public paths
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

    // Handle protected routes
    if (!session && !isPublicPath) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Handle login page access when already logged in
    if (session && request.nextUrl.pathname === '/login') {
      return NextResponse.redirect(new URL('/', request.url))
    }

    // Important: return the response with the session cookie
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
