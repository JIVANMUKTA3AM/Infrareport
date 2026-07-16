import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import {
  Mail, CheckCircle2, XCircle, Loader2,
  User, CreditCard, Plug, MessageCircle,
  ExternalLink, Trash2, RefreshCw, Shield,
} from 'lucide-react'

const API = import.meta.env.VITE_API_URL || 'https://api.infrareport.3amgflowz.com.br'

// ── helpers ──────────────────────────────────────────────────────────────────
function authHeaders(session) {
  return { Authorization: `Bearer ${session?.access_token}` }
}

// ── sub-seções ────────────────────────────────────────────────────────────────
function SectionCard({ title, icon: Icon, children }) {
  return (
    <div
      className="rounded-2xl p-6 mb-5"
      style={{
        background: 'rgba(255,255,255,0.55)',
        border: '1px solid rgba(148,163,184,0.18)',
        backdropFilter: 'blur(12px)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
      }}
    >
      <div className="flex items-center gap-2.5 mb-5">
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg,#1D4ED8,#06B6D4)' }}
        >
          <Icon size={14} className="text-white" />
        </div>
        <h2 className="text-[0.9rem] font-bold text-slate-700">{title}</h2>
      </div>
      {children}
    </div>
  )
}

// ── Perfil ────────────────────────────────────────────────────────────────────
function ProfileSection({ user }) {
  const initials = user?.name
    ? user.name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
    : 'U'

  return (
    <SectionCard title="Perfil" icon={User}>
      <div className="flex items-center gap-4">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center text-[1.1rem] font-bold text-white shrink-0"
          style={{ background: 'linear-gradient(135deg,#2563EB,#06B6D4)', boxShadow: '0 4px 16px rgba(37,99,235,0.35)' }}
        >
          {initials}
        </div>
        <div>
          <div className="text-[0.95rem] font-semibold text-slate-800">{user?.name || '—'}</div>
          <div className="text-[0.8rem] text-slate-500 mt-0.5">{user?.email || '—'}</div>
          <div className="mt-1.5">
            <span
              className="text-[0.65rem] font-bold px-2 py-0.5 rounded-full uppercase"
              style={{ background: 'linear-gradient(90deg,rgba(37,99,235,0.12),rgba(6,182,212,0.12))', color: '#2563EB', border: '1px solid rgba(37,99,235,0.2)' }}
            >
              Plano {user?.plan || 'demo'}
            </span>
          </div>
        </div>
      </div>
    </SectionCard>
  )
}

// ── Plano ─────────────────────────────────────────────────────────────────────
function PlanSection({ user }) {
  const limits = user?.plan_limits
  return (
    <SectionCard title="Plano & Limites" icon={CreditCard}>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Plano atual',    value: (user?.plan || 'demo').toUpperCase() },
          { label: 'Propostas/mês',  value: limits?.proposals_limit === -1 ? '∞' : (limits?.proposals_limit ?? '—') },
          { label: 'Agente WhatsApp', value: limits?.whatsapp_agent ? 'Ativo' : 'Indisponível' },
          { label: 'Multi-usuário',  value: limits?.multi_user ? 'Sim' : 'Não' },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="rounded-xl p-3 text-center"
            style={{ background: 'rgba(248,250,252,0.8)', border: '1px solid rgba(148,163,184,0.15)' }}
          >
            <div className="text-[0.65rem] text-slate-400 uppercase tracking-wide mb-1">{label}</div>
            <div className="text-[0.9rem] font-bold text-slate-700">{value}</div>
          </div>
        ))}
      </div>
      <p className="text-[0.72rem] text-slate-400 mt-4">
        Para fazer upgrade entre em contato ou acesse o painel de pagamentos.
      </p>
    </SectionCard>
  )
}

