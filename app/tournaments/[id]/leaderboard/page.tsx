'use client'

import { useState, useEffect, useCallback } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useRouter } from 'next/navigation'
import { cn } from "@/lib/utils"

interface PlayerStats {
  name: string
  gamesPlayed: number
  gamesWon: number
  pointsScored: number
  pointsConceded: number
  rank?: number
  teammate?: string
}

interface TeamStats {
  players: [PlayerStats, PlayerStats]
  gamesPlayed: number
  gamesWon: number
  pointsScored: number
  pointsConceded: number
  rank?: number
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
  mode: 'solo' | 'fixed'
  total_points: number
  players: string[]
}

export default function TournamentLeaderboard({ params }: { params: { id: string } }) {
  const [stats, setStats] = useState<PlayerStats[]>([])
  const [teamStats, setTeamStats] = useState<TeamStats[]>([])
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const loadStats = useCallback(async () => {
    try {
      setError(null)
      await supabase.auth.getUser()
      // Load tournament details first
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

      // Load games after confirming tournament exists
      const { data: games, error: gamesError } = await supabase
        .from('tournament_schedules')
        .select('*')
        .eq('tournament_id', params.id)

      if (gamesError) {
        console.error('Error loading games:', gamesError)
        setError('Failed to load games')
        return
      }

      const playerStats: Record<string, PlayerStats> = {}
      
      // Initialize stats for all players
      tournamentData.players.forEach((player: string, index: number) => {
        let teammate: string | undefined
        if (tournamentData.mode === 'fixed') {
          // In fixed mode, players are paired sequentially (0,1), (2,3), etc.
          if (index % 2 === 0) {
            teammate = tournamentData.players[index + 1]
          } else {
            teammate = tournamentData.players[index - 1]
          }
        }
        playerStats[player] = {
          name: player,
          gamesPlayed: 0,
          gamesWon: 0,
          pointsScored: 0,
          pointsConceded: 0,
          teammate
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

      if (tournamentData.mode === 'fixed') {
        // Group players into teams and calculate team stats
        const teams: TeamStats[] = []
        const processedPlayers = new Set<string>()

        Object.values(playerStats).forEach((player) => {
          if (!processedPlayers.has(player.name) && player.teammate) {
            const teammate = playerStats[player.teammate]
            teams.push({
              players: [player, teammate],
              gamesPlayed: player.gamesPlayed,
              gamesWon: player.gamesWon,
              pointsScored: player.pointsScored,
              pointsConceded: player.pointsConceded
            })
            processedPlayers.add(player.name)
            processedPlayers.add(player.teammate)
          }
        })

        // Sort teams by points scored first, then by matches won
        const sortedTeams = teams.sort((a, b) => {
          if (a.pointsScored !== b.pointsScored) {
            return b.pointsScored - a.pointsScored
          }
          return b.gamesWon - a.gamesWon
        })

        // Assign ranks with shared positions
        let currentRank = 1
        let currentPoints = -1
        let currentWins = -1
        let sameRankCount = 0

        sortedTeams.forEach((team, index) => {
          if (team.pointsScored !== currentPoints || 
              (team.pointsScored === currentPoints && team.gamesWon !== currentWins)) {
            currentRank = index + 1 - sameRankCount
            currentPoints = team.pointsScored
            currentWins = team.gamesWon
            sameRankCount = 0
          } else {
            sameRankCount++
          }
          team.rank = currentRank
        })

        setTeamStats(sortedTeams)
      } else {
        // Solo mode - sort individual players
        const sortedStats = Object.values(playerStats).sort((a, b) => {
          if (a.pointsScored !== b.pointsScored) {
            return b.pointsScored - a.pointsScored
          }
          return b.gamesWon - a.gamesWon
        })

        // Assign ranks with shared positions
        let currentRank = 1
        let currentPoints = -1
        let currentWins = -1
        let sameRankCount = 0

        sortedStats.forEach((player, index) => {
          if (player.pointsScored !== currentPoints || 
              (player.pointsScored === currentPoints && player.gamesWon !== currentWins)) {
            currentRank = index + 1 - sameRankCount
            currentPoints = player.pointsScored
            currentWins = player.gamesWon
            sameRankCount = 0
          } else {
            sameRankCount++
          }
          player.rank = currentRank
        })

        setStats(sortedStats)
      }
    } catch (error) {
      console.error('Error in loadStats:', error)
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }, [supabase, params.id])

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading leaderboard...</div>
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">{tournament?.name}</h1>
          <p className="text-muted-foreground">Tournament Standings ({tournament?.mode === 'fixed' ? 'Fixed Teams' : 'Solo Mode'})</p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => router.push(`/tournaments/${params.id}/scores`)}
        >
          Update Scores
        </Button>
      </div>

      {tournament?.mode === 'fixed' ? (
        // Fixed Teams Leaderboard
        <Card>
          <CardHeader>
            <CardTitle>Team Rankings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {teamStats.map((team, index) => (
                <div key={team.players[0].name + team.players[1].name} className="flex items-center justify-between p-4 border rounded">
                  <div className="flex items-center space-x-4">
                    <span className={cn(
                      "text-2xl font-bold",
                      team.rank === 1 && "text-yellow-500",
                      team.rank === 2 && "text-gray-400",
                      team.rank === 3 && "text-amber-600"
                    )}>
                      {team.rank}
                      {index > 0 && teamStats[index - 1].rank === team.rank && "*"}
                    </span>
                    <div>
                      <p className="font-semibold">{team.players[0].name} & {team.players[1].name}</p>
                      <p className="text-sm text-muted-foreground">
                        Matches: {team.gamesWon}/{team.gamesPlayed}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">Points: {team.pointsScored}</p>
                    <p className="text-sm text-muted-foreground">
                      Point Diff: {team.pointsScored - team.pointsConceded}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        // Solo Mode Leaderboard
        <Card>
          <CardHeader>
            <CardTitle>Player Rankings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {stats.map((player, index) => (
                <div key={player.name} className="flex items-center justify-between p-4 border rounded">
                  <div className="flex items-center space-x-4">
                    <span className={cn(
                      "text-2xl font-bold",
                      player.rank === 1 && "text-yellow-500",
                      player.rank === 2 && "text-gray-400",
                      player.rank === 3 && "text-amber-600"
                    )}>
                      {player.rank}
                      {index > 0 && stats[index - 1].rank === player.rank && "*"}
                    </span>
                    <div>
                      <p className="font-semibold">{player.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Matches: {player.gamesWon}/{player.gamesPlayed}
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
      )}
    </div>
  )
} 
