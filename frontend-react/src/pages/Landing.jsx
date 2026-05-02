import { useState, useEffect } from 'react'
import {
  Zap, ChevronRight, ArrowRight, MessageSquare, Check,
  Wrench, TrendingUp, FileText, MessageCircle,
  Star, Menu, X, Thermometer, Camera, Wifi,
  Lock, Bell, Settings2, LayoutDashboard,
  Activity,
} from 'lucide-react'

// ── Inline SVG Charts ─────────────────────────────────────────────────────────
function MiniBarChart() {
  const data = [
    { r: 55, e: 38 }, { r: 72, e: 45 }, { r: 62, e: 52 },
    { r: 84, e: 41 }, { r: 70, e: 48 }, { r: 91, e: 39 }, { r: 80, e: 55 },
  ]
  const H = 52, BAR = 9, GAP = 2, STEP = 29

  return (
    <svg width="100%" height={H} viewBox={`0 0 210 ${H}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id="gr-rev" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2563EB" />
          <stop offset="100%" stopColor="#2563EB" stopOpacity="0.2" />
        </linearGradient>
        <linearGradient id="gr-exp" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#06B6D4" />
          <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.2" />
        </linearGradient>
      </defs>
      {data.map(({ r, e }, i) => (
        <g key={i}>
          <rect x={i * STEP + 4} y={H - r * H / 100} width={BAR} height={r * H / 100} rx="2" fill="url(#gr-rev)" />
          <rect x={i * STEP + 4 + BAR + GAP} y={H - e * H / 100} width={BAR} height={e * H / 100} rx="2" fill="url(#gr-exp)" />
        </g>
      ))}
    </svg>
  )
}


// ── Dashboard view para o hero ────────────────────────────────────────────────
function DashboardView() {
  return (
    <div className="p-3 pb-2">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[0.6rem] font-semibold text-white/40 uppercase tracking-widest">Maio 2025</span>
        <div className="flex gap-1">
          {['1M', '3M', '12M'].map(p => (
            <span key={p} className="text-[0.55rem] px-1.5 py-0.5 rounded font-medium"
              style={{ background: p === '1M' ? 'rgba(37,99,235,0.25)' : 'transparent', color: p === '1M' ? '#60A5FA' : 'rgba(255,255,255,0.2)' }}>
              {p}
            </span>
          ))}
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        {[
          { label: 'Receita', value: 'R$ 28,4k', delta: '+12%', up: true,  color: '#34D399' },
          { label: 'Saídas',  value: 'R$ 11,2k', delta: '-8%',  up: false, color: '#F87171' },
          { label: 'Saldo',   value: 'R$ 17,2k', delta: '+18%', up: true,  color: '#60A5FA' },
        ].map(k => (
          <div key={k.label} className="rounded-xl p-2.5"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="text-[0.55rem] text-white/30 mb-1 font-medium">{k.label}</div>
            <div className="text-[0.82rem] font-black leading-none" style={{ color: k.color }}>{k.value}</div>
            <div className="text-[0.55rem] mt-1 font-bold" style={{ color: k.up ? '#34D399' : '#F87171' }}>{k.delta}</div>
          </div>
        ))}
      </div>

      {/* Bar chart */}
      <div className="rounded-xl p-2.5 mb-2"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[0.55rem] font-semibold text-white/30 uppercase tracking-wide">Receita vs Despesas</span>
          <div className="flex gap-2">
            {[['#2563EB', 'Receita'], ['#06B6D4', 'Despesas']].map(([c, l]) => (
              <span key={l} className="flex items-center gap-1 text-[0.53rem] text-white/25">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: c }} />{l}
              </span>
            ))}
          </div>
        </div>
        <MiniBarChart />
        <div className="flex justify-between mt-1.5 px-1">
          {['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul'].map(m => (
            <span key={m} className="text-[0.5rem] text-white/20 font-medium">{m}</span>
          ))}
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl p-2.5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="text-[0.55rem] text-white/25 mb-0.5">Propostas enviadas</div>
          <div className="text-[0.88rem] font-black text-white/85">47</div>
          <div className="text-[0.52rem] text-white/20">este mês</div>
        </div>
        <div className="rounded-xl p-2.5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="text-[0.55rem] text-white/25 mb-0.5">Conversão</div>
          <div className="text-[0.88rem] font-black" style={{ color: '#34D399' }}>68%</div>
          <div className="text-[0.52rem] text-white/20">acima da média</div>
        </div>
      </div>
    </div>
  )
}

// ── Chat view para o hero ─────────────────────────────────────────────────────
function ChatView({ agent }) {
  return (
    <div className="p-3">
      <p className="text-[0.58rem] text-white/20 mb-3 uppercase tracking-widest font-semibold">
        {agent.tag} · {agent.desc.slice(0, 46)}...
      </p>
      {agent.chat.map((msg, i) => (
        <div key={i} className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'} mb-2.5`}>
          <div className="max-w-[90%] px-3 py-2 rounded-xl text-[0.67rem] leading-relaxed"
            style={msg.from === 'user'
              ? { background: `${agent.color}20`, color: agent.color, border: `1px solid ${agent.color}30` }
              : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.78)', border: '1px solid rgba(255,255,255,0.08)' }
            }>
            {msg.text}
          </div>
        </div>
      ))}
      {/* Typing dots */}
      <div className="flex justify-start">
        <div className="flex gap-1 px-3 py-2 rounded-xl"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
          {[0, 1, 2].map(i => (
            <div key={i} className="w-1.5 h-1.5 rounded-full"
              style={{ background: agent.color, opacity: 0.6, animation: `bounce 1s ease-in-out ${i * 0.15}s infinite` }} />
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Dados ─────────────────────────────────────────────────────────────────────
const HERO_TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, color: '#60A5FA' },
  { id: 'tecnico',   label: 'Técnico',   icon: Wrench,          color: '#06B6D4' },
  { id: 'comercial', label: 'Comercial', icon: FileText,         color: '#3B82F6' },
  { id: 'financeiro',label: 'Financeiro',icon: TrendingUp,       color: '#10B981' },
]

const STATS = [
  { value: '9+',   label: 'Nichos técnicos atendidos' },
  { value: '3',    label: 'Agentes de IA integrados' },
  { value: '<2s',  label: 'Resposta média do agente' },
  { value: '24/7', label: 'Sem parar' },
]

const AGENTS = [
  {
    icon: Wrench,
    agentKey: 'tecnico',
    tag:   'Técnico',
    title: 'Agente Técnico',
    desc:  'Diagnóstico de falhas, dimensionamentos, laudos técnicos e consulta de normas NBR/NR para 9 nichos de atuação.',
    color: '#06B6D4',
    bg:    'rgba(6,182,212,0.08)',
    border:'rgba(6,182,212,0.2)',
    chat: [
      { from: 'user', text: 'Disjuntor Q3 (32A) do QD-02 disparando com carga medida de 18A. Já substituí o disjuntor e o problema persiste. Me ajuda a traçar uma estratégia.' },
      { from: 'ai',   text: 'Disparo com 18A em 32A descarta sobrecarga — o problema é isolação degradada no ramal. Estratégia: (1) Desligue Q3 e meça resistência de isolação com megôhmmetro — fase×neutro e fase×terra, mín. 1MΩ (NBR 5410 §6.3.3). (2) Se Riso < 1MΩ, divida o ramal por segmentos para localizar o ponto. (3) Inspecione o trecho QD-02 → TUG-14: cabo prensado em eletrocalha ou emenda dentro de eletroduto são as causas mais comuns neste padrão.' },
    ],
  },
  {
    icon: FileText,
    agentKey: 'comercial',
    tag:   'Comercial',
    title: 'Agente Comercial',
    desc:  'Gera propostas profissionais em .docx com precificação validada e envia automaticamente por e-mail ao cliente.',
    color: '#3B82F6',
    bg:    'rgba(59,130,246,0.08)',
    border:'rgba(59,130,246,0.2)',
    chat: [
      { from: 'user', text: 'Proposta para instalação de 8 câmeras IP 4MP com NVR 16 canais no galpão da Construtora Beta.' },
      { from: 'ai',   text: 'Proposta gerada — 8 câmeras IP 4MP + NVR 16CH + cabeamento Cat5e estruturado. Total: R$ 6.840,00 (materiais + mão de obra + ART). Arquivo .docx padrão ABNT gerado e enviado para contato@construtorabeta.com.br.' },
    ],
  },
  {
    icon: TrendingUp,
    agentKey: 'financeiro',
    tag:   'Financeiro',
    title: 'Agente Financeiro',
    desc:  'Registre movimentações em linguagem natural. O agente classifica, persiste no banco e atualiza seu saldo em tempo real.',
    color: '#10B981',
    bg:    'rgba(16,185,129,0.08)',
    border:'rgba(16,185,129,0.2)',
    chat: [
      { from: 'user', text: 'Entrada de R$8.500 do cliente Grupo TechPark — OS 2341, serviço de cabeamento estruturado concluído.' },
      { from: 'ai',   text: 'Receita de R$ 8.500,00 registrada — categoria: Serviços Concluídos / OS 2341. Saldo atualizado: R$ 26.350,00. Margem do projeto: 62%. Deseja registrar o lançamento fiscal correspondente?' },
    ],
  },
]

const AGENT_MAP = { tecnico: AGENTS[0], comercial: AGENTS[1], financeiro: AGENTS[2] }

const NICHES = [
  { icon: Thermometer, label: 'Climatização / AC',    color: '#0EA5E9' },
  { icon: Camera,      label: 'CFTV / Segurança',     color: '#8B5CF6' },
  { icon: Wifi,        label: 'TI / Redes',            color: '#06B6D4' },
  { icon: Lock,        label: 'Controle de Acesso',   color: '#10B981' },
  { icon: Zap,         label: 'Instalações Elétricas', color: '#F59E0B' },
  { icon: Bell,        label: 'Alarme / Monit.',      color: '#EF4444' },
  { icon: Settings2,   label: 'Automação Predial',    color: '#EC4899' },
  { icon: MessageCircle,label:'Agente WhatsApp',       color: '#22C55E' },
]

const PLANS = [
  {
    name: 'Demo', price: 'Grátis', period: '', desc: 'Experimente sem cartão', highlight: false,
    features: ['5 propostas comerciais', 'Agente Técnico IA', 'Dashboard financeiro', 'Suporte por e-mail'],
    cta: 'Começar grátis',
  },
  {
    name: 'Pro', price: 'R$197', period: '/mês', desc: 'Para técnicos e engenheiros', highlight: true,
    features: ['100 propostas/mês', 'Todos os agentes IA', 'Agente WhatsApp incluso', 'Relatórios PDF/DOCX', 'Suporte prioritário'],
    cta: 'Assinar Pro',
  },
  {
    name: 'Agency', price: 'R$397', period: '/mês', desc: 'Para empresas e equipes', highlight: false,
    features: ['Propostas ilimitadas', 'Multi-usuário', 'API de integração', 'Onboarding dedicado', 'SLA garantido'],
    cta: 'Falar com vendas',
  },
]

const TESTIMONIALS = [
  {
    name: 'Marcos Oliveira', role: 'Técnico em Refrigeração · Brasília-DF', stars: 5,
    text: 'Reduzi o tempo de elaboração de propostas de 2 horas para 3 minutos. O agente já conhece os preços do mercado e os ajusta automaticamente.',
  },
  {
    name: 'Eng. Patrícia Costa', role: 'Integradora de CFTV · São Paulo-SP', stars: 5,
    text: 'O controle financeiro por linguagem natural mudou minha rotina. Só digito "recebi R$3500 do cliente X" e o sistema resolve tudo sozinho.',
  },
  {
    name: 'Ricardo Alves', role: 'Eletricista NR10 · Goiânia-GO', stars: 5,
    text: 'O agente técnico me salvou numa obra complexa. Perguntei sobre dimensionamento de SPDA e ele trouxe a NBR 5419 com os cálculos em segundos.',
  },
]

// ── NicheCard interativo ─────────────────────────────────────────────────────
function NicheCard({ icon: Icon, label, color }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      className="flex items-center gap-3 p-4 rounded-2xl cursor-default"
      style={{
        background: hovered ? `${color}14` : 'rgba(255,255,255,0.04)',
        border: `1px solid ${hovered ? color + '45' : 'rgba(255,255,255,0.07)'}`,
        transform: hovered ? 'translateY(-3px)' : 'none',
        boxShadow: hovered ? `0 10px 28px ${color}28` : 'none',
        transition: 'all 0.2s ease',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
        style={{
          background: hovered ? `${color}28` : `${color}18`,
          border: `1px solid ${hovered ? color + '55' : color + '35'}`,
          boxShadow: hovered ? `0 0 18px ${color}40` : 'none',
          transform: hovered ? 'scale(1.12) rotate(-4deg)' : 'scale(1)',
          transition: 'all 0.2s ease',
        }}
      >
        <Icon size={16} style={{ color }} />
      </div>
      <span
        className="text-[0.8rem] font-semibold text-left"
        style={{ color: hovered ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.6)', transition: 'color 0.2s ease' }}
      >
        {label}
      </span>
    </div>
  )
}

// ── AgentCard interativo ──────────────────────────────────────────────────────
function AgentCard({ ag }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      className="rounded-2xl p-6 flex flex-col"
      style={{
        background: '#fff',
        border: `1px solid ${hovered ? ag.color + '50' : ag.border}`,
        boxShadow: hovered ? `0 12px 40px ${ag.color}20` : `0 2px 12px ${ag.color}10`,
        transform: hovered ? 'translateY(-4px)' : 'none',
        transition: 'all 0.2s ease',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="w-11 h-11 rounded-2xl flex items-center justify-center"
          style={{
            background: ag.bg,
            border: `1px solid ${ag.border}`,
            boxShadow: hovered ? `0 0 20px ${ag.color}30` : 'none',
            transition: 'box-shadow 0.2s ease',
          }}>
          <ag.icon size={20} style={{ color: ag.color }} />
        </div>
        <span className="flex items-center gap-1.5 text-[0.6rem] font-bold px-2 py-1 rounded-full"
          style={{ background: ag.bg, color: ag.color, border: `1px solid ${ag.border}` }}>
          <Activity size={9} />
          Ativo 24/7
        </span>
      </div>

      <div className="text-[0.68rem] font-bold uppercase tracking-widest mb-1.5" style={{ color: ag.color }}>
        {ag.tag}
      </div>
      <h3 className="text-[1.05rem] font-black text-slate-900 mb-2">{ag.title}</h3>
      <p className="text-[0.82rem] text-slate-500 leading-relaxed mb-5 flex-1">{ag.desc}</p>

      {/* Chat preview */}
      <div className="rounded-xl p-3 space-y-2"
        style={{ background: '#F8FAFC', border: '1px solid rgba(0,0,0,0.06)' }}>
        {ag.chat.map((msg, j) => (
          <div key={j} className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}>
            <span className="text-[0.7rem] px-3 py-1.5 rounded-xl max-w-[95%] leading-snug"
              style={msg.from === 'user'
                ? { background: ag.bg, color: ag.color, fontWeight: 500 }
                : { background: '#fff', color: '#374151', border: '1px solid rgba(0,0,0,0.07)', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }
              }>
              {msg.text}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function Landing({ onLogin, onRegister }) {
  const [menuOpen,    setMenuOpen]    = useState(false)
  const [scrolled,    setScrolled]    = useState(false)
  const [heroTab,     setHeroTab]     = useState('dashboard')
  const [userChanged, setUserChanged] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  // Auto-rotaciona tabs do hero (pausa se o usuário clicou)
  useEffect(() => {
    if (userChanged) return
    const ids = HERO_TABS.map(t => t.id)
    const t = setInterval(() => setHeroTab(cur => {
      const i = ids.indexOf(cur)
      return ids[(i + 1) % ids.length]
    }), 3800)
    return () => clearInterval(t)
  }, [userChanged])

  function handleHeroTab(id) {
    setHeroTab(id)
    setUserChanged(true)
  }

  const activeTabMeta = HERO_TABS.find(t => t.id === heroTab)

  return (
    <div className="min-h-screen font-sans" style={{ background: '#F8FAFC' }}>

      {/* ════════════════════════════════════════════════════════════════
          NAVBAR
      ════════════════════════════════════════════════════════════════ */}
      <nav
        className="fixed top-0 left-0 right-0 z-50"
        style={{
          background: scrolled ? 'rgba(255,255,255,0.93)' : 'transparent',
          backdropFilter: scrolled ? 'blur(20px)' : 'none',
          borderBottom: scrolled ? '1px solid rgba(0,0,0,0.06)' : 'none',
          boxShadow: scrolled ? '0 2px 20px rgba(0,0,0,0.06)' : 'none',
          transition: 'all 0.25s ease',
        }}
      >
        <div className="max-w-6xl mx-auto px-6 h-[64px] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#1D4ED8,#06B6D4)', boxShadow: '0 4px 14px rgba(37,99,235,0.4)' }}>
              <Zap size={15} className="text-white" fill="white" />
            </div>
            <span className="text-[1.05rem] font-black text-slate-900 tracking-tight">
              Infra<span style={{ background: 'linear-gradient(90deg,#2563EB,#06B6D4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Report</span>
            </span>
          </div>

          <div className="hidden md:flex items-center gap-7">
            {['Recursos', 'Agentes', 'Planos', 'Depoimentos'].map(l => (
              <a key={l} href={`#${l.toLowerCase()}`}
                className="text-[0.82rem] font-medium text-slate-500 hover:text-slate-900 transition-colors">
                {l}
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <button onClick={onLogin}
              className="px-4 py-2 text-[0.82rem] font-semibold text-slate-600 hover:text-slate-900 transition-colors rounded-lg hover:bg-slate-100">
              Entrar
            </button>
            <button onClick={onRegister}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[0.82rem] font-bold text-white transition-all hover:opacity-90 hover:-translate-y-px"
              style={{ background: 'linear-gradient(135deg,#1D4ED8,#3B82F6)', boxShadow: '0 4px 14px rgba(37,99,235,0.35)' }}>
              Criar conta grátis <ArrowRight size={13} />
            </button>
          </div>

          <button className="md:hidden p-2 rounded-lg" onClick={() => setMenuOpen(o => !o)}>
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden bg-white border-t border-slate-100 px-6 py-4 space-y-3">
            {['Recursos', 'Agentes', 'Planos', 'Depoimentos'].map(l => (
              <a key={l} href={`#${l.toLowerCase()}`}
                className="block text-[0.88rem] font-medium text-slate-600 py-1"
                onClick={() => setMenuOpen(false)}>{l}</a>
            ))}
            <div className="pt-2 flex flex-col gap-2">
              <button onClick={onLogin} className="w-full py-2.5 rounded-xl border border-slate-200 text-[0.85rem] font-semibold text-slate-700">Entrar</button>
              <button onClick={onRegister} className="w-full py-2.5 rounded-xl text-[0.85rem] font-bold text-white"
                style={{ background: 'linear-gradient(135deg,#1D4ED8,#3B82F6)' }}>Criar conta grátis</button>
            </div>
          </div>
        )}
      </nav>

      {/* ════════════════════════════════════════════════════════════════
          HERO
      ════════════════════════════════════════════════════════════════ */}
      <section className="pt-[100px] pb-20 px-6 max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-14 items-center">

          {/* Texto */}
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[0.75rem] font-semibold mb-6"
              style={{ background: 'rgba(37,99,235,0.07)', border: '1px solid rgba(37,99,235,0.15)', color: '#2563EB' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              Plataforma para prestadores de serviços técnicos
              <ChevronRight size={12} />
            </div>

            <h1 className="text-[3rem] lg:text-[3.5rem] font-black text-slate-900 leading-[1.05] tracking-tight mb-5">
              Gestão técnica{' '}
              <span style={{ background: 'linear-gradient(135deg,#1D4ED8,#06B6D4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                inteligente,
              </span>{' '}
              24h por dia.
            </h1>

            <p className="text-[1rem] text-slate-500 leading-relaxed mb-8 max-w-lg">
              Propostas profissionais, controle financeiro e diagnóstico técnico
              em uma plataforma integrada — para engenheiros e técnicos que querem escalar.
            </p>

            <div className="flex items-center gap-3 flex-wrap">
              <button onClick={onRegister}
                className="flex items-center gap-2 px-6 py-3.5 rounded-xl text-[0.9rem] font-bold text-white transition-all hover:opacity-90 hover:-translate-y-0.5"
                style={{ background: 'linear-gradient(135deg,#1D4ED8,#3B82F6)', boxShadow: '0 6px 24px rgba(37,99,235,0.4)' }}>
                <Zap size={15} fill="white" />
                Começar grátis
              </button>
              <a href="#agentes"
                className="flex items-center gap-1.5 px-6 py-3.5 rounded-xl text-[0.9rem] font-semibold text-slate-600 transition-all hover:bg-slate-100"
                style={{ border: '1px solid rgba(0,0,0,0.08)' }}>
                Ver os Agentes <ArrowRight size={14} />
              </a>
            </div>

            <div className="flex items-center gap-3 mt-8">
              <div className="flex -space-x-2">
                {['#1D4ED8', '#0891B2', '#059669', '#7C3AED'].map((c, i) => (
                  <div key={i} className="w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-[0.6rem] font-bold text-white"
                    style={{ background: c }}>
                    {['MO', 'EC', 'RA', 'PL'][i]}
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-1.5 text-[0.78rem] text-slate-500">
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => <Star key={i} size={11} className="text-amber-400" fill="#FBBF24" />)}
                </div>
                <span><strong className="text-slate-700">4.9/5</strong> · Usado por 200+ profissionais</span>
              </div>
            </div>
          </div>

          {/* Hero Window */}
          <div className="relative hidden lg:block">
            {/* Glow atrás */}
            <div className="absolute inset-0 rounded-3xl blur-3xl opacity-20"
              style={{ background: `linear-gradient(135deg,#1D4ED8,${activeTabMeta?.color || '#06B6D4'})`, transform: 'scale(0.9) translateY(20px)', transition: 'background 0.6s ease' }} />

            <div className="relative rounded-3xl overflow-hidden"
              style={{
                background: 'linear-gradient(160deg,#0B1628,#060E20)',
                border: '1px solid rgba(255,255,255,0.08)',
                boxShadow: '0 32px 80px rgba(0,0,0,0.45)',
              }}>

              {/* Window chrome */}
              <div className="flex items-center gap-2 px-5 py-3"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex gap-1.5">
                  <span className="w-3 h-3 rounded-full" style={{ background: '#FF5F57' }} />
                  <span className="w-3 h-3 rounded-full" style={{ background: '#FEBC2E' }} />
                  <span className="w-3 h-3 rounded-full" style={{ background: '#28C840' }} />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="flex items-center gap-2 text-[0.7rem] text-white/35 font-medium">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    InfraReport · Sistema de Gestão
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-0 px-3 pt-2"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                {HERO_TABS.map(tab => {
                  const isActive = heroTab === tab.id
                  return (
                    <button key={tab.id} onClick={() => handleHeroTab(tab.id)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-t-lg text-[0.65rem] font-semibold transition-all"
                      style={isActive
                        ? { background: 'rgba(255,255,255,0.05)', color: tab.color, borderBottom: `2px solid ${tab.color}`, marginBottom: -1 }
                        : { color: 'rgba(255,255,255,0.22)', borderBottom: '2px solid transparent', marginBottom: -1 }
                      }>
                      <tab.icon size={10} />
                      {tab.label}
                    </button>
                  )
                })}
              </div>

              {/* Content */}
              <div style={{ minHeight: 300 }}>
                {heroTab === 'dashboard'
                  ? <DashboardView />
                  : <ChatView agent={AGENT_MAP[heroTab]} />
                }
              </div>

              {/* Input bar (apenas para agentes) */}
              {heroTab !== 'dashboard' && (
                <div className="px-3 pb-3">
                  <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <span className="text-[0.7rem] text-white/18 flex-1">
                      {heroTab === 'tecnico'    ? 'Descreva o problema técnico...'
                       : heroTab === 'comercial' ? 'Descreva o serviço e cliente...'
                       : 'Registre uma movimentação...'}
                    </span>
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: `linear-gradient(135deg,${activeTabMeta?.color},${activeTabMeta?.color}99)` }}>
                      <ArrowRight size={10} className="text-white" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div className="mt-16 pt-8 grid grid-cols-2 md:grid-cols-4 gap-6"
          style={{ borderTop: '1px solid rgba(0,0,0,0.07)' }}>
          {STATS.map(s => (
            <div key={s.label} className="text-center group cursor-default">
              <div className="text-[1.6rem] font-black text-slate-900 leading-none transition-transform group-hover:scale-110"
                style={{ background: 'linear-gradient(135deg,#1D4ED8,#06B6D4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {s.value}
              </div>
              <div className="text-[0.72rem] text-slate-400 mt-1 font-medium">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          NICHOS
      ════════════════════════════════════════════════════════════════ */}
      <section id="recursos" className="py-20 px-6"
        style={{ background: 'linear-gradient(135deg,#060E20,#0A1628)' }}>
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-[0.72rem] font-bold text-blue-400 uppercase tracking-widest mb-3">Nichos Atendidos</p>
          <h2 className="text-[2rem] font-black text-white mb-3">
            Um sistema para{' '}
            <span style={{ background: 'linear-gradient(90deg,#60A5FA,#06B6D4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              cada especialidade
            </span>
          </h2>
          <p className="text-white/35 text-[0.85rem] mb-10 max-w-md mx-auto">
            Os agentes reconhecem automaticamente o seu nicho e respondem com o vocabulário técnico correto.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {NICHES.map(n => <NicheCard key={n.label} {...n} />)}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          AGENTES
      ════════════════════════════════════════════════════════════════ */}
      <section id="agentes" className="py-20 px-6 max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-[0.72rem] font-bold text-blue-600 uppercase tracking-widest mb-3">Inteligência Aplicada</p>
          <h2 className="text-[2.2rem] font-black text-slate-900 leading-tight">
            3 especialistas trabalhando{' '}
            <span style={{ background: 'linear-gradient(135deg,#1D4ED8,#06B6D4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              por você
            </span>
          </h2>
          <p className="text-slate-500 mt-3 max-w-lg mx-auto text-[0.9rem]">
            Cada agente é treinado com o conhecimento técnico do setor. Sem respostas genéricas.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {AGENTS.map((ag, i) => <AgentCard key={i} ag={ag} />)}
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          PLANOS
      ════════════════════════════════════════════════════════════════ */}
      <section id="planos" className="py-20 px-6"
        style={{ background: 'linear-gradient(145deg,#EEF2FF,#F0F9FF)' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-[0.72rem] font-bold text-blue-600 uppercase tracking-widest mb-3">Preços</p>
            <h2 className="text-[2.2rem] font-black text-slate-900">Simples e transparente</h2>
            <p className="text-slate-500 mt-2 text-[0.9rem]">Comece grátis. Cancele quando quiser.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {PLANS.map(plan => (
              <div key={plan.name}
                className="rounded-2xl p-7 flex flex-col relative"
                style={{
                  background: plan.highlight ? 'linear-gradient(160deg,#060E20,#0A1628)' : '#fff',
                  border: plan.highlight ? '1px solid rgba(59,130,246,0.3)' : '1px solid rgba(0,0,0,0.07)',
                  boxShadow: plan.highlight ? '0 8px 40px rgba(37,99,235,0.3)' : '0 2px 12px rgba(0,0,0,0.06)',
                }}>

                {plan.highlight && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-[0.7rem] font-black text-white"
                    style={{ background: 'linear-gradient(135deg,#1D4ED8,#06B6D4)', boxShadow: '0 4px 12px rgba(37,99,235,0.5)' }}>
                    MAIS POPULAR
                  </div>
                )}

                <div className={`text-[0.78rem] font-bold uppercase tracking-widest mb-3 ${plan.highlight ? 'text-blue-400' : 'text-slate-400'}`}>
                  {plan.name}
                </div>
                <div className="flex items-end gap-1 mb-1">
                  <span className={`text-[2.2rem] font-black leading-none ${plan.highlight ? 'text-white' : 'text-slate-900'}`}>{plan.price}</span>
                  <span className={`text-[0.85rem] mb-1 ${plan.highlight ? 'text-white/50' : 'text-slate-400'}`}>{plan.period}</span>
                </div>
                <p className={`text-[0.78rem] mb-6 ${plan.highlight ? 'text-white/50' : 'text-slate-500'}`}>{plan.desc}</p>

                <ul className="space-y-2.5 flex-1 mb-7">
                  {plan.features.map(f => (
                    <li key={f} className={`flex items-center gap-2.5 text-[0.8rem] ${plan.highlight ? 'text-white/80' : 'text-slate-600'}`}>
                      <Check size={14} className={plan.highlight ? 'text-blue-400' : 'text-emerald-500'} />
                      {f}
                    </li>
                  ))}
                </ul>

                <button onClick={onRegister}
                  className="w-full py-3 rounded-xl text-[0.85rem] font-bold transition-all hover:opacity-90 hover:-translate-y-0.5"
                  style={plan.highlight
                    ? { background: 'linear-gradient(135deg,#2563EB,#3B82F6)', color: '#fff', boxShadow: '0 4px 16px rgba(37,99,235,0.4)' }
                    : { background: 'rgba(37,99,235,0.07)', color: '#2563EB', border: '1px solid rgba(37,99,235,0.15)' }
                  }>
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          DEPOIMENTOS
      ════════════════════════════════════════════════════════════════ */}
      <section id="depoimentos" className="py-20 px-6 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-[0.72rem] font-bold text-blue-600 uppercase tracking-widest mb-3">Depoimentos</p>
          <h2 className="text-[2.2rem] font-black text-slate-900">O que dizem nossos clientes</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 transition-all hover:-translate-y-1"
              style={{ border: '1px solid rgba(0,0,0,0.07)', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
              <div className="flex gap-0.5 mb-4">
                {[...Array(t.stars)].map((_, j) => <Star key={j} size={13} className="text-amber-400" fill="#FBBF24" />)}
              </div>
              <p className="text-[0.85rem] text-slate-600 leading-relaxed mb-5">"{t.text}"</p>
              <div>
                <div className="text-[0.82rem] font-bold text-slate-900">{t.name}</div>
                <div className="text-[0.72rem] text-slate-400 mt-0.5">{t.role}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          CTA FINAL
      ════════════════════════════════════════════════════════════════ */}
      <section className="py-20 px-6" style={{ background: 'linear-gradient(135deg,#060E20,#0A1628)' }}>
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-[2.5rem] font-black text-white leading-tight mb-4">
            Pronto para escalar<br />
            <span style={{ background: 'linear-gradient(90deg,#60A5FA,#06B6D4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              sua operação técnica?
            </span>
          </h2>
          <p className="text-white/50 text-[0.9rem] mb-8">Comece grátis hoje. Sem cartão de crédito. Sem compromisso.</p>
          <button onClick={onRegister}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-[0.95rem] font-black text-white transition-all hover:opacity-90 hover:-translate-y-0.5"
            style={{ background: 'linear-gradient(135deg,#2563EB,#3B82F6)', boxShadow: '0 8px 32px rgba(37,99,235,0.5)' }}>
            <Zap size={18} fill="white" />
            Criar minha conta grátis
          </button>
          <p className="text-white/25 text-[0.72rem] mt-4">Plano Demo · 5 propostas grátis · Sem cartão</p>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          FOOTER
      ════════════════════════════════════════════════════════════════ */}
      <footer className="py-8 px-6 border-t border-slate-100">
        <div className="max-w-6xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#1D4ED8,#06B6D4)' }}>
              <Zap size={11} className="text-white" fill="white" />
            </div>
            <span className="text-[0.85rem] font-black text-slate-800">
              Infra<span style={{ background: 'linear-gradient(90deg,#2563EB,#06B6D4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Report</span>
            </span>
          </div>
          <div className="flex gap-6">
            {['Termos de Uso', 'Privacidade', 'Suporte'].map(l => (
              <a key={l} href="#" className="text-[0.75rem] text-slate-400 hover:text-slate-600 transition-colors">{l}</a>
            ))}
          </div>
          <p className="text-[0.72rem] text-slate-300">© 2025 InfraReport. Todos os direitos reservados.</p>
        </div>
      </footer>

      {/* Botão flutuante */}
      <button onClick={onRegister}
        className="fixed bottom-6 right-6 flex items-center gap-2 px-5 py-3 rounded-2xl text-[0.82rem] font-bold text-white z-40 transition-all hover:opacity-90 hover:-translate-y-0.5"
        style={{ background: 'linear-gradient(135deg,#2563EB,#3B82F6)', boxShadow: '0 8px 24px rgba(37,99,235,0.45)' }}>
        <MessageSquare size={16} />
        Falar com Engenharia
      </button>
    </div>
  )
}
