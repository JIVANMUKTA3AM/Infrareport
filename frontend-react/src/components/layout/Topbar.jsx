import { Bell, RefreshCw, Download, ChevronRight, X, Calendar, FileText, Wrench } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { useNotifications } from '../../hooks/useNotifications'

const PAGE_TITLES = {
  dashboard:           { title: 'Dashboard Financeiro',   sub: 'Atualizado em tempo real' },
  propostas:           { title: 'Propostas Comerciais',   sub: 'Geração automática via agente IA' },
  projetos:            { title: 'Projetos / OS',          sub: 'Ordens de serviço e acompanhamento' },
  agenda:              { title: 'Agenda',                  sub: 'Visitas e serviços programados' },
  entradas:            { title: 'Entradas',               sub: 'Receitas e recebimentos' },
  saidas:              { title: 'Saídas',                 sub: 'Despesas e pagamentos' },
  categorias:          { title: 'Categorias',             sub: 'Gerenciar categorias financeiras' },
  relatorios:          { title: 'Relatórios',             sub: 'Exportar e analisar dados' },
  arquivos:            { title: 'Arquivos',               sub: 'Propostas, relatórios e exportações' },
  'agente-tecnico':    { title: 'Agente Técnico',         sub: 'AC · CFTV · TI · Elétrica · Alarme · Automação · Telecom' },
  'agente-comercial':  { title: 'Agente Comercial',       sub: 'Geração automática de propostas via IA' },
  'agente-financeiro': { title: 'Agente Financeiro',      sub: 'Controle financeiro em linguagem natural' },
  'agente-whatsapp':   { title: 'Agente WhatsApp',        sub: 'Atendimento automático · Plano Pro' },
  configuracoes:       { title: 'Configurações',          sub: 'Conta, plano e preferências' },
}

const PERIODS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Ano']

const NOTIF_ICONS = { event: Calendar, proposal: FileText, project: Wrench }
const NOTIF_COLORS = {
  event:    { bg: '#DBEAFE', text: '#1D4ED8' },
  proposal: { bg: '#FEF3C7', text: '#B45309' },
  project:  { bg: '#DCFCE7', text: '#166534' },
}

