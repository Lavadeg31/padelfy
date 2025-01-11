import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// Make the route dynamic
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
    
    if (!code) {
      throw new Error('No code provided')
    }

    const supabase = createRouteHandlerClient({ cookies })
    
    // Exchange the code for a session
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      console.error('Error exchanging code for session:', error)
      throw error
    }

    // Get the site URL
    const siteUrl = process.env.NODE_ENV === 'production'
      ? 'https://padel.larsv.tech'
      : requestUrl.origin

    // Return HTML that shows success message and redirects
    return new NextResponse(
      `<!DOCTYPE html>
      <html>
        <head>
          <title>Email Verified</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              background-color: #f4f4f4;
            }
            .container {
              text-align: center;
              padding: 2rem;
              background: white;
              border-radius: 8px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
              max-width: 400px;
              width: 90%;
            }
            .success-icon {
              color: #10B981;
              font-size: 48px;
              margin-bottom: 1rem;
            }
            h1 {
              color: #111827;
              margin-bottom: 1rem;
            }
            p {
              color: #6B7280;
              margin-bottom: 2rem;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="success-icon">✓</div>
            <h1>Email Verified Successfully!</h1>
            <p>Redirecting to dashboard...</p>
          </div>
          <script>
            // Wait for session to be properly set
            setTimeout(() => {
              window.location.href = '${siteUrl}';
            }, 2000);
          </script>
        </body>
      </html>`,
      {
        headers: {
          'Content-Type': 'text/html',
        },
      }
    )
  } catch (error) {
    console.error('Callback error:', error)
    
    // Get the site URL for error redirect
    const siteUrl = process.env.NODE_ENV === 'production'
      ? 'https://padel.larsv.tech'
      : new URL(request.url).origin

    // Redirect to login with error
    return NextResponse.redirect(`${siteUrl}/login?error=verification_failed`)
  }
} 
