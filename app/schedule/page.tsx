'use client'

import { useState, useEffect } from 'react'
import { TopNav } from '@/components/top-nav'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { generateSchedule } from '@/utils/scheduleGenerator'
import Link from 'next/link'

interface Court {
  id: number;
  name: string;
}

interface Game {
  court: Court;
  team1: string[];
  team2: string[];
}

export default function Schedule() {
  const [schedule, setSchedule] = useState<Game[][]>([])
  const [mode, setMode] = useState<'solo' | 'fixed'>('fixed')

  useEffect(() => {
    const setup = JSON.parse(localStorage.getItem('tournamentSetup') || '{}')
    if (setup.players && setup.courts) {
      const generatedSchedule = generateSchedule(setup.players, setup.courts, setup.mode)
      setSchedule(generatedSchedule)
      setMode(setup.mode)
      localStorage.setItem('schedule', JSON.stringify(generatedSchedule))
    }
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Tournament Schedule ({mode === 'solo' ? 'Solo Mode' : 'Fixed Teams'})</h1>
          <Link href="/scores">
            <Button>Log Scores</Button>
          </Link>
        </div>
        
        <div className="grid gap-4">
          {schedule.map((round, roundIndex) => (
            <Card key={roundIndex}>
              <CardHeader>
                <CardTitle>Round {roundIndex + 1}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {round.map((game, gameIndex) => (
                    <Card key={gameIndex}>
                      <CardContent className="p-4">
                        <div className="font-semibold mb-2">{game.court.name}</div>
                        <div className="space-y-1">
                          <div className="text-sm">
                            {game.team1.join(' & ')}
                          </div>
                          <div className="text-sm text-muted-foreground">vs</div>
                          <div className="text-sm">
                            {game.team2.join(' & ')}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

