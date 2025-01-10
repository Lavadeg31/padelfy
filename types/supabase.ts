export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string | null
          full_name: string | null
          avatar_url: string | null
          updated_at: string | null
        }
        Insert: {
          id: string
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          updated_at?: string | null
        }
      }
      tournaments: {
        Row: {
          id: string
          user_id: string
          name: string
          mode: 'solo' | 'fixed'
          total_points: number
          courts: {
            id: number
            name: string
          }[]
          players: string[]
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          mode: 'solo' | 'fixed'
          total_points: number
          courts: {
            id: number
            name: string
          }[]
          players: string[]
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          mode?: 'solo' | 'fixed'
          total_points?: number
          courts?: {
            id: number
            name: string
          }[]
          players?: string[]
          created_at?: string
        }
      }
      games: {
        // ... existing games table type ...
      }
    }
    Functions: {
      create_tournament_with_games: {
        Args: {
          tournament_data: {
            user_id: string
            name: string
            mode: 'solo' | 'fixed'
            total_points: number
            courts: {
              id: number
              name: string
            }[]
            players: string[]
          }
        }
        Returns: string
      }
    }
  }
} 