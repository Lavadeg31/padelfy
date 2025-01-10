'use client'

import { useState, useEffect, useCallback } from 'react'
import { TopNav } from '@/components/top-nav'
import { MetricCard } from '@/components/metric-card'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Users, CrownIcon as Court, Trophy } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { generateSchedule } from '@/utils/scheduleGenerator'

interface Court {
  id: number;
  name: string;
}

interface Tournament {
  id: string;
  name: string;
  mode: 'solo' | 'fixed';
  total_points: number;
  courts: Court[];
  players: string[];
}

type TournamentMode = 'solo' | 'fixed'

export default function Home() {
  const [courts, setCourts] = useState<Court[]>([{ id: 1, name: '' }])
  const [players, setPlayers] = useState<string[]>(['', ''])
  const [mode, setMode] = useState<TournamentMode>('fixed')
  const [totalPoints, setTotalPoints] = useState<number>(5)
  const [tournamentName, setTournamentName] = useState('')
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const router = useRouter()

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const loadTournaments = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

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
  }, [supabase])

  useEffect(() => {
    loadTournaments()
  }, [loadTournaments])

  const handleAddCourt = () => {
    setCourts([...courts, { id: courts.length + 1, name: '' }])
  }

  const handleCourtNameChange = (id: number, name: string) => {
    setCourts(courts.map(court => 
      court.id === id ? { ...court, name } : court
    ))
  }

  const handleAddPlayer = () => {
    if (mode === 'fixed') {
      setPlayers([...players, '', ''])
    } else {
      setPlayers([...players, ''])
    }
  }

  const handlePlayerChange = (index: number, value: string) => {
    const newPlayers = [...players]
    newPlayers[index] = value
    setPlayers(newPlayers)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const validCourts = courts.filter(court => court.name.trim() !== '')
    const validPlayers = players.filter(player => player.trim() !== '')
    
    if (!tournamentName.trim()) {
      alert('Please enter a tournament name')
      return
    }

    if (mode === 'fixed') {
      if (validPlayers.length < 4 || validPlayers.length % 2 !== 0) {
        alert('Please add at least 2 complete teams (4 players)')
        return
      }
    } else {
      if (validPlayers.length < 4) {
        alert('Please add at least 4 players')
        return
      }
    }
    
    if (validCourts.length === 0) {
      alert('Please add at least one court with a name')
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      alert('Please log in to create a tournament')
      return
    }

    try {
      const { data, error } = await supabase
        .from('tournaments')
        .insert({
          name: tournamentName,
          mode,
          total_points: totalPoints,
          courts: validCourts,
          players: validPlayers,
          user_id: user.id
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating tournament:', error)
        alert(`Failed to create tournament: ${error.message}`)
        return
      }

      const schedule = generateSchedule(validPlayers, validCourts, mode)
      const { error: scheduleError } = await supabase
        .from('tournament_schedules')
        .insert(
          schedule.flatMap((round, roundIndex) =>
            round.map(game => ({
              tournament_id: data.id,
              round: roundIndex + 1,
              court: game.court,
              team1: game.team1,
              team2: game.team2
            }))
          )
        )

      if (scheduleError) {
        console.error('Error creating schedule:', scheduleError)
        alert(`Failed to create schedule: ${scheduleError.message}`)
        return
      }

      // Redirect to the schedule page after successful creation
      router.push(`/tournaments/${data.id}/schedule`)
    } catch (error) {
      console.error('Error:', error)
      alert('An unexpected error occurred')
    }
  }

  const renderPlayerInputs = () => {
    if (mode === 'fixed') {
      return players.map((player, index) => (
        index % 2 === 0 && (
          <div key={index} className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <Label>{`Player ${Math.floor(index / 2) + 1}A`}</Label>
              <Input
                value={player}
                onChange={(e) => handlePlayerChange(index, e.target.value)}
                placeholder="Player Name"
              />
            </div>
            <div className="space-y-2">
              <Label>{`Player ${Math.floor(index / 2) + 1}B`}</Label>
              <Input
                value={players[index + 1] || ''}
                onChange={(e) => handlePlayerChange(index + 1, e.target.value)}
                placeholder="Player Name"
              />
            </div>
          </div>
        )
      ))
    } else {
      return players.map((player, index) => (
        <div key={index} className="space-y-2">
          <Label>{`Player ${index + 1}`}</Label>
          <Input
            value={player}
            onChange={(e) => handlePlayerChange(index, e.target.value)}
            placeholder="Player Name"
          />
        </div>
      ))
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      <div className="container mx-auto p-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-4">
          <MetricCard
            title="Total Players"
            value={players.filter(p => p).length}
            icon={<Users className="h-4 w-4 text-muted-foreground" />}
          />
          <MetricCard
            title="Available Courts"
            value={courts.filter(c => c.name).length}
            icon={<Court className="h-4 w-4 text-muted-foreground" />}
          />
          <MetricCard
            title="Games per Round"
            value={Math.floor(players.filter(p => p).length / 4)}
            icon={<Trophy className="h-4 w-4 text-muted-foreground" />}
          />
          <Drawer>
            <DrawerTrigger asChild>
              <Button variant="outline" className="w-full h-full">
                View Tournaments
              </Button>
            </DrawerTrigger>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>Your Tournaments</DrawerTitle>
              </DrawerHeader>
              <div className="p-4">
                <Carousel>
                  <CarouselContent>
                    {tournaments.map((tournament) => (
                      <CarouselItem key={tournament.id} className="md:basis-1/2 lg:basis-1/3">
                        <Card>
                          <CardHeader>
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
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious />
                  <CarouselNext />
                </Carousel>
              </div>
            </DrawerContent>
          </Drawer>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Tournament Setup</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Tournament Name</Label>
                <Input
                  value={tournamentName}
                  onChange={(e) => setTournamentName(e.target.value)}
                  placeholder="Enter tournament name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Tournament Mode</Label>
                <RadioGroup value={mode} onValueChange={(value: TournamentMode) => setMode(value)}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="fixed" id="fixed" />
                    <Label htmlFor="fixed">Fixed Teams</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="solo" id="solo" />
                    <Label htmlFor="solo">Solo (Random Partners)</Label>
                  </div>
                </RadioGroup>
              </div>
              <div className="space-y-2">
                <Label htmlFor="total-points">Total Points per Game</Label>
                <Select value={totalPoints.toString()} onValueChange={(value) => setTotalPoints(parseInt(value))}>
                  <SelectTrigger id="total-points">
                    <SelectValue placeholder="Select total points" />
                  </SelectTrigger>
                  <SelectContent>
                    {[5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16].map((points) => (
                      <SelectItem key={points} value={points.toString()}>
                        {points} points
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {courts.map((court) => (
                <div key={court.id} className="space-y-2">
                  <Label htmlFor={`court-${court.id}`}>Court {court.id} Name</Label>
                  <Input
                    id={`court-${court.id}`}
                    value={court.name}
                    onChange={(e) => handleCourtNameChange(court.id, e.target.value)}
                    placeholder="e.g., Center Court"
                  />
                </div>
              ))}
              <Button type="button" onClick={handleAddCourt} variant="outline">
                Add Court
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Players Registration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {renderPlayerInputs()}
              <Button 
                type="button" 
                onClick={handleAddPlayer} 
                variant="outline"
              >
                Add {mode === 'fixed' ? 'Team' : 'Player'}
              </Button>
            </CardContent>
          </Card>

          <Button type="submit" className="md:col-span-2">
            Generate Schedule
          </Button>
        </form>
      </div>
    </div>
  )
}

