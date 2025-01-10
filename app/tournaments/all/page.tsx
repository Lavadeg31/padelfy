'use client'

import { useEffect, useState, useCallback } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TopNav } from '@/components/top-nav'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { toast } from "sonner"

interface Tournament {
  id: string
  name: string
  mode: 'solo' | 'fixed'
  total_points: number
  courts: { id: number; name: string }[]
  players: string[]
  created_at: string
}

export default function AllTournaments() {
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const loadTournaments = useCallback(async () => {
    try {
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

      setTournaments(data)
    } catch (error) {
      console.error('Error loading tournaments:', error)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    loadTournaments()
  }, [loadTournaments])

  const handleDelete = async (tournamentId: string) => {
    if (!confirm('Are you sure you want to delete this tournament? This action cannot be undone.')) {
      return
    }

    try {
      // Delete tournament schedules first
      const { error: scheduleError } = await supabase
        .from('tournament_schedules')
        .delete()
        .eq('tournament_id', tournamentId)

      if (scheduleError) {
        console.error('Error deleting schedules:', scheduleError)
        toast.error('Failed to delete tournament schedules')
        return
      }

      // Then delete the tournament
      const { error: tournamentError } = await supabase
        .from('tournaments')
        .delete()
        .eq('id', tournamentId)

      if (tournamentError) {
        console.error('Error deleting tournament:', tournamentError)
        toast.error('Failed to delete tournament')
        return
      }

      toast.success('Tournament deleted successfully')
      loadTournaments()
    } catch (error) {
      console.error('Error:', error)
      toast.error('An unexpected error occurred')
    }
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
          <h1 className="text-2xl font-bold">All Tournaments</h1>
          <Button onClick={() => router.push('/')}>Create New Tournament</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tournaments.map((tournament) => (
            <Card key={tournament.id}>
              <CardHeader className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-2 text-red-500 hover:text-red-700 hover:bg-red-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(tournament.id);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <CardTitle>{tournament.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p>Mode: {tournament.mode}</p>
                  <p>Players: {tournament.players.length}</p>
                  <p>Courts: {tournament.courts.length}</p>
                  <p>Points to win: {tournament.total_points}</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    variant="default" 
                    onClick={() => router.push(`/tournaments/${tournament.id}/schedule`)}
                    className="w-full"
                  >
                    Open
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => router.push(`/tournaments/${tournament.id}/leaderboard`)}
                    className="w-full"
                  >
                    Leaderboard
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {tournaments.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8 space-y-4">
              <p>You haven&apos;t created any tournaments yet.</p>
              <Button onClick={() => router.push('/')}>Create Your First Tournament</Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
} 
