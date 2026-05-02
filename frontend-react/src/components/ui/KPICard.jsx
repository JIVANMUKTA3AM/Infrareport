import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

const THEMES = {
  green: {
    grad:    'linear-gradient(135deg, #059669 0%, #10B981 100%)',
    glow:    'rgba(16,185,129,0.3)',
    light:   'rgba(16,185,129,0.08)',
    border:  'rgba(16,185,129,0.2)',
    text:    '#065F46',
    textVal: '#10B981',
  },
  red: {
    grad:    'linear-gradient(135deg, #DC2626 0%, #EF4444 100%)',
    glow:    'rgba(239,68,68,0.3)',
    light:   'rgba(239,68,68,0.07)',
    border:  'rgba(239,68,68,0.18)',
    text:    '#991B1B',
    textVal: '#EF4444',
  },
  blue: {
    grad:    'linear-gradient(135deg, #1D4ED8 0%, #3B82F6 100%)',
    glow:    'rgba(59,130,246,0.3)',
    light:   'rgba(59,130,246,0.07)',
    border:  'rgba(59,130,246,0.2)',
    text:    '#1E40AF',
    textVal: '#3B82F6',
  },
  gold: {
    grad:    'linear-gradient(135deg, #D97706 0%, #F59E0B 100%)',
    glow:    'rgba(245,158,11,0.3)',
    light:   'rgba(245,158,11,0.07)',
    border:  'rgba(245,158,11,0.2)',
    text:    '#92400E',
    textVal: '#F59E0B',
  },
}

export default function KPICard({ label, value, icon, pct, color, delay = 0 }) {
  const t   = THEMES[color] || THEMES.blue
  const up  = pct > 0
  const neu = pct === 0

  return (
    <div
      className="relative overflow-hidden rounded-2xl p-5 cursor-default animate-fade-up"
      style={{
        animationDelay: `${delay}ms`,
        background: 'linear-gradient(145deg, rgba(255,255,255,0.97), rgba(248,250,255,0.99))',
        border: `1px solid ${t.border}`,
        boxShadow: `0 1px 3px rgba(0,0,0,0.05), 0 8px 32px ${t.glow}`,
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-3px)'
        e.currentTarget.style.boxShadow = `0 4px 12px rgba(0,0,0,0.07), 0 16px 48px ${t.glow}`
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = `0 1px 3px rgba(0,0,0,0.05), 0 8px 32px ${t.glow}`
      }}
    >
      {/* Accent bar topo */}
      <div
        className="absolute top-0 left-0 right-0 h-[3px] rounded-t-2xl"
        style={{ background: t.grad }}
      />

      {/* Glow background blob */}
      <div
        className="absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-40 blur-2xl"
        style={{ background: t.grad }}
      />

      {/* Header */}
      <div className="flex items-start justify-between mb-4 relative">
        <span className="text-[0.68rem] font-bold uppercase tracking-[0.12em] text-slate-400">
          {label}
        </span>
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center text-[1rem] shrink-0"
          style={{ background: t.light, border: `1px solid ${t.border}` }}
        >
          {icon}
        </div>
      </div>

      {/* Value */}
      <div
        className="text-[1.85rem] font-black leading-none tracking-tighter mb-3 relative"
        style={{
          fontVariantNumeric: 'tabular-nums',
          background: `linear-gradient(135deg, #0F172A 0%, ${t.textVal} 100%)`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}
      >
        {value}
      </div>

      {/* Badge variação */}
      <div className="flex items-center gap-1.5 relative">
        {neu ? (
          <span className="badge-neu flex items-center gap-1">
            <Minus size={10} /> Estável
          </span>
        ) : up ? (
          <span className="badge-up flex items-center gap-1">
            <TrendingUp size={10} /> +{Math.abs(pct)}% vs fev
          </span>
        ) : (
          <span className="badge-down flex items-center gap-1">
            <TrendingDown size={10} /> -{Math.abs(pct)}% vs fev
          </span>
        )}
      </div>
    </div>
  )
}
