'use client'

import { useState, useEffect, useCallback } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useRouter } from 'next/navigation'

interface Game {
  id: string
  round: number
  court: { id: number; name: string }
  team1: string[]
  team2: string[]
  team1_score: number | null
  team2_score: number | null
}

interface Tournament {
  id: string
  name: string
  total_points: number
  players: string[]
}

export default function TournamentSchedule({ params }: { params: { id: string } }) {
  const [games, setGames] = useState<Game[]>([])
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const loadSchedule = useCallback(async () => {
    try {
      setError(null)
      await supabase.auth.getUser()
      // Load tournament details
      const { data: tournamentData, error: tournamentError } = await supabase
        .from('tournaments')
        .select('*')
        .eq('id', params.id)
        .single()

      if (tournamentError) {
        console.error('Error loading tournament:', tournamentError)
        setError('Failed to load tournament details')
        return
      }

      if (!tournamentData) {
        setError('Tournament not found')
        return
      }

      setTournament(tournamentData)

      // Load games
      const { data: gamesData, error: gamesError } = await supabase
        .from('tournament_schedules')
        .select('*')
        .eq('tournament_id', params.id)
        .order('round', { ascending: true })

      if (gamesError) {
        console.error('Error loading games:', gamesError)
        setError('Failed to load games')
        return
      }

      setGames(gamesData || [])
    } catch (error) {
      console.error('Error in loadSchedule:', error)
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }, [supabase, params.id])

  useEffect(() => {
    loadSchedule();
  }, [loadSchedule]);

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading schedule...</div>
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8 space-y-4">
          <p className="text-red-500">{error}</p>
          <Button onClick={() => router.push('/tournaments')}>Back to Tournaments</Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6 mt-4">
      <div>
        <h1 className="text-2xl font-bold">{tournament?.name}</h1>
        <p className="text-muted-foreground">Tournament Schedule</p>
      </div>

      {Array.from(new Set(games.map(g => g.round))).map(round => (
        <Card key={round}>
          <CardHeader>
            <CardTitle>Round {round}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {games
                .filter(g => g.round === round)
                .map(game => (
                  <div key={game.id} className="flex flex-col md:flex-row items-center justify-between p-4 border rounded space-y-4 md:space-y-0">
                    <div className="flex-1">
                      <p className="font-medium mb-2">Court: {game.court.name}</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="font-semibold text-green-600">Team 1</p>
                          <p>{game.team1.join(' & ')}</p>
                        </div>
                        <div>
                          <p className="font-semibold text-blue-600">Team 2</p>
                          <p>{game.team2.join(' & ')}</p>
                        </div>
                      </div>
                    </div>
                    {game.team1_score !== null && game.team2_score !== null && (
                      <div className="flex items-center space-x-4">
                        <span className="text-green-600 font-bold">{game.team1_score}</span>
                        <span className="text-sm">vs</span>
                        <span className="text-blue-600 font-bold">{game.team2_score}</span>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
} 
