import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Zap, ChevronRight, ArrowRight, MessageSquare, Check,
  Wrench, TrendingUp, FileText,
  Star, Menu, X, Thermometer, Camera, Wifi,
  Lock, Bell, Settings2, LayoutDashboard,
  ChevronUp, Clock, Bot, Activity,
} from 'lucide-react'

const GLOBAL_STYLES = `
  @keyframes floatOrb1 {
    0%,100% { transform: translate(0,0) scale(1); }
    33%      { transform: translate(30px,-20px) scale(1.06); }
    66%      { transform: translate(-15px,12px) scale(0.96); }
  }
  @keyframes floatOrb2 {
    0%,100% { transform: translate(0,0) scale(1); }
    40%      { transform: translate(-25px,18px) scale(1.04); }
    70%      { transform: translate(18px,-10px) scale(0.98); }
  }
  @keyframes floatOrb3 {
    0%,100% { transform: translate(0,0) rotate(0deg); }
    50%      { transform: translate(12px,-22px) rotate(20deg); }
  }
  @keyframes ticker {
    0%   { transform: translateX(0); }
    100% { transform: translateX(-50%); }
  }
  @keyframes shimmer {
    0%   { left: -100%; }
    100% { left: 160%; }
  }
  @keyframes starWave {
    0%   { transform: scale(0) rotate(-20deg); opacity: 0; }
    60%  { transform: scale(1.3) rotate(5deg); }
    100% { transform: scale(1) rotate(0); opacity: 1; }
  }
  @keyframes bounce {
    0%, 100% { transform: translateY(0); }
    50%       { transform: translateY(-5px); }
  }
  @keyframes ledPulse {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.15; }
  }
  @keyframes bellShake {
    0%,100% { transform: rotate(0); }
    20%      { transform: rotate(14deg); }
    50%      { transform: rotate(-11deg); }
    80%      { transform: rotate(6deg); }
  }
  @keyframes spinSlow {
    to { transform: rotate(360deg); }
  }
  @keyframes revealUp {
    from { opacity:0; transform:translateY(24px); }
    to   { opacity:1; transform:translateY(0); }
  }
  @keyframes countPop {
    0%   { transform: scale(0.7); opacity:0; }
    60%  { transform: scale(1.12); }
    100% { transform: scale(1); opacity:1; }
  }
  @property --conic-angle {
    syntax: '<angle>';
    initial-value: 0deg;
    inherits: false;
  }
  @keyframes rotateConic {
    to { --conic-angle: 360deg; }
  }
  .plan-conic-wrap {
    background: conic-gradient(
      from var(--conic-angle),
      #3B82F6 0%, #1D4ED8 25%, #60A5FA 50%, #1D4ED8 75%, #3B82F6 100%
    );
    animation: rotateConic 4s linear infinite;
    padding: 2px;
    border-radius: 18px;
  }
  .btn-shine { position:relative; overflow:hidden; }
  .btn-shine::after {
    content:'';
    position:absolute; top:0; left:-100%; width:60%; height:100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.22), transparent);
    transition: left 0s;
  }
  .btn-shine:hover::after { left:160%; transition: left 0.5s ease; }
  .section-reveal { opacity:0; transform:translateY(24px); transition: opacity 0.7s cubic-bezier(.4,0,.2,1), transform 0.7s cubic-bezier(.4,0,.2,1); }
  .section-reveal.visible { opacity:1; transform:none; }
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after { animation-duration:0.01ms!important; animation-iteration-count:1!important; transition-duration:0.01ms!important; }
    .hero-orb { display:none!important; }
  }
`

