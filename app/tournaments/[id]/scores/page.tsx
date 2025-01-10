'use client'

import { useEffect, useState, useCallback } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from "sonner"

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

export default function TournamentScores({ params }: { params: { id: string } }) {
  const [games, setGames] = useState<Game[]>([])
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentRound, setCurrentRound] = useState(1)
  const router = useRouter()

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const loadGames = useCallback(async () => {
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
      console.error('Error in loadGames:', error)
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }, [supabase, params.id])

  useEffect(() => {
    loadGames();
  }, [loadGames]);

  const handleScoreChange = async (gameId: string, team: 'team1' | 'team2', score: string) => {
    const numericScore = score === '' ? null : parseInt(score, 10)
    console.log('Score change:', { gameId, team, score, numericScore })

    // Update local state and save to database
    setGames(prevGames => {
      const newGames = prevGames.map(game => {
        if (game.id === gameId) {
          let updatedGame;
          
          if (numericScore === null) {
            updatedGame = {
              ...game,
              team1_score: null,
              team2_score: null
            }
            console.log('Clearing scores:', updatedGame)
          } else {
            // Calculate the other team's score based on total points
            const otherTeamScore = tournament!.total_points - numericScore
            updatedGame = {
              ...game,
              team1_score: team === 'team1' ? numericScore : otherTeamScore,
              team2_score: team === 'team2' ? numericScore : otherTeamScore
            }
            console.log('Updating scores:', updatedGame)
          }

          // Save to database
          saveScore(updatedGame)
          return updatedGame
        }
        return game
      })
      return newGames
    })
  }

  const saveScore = async (game: Game) => {
    try {
      console.log('Saving to database:', {
        team1_score: game.team1_score,
        team2_score: game.team2_score
      })

      const { data, error: updateError } = await supabase
        .from('tournament_schedules')
        .update({
          team1_score: game.team1_score,
          team2_score: game.team2_score
        })
        .eq('id', game.id)
        .select()

      console.log('Database response:', { data, error: updateError })

      if (updateError) {
        console.error('Error saving score:', updateError)
        toast.error('Failed to save score')
        // Reload games to ensure UI is in sync with database
        loadGames()
      } else {
        toast.success('Score saved')
      }
    } catch (error) {
      console.error('Error in auto-save:', error)
      toast.error('Failed to save score')
      loadGames()
    }
  }

  const nextRound = () => {
    const maxRound = Math.max(...games.map(g => g.round))
    if (currentRound < maxRound) {
      setCurrentRound(currentRound + 1)
    }
  }

  const prevRound = () => {
    if (currentRound > 1) {
      setCurrentRound(currentRound - 1)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading scores...</div>
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

  const currentGames = games.filter(g => g.round === currentRound)
  const maxRound = Math.max(...games.map(g => g.round))

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">{tournament?.name}</h1>
          <p className="text-muted-foreground">First to {tournament?.total_points} points wins</p>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Round {currentRound}</CardTitle>
          <div className="flex items-center space-x-2">
            <Button onClick={prevRound} disabled={currentRound === 1} size="icon" variant="outline">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span>{currentRound} / {maxRound}</span>
            <Button onClick={nextRound} disabled={currentRound === maxRound} size="icon" variant="outline">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {currentGames.map((game) => (
              <Card key={game.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-center mb-4">
                    <div className="text-sm font-medium text-green-600">{game.team1.join(' & ')}</div>
                    <div className="text-sm font-medium text-blue-600">{game.team2.join(' & ')}</div>
                  </div>
                  <div className="flex justify-center space-x-4 items-center">
                    <Input
                      type="number"
                      min="0"
                      max={tournament?.total_points}
                      value={game.team1_score ?? ''}
                      onChange={(e) => handleScoreChange(game.id, 'team1', e.target.value)}
                      className="w-20 text-center"
                    />
                    <Input
                      type="number"
                      min="0"
                      max={tournament?.total_points}
                      value={game.team2_score ?? ''}
                      onChange={(e) => handleScoreChange(game.id, 'team2', e.target.value)}
                      className="w-20 text-center"
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 
