import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req: request, res })

  // Get current session
  const { data: { session } } = await supabase.auth.getSession()

  // Handle protected routes
  if (!session) {
    // Allow access to public routes
    if (request.nextUrl.pathname === '/login' || 
        request.nextUrl.pathname === '/auth/callback' ||
        request.nextUrl.pathname.startsWith('/_next') ||
        request.nextUrl.pathname.startsWith('/api')) {
      return res
    }
    // Redirect to login for protected routes
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Redirect to home if trying to access login page while authenticated
  if (session && request.nextUrl.pathname === '/login') {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return res
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
} 
