'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TopNav } from '@/components/top-nav'
import { useRouter } from 'next/navigation'

interface PlayerStats {
  name: string
  gamesPlayed: number
  gamesWon: number
  pointsScored: number
  pointsConceded: number
}

interface Game {
  id: string
  tournament_id: string
  round: number
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

export default function Leaderboard() {
  const [stats, setStats] = useState<PlayerStats[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      setError(null)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('Please log in to view the leaderboard')
        return
      }

      // Load all tournaments for the user
      const { data: tournaments, error: tournamentsError } = await supabase
        .from('tournaments')
        .select('*')
        .eq('user_id', user.id)

      if (tournamentsError) {
        console.error('Error loading tournaments:', tournamentsError)
        setError('Failed to load tournaments')
        return
      }

      if (!tournaments || tournaments.length === 0) {
        setError('No tournaments found')
        return
      }

      // Load all games from all tournaments
      const { data: games, error: gamesError } = await supabase
        .from('tournament_schedules')
        .select('*')
        .in('tournament_id', tournaments.map(t => t.id))

      if (gamesError) {
        console.error('Error loading games:', gamesError)
        setError('Failed to load games')
        return
      }

      // Get all unique players from all tournaments
      const allPlayers = new Set<string>()
      tournaments.forEach((tournament: Tournament) => {
        tournament.players.forEach((player: string) => allPlayers.add(player))
      })

      const playerStats: Record<string, PlayerStats> = {}
      
      // Initialize stats for all players
      Array.from(allPlayers).forEach((player: string) => {
        playerStats[player] = {
          name: player,
          gamesPlayed: 0,
          gamesWon: 0,
          pointsScored: 0,
          pointsConceded: 0
        }
      })

      // Calculate stats from completed games only
      games?.forEach((game: Game) => {
        if (typeof game.team1_score === 'number' && typeof game.team2_score === 'number') {
          // Process team 1 players
          game.team1.forEach((player: string) => {
            playerStats[player].gamesPlayed++
            playerStats[player].pointsScored += game.team1_score!
            playerStats[player].pointsConceded += game.team2_score!
            if (game.team1_score! > game.team2_score!) {
              playerStats[player].gamesWon++
            }
          })

          // Process team 2 players
          game.team2.forEach((player: string) => {
            playerStats[player].gamesPlayed++
            playerStats[player].pointsScored += game.team2_score!
            playerStats[player].pointsConceded += game.team1_score!
            if (game.team2_score! > game.team1_score!) {
              playerStats[player].gamesWon++
            }
          })
        }
      })

      // Sort players by win percentage, then by points scored
      const sortedStats = Object.values(playerStats).sort((a, b) => {
        const aWinRate = a.gamesPlayed > 0 ? a.gamesWon / a.gamesPlayed : 0
        const bWinRate = b.gamesPlayed > 0 ? b.gamesWon / b.gamesPlayed : 0
        if (aWinRate !== bWinRate) {
          return bWinRate - aWinRate
        }
        return b.pointsScored - a.pointsScored
      })

      setStats(sortedStats)
    } catch (error) {
      console.error('Error in loadStats:', error)
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <TopNav />
        <div className="container mx-auto p-4">
          <div className="flex items-center justify-center h-64">
            <p>Loading leaderboard...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <TopNav />
        <div className="container mx-auto p-4">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8 space-y-4">
              <p className="text-red-500">{error}</p>
              <Button onClick={() => router.push('/tournaments')}>View Tournaments</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Overall Leaderboard</h1>
            <p className="text-muted-foreground">All-time player statistics</p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => router.push('/tournaments')}
          >
            View Tournaments
          </Button>
        </div>

        {stats.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Player Rankings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {stats.map((player, index) => (
                  <div key={player.name} className="flex items-center justify-between p-4 border rounded">
                    <div className="flex items-center space-x-4">
                      <span className="text-2xl font-bold">{index + 1}</span>
                      <div>
                        <p className="font-semibold">{player.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Win Rate: {player.gamesPlayed > 0 
                            ? `${((player.gamesWon / player.gamesPlayed) * 100).toFixed(1)}%` 
                            : '0%'} ({player.gamesWon}/{player.gamesPlayed})
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">Points: {player.pointsScored}</p>
                      <p className="text-sm text-muted-foreground">
                        Point Diff: {player.pointsScored - player.pointsConceded}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <p>No games have been played yet.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

