import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer,
} from 'recharts'
import { BarChart2 } from 'lucide-react'

const fmt = (v) => `R$${(v / 1000).toFixed(1)}k`

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="chart-tooltip">
      <p className="text-[0.7rem] font-bold text-white/50 uppercase tracking-wider mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center justify-between gap-6">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-sm" style={{ background: p.fill }} />
            <span className="text-white/70">{p.name}</span>
          </div>
          <span className="font-bold text-white">R$ {(p.value || 0).toLocaleString('pt-BR')}</span>
        </div>
      ))}
    </div>
  )
}

export default function BarEntradasSaidas({ data }) {
  // Guard: empty or all-zero
  const hasAny = Array.isArray(data) && data.some(r => (r.entradas || 0) > 0 || (r.saidas || 0) > 0)

  if (!hasAny) {
    return (
      <div className="flex flex-col items-center justify-center h-[240px] gap-2 text-center">
        <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center">
          <BarChart2 size={16} className="text-slate-300" />
        </div>
        <p className="text-[0.75rem] text-slate-400 font-medium">Sem movimentações no ano</p>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }} barGap={4}>
        <defs>
          <linearGradient id="gradEntradas" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#10B981" stopOpacity={1} />
            <stop offset="100%" stopColor="#059669" stopOpacity={0.8} />
          </linearGradient>
          <linearGradient id="gradSaidas" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#F87171" stopOpacity={1} />
            <stop offset="100%" stopColor="#EF4444" stopOpacity={0.8} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(226,232,240,0.6)" vertical={false} />
        <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#94A3B8', fontWeight: 500 }} axisLine={false} tickLine={false} />
        <YAxis tickFormatter={fmt} tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} width={46} />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(59,130,246,0.06)' }} />
        <Legend
          iconType="circle" iconSize={7}
          wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
          formatter={(v) => <span style={{ color: '#64748B', fontWeight: 600 }}>{v}</span>}
        />
        <Bar dataKey="entradas" name="Entradas" fill="url(#gradEntradas)" radius={[5, 5, 0, 0]} maxBarSize={28} />
        <Bar dataKey="saidas"   name="Saídas"   fill="url(#gradSaidas)"   radius={[5, 5, 0, 0]} maxBarSize={28} />
      </BarChart>
    </ResponsiveContainer>
  )
}
