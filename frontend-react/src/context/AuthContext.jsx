import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user,         setUser]         = useState(null)
  const [session,      setSession]      = useState(null)
  const [loading,      setLoading]      = useState(true)
  const [recoveryMode, setRecoveryMode] = useState(false)

  // Carrega perfil da tabela users a partir do auth.uid
  async function loadProfile(authUser) {
    if (!authUser) { setUser(null); return }
    const { data: userData } = await supabase
      .from('users')
      .select('*')
      .eq('auth_id', authUser.id)
      .single()
    if (!userData) { setUser(null); return }
    const { data: planData } = await supabase
      .from('plan_limits')
      .select('label, proposals_limit, whatsapp_agent, multi_user')
      .eq('plan', userData.plan)
      .single()
    setUser({ ...userData, plan_limits: planData })
  }

  useEffect(() => {
    // Sessão inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      loadProfile(session?.user).finally(() => setLoading(false))
    })

    // Listener de mudanças
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setRecoveryMode(true)
        setSession(session)
        return
      }
      setRecoveryMode(false)
      setSession(session)
      loadProfile(session?.user)
    })
    return () => subscription.unsubscribe()
  }, [])

  // ── Actions ───────────────────────────────────────────────────────────
  async function signUp({ email, password, name, company }) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, company } },
    })
    if (error) throw error
    return data
  }

  async function signIn({ email, password }) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }

  async function signInWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}`,
        scopes: 'openid email profile',
      },
    })
    if (error) throw error
  }

  async function updatePassword(newPassword) {
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) throw error
    setRecoveryMode(false)
  }

  async function resetPassword(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}`,
    })
    if (error) throw error
  }

  async function signOut() {
    await supabase.auth.signOut()
    setUser(null)
    setSession(null)
  }

  const value = { user, session, loading, recoveryMode, signUp, signIn, signInWithGoogle, signOut, resetPassword, updatePassword }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de <AuthProvider>')
  return ctx
}