export default function Topbar({ page, onRefresh, user }) {
  const [period,   setPeriod]   = useState('Mar')
  const [spinning, setSpinning] = useState(false)
  const [bellOpen, setBellOpen] = useState(false)
  const bellRef = useRef(null)

  const { notifications, refetch } = useNotifications(user?.id)

  const { title, sub } = PAGE_TITLES[page] || PAGE_TITLES.dashboard

  function handleRefresh() {
    setSpinning(true)
    onRefresh()
    setTimeout(() => setSpinning(false), 800)
  }

  // Close bell dropdown on outside click
  useEffect(() => {
    function handleClick(e) {
      if (bellRef.current && !bellRef.current.contains(e.target)) setBellOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const count = notifications.count || 0

  return (
    <header
      className="sticky top-0 z-40 px-8 h-[60px] flex items-center justify-between"
      style={{
        background: 'rgba(240,244,255,0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(37,99,235,0.1)',
        boxShadow: '0 1px 0 rgba(255,255,255,0.8), 0 4px 24px rgba(37,99,235,0.05)',
      }}
    >
      {/* Breadcrumb + título */}
      <div className="flex items-center gap-2 min-w-0">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-[0.98rem] font-bold text-slate-900 tracking-tight leading-none truncate">
              {title}
            </h1>
            {page === 'dashboard' && (
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[0.62rem] font-bold"
                style={{ background: 'rgba(16,185,129,0.1)', color: '#059669', border: '1px solid rgba(16,185,129,0.2)' }}>
                <span className="live-dot w-1.5 h-1.5" />
                LIVE
              </div>
            )}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5 text-[0.7rem] text-slate-400">
            <span>InfraReport</span>
            <ChevronRight size={10} className="text-slate-300" />
            <span className="text-slate-500">{title}</span>
            {page === 'dashboard' && (
              <>
                <ChevronRight size={10} className="text-slate-300" />
                <span className="text-blue-500">{sub}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0">

        {/* Dashboard-only controls */}
        {page === 'dashboard' && (
          <>
            {/* Period selector */}
            <div
              className="flex rounded-xl overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.8)', border: '1px solid rgba(37,99,235,0.12)', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
            >
              {PERIODS.map(m => (
                <button key={m} onClick={() => setPeriod(m)}
                  className="px-3 py-1.5 text-[0.72rem] font-semibold transition-all"
                  style={period === m
                    ? { background: 'linear-gradient(135deg,#1D4ED8,#3B82F6)', color: '#fff', boxShadow: '0 2px 8px rgba(37,99,235,0.35)' }
                    : { color: '#64748B' }
                  }
                >{m}</button>
              ))}
            </div>

            {/* Refresh */}
            <button onClick={handleRefresh}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-blue-600 transition-all"
              style={{ background: 'rgba(255,255,255,0.8)', border: '1px solid rgba(37,99,235,0.1)' }}
              title="Atualizar dados">
              <RefreshCw size={13} className={spinning ? 'animate-spin' : ''} />
            </button>

            {/* Export */}
            <button onClick={() => window.print()}
              className="flex items-center gap-1.5 px-4 py-1.5 text-[0.75rem] font-bold text-white rounded-xl transition-all hover:opacity-90 hover:-translate-y-px"
              style={{ background: 'linear-gradient(135deg,#1D4ED8,#3B82F6)', boxShadow: '0 4px 16px rgba(37,99,235,0.4)' }}>
              <Download size={12} />
              Exportar PDF
            </button>
          </>
        )}

        {/* Bell — always visible */}
        <div className="relative" ref={bellRef}>
          <button
            onClick={() => { setBellOpen(o => !o); if (!bellOpen) refetch() }}
            className="relative w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-blue-600 transition-all"
            style={{ background: 'rgba(255,255,255,0.8)', border: '1px solid rgba(37,99,235,0.1)' }}
            title="Notificações"
          >
            <Bell size={13} />
            {count > 0 && (
              <span
                className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full text-[9px] font-bold text-white flex items-center justify-center"
                style={{ background: '#EF4444', boxShadow: '0 0 6px rgba(239,68,68,0.6)' }}
              >
                {count > 9 ? '9+' : count}
              </span>
            )}
            {count === 0 && (
              <span
                className="absolute top-1 right-1 w-2 h-2 rounded-full border-2 border-white"
                style={{ background: count === 0 ? '#94A3B8' : '#EF4444' }}
              />
            )}
          </button>

          {/* Notification dropdown */}
          {bellOpen && (
            <div
              className="absolute right-0 mt-2 w-80 rounded-2xl overflow-hidden shadow-xl z-50"
              style={{ background: '#fff', border: '1px solid rgba(37,99,235,0.1)', top: '100%' }}
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                <span className="text-[0.82rem] font-bold text-slate-800">Notificações</span>
                <button onClick={() => setBellOpen(false)} className="text-slate-400 hover:text-slate-600 transition">
                  <X size={14} />
                </button>
              </div>

              {notifications.items?.length === 0 ? (
                <div className="py-8 text-center">
                  <Bell size={24} className="mx-auto mb-2 text-slate-200" />
                  <p className="text-[0.78rem] text-slate-400">Nenhuma notificação</p>
                </div>
              ) : (
                <div className="max-h-80 overflow-y-auto">
                  {notifications.items.map(n => {
                    const IconComp = NOTIF_ICONS[n.type] || Bell
                    const colors   = NOTIF_COLORS[n.type] || { bg: '#F1F5F9', text: '#475569' }
                    return (
                      <a
                        key={n.id}
                        href={`#${n.link}`}
                        onClick={() => setBellOpen(false)}
                        className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition border-b border-slate-50 last:border-0"
                      >
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                          style={{ background: colors.bg }}>
                          <IconComp size={14} style={{ color: colors.text }} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[0.78rem] font-semibold text-slate-800 leading-snug truncate">{n.title}</p>
                          {n.body && <p className="text-[0.7rem] text-slate-500 mt-0.5 truncate">{n.body}</p>}
                          {n.urgency === 'high' && (
                            <span className="inline-block mt-1 text-[0.62rem] font-bold px-1.5 py-0.5 rounded"
                              style={{ background: '#FEE2E2', color: '#DC2626' }}>URGENTE</span>
                          )}
                        </div>
                      </a>
                    )
                  })}
                </div>
              )}

              <div className="px-4 py-2.5 border-t border-slate-100">
                <a href="#agenda" onClick={() => setBellOpen(false)}
                  className="text-[0.74rem] font-semibold text-blue-600 hover:underline">
                  Ver agenda completa →
                </a>
              </div>
            </div>
          )}
        </div>

      </div>
    </header>
  )
}