// ── Mini Bar Chart ────────────────────────────────────────────────────────────
function MiniBarChart() {
  const data = [
    {r:55,e:38},{r:72,e:45},{r:62,e:52},
    {r:84,e:41},{r:70,e:48},{r:91,e:39},{r:80,e:55},
  ]
  const H=52, BAR=9, GAP=2, STEP=29
  return (
    <svg width="100%" height={H} viewBox={`0 0 210 ${H}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id="gr-rev" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2563EB"/><stop offset="100%" stopColor="#2563EB" stopOpacity="0.2"/>
        </linearGradient>
        <linearGradient id="gr-exp" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#06B6D4"/><stop offset="100%" stopColor="#06B6D4" stopOpacity="0.2"/>
        </linearGradient>
      </defs>
      {data.map(({r,e},i) => (
        <g key={i}>
          <rect x={i*STEP+4} y={H-r*H/100} width={BAR} height={r*H/100} rx="2" fill="url(#gr-rev)"/>
          <rect x={i*STEP+4+BAR+GAP} y={H-e*H/100} width={BAR} height={e*H/100} rx="2" fill="url(#gr-exp)"/>
        </g>
      ))}
    </svg>
  )
}

// ── Dashboard View ────────────────────────────────────────────────────────────
function DashboardView() {
  return (
    <div className="p-3 pb-2">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[0.6rem] font-semibold text-white/40 uppercase tracking-widest">Maio 2025</span>
        <div className="flex gap-1">
          {['1M','3M','12M'].map(p=>(
            <span key={p} className="text-[0.55rem] px-1.5 py-0.5 rounded font-medium"
              style={{background:p==='1M'?'rgba(37,99,235,0.25)':'transparent',color:p==='1M'?'#60A5FA':'rgba(255,255,255,0.2)'}}>
              {p}
            </span>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 mb-3">
        {[
          {label:'Receita',value:'R$ 28,4k',delta:'+12%',up:true, color:'#34D399'},
          {label:'Saídas', value:'R$ 11,2k',delta:'-8%', up:false,color:'#F87171'},
          {label:'Saldo',  value:'R$ 17,2k',delta:'+18%',up:true, color:'#60A5FA'},
        ].map(k=>(
          <div key={k.label} className="rounded-xl p-2.5"
            style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.07)'}}>
            <div className="text-[0.55rem] text-white/30 mb-1 font-medium">{k.label}</div>
            <div className="text-[0.82rem] font-black leading-none" style={{color:k.color}}>{k.value}</div>
            <div className="text-[0.55rem] mt-1 font-bold" style={{color:k.up?'#34D399':'#F87171'}}>{k.delta}</div>
          </div>
        ))}
      </div>
      <div className="rounded-xl p-2.5 mb-2" style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.05)'}}>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[0.55rem] font-semibold text-white/30 uppercase tracking-wide">Receita vs Despesas</span>
          <div className="flex gap-2">
            {[['#2563EB','Receita'],['#06B6D4','Despesas']].map(([c,l])=>(
              <span key={l} className="flex items-center gap-1 text-[0.53rem] text-white/25">
                <span className="w-1.5 h-1.5 rounded-full" style={{background:c}}/>{l}
              </span>
            ))}
          </div>
        </div>
        <MiniBarChart/>
        <div className="flex justify-between mt-1.5 px-1">
          {['Jan','Fev','Mar','Abr','Mai','Jun','Jul'].map(m=>(
            <span key={m} className="text-[0.5rem] text-white/20 font-medium">{m}</span>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl p-2.5" style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.05)'}}>
          <div className="text-[0.55rem] text-white/25 mb-0.5">Propostas enviadas</div>
          <div className="text-[0.88rem] font-black text-white/85">47</div>
          <div className="text-[0.52rem] text-white/20">este mês</div>
        </div>
        <div className="rounded-xl p-2.5" style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.05)'}}>
          <div className="text-[0.55rem] text-white/25 mb-0.5">Conversão</div>
          <div className="text-[0.88rem] font-black" style={{color:'#34D399'}}>68%</div>
          <div className="text-[0.52rem] text-white/20">acima da média</div>
        </div>
      </div>
    </div>
  )
}

// ── Chat View ─────────────────────────────────────────────────────────────────
function ChatView({agent}) {
  return (
    <div className="p-3">
      <p className="text-[0.58rem] text-white/20 mb-3 uppercase tracking-widest font-semibold">
        {agent.tag} · {agent.desc.slice(0,46)}...
      </p>
      {agent.chat.map((msg,i)=>(
        <div key={i} className={`flex ${msg.from==='user'?'justify-end':'justify-start'} mb-2.5`}>
          <div className="max-w-[90%] px-3 py-2 rounded-xl text-[0.67rem] leading-relaxed"
            style={msg.from==='user'
              ?{background:`${agent.color}20`,color:agent.color,border:`1px solid ${agent.color}30`}
              :{background:'rgba(255,255,255,0.06)',color:'rgba(255,255,255,0.78)',border:'1px solid rgba(255,255,255,0.08)'}}>
            {msg.text}
          </div>
        </div>
      ))}
      <div className="flex justify-start">
        <div className="flex gap-1 px-3 py-2 rounded-xl" style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.07)'}}>
          {[0,1,2].map(i=>(
            <div key={i} className="w-1.5 h-1.5 rounded-full"
              style={{background:agent.color,opacity:0.6,animation:`bounce 1s ease-in-out ${i*0.15}s infinite`}}/>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Dados ─────────────────────────────────────────────────────────────────────
const HERO_TABS = [
  {id:'dashboard',label:'Dashboard',icon:LayoutDashboard,color:'#60A5FA'},
  {id:'tecnico',  label:'Técnico',  icon:Wrench,         color:'#06B6D4'},
  {id:'comercial',label:'Comercial',icon:FileText,        color:'#3B82F6'},
  {id:'financeiro',label:'Financeiro',icon:TrendingUp,    color:'#10B981'},
]

const STATS = [
  {numeric:9,  suffix:'+', display:null, label:'Nichos técnicos', icon:Bot,      color:'#3B82F6'},
  {numeric:3,  suffix:'',  display:null, label:'Agentes de IA',   icon:Activity, color:'#06B6D4'},
  {numeric:null,suffix:'', display:'<2s',label:'Resposta média',  icon:Clock,    color:'#10B981'},
  {numeric:null,suffix:'', display:'24/7',label:'Sem parar',       icon:Zap,      color:'#F59E0B'},
]

const AGENTS = [
  {
    icon:Wrench, agentKey:'tecnico', tag:'Técnico', title:'Agente Técnico',
    desc:'Diagnóstico de falhas, dimensionamentos, laudos técnicos e consulta de normas NBR/NR para 9 nichos de atuação.',
    color:'#06B6D4', bg:'rgba(6,182,212,0.08)', border:'rgba(6,182,212,0.2)',
    chat:[
      {from:'user',text:'Disjuntor Q3 (32A) do QD-02 disparando com carga medida de 18A. Já substituí e o problema persiste.'},
      {from:'ai',  text:'Disparo com 18A em 32A descarta sobrecarga — problema é isolação degradada no ramal. Meça Riso com megôhmmetro, mín. 1MΩ (NBR 5410 §6.3.3).'},
    ],
  },
  {
    icon:FileText, agentKey:'comercial', tag:'Comercial', title:'Agente Comercial',
    desc:'Gera propostas profissionais em .docx com precificação validada e envia automaticamente por e-mail ao cliente.',
    color:'#3B82F6', bg:'rgba(59,130,246,0.08)', border:'rgba(59,130,246,0.2)',
    chat:[
      {from:'user',text:'Proposta para 8 câmeras IP 4MP com NVR 16 canais no galpão da Construtora Beta.'},
      {from:'ai',  text:'Proposta gerada — R$ 6.840,00. .docx enviado para contato@construtorabeta.com.br.'},
    ],
  },
  {
    icon:TrendingUp, agentKey:'financeiro', tag:'Financeiro', title:'Agente Financeiro',
    desc:'Registre movimentações em linguagem natural. O agente classifica, persiste no banco e atualiza seu saldo em tempo real.',
    color:'#10B981', bg:'rgba(16,185,129,0.08)', border:'rgba(16,185,129,0.2)',
    chat:[
      {from:'user',text:'Entrada de R$8.500 do Grupo TechPark — OS 2341, cabeamento concluído.'},
      {from:'ai',  text:'R$ 8.500,00 registrado — Serviços / OS 2341. Saldo: R$ 26.350,00. Margem: 62%.'},
    ],
  },
]

const AGENT_MAP = {tecnico:AGENTS[0],comercial:AGENTS[1],financeiro:AGENTS[2]}

const NICHES = [
  {icon:Thermometer, label:'Climatização / AC',     color:'#0EA5E9', anim:'spinSlow 6s linear infinite'},
  {icon:Camera,      label:'CFTV / Segurança',      color:'#8B5CF6', anim:'ledPulse 1.6s ease-in-out infinite'},
  {icon:Wifi,        label:'TI / Redes',             color:'#06B6D4', anim:'none'},
  {icon:Lock,        label:'Controle de Acesso',    color:'#10B981', anim:'none'},
  {icon:Zap,         label:'Instalações Elétricas', color:'#F59E0B', anim:'none'},
  {icon:Bell,        label:'Alarme / Monit.',       color:'#EF4444', anim:'bellShake 0.6s ease infinite'},
  {icon:Settings2,   label:'Automação Predial',     color:'#EC4899', anim:'spinSlow 4s linear infinite'},
  {icon:MessageSquare,label:'Agente WhatsApp',      color:'#22C55E', anim:'bounce 1s ease-in-out infinite'},
]

const PLANS = [
  {
    name:'Demo', price:'Grátis', period:'', desc:'Experimente sem cartão', highlight:false,
    features:['5 propostas comerciais','Agente Técnico IA','Dashboard financeiro','Suporte por e-mail'],
    cta:'Começar grátis',
  },
  {
    name:'Pro', price:'R$197', period:'/mês', desc:'Para técnicos e engenheiros', highlight:true,
    features:['100 propostas/mês','Todos os agentes IA','Agente WhatsApp incluso','Relatórios PDF/DOCX','Suporte prioritário'],
    cta:'Assinar Pro',
  },
  {
    name:'Agency', price:'R$397', period:'/mês', desc:'Para empresas e equipes', highlight:false,
    features:['Propostas ilimitadas','Multi-usuário','API de integração','Onboarding dedicado','SLA garantido'],
    cta:'Falar com vendas',
  },
]

const TESTIMONIALS = [
  {
    name:'Marcos Oliveira', role:'Técnico em Refrigeração · Brasília-DF', stars:5, initials:'MO',
    text:'Reduzi o tempo de elaboração de propostas de 2 horas para 3 minutos. O agente já conhece os preços do mercado.',
    gradient:'linear-gradient(135deg,#1D4ED8,#06B6D4)',
  },
  {
    name:'Eng. Patrícia Costa', role:'Integradora de CFTV · São Paulo-SP', stars:5, initials:'PC',
    text:'O controle financeiro por linguagem natural mudou minha rotina. Só digito "recebi R$3500 do cliente X" e o sistema resolve tudo.',
    gradient:'linear-gradient(135deg,#7C3AED,#EC4899)',
  },
  {
    name:'Ricardo Alves', role:'Eletricista NR10 · Goiânia-GO', stars:5, initials:'RA',
    text:'O agente técnico me salvou numa obra complexa. Perguntei sobre SPDA e ele trouxe a NBR 5419 com os cálculos em segundos.',
    gradient:'linear-gradient(135deg,#059669,#10B981)',
  },
]

const TICKER_ITEMS = [
  '⚡ Eletricistas MEI',  '❄️ Engenheiros de AC',  '📷 Técnicos CFTV',
  '🔒 Controle de Acesso','🌐 TI & Redes',          '🔔 Alarmes & Monit.',
  '🤖 Automação Predial', '💬 Via WhatsApp',         '📄 Proposta em 3 min',
  '💰 Controle financeiro','📊 Relatórios PDF',      '✅ 9+ nichos técnicos',
]

// ── NicheCard — colorido por padrão ──────────────────────────────────────────
function NicheCard({icon:Icon, label, color, anim}) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      className="flex items-center gap-3 p-4 rounded-2xl cursor-default"
      style={{
        background: hovered ? `${color}20` : `${color}0d`,
        border: `1px solid ${hovered ? color+'60' : color+'35'}`,
        transform: hovered ? 'translateY(-4px) scale(1.02)' : 'none',
        boxShadow: hovered ? `0 14px 30px ${color}30` : `0 2px 8px ${color}15`,
        transition:'all 0.3s cubic-bezier(.4,0,.2,1)',
      }}
      onMouseEnter={()=>setHovered(true)}
      onMouseLeave={()=>setHovered(false)}
    >
      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{
          background: `linear-gradient(135deg,${color}35,${color}18)`,
          border:`1px solid ${color}55`,
          boxShadow: hovered ? `0 0 22px ${color}50` : `0 0 8px ${color}25`,
          transition:'all 0.3s ease',
        }}>
        <Icon size={17} style={{color, animation: anim}}/>
      </div>
      <span className="text-[0.8rem] font-semibold text-left"
        style={{color: hovered ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.75)', transition:'color 0.2s'}}>
        {label}
      </span>
    </div>
  )
}

// ── AgentCard — accent sempre visível ────────────────────────────────────────
function AgentCard({ag}) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      className="rounded-2xl flex flex-col overflow-hidden"
      style={{
        background:'#fff',
        border:`1px solid ${hovered ? ag.color+'55' : ag.border}`,
        boxShadow: hovered ? `0 16px 48px ${ag.color}25` : `0 2px 16px ${ag.color}12`,
        transform: hovered ? 'translateY(-5px)' : 'none',
        transition:'all 0.3s cubic-bezier(.4,0,.2,1)',
      }}
      onMouseEnter={()=>setHovered(true)}
      onMouseLeave={()=>setHovered(false)}
    >
      {/* colored top accent — SEMPRE visível */}
      <div style={{height:4, background:`linear-gradient(90deg,${ag.color},${ag.color}88)`, flexShrink:0}}/>

      <div className="p-6 flex flex-col flex-1">
        <div className="flex items-start justify-between mb-4">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center"
            style={{background:ag.bg, border:`1px solid ${ag.border}`, boxShadow:`0 0 16px ${ag.color}30`}}>
            <ag.icon size={20} style={{color:ag.color}}/>
          </div>
          <span className="flex items-center gap-1.5 text-[0.6rem] font-bold px-2 py-1 rounded-full"
            style={{background:ag.bg, color:ag.color, border:`1px solid ${ag.border}`}}>
            <span className="w-1.5 h-1.5 rounded-full" style={{background:ag.color, animation:'bounce 2s ease-in-out infinite'}}/>
            Ativo 24/7
          </span>
        </div>

        <div className="text-[0.68rem] font-bold uppercase tracking-widest mb-1.5" style={{color:ag.color}}>{ag.tag}</div>
        <h3 className="text-[1.05rem] font-black text-slate-900 mb-2">{ag.title}</h3>
        <p className="text-[0.82rem] text-slate-500 leading-relaxed mb-5 flex-1">{ag.desc}</p>

        <div className="rounded-xl p-3 space-y-2" style={{background:`${ag.color}08`, border:`1px solid ${ag.color}18`}}>
          {ag.chat.map((msg,j)=>(
            <div key={j} className={`flex ${msg.from==='user'?'justify-end':'justify-start'}`}>
              <span className="text-[0.7rem] px-3 py-1.5 rounded-xl max-w-[95%] leading-snug"
                style={msg.from==='user'
                  ?{background:ag.bg, color:ag.color, fontWeight:500}
                  :{background:'#fff', color:'#374151', border:'1px solid rgba(0,0,0,0.07)', boxShadow:'0 1px 4px rgba(0,0,0,0.06)'}}>
                {msg.text}
              </span>
            </div>
          ))}
          <div className="flex justify-start">
            <div className="flex gap-1 px-3 py-2 rounded-xl" style={{background:'rgba(0,0,0,0.03)',border:'1px solid rgba(0,0,0,0.05)'}}>
              {[0,1,2].map(i=>(
                <div key={i} className="w-1.5 h-1.5 rounded-full"
                  style={{background:ag.color, opacity:0.5, animation:`bounce 1s ease-in-out ${i*0.18}s infinite`}}/>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── TestimonialCard com tilt 3D ───────────────────────────────────────────────
function TestimonialCard({t}) {
  const [tilt, setTilt] = useState({x:0,y:0})
  const handleMove = useCallback(e=>{
    const r = e.currentTarget.getBoundingClientRect()
    setTilt({x:((e.clientX-r.left)/r.width-0.5)*9, y:((e.clientY-r.top)/r.height-0.5)*9})
  },[])
  const handleLeave = useCallback(()=>setTilt({x:0,y:0}),[])
  return (
    <div
      onMouseMove={handleMove} onMouseLeave={handleLeave}
      className="bg-white rounded-2xl p-6 flex flex-col relative overflow-hidden"
      style={{
        border:'1px solid rgba(0,0,0,0.07)',
        boxShadow:'0 2px 20px rgba(0,0,0,0.07)',
        transform:`perspective(700px) rotateX(${-tilt.y}deg) rotateY(${tilt.x}deg)`,
        transition: tilt.x===0&&tilt.y===0 ? 'transform 0.45s cubic-bezier(.4,0,.2,1)' : 'transform 0.05s',
        willChange:'transform',
      }}
    >
      {/* quote decorativa */}
      <div className="absolute top-3 left-4 font-black select-none pointer-events-none"
        style={{fontSize:'5rem',lineHeight:1,color:'rgba(37,99,235,0.07)',fontFamily:'Georgia,serif'}}>"</div>

      {/* stars com gradient */}
      <div className="flex gap-0.5 mb-4 relative z-10">
        {[...Array(t.stars)].map((_,j)=>(
          <svg key={j} width="14" height="14" viewBox="0 0 14 14">
            <defs>
              <linearGradient id={`sg${j}`} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#FBBF24"/><stop offset="100%" stopColor="#F59E0B"/>
              </linearGradient>
            </defs>
            <polygon points="7,1 8.8,5.4 13.5,5.7 10,8.8 11.1,13.4 7,10.8 2.9,13.4 4,8.8 0.5,5.7 5.2,5.4"
              fill={`url(#sg${j})`}/>
          </svg>
        ))}
      </div>
      <p className="text-[0.85rem] text-slate-600 leading-relaxed mb-5 relative z-10 flex-1">"{t.text}"</p>
      <div className="flex items-center gap-3 relative z-10">
        <div className="w-9 h-9 rounded-full flex items-center justify-center text-[0.68rem] font-black text-white shrink-0"
          style={{background:t.gradient}}>{t.initials}</div>
        <div>
          <div className="text-[0.82rem] font-bold text-slate-900">{t.name}</div>
          <div className="text-[0.72rem] text-slate-400 mt-0.5">{t.role}</div>
        </div>
      </div>
    </div>
  )
}

