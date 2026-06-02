import { useEffect } from 'react'
import { supabase } from '../lib/supabase'

const LIMIT = 100

/**
 * Carrega histórico do agente ao montar o componente.
 * setMessages deve ser a função setState do componente pai.
 */
export function useAgentHistory(agent, userId, setMessages) {
  useEffect(() => {
    if (!userId) return
    supabase
      .from('agent_messages')
      .select('role, content, metadata, created_at')
      .eq('user_id', userId)
      .eq('agent', agent)
      .order('created_at', { ascending: true })
      .limit(LIMIT)
      .then(({ data, error }) => {
        if (error || !data?.length) return
        setMessages(data.map(m => ({
          role:    m.role,
          content: m.content,
          time:    new Date(m.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          ...(m.metadata || {}),
        })))
      })
  }, [userId, agent])
}

/** Persiste uma mensagem no banco (fire-and-forget). */
export function saveAgentMessage(agent, userId, role, content, metadata = {}) {
  if (!userId) return
  supabase.from('agent_messages').insert({
    user_id:  userId,
    agent,
    role,
    content,
    metadata,
  }).then(() => {})
}

/** Apaga todo o histórico do agente no banco e reseta o estado local. */
export async function clearAgentHistory(agent, userId, resetFn) {
  if (userId) {
    await supabase
      .from('agent_messages')
      .delete()
      .eq('user_id', userId)
      .eq('agent', agent)
  }
  resetFn()
}
