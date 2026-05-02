import {
  LayoutDashboard, FileText, FolderKanban, CalendarDays,
  ArrowDownCircle, ArrowUpCircle, Tag, BarChart3,
  Briefcase, TrendingUp, MessageCircle, Wrench,
  Settings, LogOut, FolderOpen, Zap,
} from 'lucide-react'

const NAV = [
  {
    section: 'Principal',
    items: [
      { id: 'dashboard',    icon: LayoutDashboard, label: 'Dashboard Financeiro' },
      { id: 'propostas',    icon: FileText,         label: 'Propostas' },
      { id: 'projetos',     icon: FolderKanban,     label: 'Projetos / OS' },
      { id: 'agenda',       icon: CalendarDays,     label: 'Agenda' },
    ],
  },
  {
    section: 'Financeiro',
    items: [
      { id: 'entradas',     icon: ArrowDownCircle,  label: 'Entradas' },
      { id: 'saidas',       icon: ArrowUpCircle,    label: 'Saídas' },
      { id: 'categorias',   icon: Tag,              label: 'Categorias' },
      { id: 'relatorios',   icon: BarChart3,        label: 'Relatórios' },
      { id: 'arquivos',     icon: FolderOpen,       label: 'Arquivos' },
    ],
  },
  {
    section: 'Agentes IA',
    items: [
      { id: 'agente-tecnico',    icon: Wrench,        label: 'Agente Técnico' },
      { id: 'agente-comercial',  icon: Briefcase,     label: 'Agente Comercial' },
      { id: 'agente-financeiro', icon: TrendingUp,    label: 'Agente Financeiro' },
      { id: 'agente-whatsapp',   icon: MessageCircle, label: 'Agente WhatsApp', badge: 'Pro' },
    ],
  },
  {
    section: 'Conta',
    items: [
      { id: 'configuracoes', icon: Settings, label: 'Configurações' },
    ],
  },
]

export default function Sidebar({ active, onNavigate, user, onSignOut }) {
  const initials = user?.name
    ? user.name.split(' ').slice(0,2).map(w => w[0]).join('').toUpperCase()
    : 'U'
  const planLabel = (user?.plan || 'demo').toUpperCase()
  return (
    <aside
      className="fixed top-0 left-0 bottom-0 w-[230px] flex flex-col z-50"
      style={{
        background: 'linear-gradient(180deg, #060E20 0%, #0A1628 60%, #060E20 100%)',
        boxShadow: '4px 0 40px rgba(0,0,0,0.4), inset -1px 0 0 rgba(255,255,255,0.04)',
      }}
    >
      {/* ── Logo ────────────────────────────────────────────────────── */}
      <div className="px-5 pt-6 pb-5">
        <div className="flex items-center gap-2.5 mb-0.5">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'linear-gradient(135deg, #1D4ED8, #06B6D4)', boxShadow: '0 4px 16px rgba(37,99,235,0.5)' }}
          >
            <Zap size={15} className="text-white" fill="white" />
          </div>
          <div>
            <div className="text-[1.05rem] font-black text-white tracking-tight leading-none">
              Infra<span style={{ background: 'linear-gradient(90deg,#60A5FA,#06B6D4)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>Report</span>
            </div>
            <div className="text-[0.6rem] text-white/25 uppercase tracking-[0.15em] mt-0.5">Gestão Técnica</div>
          </div>
        </div>
      </div>

      {/* ── User ────────────────────────────────────────────────────── */}
      <div
        className="mx-3 mb-4 p-3 rounded-xl flex items-center gap-2.5"
        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center text-[0.72rem] font-bold text-white shrink-0"
          style={{ background: 'linear-gradient(135deg, #2563EB, #06B6D4)', boxShadow: '0 2px 8px rgba(37,99,235,0.4)' }}
        >
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[0.8rem] font-semibold text-white/90 truncate">{user?.name || user?.email || 'Usuário'}</div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span
              className="text-[0.6rem] font-bold px-1.5 py-0.5 rounded"
              style={{ background: 'linear-gradient(90deg,rgba(37,99,235,0.3),rgba(6,182,212,0.3))', color: '#60A5FA', border: '1px solid rgba(96,165,250,0.2)' }}
            >
              {planLabel}
            </span>
            <div className="live-dot" />
          </div>
        </div>
      </div>

      {/* ── Nav ─────────────────────────────────────────────────────── */}
      <nav className="flex-1 pb-3 overflow-y-auto scrollbar-none">
        {NAV.map((group) => (
          <div key={group.section} className="mb-1">
            <div className="px-5 pt-3 pb-1 text-[0.58rem] font-bold uppercase tracking-[0.18em] text-white/20 flex items-center gap-2">
              <span className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
              {group.section}
              <span className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
            </div>
            {group.items.map(({ id, icon: Icon, label, badge }) => (
              <button
                key={id}
                onClick={() => onNavigate(id)}
                className={`nav-item w-full text-left group ${active === id ? 'active' : ''}`}
              >
                <Icon
                  size={14}
                  className={`nav-icon shrink-0 transition-colors ${active === id ? 'text-blue-400' : 'text-white/35 group-hover:text-white/70'}`}
                />
                <span className="flex-1 text-[0.8rem]">{label}</span>
                {active === id && <span className="nav-dot-active" />}
                {badge && !( active === id) && (
                  <span
                    className="text-[0.58rem] font-bold px-1.5 py-0.5 rounded"
                    style={{ background: 'rgba(6,182,212,0.15)', color: '#22D3EE', border: '1px solid rgba(6,182,212,0.2)' }}
                  >
                    {badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        ))}
      </nav>

      {/* ── Footer ──────────────────────────────────────────────────── */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <button
          onClick={onSignOut}
          className="nav-item w-full text-left mx-0 px-5 py-3.5 rounded-none hover:text-red-400 transition-colors"
          style={{ margin: 0, borderRadius: 0 }}
        >
          <LogOut size={14} className="shrink-0 text-white/25" />
          <span className="text-[0.78rem] text-white/35">Sair</span>
        </button>
        <div className="px-5 py-2.5 text-[0.6rem] text-white/15 font-mono">
          v1.0 · InfraReport © 2025
        </div>
      </div>
    </aside>
  )
}
