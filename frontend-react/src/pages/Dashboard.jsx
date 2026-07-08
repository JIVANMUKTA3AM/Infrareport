import { useState, useEffect } from 'react'
import KPICard           from '../components/ui/KPICard'
import BarEntradasSaidas from '../components/charts/BarEntradasSaidas'
import LineSaldo         from '../components/charts/LineSaldo'
import PieDonut          from '../components/charts/PieChart'
import BarMargem         from '../components/charts/BarMargem'
import { useDashboardData } from '../hooks/useDashboardData'
import { useAuth }          from '../context/AuthContext'
import { RefreshCw, TrendingUp, ArrowDownCircle, PlusCircle, MessageSquarePlus, Calendar } from 'lucide-react'

import {
  MONTHLY_DATA_WITH_ACC, RECEITA_TIPOS, SAIDAS_CATEGORIAS, PROJETOS,
} from '../data/mock'

const API = ''

const EVENT_TYPE_COLORS = {
  visita:     { color: '#2563EB', emoji: '🔍' },
  execucao:   { color: '#D97706', emoji: '🔧' },
  vencimento: { color: '#DC2626', emoji: '⏰' },
  followup:   { color: '#7C3AED', emoji: '📞' },
  outro:      { color: '#475569', emoji: '📌' },
}

const fmtBRL = (v) => `R$ ${Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`

function fmtDate(iso) {
  if (!iso) return ''
  const [y, m, d] = iso.split('T')[0].split('-')
  return `${d}/${m}`
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-5 animate-fade-up">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
        style={{ background:'linear-gradient(135deg,#EEF2FF,#E0F2FE)', border:'1px solid rgba(37,99,235,0.1)' }}>
        <TrendingUp size={28} className="text-blue-400" />
      </div>
      <div className="text-center max-w-sm">
        <h3 className="text-[0.95rem] font-bold text-slate-800 mb-1.5">Comece inserindo seus dados</h3>
        <p className="text-[0.8rem] text-slate-500 leading-relaxed">
          Registre entradas e saídas para o dashboard começar a mostrar seus números reais.
          Quanto mais dados, mais insights você tem.
        </p>
      </div>
      <div className="flex gap-3 flex-wrap justify-center">
        <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-[0.78rem] font-bold text-white transition-all hover:-translate-y-px"
          style={{ background:'linear-gradient(135deg,#1D4ED8,#3B82F6)', boxShadow:'0 4px 16px rgba(37,99,235,0.35)' }}>
          <PlusCircle size={14} /> Registrar Entrada
        </button>
        <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-[0.78rem] font-bold text-slate-600 transition-all hover:-translate-y-px"
          style={{ background:'rgba(255,255,255,0.9)', border:'1px solid rgba(37,99,235,0.15)', boxShadow:'0 2px 8px rgba(37,99,235,0.07)' }}>
          <MessageSquarePlus size={14} /> Usar Agente Financeiro
        </button>
      </div>
    </div>
  )
}

