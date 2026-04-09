'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Database } from '@/types/database'
import { useAuth } from './useAuth'

type Teacher = Database['public']['Tables']['teachers']['Row']

export function useTeacher() {
  const { user } = useAuth()
  const [teacher, setTeacher] = useState<Teacher | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { setLoading(false); return }
    supabase
      .from('teachers')
      .select('*')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        setTeacher(data)
        setLoading(false)
      })
  }, [user])

  const updateTeacher = async (updates: Database['public']['Tables']['teachers']['Update']) => {
    if (!user) return
    const { data, error } = await supabase
      .from('teachers')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', user.id)
      .select()
      .single()
    if (!error && data) setTeacher(data)
    return { data, error }
  }

  return { teacher, loading, updateTeacher }
}
