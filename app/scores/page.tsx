'use client'

import { useState, useEffect } from 'react'
import { TopNav } from '@/components/top-nav'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'

interface Court {
  id: number;
  name: string;
}

interface Game {
  id: string;
  team1_score: number;
  team2_score: number;
  team1: string[];
  team2: string[];
  court: Court;
}

interface GameScore {
  team1Score: number;
  team2Score: number;
}

export default function Scores() {
  const [schedule, setSchedule] = useState<Game[][]>([])
  const [scores, setScores] = useState<GameScore[][]>([])
  const [mode, setMode] = useState<'solo' | 'fixed'>('fixed')
  const [currentRound, setCurrentRound] = useState(0)
  const [totalPoints, setTotalPoints] = useState(5)

  useEffect(() => {
    const savedSchedule = JSON.parse(localStorage.getItem('schedule') || '[]')
    const setup = JSON.parse(localStorage.getItem('tournamentSetup') || '{}')
    const savedScores = JSON.parse(localStorage.getItem('scores') || '[]')
    
    setSchedule(savedSchedule)
    setMode(setup.mode)
    setTotalPoints(setup.totalPoints || 5)
    
    if (savedScores.length === savedSchedule.length) {
      setScores(savedScores)
    } else {
      const initialScores = savedSchedule.map((round: any[]) => 
        round.map(() => ({ team1Score: 0, team2Score: 0 }))
      )
      setScores(initialScores)
      localStorage.setItem('scores', JSON.stringify(initialScores))
    }
  }, [])

  const handleScoreChange = (gameIndex: number, team: 'team1Score' | 'team2Score', value: string) => {
    const newScores = [...scores];
    if (!newScores[currentRound]) {
      newScores[currentRound] = [];
    }
    if (!newScores[currentRound][gameIndex]) {
      newScores[currentRound][gameIndex] = { team1Score: 0, team2Score: 0 };
    }

    const numericValue = Math.min(Math.max(0, parseInt(value) || 0), totalPoints);
    const otherTeam = team === 'team1Score' ? 'team2Score' : 'team1Score';

    // Update the entered score
    newScores[currentRound][gameIndex][team] = numericValue;
    // Calculate and update the other team's score
    newScores[currentRound][gameIndex][otherTeam] = totalPoints - numericValue;

    setScores(newScores);
    localStorage.setItem('scores', JSON.stringify(newScores));
  }

  const handleSave = () => {
    localStorage.setItem('scores', JSON.stringify(scores))
    alert('Scores saved successfully!')
  }

  const nextRound = () => {
    if (currentRound < schedule.length - 1) {
      setCurrentRound(currentRound + 1)
    }
  }

  const prevRound = () => {
    if (currentRound > 0) {
      setCurrentRound(currentRound - 1)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Score Logging ({mode === 'solo' ? 'Solo Mode' : 'Fixed Teams'})</h1>
          <div className="space-x-2">
            <Button onClick={handleSave}>Save Scores</Button>
            <Link href="/leaderboard">
              <Button variant="outline">View Leaderboard</Button>
            </Link>
          </div>
        </div>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Round {currentRound + 1}</CardTitle>
            <div className="flex items-center space-x-2">
              <Button onClick={prevRound} disabled={currentRound === 0} size="icon" variant="outline">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span>{currentRound + 1} / {schedule.length}</span>
              <Button onClick={nextRound} disabled={currentRound === schedule.length - 1} size="icon" variant="outline">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {schedule[currentRound]?.map((game, gameIndex) => (
                <Card key={gameIndex}>
                  <CardContent className="p-4">
                    <div className="font-semibold mb-2">{game.court.name}</div>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">{game.team1.join(' & ')}</span>
                        <Input
                          type="number"
                          value={scores[currentRound]?.[gameIndex]?.team1Score || 0}
                          onChange={(e) => handleScoreChange(gameIndex, 'team1Score', e.target.value)}
                          className="w-20"
                          min="0"
                          max={totalPoints}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">{game.team2.join(' & ')}</span>
                        <Input
                          type="number"
                          value={scores[currentRound]?.[gameIndex]?.team2Score || 0}
                          onChange={(e) => handleScoreChange(gameIndex, 'team2Score', e.target.value)}
                          className="w-20"
                          min="0"
                          max={totalPoints}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

