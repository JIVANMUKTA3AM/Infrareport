import { useState, useRef, useEffect } from 'react'
import {
  Send, Wrench, Cpu, Bot, User, Copy, Check,
  Download, Zap, RefreshCw, ChevronRight,
  Thermometer, Camera, Wifi, Lock, Zap as ZapElec,
  Bell, Settings2, Radio, FileText,
} from 'lucide-react'

const API_BASE = import.meta.env.VITE_API_URL || ''
const USER_ID  = 'USER_UUID_AQUI' // TODO: auth

// ── Nichos ──────────────────────────────────────────────────────────────────
const NICHES = [
  { id: 'ac',       label: 'Climatização',    icon: Thermometer, color: '#0EA5E9', bg: 'rgba(14,165,233,0.12)' },
  { id: 'cftv',     label: 'CFTV',            icon: Camera,      color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)' },
  { id: 'ti',       label: 'TI / Redes',      icon: Wifi,        color: '#06B6D4', bg: 'rgba(6,182,212,0.12)' },
  { id: 'acesso',   label: 'Controle Acesso', icon: Lock,        color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
  { id: 'eletrica', label: 'Elétrica',        icon: ZapElec,     color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
  { id: 'alarme',   label: 'Alarme',          icon: Bell,        color: '#EF4444', bg: 'rgba(239,68,68,0.12)' },
  { id: 'automacao',label: 'Automação',       icon: Settings2,   color: '#EC4899', bg: 'rgba(236,72,153,0.12)' },
  { id: 'telecom',  label: 'Telecom',         icon: Radio,       color: '#6366F1', bg: 'rgba(99,102,241,0.12)' },
  { id: 'laudo',    label: 'Laudos',          icon: FileText,    color: '#64748B', bg: 'rgba(100,116,139,0.12)' },
]

// ── Quick prompts iniciais ──────────────────────────────────────────────────
const QUICK_PROMPTS = [
  { icon: '📋', label: 'Gerar Relatório Técnico',      prompt: 'Preciso gerar um relatório técnico de vistoria. Pode me ajudar?' },
  { icon: '🔧', label: 'Diagnóstico de Falha',         prompt: 'Preciso diagnosticar uma falha no sistema. Me ajude com o troubleshooting.' },
  { icon: '📐', label: 'Dimensionamento',              prompt: 'Preciso fazer um dimensionamento técnico. Qual é o procedimento?' },
  { icon: '📚', label: 'Consultar Normas ABNT/NR',     prompt: 'Quais normas se aplicam ao meu serviço? Pode listar as principais?' },
  { icon: '📝', label: 'Elaborar Ordem de Serviço',    prompt: 'Preciso elaborar uma OS detalhada para um cliente.' },
  { icon: '⚡', label: 'Boas Práticas do Nicho',       prompt: 'Quais são as boas práticas e cuidados mais importantes na execução deste tipo de serviço?' },
]

// ── Utilitários ─────────────────────────────────────────────────────────────
function formatMessage(text) {
  // Converte marcações básicas para HTML simples
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/```([\s\S]*?)```/g, '<pre class="code-block">$1</pre>')
    .replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>')
    .replace(/^#{1,3} (.+)$/gm, '<span class="msg-heading">$1</span>')
    .replace(/^[-•] (.+)$/gm, '<span class="msg-bullet">• $1</span>')
    .replace(/\n/g, '<br/>')
    .replace(/════+/g, '<hr class="msg-divider"/>')
    .replace(/────+/g, '<hr class="msg-subdiv"/>')
}

// ── Componente de mensagem ──────────────────────────────────────────────────
function Message({ msg, isLast }) {
  const [copied, setCopied] = useState(false)
  const isBot = msg.role === 'assistant'

  function copyText() {
    navigator.clipboard.writeText(msg.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function downloadAsText() {
    const blob = new Blob([msg.content], { type: 'text/plain' })
    const url  = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `relatorio-tecnico-${Date.now()}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className={`flex gap-3 ${isBot ? 'justify-start' : 'justify-end'} animate-fade-up`}>

      {/* Avatar bot */}
      {isBot && (
        <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
          style={{ background: 'linear-gradient(135deg,#1D4ED8,#06B6D4)', boxShadow: '0 4px 12px rgba(37,99,235,0.4)' }}>
          <Bot size={14} className="text-white" />
        </div>
      )}

      {/* Bubble */}
      <div className={`group max-w-[82%] ${isBot ? '' : 'flex flex-col items-end'}`}>
        <div
          className="rounded-2xl px-4 py-3 text-[0.83rem] leading-relaxed"
          style={isBot ? {
            background: 'linear-gradient(145deg, rgba(255,255,255,0.97), rgba(248,250,255,0.99))',
            border: '1px solid rgba(37,99,235,0.1)',
            boxShadow: '0 2px 12px rgba(37,99,235,0.08)',
            color: '#1E293B',
          } : {
            background: 'linear-gradient(135deg,#1D4ED8,#2563EB)',
            color: '#fff',
            boxShadow: '0 4px 16px rgba(37,99,235,0.35)',
          }}
        >
          {isBot ? (
            <div
              className="prose-tech"
              dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }}
            />
          ) : (
            <p>{msg.content}</p>
          )}
        </div>

        {/* Actions bot */}
        {isBot && (
          <div className="flex items-center gap-1.5 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={copyText}
              className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-[0.68rem] font-medium text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all">
              {copied ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
              {copied ? 'Copiado!' : 'Copiar'}
            </button>
            {msg.has_report && (
              <button onClick={downloadAsText}
                className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-[0.68rem] font-medium text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all">
                <Download size={11} />
                Baixar .txt
              </button>
            )}
          </div>
        )}
      </div>

      {/* Avatar user */}
      {!isBot && (
        <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
          style={{ background: 'linear-gradient(135deg,#475569,#64748B)' }}>
          <User size={14} className="text-white" />
        </div>
      )}
    </div>
  )
}

// ── Typing indicator ────────────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div className="flex gap-3 justify-start animate-fade-up">
      <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: 'linear-gradient(135deg,#1D4ED8,#06B6D4)', boxShadow: '0 4px 12px rgba(37,99,235,0.4)' }}>
        <Bot size={14} className="text-white" />
      </div>
      <div className="rounded-2xl px-5 py-3.5 flex items-center gap-1.5"
        style={{ background: 'rgba(255,255,255,0.97)', border: '1px solid rgba(37,99,235,0.1)', boxShadow: '0 2px 12px rgba(37,99,235,0.08)' }}>
        {[0, 1, 2].map(i => (
          <span key={i} className="w-2 h-2 rounded-full bg-blue-400 animate-bounce"
            style={{ animationDelay: `${i * 150}ms` }} />
        ))}
      </div>
    </div>
  )
}

// ── Tela inicial (sem mensagens) ────────────────────────────────────────────
function WelcomeScreen({ onPrompt }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-8 py-12">
      {/* Hero icon */}
      <div className="relative">
        <div className="w-20 h-20 rounded-3xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg,#1D4ED8,#06B6D4)', boxShadow: '0 8px 40px rgba(37,99,235,0.4)' }}>
          <Wrench size={36} className="text-white" />
        </div>
        <div className="absolute -top-1 -right-1 w-6 h-6 rounded-xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg,#10B981,#34D399)', boxShadow: '0 4px 12px rgba(16,185,129,0.5)' }}>
          <Zap size={12} className="text-white" fill="white" />
        </div>
      </div>

      <div className="text-center max-w-md">
        <h2 className="text-[1.2rem] font-black text-slate-800 mb-2">Agente Técnico InfraReport</h2>
        <p className="text-[0.85rem] text-slate-500 leading-relaxed">
          Especialista em AC, CFTV, TI/Redes, Controle de Acesso, Elétrica, Alarme, Automação e mais.
          Tire dúvidas, gere relatórios técnicos e laudos.
        </p>
      </div>

      {/* Quick prompts */}
      <div className="grid grid-cols-2 gap-2.5 w-full max-w-xl">
        {QUICK_PROMPTS.map((q) => (
          <button
            key={q.label}
            onClick={() => onPrompt(q.prompt)}
            className="flex items-center gap-2.5 p-3 rounded-xl text-left transition-all hover:-translate-y-0.5"
            style={{
              background: 'linear-gradient(145deg,rgba(255,255,255,0.97),rgba(248,250,255,0.99))',
              border: '1px solid rgba(37,99,235,0.1)',
              boxShadow: '0 2px 8px rgba(37,99,235,0.06)',
            }}
          >
            <span className="text-[1.1rem] shrink-0">{q.icon}</span>
            <span className="text-[0.76rem] font-semibold text-slate-700">{q.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Componente principal ────────────────────────────────────────────────────
export default function AgenteTecnico() {
  const [messages,    setMessages]    = useState([])
  const [input,       setInput]       = useState('')
  const [loading,     setLoading]     = useState(false)
  const [niche,       setNiche]       = useState(null)
  const [suggestions, setSuggestions] = useState([])
  const bottomRef = useRef(null)
  const inputRef  = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function send(text) {
    const msg = text || input.trim()
    if (!msg || loading) return
    setInput('')

    const userMsg = { role: 'user', content: msg }
    const newHistory = [...messages, userMsg]
    setMessages(newHistory)
    setLoading(true)

    try {
      const res = await fetch(`${API_BASE}/api/technical/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: USER_ID,
          message: msg,
          niche: niche,
          history: messages.map(m => ({ role: m.role, content: m.content })),
        }),
      })

      if (!res.ok) throw new Error(`Erro ${res.status}`)
      const data = await res.json()

      if (data.niche_detected && !niche) setNiche(data.niche_detected)
      if (data.suggestions?.length) setSuggestions(data.suggestions)

      setMessages(prev => [...prev, {
        role:       'assistant',
        content:    data.reply,
        has_report: data.has_report,
      }])
    } catch (err) {
      setMessages(prev => [...prev, {
        role:    'assistant',
        content: `⚠️ Erro ao conectar com o agente: ${err.message}. Verifique se o backend está rodando.`,
        has_report: false,
      }])
    } finally {
      setLoading(false)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  const activeNiche = NICHES.find(n => n.id === niche)

  return (
    <div className="flex flex-col h-[calc(100vh-60px)]">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div
        className="px-6 py-3 flex items-center justify-between gap-4 flex-wrap"
        style={{ borderBottom: '1px solid rgba(37,99,235,0.08)', background: 'rgba(240,244,255,0.6)', backdropFilter: 'blur(12px)' }}
      >
        {/* Seletor de nicho */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[0.68rem] font-bold text-slate-400 uppercase tracking-wider mr-1">Nicho:</span>
          {NICHES.map(n => {
            const Icon = n.icon
            const active = niche === n.id
            return (
              <button
                key={n.id}
                onClick={() => setNiche(active ? null : n.id)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[0.7rem] font-semibold transition-all hover:scale-105"
                style={{
                  background: active ? n.bg : 'rgba(255,255,255,0.7)',
                  color:      active ? n.color : '#94A3B8',
                  border:     `1px solid ${active ? n.color + '40' : 'rgba(226,232,240,0.8)'}`,
                  boxShadow:  active ? `0 2px 8px ${n.color}30` : 'none',
                }}
              >
                <Icon size={11} />
                {n.label}
              </button>
            )
          })}
        </div>

        {/* Reset */}
        {messages.length > 0 && (
          <button
            onClick={() => { setMessages([]); setNiche(null); setSuggestions([]) }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[0.72rem] font-medium text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
          >
            <RefreshCw size={12} />
            Nova conversa
          </button>
        )}
      </div>

      {/* ── Messages ────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
        {messages.length === 0 ? (
          <WelcomeScreen onPrompt={send} />
        ) : (
          <>
            {messages.map((msg, i) => (
              <Message key={i} msg={msg} isLast={i === messages.length - 1} />
            ))}
            {loading && <TypingIndicator />}
          </>
        )}
        <div ref={bottomRef} />
      </div>

      {/* ── Suggestions ────────────────────────────────────────────────── */}
      {suggestions.length > 0 && messages.length > 0 && !loading && (
        <div className="px-6 pb-2 flex items-center gap-2 flex-wrap"
          style={{ borderTop: '1px solid rgba(37,99,235,0.06)' }}>
          <span className="text-[0.68rem] font-bold text-slate-400 uppercase tracking-wider">Sugestões:</span>
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => send(s)}
              className="flex items-center gap-1 px-3 py-1 rounded-full text-[0.72rem] font-medium transition-all hover:-translate-y-px"
              style={{
                background: 'rgba(37,99,235,0.07)',
                color: '#2563EB',
                border: '1px solid rgba(37,99,235,0.15)',
              }}
            >
              <ChevronRight size={10} />
              {s}
            </button>
          ))}
        </div>
      )}

      {/* ── Input ───────────────────────────────────────────────────────── */}
      <div
        className="px-6 py-4"
        style={{ borderTop: '1px solid rgba(37,99,235,0.1)', background: 'rgba(240,244,255,0.8)', backdropFilter: 'blur(16px)' }}
      >
        <div
          className="flex items-end gap-3 rounded-2xl px-4 py-3"
          style={{
            background: 'rgba(255,255,255,0.97)',
            border: '1.5px solid rgba(37,99,235,0.15)',
            boxShadow: '0 4px 24px rgba(37,99,235,0.1)',
          }}
        >
          {/* Nicho ativo */}
          {activeNiche && (
            <div
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-[0.68rem] font-bold shrink-0 mb-0.5"
              style={{ background: activeNiche.bg, color: activeNiche.color }}
            >
              <activeNiche.icon size={10} />
              {activeNiche.label}
            </div>
          )}

          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Digite sua dúvida técnica, peça um relatório, laudo ou diagnóstico..."
            rows={1}
            className="flex-1 resize-none bg-transparent text-[0.85rem] text-slate-800 placeholder-slate-400 outline-none leading-relaxed"
            style={{ maxHeight: 120, minHeight: 24 }}
            onInput={e => {
              e.target.style.height = 'auto'
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
            }}
            disabled={loading}
          />

          <button
            onClick={() => send()}
            disabled={!input.trim() || loading}
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all disabled:opacity-40 hover:scale-105"
            style={{
              background: input.trim() ? 'linear-gradient(135deg,#1D4ED8,#3B82F6)' : '#E2E8F0',
              boxShadow:  input.trim() ? '0 4px 12px rgba(37,99,235,0.4)' : 'none',
            }}
          >
            {loading
              ? <RefreshCw size={15} className="animate-spin text-blue-400" />
              : <Send size={15} className={input.trim() ? 'text-white' : 'text-slate-400'} />
            }
          </button>
        </div>

        <p className="text-center text-[0.65rem] text-slate-400 mt-2">
          <kbd className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 text-[0.62rem] font-mono">Enter</kbd> para enviar ·
          <kbd className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 text-[0.62rem] font-mono ml-1">Shift+Enter</kbd> para quebrar linha
        </p>
      </div>
    </div>
  )
}
