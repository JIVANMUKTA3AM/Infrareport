import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Cell, ResponsiveContainer, ReferenceLine,
} from 'recharts'

const getColor = (m) =>
  m >= 80 ? '#10B981' : m >= 60 ? '#3B82F6' : m >= 40 ? '#F59E0B' : '#EF4444'

const getGrad = (m) =>
  m >= 80 ? ['#34D399','#10B981'] : m >= 60 ? ['#60A5FA','#3B82F6'] : m >= 40 ? ['#FCD34D','#F59E0B'] : ['#F87171','#EF4444']

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  const color = getColor(d.margem)
  return (
    <div className="chart-tooltip min-w-[170px]">
      <p className="font-bold text-white mb-2 truncate">{d.name}</p>
      <div className="space-y-1">
        <div className="flex justify-between gap-4">
          <span className="text-white/55">Receita</span>
          <span className="font-semibold text-emerald-400">R$ {d.receita.toLocaleString('pt-BR')}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-white/55">Custo</span>
          <span className="font-semibold text-red-400">R$ {d.custo.toLocaleString('pt-BR')}</span>
        </div>
        <div className="flex justify-between gap-4 pt-1 border-t border-white/10 mt-1">
          <span className="text-white/55">Margem</span>
          <span className="font-black" style={{ color }}>{d.margem}%</span>
        </div>
      </div>
    </div>
  )
}

export default function BarMargem({ data }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }} barSize={12}>
        <defs>
          {data.map((d, i) => {
            const [c1, c2] = getGrad(d.margem)
            return (
              <linearGradient key={i} id={`mg${i}`} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%"   stopColor={c1} stopOpacity={0.7} />
                <stop offset="100%" stopColor={c2} stopOpacity={1} />
              </linearGradient>
            )
          })}
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(226,232,240,0.5)" horizontal={false} />
        <XAxis
          type="number" domain={[0, 100]}
          tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false}
          tickFormatter={(v) => `${v}%`}
        />
        <YAxis
          type="category" dataKey="name"
          tick={{ fontSize: 11, fill: '#64748B', fontWeight: 500 }}
          axisLine={false} tickLine={false} width={115}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(59,130,246,0.05)' }} />
        <ReferenceLine
          x={70} stroke="rgba(148,163,184,0.5)" strokeDasharray="5 5"
          label={{ value: '70%', fill: '#94A3B8', fontSize: 10, position: 'insideTopRight', offset: 4 }}
        />
        <Bar dataKey="margem" name="Margem %" radius={[0, 6, 6, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={`url(#mg${i})`} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
