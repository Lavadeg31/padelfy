import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()
  const supabase = createMiddlewareClient({ req: request, res: response })

  // Refresh session if expired
  const { data: { session } } = await supabase.auth.getSession()

  // If no session and trying to access protected route, redirect to login
  if (!session && 
      !request.nextUrl.pathname.startsWith('/login') && 
      !request.nextUrl.pathname.startsWith('/auth/callback') &&
      !request.nextUrl.pathname.startsWith('/_next') &&
      !request.nextUrl.pathname.startsWith('/api') &&
      request.nextUrl.pathname !== '/') {
    const redirectUrl = new URL('/login', request.url)
    return NextResponse.redirect(redirectUrl)
  }

  // If session exists and trying to access login, redirect to home
  if (session && request.nextUrl.pathname.startsWith('/login')) {
    const redirectUrl = new URL('/', request.url)
    return NextResponse.redirect(redirectUrl)
  }

  return response
}

// Specify which routes to run the middleware on
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