// ── Gmail Integration ─────────────────────────────────────────────────────────
function GmailSection({ session }) {
  const [status, setStatus]   = useState(null)   // null | { provider_email, updated_at }
  const [loading, setLoading] = useState(true)
  const [busy, setBusy]       = useState(false)
  const [error, setError]     = useState('')

  const headers = authHeaders(session)

  async function fetchStatus() {
    setLoading(true)
    try {
      const r = await fetch(`${API}/api/integrations/status`, { headers })
      const d = await r.json()
      const gmail = (d.integrations || []).find(i => i.provider === 'gmail')
      setStatus(gmail || null)
    } catch {
      setError('Erro ao carregar status')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchStatus() }, [])

  // Verifica se voltou do OAuth (URL contém ?gmail_callback=1&code=...)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code   = params.get('code')
    const isGmailCb = params.get('gmail_callback') === '1'
    if (!code || !isGmailCb) return

    setBusy(true)
    setError('')
    fetch(`${API}/api/integrations/gmail/callback?code=${encodeURIComponent(code)}`, { headers })
      .then(r => r.json())
      .then(d => {
        if (d.ok) {
          fetchStatus()
          // limpa a URL
          window.history.replaceState({}, '', window.location.pathname + '#configuracoes')
        } else {
          setError(d.detail || 'Erro ao conectar Gmail')
        }
      })
      .catch(() => setError('Erro ao conectar Gmail'))
      .finally(() => setBusy(false))
  }, [])

  async function handleConnect() {
    setBusy(true)
    setError('')
    try {
      const r = await fetch(`${API}/api/integrations/gmail/auth`, { headers })
      const d = await r.json()
      if (d.auth_url) window.location.href = d.auth_url
    } catch {
      setError('Erro ao gerar URL de autorização')
      setBusy(false)
    }
  }

  async function handleDisconnect() {
    if (!confirm('Desconectar Gmail? Os agentes voltarão a usar o e-mail padrão do sistema.')) return
    setBusy(true)
    try {
      await fetch(`${API}/api/integrations/gmail/disconnect`, { method: 'DELETE', headers })
      setStatus(null)
    } catch {
      setError('Erro ao desconectar')
    } finally {
      setBusy(false)
    }
  }

  return (
    <SectionCard title="Integrações" icon={Plug}>
      {/* Gmail */}
      <div
        className="rounded-xl p-4 flex items-center justify-between gap-4"
        style={{ background: 'rgba(248,250,252,0.9)', border: '1px solid rgba(148,163,184,0.18)' }}
      >
        <div className="flex items-center gap-3">
          {/* Gmail logo */}
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'white', border: '1px solid rgba(0,0,0,0.08)', boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
            <svg width="20" height="20" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 24.6L6 13.2V36h36V13.2z"/>
              <path fill="#FBBC04" d="M6 13.2l18 11.4 18-11.4V12H6z"/>
              <path fill="#34A853" d="M42 13.2V36h-6V21.6z"/>
              <path fill="#4285F4" d="M6 36V13.2L12 21.6V36z"/>
              <path fill="#C5221F" d="M24 24.6L6 36h36z" opacity=".1"/>
            </svg>
          </div>
          <div>
            <div className="text-[0.82rem] font-semibold text-slate-700 flex items-center gap-1.5">
              Gmail
              {loading ? (
                <Loader2 size={12} className="animate-spin text-slate-400" />
              ) : status ? (
                <CheckCircle2 size={13} className="text-emerald-500" />
              ) : (
                <XCircle size={13} className="text-slate-300" />
              )}
            </div>
            <div className="text-[0.72rem] text-slate-400 mt-0.5">
              {loading
                ? 'Verificando...'
                : status
                  ? `Conectado como ${status.provider_email}`
                  : 'Envie propostas diretamente do seu Gmail'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {status ? (
            <>
              <button
                onClick={fetchStatus}
                disabled={busy || loading}
                className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                title="Atualizar"
              >
                <RefreshCw size={13} className="text-slate-400" />
              </button>
              <button
                onClick={handleDisconnect}
                disabled={busy}
                className="flex items-center gap-1.5 text-[0.75rem] font-medium px-3 py-1.5 rounded-lg transition-colors hover:bg-red-50 text-red-500"
                style={{ border: '1px solid rgba(239,68,68,0.2)' }}
              >
                {busy ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                Desconectar
              </button>
            </>
          ) : (
            <button
              onClick={handleConnect}
              disabled={busy || loading}
              className="flex items-center gap-1.5 text-[0.75rem] font-semibold px-4 py-1.5 rounded-lg text-white transition-all hover:opacity-90"
              style={{ background: 'linear-gradient(135deg,#1D4ED8,#06B6D4)', boxShadow: '0 2px 10px rgba(37,99,235,0.35)' }}
            >
              {busy ? <Loader2 size={12} className="animate-spin" /> : <ExternalLink size={12} />}
              Conectar
            </button>
          )}
        </div>
      </div>

      {error && (
        <p className="text-[0.72rem] text-red-500 mt-2">{error}</p>
      )}

      <div
        className="mt-4 rounded-xl p-3 flex gap-2.5"
        style={{ background: 'rgba(37,99,235,0.05)', border: '1px solid rgba(37,99,235,0.1)' }}
      >
        <Shield size={14} className="text-blue-500 shrink-0 mt-0.5" />
        <p className="text-[0.72rem] text-slate-500">
          Usamos apenas o escopo <strong>gmail.send</strong> — somente envio de e-mails.
          Nunca lemos, excluímos ou modificamos suas mensagens. Você pode revogar o acesso a qualquer momento
          em <a href="https://myaccount.google.com/permissions" target="_blank" rel="noreferrer" className="text-blue-500 underline">myaccount.google.com/permissions</a>.
        </p>
      </div>
    </SectionCard>
  )
}

// ── WhatsApp ──────────────────────────────────────────────────────────────────
function WhatsAppSection({ user }) {
  const hasAccess = user?.plan_limits?.whatsapp_agent
  return (
    <SectionCard title="WhatsApp" icon={MessageCircle}>
      {hasAccess ? (
        <div>
          <div
            className="rounded-xl p-4 flex items-center gap-3"
            style={{ background: 'rgba(248,250,252,0.9)', border: '1px solid rgba(148,163,184,0.18)' }}
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: '#25D366' }}
            >
              <MessageCircle size={16} className="text-white" />
            </div>
            <div>
              <div className="text-[0.82rem] font-semibold text-slate-700">Agente WhatsApp</div>
              <div className="text-[0.72rem] text-slate-400 mt-0.5">Configure pelo painel de Agentes → Agente WhatsApp</div>
            </div>
          </div>
        </div>
      ) : (
        <div
          className="rounded-xl p-4 text-center"
          style={{ background: 'rgba(248,250,252,0.9)', border: '1px dashed rgba(148,163,184,0.3)' }}
        >
          <MessageCircle size={22} className="text-slate-300 mx-auto mb-2" />
          <p className="text-[0.8rem] text-slate-500 font-medium">Disponível no plano Pro ou Agency</p>
          <p className="text-[0.72rem] text-slate-400 mt-1">Faça upgrade para habilitar o Agente WhatsApp</p>
        </div>
      )}
    </SectionCard>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Configuracoes() {
  const { user, session } = useAuth()

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-[1.2rem] font-black text-slate-800">Configurações</h1>
        <p className="text-[0.8rem] text-slate-500 mt-0.5">Gerencie seu perfil, plano e integrações</p>
      </div>

      <ProfileSection user={user} />
      <PlanSection user={user} />
      <GmailSection session={session} />
      <WhatsAppSection user={user} />
    </div>
  )
}
