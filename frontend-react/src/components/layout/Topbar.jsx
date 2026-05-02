import { Bell, RefreshCw, Download, ChevronRight } from 'lucide-react'
import { useState } from 'react'

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

export default function Topbar({ page, onRefresh }) {
  const [period, setPeriod]   = useState('Mar')
  const [spinning, setSpinning] = useState(false)
  const { title, sub } = PAGE_TITLES[page] || PAGE_TITLES.dashboard

  function handleRefresh() {
    setSpinning(true)
    onRefresh()
    setTimeout(() => setSpinning(false), 800)
  }

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
      {page === 'dashboard' && (
        <div className="flex items-center gap-2 shrink-0">

          {/* Period selector */}
          <div
            className="flex rounded-xl overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.8)', border: '1px solid rgba(37,99,235,0.12)', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
          >
            {PERIODS.map(m => (
              <button
                key={m}
                onClick={() => setPeriod(m)}
                className="px-3 py-1.5 text-[0.72rem] font-semibold transition-all"
                style={period === m
                  ? { background: 'linear-gradient(135deg,#1D4ED8,#3B82F6)', color: '#fff', boxShadow: '0 2px 8px rgba(37,99,235,0.35)' }
                  : { color: '#64748B' }
                }
              >
                {m}
              </button>
            ))}
          </div>

          {/* Refresh */}
          <button
            onClick={handleRefresh}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-blue-600 transition-all"
            style={{ background: 'rgba(255,255,255,0.8)', border: '1px solid rgba(37,99,235,0.1)' }}
            title="Atualizar dados"
          >
            <RefreshCw size={13} className={spinning ? 'animate-spin' : ''} />
          </button>

          {/* Bell */}
          <button
            className="relative w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-blue-600 transition-all"
            style={{ background: 'rgba(255,255,255,0.8)', border: '1px solid rgba(37,99,235,0.1)' }}
          >
            <Bell size={13} />
            <span
              className="absolute top-1 right-1 w-2 h-2 rounded-full border-2 border-white"
              style={{ background: '#EF4444', boxShadow: '0 0 6px rgba(239,68,68,0.6)' }}
            />
          </button>

          {/* Export */}
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-4 py-1.5 text-[0.75rem] font-bold text-white rounded-xl transition-all hover:opacity-90 hover:-translate-y-px"
            style={{
              background: 'linear-gradient(135deg,#1D4ED8,#3B82F6)',
              boxShadow: '0 4px 16px rgba(37,99,235,0.4)',
            }}
          >
            <Download size={12} />
            Exportar PDF
          </button>
        </div>
      )}
    </header>
  )
}
