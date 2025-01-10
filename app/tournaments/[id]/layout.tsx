'use client'

import { TopNav } from '@/components/top-nav'
import Link from 'next/link'

export default function TournamentLayout({
  children,
  params
}: {
  children: React.ReactNode
  params: { id: string }
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <TopNav />
      <div className="border-b">
        <div className="flex h-12 items-center space-x-4 px-4">
          <Link 
            href={`/tournaments/${params.id}/schedule`}
            className="text-sm font-medium hover:text-primary"
          >
            Schedule
          </Link>
          <Link 
            href={`/tournaments/${params.id}/scores`}
            className="text-sm font-medium hover:text-primary"
          >
            Scores
          </Link>
          <Link 
            href={`/tournaments/${params.id}/leaderboard`}
            className="text-sm font-medium hover:text-primary"
          >
            Leaderboard
          </Link>
        </div>
      </div>
      <main className="flex-1 container mx-auto px-4 py-4">
        {children}
      </main>
    </div>
  )
} 