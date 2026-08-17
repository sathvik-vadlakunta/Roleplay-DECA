'use client'
import { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

type Profile = {
  id: string
  full_name: string
  role: 'student' | 'teacher' | 'admin'
  class_id: string | null
}

type AuthContextType = {
  user: User | null
  profile: Profile | null
  loading: boolean
  signUp: (name: string, email: string, password: string, role: 'student' | 'teacher') => Promise<void>
  logIn: (email: string, password: string) => Promise<void>
  logOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  // Memoize so the client is created once, not on every render
  const supabase = useMemo(() => createClient(), [])

  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = useCallback(async (uid: string, fallbackUser?: User) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, role, class_id')
      .eq('id', uid)
      .single()

    console.log('[fetchProfile]', { uid, data, error })

    if (data) {
      setProfile(data)
    } else if (fallbackUser?.user_metadata) {
      // No profile row yet — build one from auth metadata so the app still works
      const meta = fallbackUser.user_metadata
      const role = (meta.role === 'teacher' ? 'teacher' : 'student') as 'student' | 'teacher'
      // Insert only — never overwrite a manually-set role
      await supabase.from('profiles').insert({
        id: uid,
        full_name: meta.full_name ?? meta.name ?? '',
        role,
        class_id: null,
      }).select().maybeSingle()
      setProfile({ id: uid, full_name: meta.full_name ?? '', role, class_id: null })
    } else {
      setProfile(null)
    }
  }, [supabase])

  useEffect(() => {
    let mounted = true

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!mounted) return
      setUser(user ?? null)
      if (user) {
        fetchProfile(user.id, user).finally(() => { if (mounted) setLoading(false) })
      } else {
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id, session.user)
      else { setProfile(null); setLoading(false) }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [supabase, fetchProfile])

  async function signUp(name: string, email: string, password: string, role: 'student' | 'teacher') {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name, role } },
    })
    if (error) throw error
    // If email confirmation is ON, session is null here — tell the caller
    if (!data.session) throw new Error('CHECK_EMAIL')
    if (data.user) {
      await new Promise(r => setTimeout(r, 600))
      await fetchProfile(data.user.id, data.user)
    }
  }

  async function logIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    if (data.user) await fetchProfile(data.user.id, data.user)
  }

  async function logOut() {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signUp, logIn, logOut }}>
      {children}
    </AuthContext.Provider>
  )
}
