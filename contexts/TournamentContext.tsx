'use client'

import { createContext, useContext, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface Court {
  id: number
  name: string
}

interface Tournament {
  id: string
  name: string
  mode: 'solo' | 'fixed'
  total_points: number
  courts: Court[]
  players: string[]
}

interface TournamentContextType {
  createTournament: (tournament: Omit<Tournament, 'id'>) => Promise<void>
  getUserTournaments: () => Promise<Tournament[]>
  deleteTournament: (id: string) => Promise<void>
}

const TournamentContext = createContext<TournamentContextType | undefined>(undefined)

export function TournamentProvider({ children }: { children: React.ReactNode }) {
  const createTournament = async (tournament: Omit<Tournament, 'id'>) => {
    const { data: { user } } = await supabase.auth.getUser()
    
    // Use explicit transaction when needed
    const { data, error } = await supabase.rpc('create_tournament_with_games', {
      tournament_data: {
        ...tournament,
        user_id: user?.id
      }
    })
    
    if (error) throw error
    return data
  }

  const getUserTournaments = async () => {
    const { data, error } = await supabase
      .from('tournaments')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data as Tournament[]
  }

  const deleteTournament = async (id: string) => {
    const { error } = await supabase
      .from('tournaments')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }

  return (
    <TournamentContext.Provider value={{
      createTournament,
      getUserTournaments,
      deleteTournament,
    }}>
      {children}
    </TournamentContext.Provider>
  )
}

export const useTournament = () => {
  const context = useContext(TournamentContext)
  if (context === undefined) {
    throw new Error('useTournament must be used within a TournamentProvider')
  }
  return context
} 