function ChartCard({ title, subtitle, children, className = '', action }) {
  return (
    <div className={`card p-5 animate-fade-up ${className}`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-[0.82rem] font-bold text-slate-800 leading-tight">{title}</h3>
          {subtitle && <p className="text-[0.7rem] text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
  )
}

function ChipTag({ label, color }) {
  const map = {
    green: { bg:'rgba(16,185,129,0.1)',  text:'#059669', dot:'#10B981' },
    blue:  { bg:'rgba(59,130,246,0.1)',  text:'#1D4ED8', dot:'#3B82F6' },
    amber: { bg:'rgba(245,158,11,0.1)',  text:'#B45309', dot:'#F59E0B' },
    red:   { bg:'rgba(239,68,68,0.1)',   text:'#991B1B', dot:'#EF4444' },
  }
  const c = map[color] || map.blue
  return (
    <span className="inline-flex items-center gap-1.5 text-[0.67rem] font-bold px-2 py-0.5 rounded-full"
      style={{ background:c.bg, color:c.text }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background:c.dot }} />
      {label}
    </span>
  )
}

function Skeleton({ className = '' }) {
  return <div className={`animate-pulse rounded-xl bg-slate-100 ${className}`} />
}

// ── Upcoming Events Widget ────────────────────────────────────────────────────
function UpcomingEventsCard({ userId }) {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) return
    setLoading(true)
    fetch(`${API}/api/events/upcoming?user_id=${userId}&days=7`)
      .then(r => r.ok ? r.json() : [])
      .then(d => setEvents(Array.isArray(d) ? d.slice(0, 5) : []))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false))
  }, [userId])

  return (
    <div className="card p-5 animate-fade-up flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-[0.82rem] font-bold text-slate-800">Próximos Compromissos</h3>
          <p className="text-[0.7rem] text-slate-400 mt-0.5">Próximos 7 dias</p>
        </div>
        <a href="#agenda"
          className="text-[0.68rem] font-semibold text-blue-600 hover:underline">
          Ver agenda →
        </a>
      </div>

      {loading ? (
        <div className="space-y-2">{[0,1,2].map(i => <Skeleton key={i} className="h-10" />)}</div>
      ) : events.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-6">
          <Calendar size={28} className="text-slate-200 mb-2" />
          <p className="text-[0.75rem] text-slate-400">Nenhum evento nos próximos 7 dias</p>
          <a href="#agenda"
            className="mt-2 text-[0.72rem] text-blue-500 font-medium hover:underline">Criar evento</a>
        </div>
      ) : (
        <div className="space-y-2.5 flex-1">
          {events.map(ev => {
            const cfg = EVENT_TYPE_COLORS[ev.type] || EVENT_TYPE_COLORS.outro
            return (
              <div key={ev.id} className="flex items-center gap-2.5">
                <span className="text-sm shrink-0">{cfg.emoji}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-[0.76rem] font-semibold text-slate-700 truncate">{ev.title}</p>
                  {ev.client_name && <p className="text-[0.67rem] text-slate-400 truncate">{ev.client_name}</p>}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[0.67rem] font-bold" style={{ color: cfg.color }}>{fmtDate(ev.date)}</p>
                  {ev.start_time && <p className="text-[0.62rem] text-slate-400">{ev.start_time.slice(0,5)}</p>}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { user }   = useAuth()
  const userId     = user?.id
  const [month]    = useState(new Date().getMonth() + 1)
  const [year]     = useState(new Date().getFullYear())
  const { data, loading, error, refetch } = useDashboardData(userId, month, year)

  const hasData = data?.has_data
  const kpiData = data || { entradas:0, saidas:0, saldo:0, acumulado:0, entradas_pct:0, saidas_pct:0 }
  const monthly     = hasData ? data.monthly   : MONTHLY_DATA_WITH_ACC
  const saidas_cats = (hasData && data.categories?.length) ? data.categories : SAIDAS_CATEGORIAS

  // Usa projetos reais do dashboard stats se disponíveis, senão mock
  const projetos = (data?.projects?.list?.length
    ? data.projects.list.map(p => ({
        name:   p.name,
        margem: p.margin,
        receita: p.revenue,
        custo:   p.cost,
      }))
    : PROJETOS
  )

  const KPIS = [
    { label:'Total Entradas',  value:fmtBRL(kpiData.entradas),  icon:'💰', pct:kpiData.entradas_pct,  color:'green', delay:0   },
    { label:'Total Saídas',    value:fmtBRL(kpiData.saidas),    icon:'📤', pct:kpiData.saidas_pct,    color:'red',   delay:80  },
    { label:'Saldo do Mês',    value:fmtBRL(kpiData.saldo),     icon:'📊', pct:kpiData.saldo_pct || 0,color:'blue',  delay:160 },
    { label:'Saldo Acumulado', value:fmtBRL(kpiData.acumulado), icon:'🏦', pct:kpiData.acumulado_pct||0,color:'gold',delay:240 },
  ]

  if (error) return (
    <div className="p-8 flex flex-col items-center gap-3 text-slate-500">
      <p className="text-[0.85rem]">⚠️ Erro ao carregar dados: {error}</p>
      <button onClick={refetch} className="flex items-center gap-1.5 text-blue-600 text-[0.8rem] font-medium hover:underline">
        <RefreshCw size={13} /> Tentar novamente
      </button>
    </div>
  )

  return (
    <div className="p-7 space-y-5">

      {/* Demo banner */}
      {user?.plan === 'demo' && (
        <div className="flex items-center justify-between px-5 py-3 rounded-2xl animate-fade-up"
          style={{ background:'linear-gradient(135deg,rgba(37,99,235,0.07),rgba(6,182,212,0.05))', border:'1px solid rgba(37,99,235,0.12)' }}>
          <div className="flex items-center gap-2.5">
            <span className="text-[0.72rem] font-bold px-2 py-0.5 rounded-full"
              style={{ background:'rgba(37,99,235,0.1)', color:'#2563EB' }}>DEMO</span>
            <span className="text-[0.8rem] text-slate-600">
              Você está no plano Demo · {5 - (user?.proposals_used || 0)} propostas restantes
            </span>
          </div>
          <button className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-[0.75rem] font-bold text-white transition-all hover:opacity-90"
            style={{ background:'linear-gradient(135deg,#1D4ED8,#3B82F6)', boxShadow:'0 4px 12px rgba(37,99,235,0.3)' }}>
            <ArrowDownCircle size={13} /> Fazer upgrade
          </button>
        </div>
      )}

      {/* KPIs */}
      {loading ? (
        <div className="grid grid-cols-4 gap-4">
          {[0,1,2,3].map(i => <Skeleton key={i} className="h-[120px]" />)}
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-4">
          {KPIS.map(kpi => <KPICard key={kpi.label} {...kpi} />)}
        </div>
      )}

      {/* Empty state */}
      {!loading && !hasData && <EmptyState />}

      {/* Charts */}
      {!loading && (
        <>
          <div className="grid grid-cols-5 gap-4">
            <ChartCard title="Entradas vs Saídas" subtitle="Últimos 6 meses" className="col-span-3"
              action={<span className="text-[0.65rem] font-bold px-2 py-0.5 rounded"
                style={{ background:'rgba(37,99,235,0.08)', color:'#2563EB' }}>{year}</span>}>
              <BarEntradasSaidas data={monthly} />
            </ChartCard>

            <ChartCard title="Evolução do Saldo" subtitle="Acumulado mês a mês" className="col-span-2"
              action={<span className="text-[0.65rem] font-bold px-2 py-0.5 rounded"
                style={{ background:'rgba(16,185,129,0.1)', color:'#059669' }}>Linha</span>}>
              <LineSaldo data={monthly} />
            </ChartCard>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <ChartCard title="Receitas por Tipo" subtitle="Distribuição no mês">
              <PieDonut data={RECEITA_TIPOS} />
            </ChartCard>

            <ChartCard title="Saídas por Categoria" subtitle="Distribuição no mês">
              <PieDonut data={saidas_cats} />
            </ChartCard>

            <div className="card p-5 animate-fade-up flex flex-col">
              <h3 className="text-[0.82rem] font-bold text-slate-800 mb-1">Projetos em Andamento</h3>
              <p className="text-[0.7rem] text-slate-400 mb-4">Margem por projeto</p>
              <div className="space-y-3.5 flex-1">
                {projetos.map(p => {
                  const m     = p.margem
                  const color = m>=80?'green':m>=60?'blue':m>=40?'amber':'red'
                  const bar   = m>=80?'#10B981':m>=60?'#3B82F6':m>=40?'#F59E0B':'#EF4444'
                  const barBg = m>=80?'rgba(16,185,129,0.1)':m>=60?'rgba(59,130,246,0.1)':m>=40?'rgba(245,158,11,0.1)':'rgba(239,68,68,0.1)'
                  return (
                    <div key={p.name}>
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-[0.76rem] font-medium text-slate-700 truncate max-w-[120px]">{p.name}</span>
                        <ChipTag label={`${m}%`} color={color} />
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background:barBg }}>
                        <div className="h-full rounded-full transition-all duration-700"
                          style={{ width:`${Math.min(m,100)}%`, background:`linear-gradient(90deg,${bar}99,${bar})`, boxShadow:`0 0 6px ${bar}60` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="mt-4 pt-3.5 space-y-1.5" style={{ borderTop:'1px solid rgba(226,232,240,0.7)' }}>
                <div className="flex justify-between text-[0.75rem]">
                  <span className="text-slate-500">Receita total</span>
                  <span className="font-bold text-emerald-600">R$ {projetos.reduce((s,p)=>s+(p.receita||0),0).toLocaleString('pt-BR')}</span>
                </div>
                <div className="flex justify-between text-[0.75rem]">
                  <span className="text-slate-500">Custo total</span>
                  <span className="font-bold text-red-500">R$ {projetos.reduce((s,p)=>s+(p.custo||0),0).toLocaleString('pt-BR')}</span>
                </div>
              </div>
            </div>

            <UpcomingEventsCard userId={userId} />
          </div>

          <ChartCard title="Margem por Projeto (%)" subtitle="Meta: 70%"
            action={
              <div className="flex gap-2 flex-wrap justify-end">
                {[['#10B981','≥80%'],['#3B82F6','60–79%'],['#F59E0B','40–59%'],['#EF4444','<40%']].map(([c,l]) => (
                  <div key={l} className="flex items-center gap-1 text-[0.68rem] text-slate-500">
                    <span className="w-2 h-2 rounded-sm" style={{ background:c }} />{l}
                  </div>
                ))}
              </div>
            }>
            <BarMargem data={projetos} />
          </ChartCard>
        </>
      )}

    </div>
  )
}
