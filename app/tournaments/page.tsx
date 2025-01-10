'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TopNav } from '@/components/top-nav'
import { useRouter } from 'next/navigation'

interface Tournament {
  id: string
  name: string
  mode: 'solo' | 'fixed'
  total_points: number
  courts: { id: number; name: string }[]
  players: string[]
  created_at: string
}

export default function Tournaments() {
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    loadTournaments()
  }, [])

  const loadTournaments = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }

    const { data, error } = await supabase
      .from('tournaments')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error loading tournaments:', error)
      return
    }

    setTournaments(data || [])
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <TopNav />
        <div className="container mx-auto p-4">
          <div className="flex items-center justify-center h-64">
            <p>Loading tournaments...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Your Tournaments</h1>
          <Button onClick={() => router.push('/')}>Create New Tournament</Button>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {tournaments.map((tournament) => (
            <Card key={tournament.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle>{tournament.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <p>Mode: {tournament.mode}</p>
                    <p>Players: {tournament.players.length}</p>
                    <p>Courts: {tournament.courts.length}</p>
                    <p>Points to win: {tournament.total_points}</p>
                    <p className="text-sm text-muted-foreground">
                      Created: {new Date(tournament.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      variant="default" 
                      className="flex-1"
                      onClick={() => router.push(`/tournaments/${tournament.id}/schedule`)}
                    >
                      Schedule & Scores
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => router.push(`/tournaments/${tournament.id}/leaderboard`)}
                    >
                      Leaderboard
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {tournaments.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8 space-y-4">
              <p>You haven't created any tournaments yet.</p>
              <Button onClick={() => router.push('/')}>Create Your First Tournament</Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
} 