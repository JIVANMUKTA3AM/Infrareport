import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { Zap, Eye, EyeOff, Loader2, CheckCircle, ArrowRight, Wrench, TrendingUp, FileText } from 'lucide-react'

const FEATURES = [
  { icon: FileText,   title: 'Propostas Automáticas',  desc: 'Gere propostas profissionais em segundos com IA'      },
  { icon: TrendingUp, title: 'Controle Financeiro',    desc: 'Entradas e saídas por comando de voz natural'         },
  { icon: Wrench,     title: 'Agente Técnico IA',      desc: 'Suporte técnico 24h para AC, CFTV, Redes e muito mais' },
]

const PLANS = [
  { name: 'Demo',    price: 'Grátis', desc: '5 propostas · Experimente agora', highlight: false },
  { name: 'Pro',     price: 'R$197',  desc: '100 propostas + WhatsApp Agent',  highlight: true  },
  { name: 'Agency',  price: 'R$397',  desc: 'Ilimitado · Multi-usuário',       highlight: false },
]

export default function Login({ onBack, defaultTab = 'login' }) {
  const { signIn, signUp, signInWithGoogle, resetPassword } = useAuth()
  const [tab,        setTab]       = useState(defaultTab) // 'login' | 'register'
  const [loading,    setLoading]   = useState(false)
  const [error,      setError]     = useState('')
  const [success,    setSuccess]   = useState('')
  const [showPass,   setShowPass]  = useState(false)
  const [forgotMode, setForgotMode] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetSent,  setResetSent]  = useState(false)

  const [form, setForm] = useState({ name: '', company: '', email: '', password: '' })
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  async function handleReset(e) {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      await resetPassword(resetEmail)
      setResetSent(true)
    } catch (err) {
      setError(err.message || 'Não foi possível enviar o e-mail de redefinição.')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(''); setSuccess(''); setLoading(true)
    try {
      if (tab === 'login') {
        await signIn({ email: form.email, password: form.password })
      } else {
        await signUp({ email: form.email, password: form.password, name: form.name, company: form.company })
        setSuccess('Conta criada! Verifique seu e-mail para confirmar o acesso.')
      }
    } catch (err) {
      const msgs = {
        'Invalid login credentials': 'E-mail ou senha incorretos.',
        'Email not confirmed':        'Confirme seu e-mail antes de entrar.',
        'User already registered':    'Este e-mail já está cadastrado.',
      }
      setError(msgs[err.message] || err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'linear-gradient(145deg,#EEF2FF,#F0F9FF,#F5F3FF)' }}>

      {/* ── Painel esquerdo — Branding ─────────────────────────────────── */}
      <div
        className="hidden lg:flex flex-col justify-between w-[480px] shrink-0 p-10"
        style={{
          background: 'linear-gradient(160deg,#060E20 0%,#0A1628 60%,#0D1F3C 100%)',
          boxShadow: '4px 0 40px rgba(0,0,0,0.3)',
        }}
      >
        {/* Logo */}
        <div>
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#1D4ED8,#06B6D4)', boxShadow: '0 4px 20px rgba(37,99,235,0.5)' }}>
              <Zap size={20} className="text-white" fill="white" />
            </div>
            <div>
              <div className="text-[1.3rem] font-black text-white">
                Infra<span style={{ background:'linear-gradient(90deg,#60A5FA,#06B6D4)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>Report</span>
              </div>
              <div className="text-[0.62rem] text-white/25 uppercase tracking-widest">Gestão Técnica Inteligente</div>
            </div>
          </div>

          <h2 className="text-[1.8rem] font-black text-white leading-tight mb-3">
            Automatize sua<br />
            <span style={{ background:'linear-gradient(90deg,#60A5FA,#06B6D4)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
              gestão técnica
            </span>
          </h2>
          <p className="text-[0.88rem] text-white/50 mb-10 leading-relaxed">
            Plataforma SaaS para engenheiros e técnicos que querem ganhar tempo, fechar mais contratos e ter controle financeiro total.
          </p>

          <div className="space-y-5">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-4">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background:'rgba(59,130,246,0.12)', border:'1px solid rgba(59,130,246,0.2)' }}>
                  <Icon size={16} className="text-blue-400" />
                </div>
                <div>
                  <div className="text-[0.83rem] font-bold text-white/90">{title}</div>
                  <div className="text-[0.75rem] text-white/40 mt-0.5">{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Planos */}
        <div>
          <div className="text-[0.65rem] font-bold text-white/25 uppercase tracking-widest mb-3">Planos disponíveis</div>
          <div className="grid grid-cols-3 gap-2">
            {PLANS.map(p => (
              <div
                key={p.name}
                className="p-3 rounded-xl text-center"
                style={{
                  background: p.highlight ? 'linear-gradient(135deg,rgba(37,99,235,0.25),rgba(6,182,212,0.15))' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${p.highlight ? 'rgba(59,130,246,0.3)' : 'rgba(255,255,255,0.07)'}`,
                }}
              >
                <div className="text-[0.7rem] font-bold text-white/70">{p.name}</div>
                <div className="text-[0.95rem] font-black text-white my-0.5">{p.price}</div>
                <div className="text-[0.62rem] text-white/35 leading-tight">{p.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Painel direito — Formulário ────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-[400px]">

          {/* Voltar para o site */}
          {onBack && (
            <button onClick={onBack}
              className="flex items-center gap-1.5 text-[0.78rem] font-medium text-slate-400 hover:text-slate-700 transition-colors mb-6">
              ← Voltar ao site
            </button>
          )}

          {/* Logo mobile */}
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background:'linear-gradient(135deg,#1D4ED8,#06B6D4)', boxShadow:'0 4px 16px rgba(37,99,235,0.4)' }}>
              <Zap size={15} className="text-white" fill="white" />
            </div>
            <span className="text-[1.1rem] font-black text-slate-800">
              Infra<span style={{ background:'linear-gradient(90deg,#2563EB,#06B6D4)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>Report</span>
            </span>
          </div>

          <div className="mb-6">
            <h1 className="text-[1.4rem] font-black text-slate-900 leading-tight">
              {tab === 'login' ? 'Bem-vindo de volta' : 'Crie sua conta grátis'}
            </h1>
            <p className="text-[0.82rem] text-slate-500 mt-1">
              {tab === 'login' ? 'Entre com suas credenciais para acessar o sistema.' : 'Comece com o plano Demo — sem cartão de crédito.'}
            </p>
          </div>

          {/* Tabs */}
          <div className="flex rounded-xl p-1 mb-6"
            style={{ background:'rgba(255,255,255,0.8)', border:'1px solid rgba(37,99,235,0.1)' }}>
            {['login','register'].map(t => (
              <button
                key={t}
                onClick={() => { setTab(t); setError(''); setSuccess('') }}
                className="flex-1 py-2 rounded-lg text-[0.8rem] font-semibold transition-all"
                style={tab === t ? {
                  background: 'linear-gradient(135deg,#1D4ED8,#3B82F6)',
                  color: '#fff',
                  boxShadow: '0 2px 8px rgba(37,99,235,0.35)',
                } : { color:'#64748B' }}
              >
                {t === 'login' ? 'Fazer Login' : 'Criar Conta'}
              </button>
            ))}
          </div>

          {/* Google */}
          <button
            type="button"
            onClick={signInWithGoogle}
            className="w-full flex items-center justify-center gap-3 py-2.5 rounded-xl text-[0.85rem] font-semibold text-slate-700 transition-all hover:bg-slate-50 mb-4"
            style={{ background:'#fff', border:'1.5px solid rgba(0,0,0,0.12)', boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}
          >
            <svg width="18" height="18" viewBox="0 0 48 48">
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            </svg>
            Continuar com Google
          </button>

          <div className="flex items-center gap-3 mb-4">
            <span className="flex-1 h-px bg-slate-200" />
            <span className="text-[0.72rem] text-slate-400 font-medium">ou com e-mail</span>
            <span className="flex-1 h-px bg-slate-200" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {tab === 'register' && (
              <>
                <Field label="Nome completo" type="text" value={form.name}
                  onChange={set('name')} placeholder="Eng. João Silva" required />
                <Field label="Empresa (opcional)" type="text" value={form.company}
                  onChange={set('company')} placeholder="Silva Engenharia Ltda" />
              </>
            )}

            <Field label="E-mail" type="email" value={form.email}
              onChange={set('email')} placeholder="joao@empresa.com" required />

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[0.75rem] font-bold text-slate-600">Senha</label>
                {tab === 'login' && (
                  <button type="button"
                    onClick={() => { setForgotMode(f => !f); setError(''); setResetSent(false) }}
                    className="text-[0.72rem] text-blue-500 hover:text-blue-700 font-medium transition-colors">
                    Esqueci minha senha
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={set('password')}
                  placeholder={tab === 'register' ? 'Mínimo 8 caracteres' : '••••••••'}
                  minLength={tab === 'register' ? 8 : undefined}
                  required
                  className="w-full pr-10 pl-4 py-2.5 rounded-xl text-[0.85rem] text-slate-800 outline-none transition-all"
                  style={{
                    background: 'rgba(255,255,255,0.9)',
                    border: '1.5px solid rgba(37,99,235,0.15)',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                  }}
                  onFocus={e => e.target.style.borderColor = '#3B82F6'}
                  onBlur={e => e.target.style.borderColor = 'rgba(37,99,235,0.15)'}
                />
                <button type="button" onClick={() => setShowPass(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>

              {/* Painel de reset de senha */}
              {forgotMode && tab === 'login' && (
                <div className="mt-3 p-4 rounded-xl"
                  style={{ background:'rgba(37,99,235,0.05)', border:'1px solid rgba(37,99,235,0.15)' }}>
                  {resetSent ? (
                    <div className="flex items-center gap-2 text-[0.78rem] font-medium text-emerald-700">
                      <CheckCircle size={14} />
                      Link enviado! Verifique sua caixa de entrada.
                    </div>
                  ) : (
                    <form onSubmit={handleReset} className="flex flex-col gap-2">
                      <p className="text-[0.75rem] text-slate-500">Digite seu e-mail para receber o link de redefinição.</p>
                      <input
                        type="email"
                        value={resetEmail}
                        onChange={e => setResetEmail(e.target.value)}
                        placeholder="seu@email.com"
                        required
                        className="w-full px-3 py-2 rounded-lg text-[0.82rem] text-slate-800 outline-none"
                        style={{ background:'#fff', border:'1.5px solid rgba(37,99,235,0.2)' }}
                        onFocus={e => e.target.style.borderColor = '#3B82F6'}
                        onBlur={e => e.target.style.borderColor = 'rgba(37,99,235,0.2)'}
                      />
                      <button type="submit" disabled={loading}
                        className="w-full py-2 rounded-lg text-[0.8rem] font-bold text-white transition-all disabled:opacity-60"
                        style={{ background:'linear-gradient(135deg,#1D4ED8,#3B82F6)' }}>
                        {loading ? <Loader2 size={14} className="animate-spin mx-auto" /> : 'Enviar link'}
                      </button>
                    </form>
                  )}
                </div>
              )}
            </div>

            {/* Erro / Sucesso */}
            {error && (
              <div className="px-4 py-2.5 rounded-xl text-[0.78rem] font-medium text-red-700"
                style={{ background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)' }}>
                {error}
              </div>
            )}
            {success && (
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[0.78rem] font-medium text-emerald-700"
                style={{ background:'rgba(16,185,129,0.08)', border:'1px solid rgba(16,185,129,0.2)' }}>
                <CheckCircle size={14} /> {success}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-[0.88rem] font-bold text-white transition-all disabled:opacity-60 hover:opacity-90 hover:-translate-y-px mt-2"
              style={{
                background: 'linear-gradient(135deg,#1D4ED8,#3B82F6)',
                boxShadow: '0 4px 20px rgba(37,99,235,0.4)',
              }}
            >
              {loading
                ? <Loader2 size={16} className="animate-spin" />
                : <>
                    {tab === 'login' ? 'Entrar no sistema' : 'Criar conta gratuita'}
                    <ArrowRight size={15} />
                  </>
              }
            </button>
          </form>

          {tab === 'login' && (
            <p className="text-center text-[0.75rem] text-slate-400 mt-4">
              Não tem conta?{' '}
              <button onClick={() => setTab('register')} className="text-blue-600 font-semibold hover:underline">
                Cadastre-se grátis
              </button>
            </p>
          )}

          <p className="text-center text-[0.68rem] text-slate-300 mt-6">
            Ao continuar você concorda com os Termos de Uso e Política de Privacidade.
          </p>
        </div>
      </div>
    </div>
  )
}

// Campo de formulário reutilizável
function Field({ label, ...props }) {
  return (
    <div>
      <label className="block text-[0.75rem] font-bold text-slate-600 mb-1.5">{label}</label>
      <input
        {...props}
        className="w-full px-4 py-2.5 rounded-xl text-[0.85rem] text-slate-800 outline-none transition-all"
        style={{
          background: 'rgba(255,255,255,0.9)',
          border: '1.5px solid rgba(37,99,235,0.15)',
          boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
        }}
        onFocus={e => e.target.style.borderColor = '#3B82F6'}
        onBlur={e => e.target.style.borderColor = 'rgba(37,99,235,0.15)'}
      />
    </div>
  )
}
