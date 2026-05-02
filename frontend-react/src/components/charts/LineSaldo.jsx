import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts'

const fmt = (v) => `R$${(v / 1000).toFixed(0)}k`

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="chart-tooltip">
      <p className="text-[0.7rem] font-bold text-white/50 uppercase tracking-wider mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center justify-between gap-6">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ background: p.stroke }} />
            <span className="text-white/70">{p.name}</span>
          </div>
          <span className="font-bold text-white">R$ {p.value.toLocaleString('pt-BR')}</span>
        </div>
      ))}
    </div>
  )
}

export default function LineSaldo({ data }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="fillSaldo" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#3B82F6" stopOpacity={0.25} />
            <stop offset="100%" stopColor="#3B82F6" stopOpacity={0.02} />
          </linearGradient>
          <linearGradient id="fillAcc" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#10B981" stopOpacity={0.2} />
            <stop offset="100%" stopColor="#10B981" stopOpacity={0.01} />
          </linearGradient>
          <filter id="glow-blue">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(226,232,240,0.6)" vertical={false} />
        <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#94A3B8', fontWeight: 500 }} axisLine={false} tickLine={false} />
        <YAxis tickFormatter={fmt} tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} width={46} />
        <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(59,130,246,0.2)', strokeWidth: 1, strokeDasharray: '4 4' }} />
        <Area
          type="monotone" dataKey="saldo" name="Saldo Mês"
          stroke="#3B82F6" strokeWidth={2.5} fill="url(#fillSaldo)"
          dot={{ r: 4, fill: '#3B82F6', strokeWidth: 2, stroke: '#fff' }}
          activeDot={{ r: 6, fill: '#3B82F6', stroke: '#fff', strokeWidth: 2, filter: 'url(#glow-blue)' }}
        />
        <Area
          type="monotone" dataKey="acumulado" name="Acumulado"
          stroke="#10B981" strokeWidth={2.5} fill="url(#fillAcc)"
          dot={{ r: 4, fill: '#10B981', strokeWidth: 2, stroke: '#fff' }}
          activeDot={{ r: 6, fill: '#10B981', stroke: '#fff', strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
