import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

const fmtBRL = (v) => `R$ ${v.toLocaleString('pt-BR')}`

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const d = payload[0]
  return (
    <div className="chart-tooltip">
      <div className="flex items-center gap-2 mb-1">
        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: d.payload.color }} />
        <span className="font-semibold text-white">{d.name}</span>
      </div>
      <div className="text-white/70">{fmtBRL(d.value)}</div>
    </div>
  )
}

const renderLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  if (percent < 0.07) return null
  const R = Math.PI / 180
  const r = innerRadius + (outerRadius - innerRadius) * 0.55
  return (
    <text
      x={cx + r * Math.cos(-midAngle * R)}
      y={cy + r * Math.sin(-midAngle * R)}
      fill="#fff" textAnchor="middle" dominantBaseline="central"
      fontSize={11} fontWeight={800}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

export default function PieDonut({ data }) {
  const total = data.reduce((s, d) => s + d.value, 0)

  return (
    <div className="flex flex-col">
      <ResponsiveContainer width="100%" height={190}>
        <PieChart>
          <defs>
            {data.map((_, i) => (
              <filter key={i} id={`glow-pie-${i}`}>
                <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            ))}
          </defs>
          <Pie
            data={data} cx="50%" cy="50%"
            innerRadius={52} outerRadius={80}
            paddingAngle={3} dataKey="value"
            labelLine={false} label={renderLabel}
            strokeWidth={0}
          >
            {data.map((d, i) => (
              <Cell key={i} fill={d.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>

      {/* Legenda */}
      <ul className="space-y-2 mt-1">
        {data.map((item, i) => (
          <li key={i} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ background: item.color, boxShadow: `0 0 6px ${item.color}80` }}
              />
              <span className="text-[0.75rem] text-slate-600 truncate max-w-[110px]">{item.name}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[0.75rem] font-bold text-slate-800">{fmtBRL(item.value)}</span>
              <span
                className="text-[0.65rem] font-bold px-1.5 py-0.5 rounded-full"
                style={{ background: `${item.color}18`, color: item.color }}
              >
                {((item.value / total) * 100).toFixed(0)}%
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
