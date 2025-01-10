'use client'

import { useState, useEffect, useMemo } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()
  const [lastAttempt, setLastAttempt] = useState<number>(0)

  // Create Supabase client once and memoize it
  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), [])

  useEffect(() => {
    setMounted(true)
  }, [])

  // Reset error and message when switching modes
  useEffect(() => {
    setError(null)
    setMessage(null)
  }, [isSignUp])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Rate limiting: Only allow one attempt every 10 seconds
    const now = Date.now()
    if (isSignUp && now - lastAttempt < 10000) {
      const remainingSeconds = Math.ceil((10000 - (now - lastAttempt)) / 1000)
      setError(`Please wait ${remainingSeconds} seconds before trying again`)
      return
    }

    // Input validation
    if (!email || !password) {
      setError('Please fill in all fields')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setError(null)
    setMessage(null)
    setIsLoading(true)

    try {
      if (isSignUp) {
        setLastAttempt(now)
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          }
        })
        
        if (signUpError) throw signUpError
        
        setMessage('Check your email for the confirmation link!')
        setEmail('')
        setPassword('')
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        
        if (signInError) throw signInError

        router.push('/')
        router.refresh()
      }
    } catch (error) {
      console.error('Auth error:', error)
      if (error instanceof Error) {
        setError(error.message)
      } else {
        setError('An error occurred during authentication')
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (!mounted) {
    return null
  }

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
      {/* Left side - Dark section */}
      <div className="bg-black p-4 lg:p-8 text-white">
        <div className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-full bg-white" />
          <span className="font-semibold">Padel Tournament Manager</span>
        </div>
      </div>

      {/* Right side - Login/Signup form */}
      <div className="p-4 lg:p-8 flex flex-col">
        <div className="flex justify-end">
          <Button 
            variant="ghost" 
            onClick={() => setIsSignUp(!isSignUp)}
          >
            {isSignUp ? 'Login' : 'Create account'}
          </Button>
        </div>

        <div className="flex-1 flex items-center justify-center py-8">
          <div className="w-full max-w-sm space-y-6 px-4">
            <div className="space-y-2 text-center">
              <h1 className="text-2xl lg:text-3xl font-bold">
                {isSignUp ? 'Create an account' : 'Welcome back'}
              </h1>
              <p className="text-gray-500 text-sm lg:text-base">
                {isSignUp 
                  ? 'Enter your email below to create your account'
                  : 'Enter your email to sign in to your account'
                }
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value.trim())}
                  required
                  disabled={isLoading}
                  className="w-full"
                />
                <Input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  minLength={6}
                  className="w-full"
                />
              </div>

              {error && (
                <p className="text-sm text-red-500">{error}</p>
              )}
              {message && (
                <p className="text-sm text-green-500">{message}</p>
              )}

              <Button 
                type="submit" 
                className="w-full"
                disabled={isLoading || !email || !password}
              >
                {isLoading 
                  ? 'Please wait...' 
                  : (isSignUp ? 'Sign Up with Email' : 'Sign In with Email')
                }
              </Button>

              {!isSignUp && (
                <div className="text-center">
                  <Link 
                    href="/reset-password"
                    className="text-sm text-muted-foreground hover:text-primary"
                  >
                    Forgot password?
                  </Link>
                </div>
              )}
            </form>

            <p className="text-center text-xs lg:text-sm text-muted-foreground">
              By clicking continue, you agree to our{' '}
              <Link href="/terms" className="underline underline-offset-4 hover:text-primary">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="underline underline-offset-4 hover:text-primary">
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 
