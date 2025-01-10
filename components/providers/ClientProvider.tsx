'use client'

import { useState, useEffect } from 'react'
import { TournamentProvider } from '@/contexts/TournamentContext'

export function ClientProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return <TournamentProvider>{children}</TournamentProvider>
} 