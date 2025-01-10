import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/supabase'

type Profile = Database['public']['Tables']['profiles']['Row']

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadProfile() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (error) throw error
        setProfile(data)
      } catch (error) {
        console.error('Error loading profile:', error)
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [])

  const updateProfile = async (updates: Partial<Profile>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No user logged in')

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)

      if (error) throw error
      setProfile(prev => prev ? { ...prev, ...updates } : null)
      return { error: null }
    } catch (error) {
      console.error('Error updating profile:', error)
      return { error }
    }
  }

  return {
    profile,
    loading,
    updateProfile
  }
} 