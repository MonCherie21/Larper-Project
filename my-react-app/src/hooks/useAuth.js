import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

// Lightweight, reusable Supabase auth listener; no extra context library needed.
export function useAuth() {
  const [state, setState] = useState({ user: null, loading: Boolean(supabase) })

  useEffect(() => {
    if (!supabase) return undefined
    let active = true

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) setState({ user: session?.user ?? null, loading: false })
    })

    supabase.auth.getUser()
      .then(({ data, error }) => {
        if (active) setState({ user: error ? null : data.user, loading: false })
      })
      .catch(() => {
        if (active) setState({ user: null, loading: false })
      })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  return { ...state, configured: Boolean(supabase) }
}