// ── Count-up ──────────────────────────────────────────────────────────────────
function useCountUp(target, isVisible, duration=1400) {
  const [count, setCount] = useState(0)
  useEffect(()=>{
    if (!isVisible||target===null) return
    const start = performance.now()
    const tick = now=>{
      const p = Math.min((now-start)/duration,1)
      setCount(Math.round((1-Math.pow(1-p,3))*target))
      if (p<1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  },[isVisible,target,duration])
  return count
}

function StatCard({stat, isVisible}) {
  const count = useCountUp(stat.numeric, isVisible)
  const display = stat.display!==null ? stat.display : `${count}${stat.suffix}`
  const Icon = stat.icon
  return (
    <div className="text-center rounded-2xl p-5 flex flex-col items-center gap-2"
      style={{background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.10)'}}>
      <div className="w-9 h-9 rounded-xl flex items-center justify-center"
        style={{background:`${stat.color}25`, border:`1px solid ${stat.color}40`}}>
        <Icon size={16} style={{color:stat.color}}/>
      </div>
      <div className="text-[2rem] font-black leading-none"
        style={{background:`linear-gradient(135deg,#fff,${stat.color})`, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
          animation: isVisible ? 'countPop 0.5s ease both' : 'none'}}>
        {display}
      </div>
      <div className="text-[0.72rem] font-medium" style={{color:'rgba(255,255,255,0.5)'}}>{stat.label}</div>
    </div>
  )
}

// ── Ticker de nichos ──────────────────────────────────────────────────────────
function NicheTicker() {
  const items = [...TICKER_ITEMS, ...TICKER_ITEMS]
  return (
    <div className="overflow-hidden py-3" style={{borderTop:'1px solid rgba(0,0,0,0.06)',borderBottom:'1px solid rgba(0,0,0,0.06)',background:'rgba(37,99,235,0.03)'}}>
      <div className="flex gap-8 whitespace-nowrap" style={{animation:'ticker 28s linear infinite', width:'max-content'}}>
        {items.map((item,i)=>(
          <span key={i} className="text-[0.78rem] font-semibold text-slate-500 shrink-0">{item}</span>
        ))}
      </div>
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function Landing({onLogin, onRegister}) {
  const [menuOpen,    setMenuOpen]    = useState(false)
  const [scrolled,    setScrolled]    = useState(false)
  const [heroTab,     setHeroTab]     = useState('dashboard')
  const [userChanged, setUserChanged] = useState(false)
  const [starsVisible,setStarsVisible]= useState(false)
  const [statsVisible,setStatsVisible]= useState(false)
  const [showBackTop, setShowBackTop] = useState(false)
  const statsRef = useRef(null)

  useEffect(()=>{
    const style = document.createElement('style')
    style.id = 'landing-anim'
    style.textContent = GLOBAL_STYLES
    if (!document.getElementById('landing-anim')) document.head.appendChild(style)
    return ()=>document.getElementById('landing-anim')?.remove()
  },[])

  useEffect(()=>{
    const h = ()=>{ setScrolled(window.scrollY>20); setShowBackTop(window.scrollY>600) }
    window.addEventListener('scroll',h,{passive:true})
    return ()=>window.removeEventListener('scroll',h)
  },[])

  useEffect(()=>{ const t=setTimeout(()=>setStarsVisible(true),600); return ()=>clearTimeout(t) },[])

  useEffect(()=>{
    if (!statsRef.current) return
    const obs = new IntersectionObserver(([e])=>{ if(e.isIntersecting){setStatsVisible(true);obs.disconnect()} },{threshold:0.3})
    obs.observe(statsRef.current)
    return ()=>obs.disconnect()
  },[])

  useEffect(()=>{
    const els = document.querySelectorAll('.section-reveal')
    const obs = new IntersectionObserver(entries=>{
      entries.forEach(e=>{ if(e.isIntersecting){e.target.classList.add('visible');obs.unobserve(e.target)} })
    },{threshold:0.07})
    els.forEach(el=>obs.observe(el))
    return ()=>obs.disconnect()
  },[])

  useEffect(()=>{
    if (userChanged) return
    const ids = HERO_TABS.map(t=>t.id)
    const t = setInterval(()=>setHeroTab(cur=>{ const i=ids.indexOf(cur); return ids[(i+1)%ids.length] }),3800)
    return ()=>clearInterval(t)
  },[userChanged])

  const activeTabMeta = HERO_TABS.find(t=>t.id===heroTab)

  return (
    <div className="min-h-screen font-sans" style={{background:'#F8FAFC'}}>

      {/* ════ NAVBAR ════ */}
      <nav className="fixed top-0 left-0 right-0 z-50" style={{
        background: scrolled ? 'rgba(255,255,255,0.96)' : 'transparent',
        backdropFilter: scrolled ? 'blur(28px)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(28px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(0,0,0,0.06)' : 'none',
        boxShadow: scrolled ? '0 2px 24px rgba(0,0,0,0.07)' : 'none',
        transition:'all 0.3s ease',
      }}>
        <div className="max-w-6xl mx-auto px-6 h-[64px] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{background:'linear-gradient(135deg,#1D4ED8,#06B6D4)',boxShadow:'0 4px 14px rgba(37,99,235,0.4)'}}>
              <Zap size={15} className="text-white" fill="white"/>
            </div>
            <span className="text-[1.05rem] font-black text-slate-900 tracking-tight">
              Infra<span style={{background:'linear-gradient(90deg,#2563EB,#06B6D4)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>Report</span>
            </span>
          </div>
          <div className="hidden md:flex items-center gap-7">
            {['Recursos','Agentes','Planos','Depoimentos'].map(l=>(
              <a key={l} href={`#${l.toLowerCase()}`} className="text-[0.82rem] font-medium text-slate-500 hover:text-slate-900 transition-colors">{l}</a>
            ))}
          </div>
          <div className="hidden md:flex items-center gap-3">
            <button onClick={onLogin} className="px-4 py-2 text-[0.82rem] font-semibold text-slate-600 hover:text-slate-900 transition-colors rounded-lg hover:bg-slate-100">Entrar</button>
            <button onClick={onRegister} className="btn-shine flex items-center gap-1.5 px-4 py-2 rounded-xl text-[0.82rem] font-bold text-white"
              style={{background:'linear-gradient(135deg,#1D4ED8,#3B82F6)',boxShadow:'0 4px 14px rgba(37,99,235,0.35)',transition:'opacity 0.2s,transform 0.2s'}}
              onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-1px)';e.currentTarget.style.opacity='0.92'}}
              onMouseLeave={e=>{e.currentTarget.style.transform='';e.currentTarget.style.opacity=''}}>
              Criar conta grátis <ArrowRight size={13}/>
            </button>
          </div>
          <button className="md:hidden p-2 rounded-lg" onClick={()=>setMenuOpen(o=>!o)}>
            {menuOpen ? <X size={20}/> : <Menu size={20}/>}
          </button>
        </div>
        {menuOpen && (
          <div className="md:hidden bg-white border-t border-slate-100 px-6 py-4 space-y-3">
            {['Recursos','Agentes','Planos','Depoimentos'].map(l=>(
              <a key={l} href={`#${l.toLowerCase()}`} className="block text-[0.88rem] font-medium text-slate-600 py-1" onClick={()=>setMenuOpen(false)}>{l}</a>
            ))}
            <div className="pt-2 flex flex-col gap-2">
              <button onClick={onLogin} className="w-full py-2.5 rounded-xl border border-slate-200 text-[0.85rem] font-semibold text-slate-700">Entrar</button>
              <button onClick={onRegister} className="w-full py-2.5 rounded-xl text-[0.85rem] font-bold text-white" style={{background:'linear-gradient(135deg,#1D4ED8,#3B82F6)'}}>Criar conta grátis</button>
            </div>
          </div>
        )}
      </nav>

      {/* ════ HERO ════ */}
      <section className="relative pt-[100px] pb-20 px-6 overflow-hidden"
        style={{background:'linear-gradient(160deg,#F0F6FF 0%,#EEF2FF 50%,#F0F9FF 100%)'}}>

        {/* orbs sempre animados — visíveis sem interação */}
        <div className="hero-orb absolute pointer-events-none rounded-full hidden lg:block"
          style={{width:400,height:400,background:'radial-gradient(circle,rgba(37,99,235,0.13),transparent 70%)',top:'-80px',right:'-60px',animation:'floatOrb1 10s ease-in-out infinite'}}/>
        <div className="hero-orb absolute pointer-events-none rounded-full hidden lg:block"
          style={{width:280,height:280,background:'radial-gradient(circle,rgba(6,182,212,0.12),transparent 70%)',top:'40%',right:'8%',animation:'floatOrb2 14s 2s ease-in-out infinite'}}/>
        <div className="hero-orb absolute pointer-events-none rounded-full hidden lg:block"
          style={{width:180,height:180,background:'radial-gradient(circle,rgba(139,92,246,0.09),transparent 70%)',top:'20%',left:'5%',animation:'floatOrb3 9s 1s ease-in-out infinite'}}/>
        {/* grid decorativo */}
        <div className="absolute inset-0 pointer-events-none hidden lg:block" style={{backgroundImage:'radial-gradient(rgba(37,99,235,0.07) 1px,transparent 1px)',backgroundSize:'36px 36px'}}/>

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-14 items-center">
            {/* Texto */}
            <div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[0.75rem] font-semibold mb-6"
                style={{background:'rgba(37,99,235,0.10)',border:'1px solid rgba(37,99,235,0.20)',color:'#2563EB'}}>
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"/>
                Plataforma para prestadores de serviços técnicos
                <ChevronRight size={12}/>
              </div>

              <h1 className="text-[3rem] lg:text-[3.5rem] font-black text-slate-900 leading-[1.05] tracking-tight mb-5">
                Gestão técnica{' '}
                <span style={{background:'linear-gradient(135deg,#1D4ED8,#06B6D4)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>
                  inteligente,
                </span>{' '}
                24h por dia.
              </h1>

              <p className="text-[1rem] text-slate-500 leading-relaxed mb-8 max-w-lg">
                Propostas profissionais, controle financeiro e diagnóstico técnico em uma plataforma integrada — para engenheiros e técnicos que querem escalar.
              </p>

              <div className="flex items-center gap-3 flex-wrap mb-8">
                <button onClick={onRegister} className="btn-shine flex items-center gap-2 px-6 py-3.5 rounded-xl text-[0.9rem] font-bold text-white"
                  style={{background:'linear-gradient(135deg,#1D4ED8,#3B82F6)',boxShadow:'0 6px 24px rgba(37,99,235,0.4)',transition:'transform 0.2s,box-shadow 0.2s'}}
                  onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow='0 12px 32px rgba(37,99,235,0.5)'}}
                  onMouseLeave={e=>{e.currentTarget.style.transform='';e.currentTarget.style.boxShadow='0 6px 24px rgba(37,99,235,0.4)'}}>
                  <Zap size={15} fill="white"/> Começar grátis
                </button>
                <a href="#agentes" className="flex items-center gap-1.5 px-6 py-3.5 rounded-xl text-[0.9rem] font-semibold text-slate-600 transition-all hover:bg-white"
                  style={{border:'1px solid rgba(0,0,0,0.10)',backdropFilter:'blur(8px)'}}>
                  Ver os Agentes <ArrowRight size={14}/>
                </a>
              </div>

              {/* avatars + stars */}
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  {[['#1D4ED8','#3B82F6','MO'],['#0891B2','#06B6D4','EC'],['#059669','#10B981','RA'],['#7C3AED','#A855F7','PL']].map(([c1,c2,lb],i)=>(
                    <div key={i} className="w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-[0.6rem] font-bold text-white"
                      style={{background:`linear-gradient(135deg,${c1},${c2})`}}>{lb}</div>
                  ))}
                </div>
                <div className="flex items-center gap-1.5 text-[0.78rem] text-slate-500">
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_,i)=>(
                      <Star key={i} size={11} style={{color:'#FBBF24',fill:'#FBBF24',animation:starsVisible?`starWave 0.5s ease ${i*0.12}s both`:'none',display:'inline-block'}}/>
                    ))}
                  </div>
                  <span><strong className="text-slate-700">4.9/5</strong> · 200+ profissionais</span>
                </div>
              </div>
            </div>

            {/* Hero Window */}
            <div className="relative hidden lg:block">
              <div className="absolute inset-0 rounded-3xl blur-3xl opacity-25"
                style={{background:`linear-gradient(135deg,#1D4ED8,${activeTabMeta?.color||'#06B6D4'})`,transform:'scale(0.9) translateY(20px)',transition:'background 0.6s ease'}}/>
              <div className="relative rounded-3xl overflow-hidden"
                style={{background:'linear-gradient(160deg,#0B1628,#060E20)',border:'1px solid rgba(255,255,255,0.08)',boxShadow:'0 32px 80px rgba(0,0,0,0.45)'}}>
                <div className="flex items-center gap-2 px-5 py-3" style={{borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
                  <div className="flex gap-1.5">
                    <span className="w-3 h-3 rounded-full" style={{background:'#FF5F57'}}/>
                    <span className="w-3 h-3 rounded-full" style={{background:'#FEBC2E'}}/>
                    <span className="w-3 h-3 rounded-full" style={{background:'#28C840'}}/>
                  </div>
                  <div className="flex-1 flex justify-center">
                    <div className="flex items-center gap-2 text-[0.7rem] text-white/35 font-medium">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"/>
                      InfraReport · Sistema de Gestão
                    </div>
                  </div>
                </div>
                <div className="flex gap-0 px-3 pt-2" style={{borderBottom:'1px solid rgba(255,255,255,0.05)'}}>
                  {HERO_TABS.map(tab=>{
                    const isActive = heroTab===tab.id
                    return (
                      <button key={tab.id} onClick={()=>{setHeroTab(tab.id);setUserChanged(true)}}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-t-lg text-[0.65rem] font-semibold transition-all"
                        style={isActive
                          ?{background:'rgba(255,255,255,0.05)',color:tab.color,borderBottom:`2px solid ${tab.color}`,marginBottom:-1}
                          :{color:'rgba(255,255,255,0.22)',borderBottom:'2px solid transparent',marginBottom:-1}}>
                        <tab.icon size={10}/>{tab.label}
                      </button>
                    )
                  })}
                </div>
                <div style={{minHeight:300}}>
                  {heroTab==='dashboard' ? <DashboardView/> : <ChatView agent={AGENT_MAP[heroTab]}/>}
                </div>
                {heroTab!=='dashboard' && (
                  <div className="px-3 pb-3">
                    <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl" style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.07)'}}>
                      <span className="text-[0.7rem] text-white/18 flex-1">
                        {heroTab==='tecnico'?'Descreva o problema técnico...':heroTab==='comercial'?'Descreva o serviço e cliente...':'Registre uma movimentação...'}
                      </span>
                      <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{background:`linear-gradient(135deg,${activeTabMeta?.color},${activeTabMeta?.color}99)`}}>
                        <ArrowRight size={10} className="text-white"/>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════ TICKER ════ */}
      <NicheTicker/>

      {/* ════ STATS — fundo escuro sempre visível ════ */}
      <section ref={statsRef} style={{background:'linear-gradient(135deg,#060E20,#0A1628)'}}>
        <div className="max-w-6xl mx-auto px-6 py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {STATS.map(s=><StatCard key={s.label} stat={s} isVisible={statsVisible}/>)}
          </div>
        </div>
      </section>

      {/* ════ NICHOS ════ */}
      <section id="recursos" className="py-20 px-6 section-reveal"
        style={{background:'linear-gradient(160deg,#070F22,#0C1830)'}}>
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-[0.72rem] font-bold text-blue-400 uppercase tracking-widest mb-3">Nichos Atendidos</p>
          <h2 className="text-[2rem] font-black text-white mb-3">
            Um sistema para{' '}
            <span style={{background:'linear-gradient(90deg,#60A5FA,#06B6D4)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>
              cada especialidade
            </span>
          </h2>
          <p className="text-white/40 text-[0.85rem] mb-10 max-w-md mx-auto">
            Os agentes reconhecem automaticamente o seu nicho e respondem com o vocabulário técnico correto.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {NICHES.map(n=><NicheCard key={n.label} {...n}/>)}
          </div>
        </div>
      </section>

      {/* ════ AGENTES ════ */}
      <section id="agentes" className="py-20 px-6 section-reveal" style={{background:'#F8FAFC'}}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-[0.72rem] font-bold text-blue-600 uppercase tracking-widest mb-3">Inteligência Aplicada</p>
            <h2 className="text-[2.2rem] font-black text-slate-900 leading-tight">
              3 especialistas trabalhando{' '}
              <span style={{background:'linear-gradient(135deg,#1D4ED8,#06B6D4)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>por você</span>
            </h2>
            <p className="text-slate-500 mt-3 max-w-lg mx-auto text-[0.9rem]">Cada agente é treinado com o conhecimento técnico do setor. Sem respostas genéricas.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {AGENTS.map((ag,i)=><AgentCard key={i} ag={ag}/>)}
          </div>
        </div>
      </section>

      {/* ════ PLANOS ════ */}
      <section id="planos" className="py-20 px-6 section-reveal" style={{background:'linear-gradient(145deg,#EEF2FF,#F0F9FF)'}}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-[0.72rem] font-bold text-blue-600 uppercase tracking-widest mb-3">Preços</p>
            <h2 className="text-[2.2rem] font-black text-slate-900">Simples e transparente</h2>
            <p className="text-slate-500 mt-2 text-[0.9rem]">Comece grátis. Cancele quando quiser.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {PLANS.map(plan=>{
              const inner = (
                <div key={plan.name}
                  className="rounded-2xl p-7 flex flex-col relative h-full transition-all duration-300"
                  style={{
                    background: plan.highlight ? 'linear-gradient(160deg,#060E20,#0A1628)' : '#fff',
                    border: plan.highlight ? 'none' : '1px solid rgba(0,0,0,0.07)',
                    boxShadow: plan.highlight ? 'none' : '0 2px 12px rgba(0,0,0,0.06)',
                  }}
                  onMouseEnter={e=>{ if(!plan.highlight) e.currentTarget.style.boxShadow='0 16px 40px rgba(37,99,235,0.12)'; if(!plan.highlight) e.currentTarget.style.transform='translateY(-3px)'}}
                  onMouseLeave={e=>{ if(!plan.highlight) e.currentTarget.style.boxShadow='0 2px 12px rgba(0,0,0,0.06)'; if(!plan.highlight) e.currentTarget.style.transform=''}}>
                  {plan.highlight && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-[0.7rem] font-black text-white z-10"
                      style={{background:'linear-gradient(135deg,#1D4ED8,#06B6D4)',boxShadow:'0 4px 12px rgba(37,99,235,0.5)'}}>
                      MAIS POPULAR
                    </div>
                  )}
                  <div className={`text-[0.78rem] font-bold uppercase tracking-widest mb-3 ${plan.highlight?'text-blue-400':'text-slate-400'}`}>{plan.name}</div>
                  <div className="flex items-end gap-1 mb-1">
                    <span className={`text-[2.2rem] font-black leading-none ${plan.highlight?'text-white':'text-slate-900'}`}>{plan.price}</span>
                    <span className={`text-[0.85rem] mb-1 ${plan.highlight?'text-white/50':'text-slate-400'}`}>{plan.period}</span>
                  </div>
                  <p className={`text-[0.78rem] mb-6 ${plan.highlight?'text-white/50':'text-slate-500'}`}>{plan.desc}</p>
                  <ul className="space-y-2.5 flex-1 mb-7">
                    {plan.features.map(f=>(
                      <li key={f} className={`flex items-center gap-2.5 text-[0.8rem] ${plan.highlight?'text-white/80':'text-slate-600'}`}>
                        <Check size={14} className={plan.highlight?'text-blue-400':'text-emerald-500'}/>{f}
                      </li>
                    ))}
                  </ul>
                  <button onClick={onRegister} className="btn-shine w-full py-3 rounded-xl text-[0.85rem] font-bold transition-all hover:opacity-90 hover:-translate-y-0.5"
                    style={plan.highlight
                      ?{background:'linear-gradient(135deg,#2563EB,#3B82F6)',color:'#fff',boxShadow:'0 4px 16px rgba(37,99,235,0.4)'}
                      :{background:'rgba(37,99,235,0.07)',color:'#2563EB',border:'1px solid rgba(37,99,235,0.15)'}}>
                    {plan.cta}
                  </button>
                </div>
              )
              return plan.highlight ? (
                <div key={plan.name} className="plan-conic-wrap relative">{inner}</div>
              ) : inner
            })}
          </div>
        </div>
      </section>

      {/* ════ DEPOIMENTOS ════ */}
      <section id="depoimentos" className="py-20 px-6 section-reveal" style={{background:'#fff'}}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-[0.72rem] font-bold text-blue-600 uppercase tracking-widest mb-3">Depoimentos</p>
            <h2 className="text-[2.2rem] font-black text-slate-900">O que dizem nossos clientes</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t,i)=><TestimonialCard key={i} t={t}/>)}
          </div>
        </div>
      </section>

      {/* ════ CTA FINAL ════ */}
      <section className="py-20 px-6 section-reveal" style={{background:'linear-gradient(135deg,#060E20,#0A1628)'}}>
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-[2.5rem] font-black text-white leading-tight mb-4">
            Pronto para escalar<br/>
            <span style={{background:'linear-gradient(90deg,#60A5FA,#06B6D4)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>
              sua operação técnica?
            </span>
          </h2>
          <p className="text-white/50 text-[0.9rem] mb-8">Comece grátis hoje. Sem cartão de crédito. Sem compromisso.</p>
          <button onClick={onRegister} className="btn-shine inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-[0.95rem] font-black text-white"
            style={{background:'linear-gradient(135deg,#2563EB,#3B82F6)',boxShadow:'0 8px 32px rgba(37,99,235,0.5)',transition:'transform 0.2s,box-shadow 0.2s'}}
            onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow='0 14px 40px rgba(37,99,235,0.6)'}}
            onMouseLeave={e=>{e.currentTarget.style.transform='';e.currentTarget.style.boxShadow='0 8px 32px rgba(37,99,235,0.5)'}}>
            <Zap size={18} fill="white"/> Criar minha conta grátis
          </button>
          <p className="text-white/25 text-[0.72rem] mt-4">Plano Demo · 5 propostas grátis · Sem cartão</p>
        </div>
      </section>

      {/* ════ FOOTER ════ */}
      <footer className="py-8 px-6 border-t border-slate-100">
        <div className="max-w-6xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{background:'linear-gradient(135deg,#1D4ED8,#06B6D4)'}}>
              <Zap size={11} className="text-white" fill="white"/>
            </div>
            <span className="text-[0.85rem] font-black text-slate-800">
              Infra<span style={{background:'linear-gradient(90deg,#2563EB,#06B6D4)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>Report</span>
            </span>
          </div>
          <div className="flex gap-6">
            {['Termos de Uso','Privacidade','Suporte'].map(l=>(
              <a key={l} href="#" className="text-[0.75rem] text-slate-400 hover:text-slate-600 transition-colors">{l}</a>
            ))}
          </div>
          <p className="text-[0.72rem] text-slate-300">© 2025 InfraReport. Todos os direitos reservados.</p>
        </div>
      </footer>

      {/* chat widget */}
      <button onClick={onRegister}
        className="fixed bottom-6 right-6 flex items-center gap-2 px-5 py-3 rounded-2xl text-[0.82rem] font-bold text-white z-40 transition-all hover:opacity-90 hover:-translate-y-0.5"
        style={{background:'linear-gradient(135deg,#2563EB,#3B82F6)',boxShadow:'0 8px 24px rgba(37,99,235,0.45)'}}>
        <MessageSquare size={16}/> Falar com Engenharia
      </button>

      {/* back to top */}
      <button onClick={()=>window.scrollTo({top:0,behavior:'smooth'})} aria-label="Voltar ao topo"
        className="fixed bottom-6 left-6 z-40 w-10 h-10 rounded-xl flex items-center justify-center text-white"
        style={{background:'linear-gradient(135deg,#1D4ED8,#3B82F6)',boxShadow:'0 4px 14px rgba(37,99,235,0.35)',opacity:showBackTop?1:0,transform:showBackTop?'translateY(0)':'translateY(10px)',pointerEvents:showBackTop?'auto':'none',transition:'opacity 0.3s,transform 0.3s'}}>
        <ChevronUp size={18}/>
      </button>
    </div>
  )
}
