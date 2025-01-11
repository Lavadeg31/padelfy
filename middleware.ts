import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req: request, res })
  const { data: { session } } = await supabase.auth.getSession()

  // Public paths that don't require authentication
  const publicPaths = ['/login', '/auth/callback']
  const isPublicPath = publicPaths.some(path => request.nextUrl.pathname === path)

  // Protect all routes except public ones
  if (!session && !isPublicPath) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Redirect from login to home if already authenticated
  if (session && request.nextUrl.pathname === '/login') {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return res
}

// Only run middleware on specific paths
export const config = {
  matcher: [
    '/',
    '/login',
    '/tournaments/:path*',
    '/auth/callback'
  ]
} 
