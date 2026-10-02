import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { AuthContext } from './auth-context'

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(isSupabaseConfigured)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState('login')

  useEffect(() => {
    if (!supabase) return undefined

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  const openAuth = useCallback((mode = 'login') => {
    setModalMode(mode)
    setModalOpen(true)
  }, [])
  const closeAuth = useCallback(() => setModalOpen(false), [])

  const signIn = useCallback(async ({ email, password }) => {
    if (!supabase) throw new Error('Supabase is not configured')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }, [])

  const signUp = useCallback(async ({ email, password, username }) => {
    if (!supabase) throw new Error('Supabase is not configured')
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } },
    })
    if (error) throw error
    return { needsConfirmation: !data.session }
  }, [])

  const signOut = useCallback(async () => {
    if (!supabase) return
    await supabase.auth.signOut()
  }, [])

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      loading,
      isConfigured: isSupabaseConfigured,
      signIn,
      signUp,
      signOut,
      authModal: { open: modalOpen, mode: modalMode, openAuth, closeAuth },
    }),
    [session, loading, signIn, signUp, signOut, modalOpen, modalMode, openAuth, closeAuth],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
