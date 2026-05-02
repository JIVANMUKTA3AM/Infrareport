import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, RefreshCw, ChevronRight, MessageSquarePlus, DollarSign, ArrowUpCircle, ArrowDownCircle, PieChart } from 'lucide-react'
import { KPI_CURRENT } from '../data/mock'

const API_BASE = import.meta.env.VITE_API_URL || ''
const USER_ID  = 'USER_UUID_AQUI' // TODO: auth

const QUICK_PROMPTS = [
  { label: 'Qual meu saldo atual?', prompt: 'Qual meu saldo atual?' },
  { label: 'Resumo das entradas do mês', prompt: 'Qual o resumo das entradas deste mês?' },
  { label: 'Maiores gastos', prompt: 'Onde eu gastei mais dinheiro neste mês?' },
  { label: 'Gerar relatório', prompt: 'Gere um relatório completo de fechamento mensal.' },
]

function formatBRL(value) {
  return `R$ ${Number(value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`
}

function formatMessage(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br/>')
}

function Message({ msg }) {
  const isBot = msg.role === 'assistant'

  return (
    <div className={`flex gap-3 ${isBot ? 'justify-start' : 'justify-end'} animate-fade-up`}>
      {isBot && (
        <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
          style={{ background: 'linear-gradient(135deg,#1D4ED8,#3B82F6)', boxShadow: '0 4px 12px rgba(37,99,235,0.3)' }}>
          <Bot size={14} className="text-white" />
        </div>
      )}

      <div className={`group max-w-[85%] ${isBot ? '' : 'flex flex-col items-end'}`}>
        <div
          className="rounded-2xl px-4 py-3 text-[0.83rem] leading-relaxed"
          style={isBot ? {
            background: 'white', border: '1px solid rgba(226,232,240,0.8)', color: '#1E293B',
          } : {
            background: 'linear-gradient(135deg,#1D4ED8,#2563EB)', color: '#fff', boxShadow: '0 4px 16px rgba(37,99,235,0.25)',
          }}
        >
          {isBot ? (
            <div dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }} />
          ) : (
            <p>{msg.content}</p>
          )}
        </div>
        <div className="text-[0.65rem] text-slate-400 mt-1 px-1">{msg.time || 'Agora'}</div>
      </div>

      {!isBot && (
        <div className="w-8 h-8 rounded-xl bg-slate-200 flex items-center justify-center shrink-0 mt-0.5 text-slate-500">
          <User size={14} />
        </div>
      )}
    </div>
  )
}

function TypingIndicator() {
  return (
    <div className="flex gap-3 justify-start animate-fade-up">
      <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: 'linear-gradient(135deg,#1D4ED8,#3B82F6)' }}>
        <Bot size={14} className="text-white" />
      </div>
      <div className="rounded-2xl px-4 py-3 bg-white border border-slate-200 flex items-center gap-1.5">
        {[0, 1, 2].map(i => (
          <span key={i} className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
        ))}
      </div>
    </div>
  )
}

export default function AgenteFinanceiro() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Olá! 👋\nSou seu **Agente Financeiro.** Posso te ajudar com consultas, lançamentos rápidos em linguagem natural e relatórios.\n\nExperimente dizer: *"Gastei R$200 em gasolina pro carro"* ou *"Qual meu saldo?"*' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function send(text) {
    const msg = text || input.trim()
    if (!msg || loading) return
    setInput('')

    const newHistory = [...messages, { role: 'user', content: msg, time: 'Agora' }]
    setMessages(newHistory)
    setLoading(true)

    try {
      const res = await fetch(`${API_BASE}/api/financial/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: USER_ID, message: msg }),
      })

      if (!res.ok) throw new Error(`Erro ${res.status}`)
      const data = await res.json()

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.reply || data.response || 'Confirmado.',
        time: 'Agora'
      }])
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `⚠️ Erro de conexão com o agente financeiro: ${err.message}.`,
        time: 'Agora'
      }])
    } finally {
      setLoading(false)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }

  return (
    <div className="p-7 h-[calc(100vh-60px)] animate-fade-up">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 h-full max-h-[800px]">
        
        {/* Main Chat Area */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col overflow-hidden">
          
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-600/20">
                <Bot size={18} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-[0.9rem]">Agente Financeiro</h3>
                <div className="flex items-center gap-1.5 text-[0.7rem] font-semibold text-emerald-600 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Online Agora
                </div>
              </div>
            </div>
            <button 
              onClick={() => setMessages([{ role:'assistant', content:'Conversa reiniciada. Como posso ajudar?' }])}
              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              title="Reiniciar conversa"
            >
              <RefreshCw size={16} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-[#F8FAFC]">
            {messages.map((msg, i) => <Message key={i} msg={msg} />)}
            {loading && <TypingIndicator />}
            <div ref={bottomRef} />
          </div>

          {/* Input Area */}
          <div className="p-5 border-t border-slate-100 bg-white">
            
            {/* Chips */}
            {messages.length < 3 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {QUICK_PROMPTS.map((q, i) => (
                  <button key={i} onClick={() => send(q.prompt)} className="px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-blue-600 text-[0.7rem] font-semibold hover:bg-blue-50 transition-colors">
                    {q.label}
                  </button>
                ))}
              </div>
            )}

            <div className="flex items-end gap-3 bg-slate-50 border border-slate-200 rounded-xl p-2 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
                placeholder="Pergunte sobre finanças ou adicione um lançamento novo..."
                className="flex-1 resize-none bg-transparent outline-none text-[0.85rem] text-slate-700 py-1.5 px-2"
                style={{ maxHeight: 80, minHeight: 24 }}
                onInput={e => {
                  e.target.style.height = 'auto'
                  e.target.style.height = Math.min(e.target.scrollHeight, 80) + 'px'
                }}
              />
              <button 
                onClick={() => send()}
                disabled={!input.trim() || loading}
                className="w-9 h-9 flex items-center justify-center rounded-lg bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:hover:bg-blue-600 shrink-0 transition-colors"
              >
                <Send size={15} />
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar Info Panel */}
        <div className="flex flex-col gap-5">
          
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <h4 className="text-[0.7rem] font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-1.5">
              <PieChart size={14} className="text-slate-500" /> Resumo Rápido
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-[0.85rem] pb-3 border-b border-slate-100">
                <span className="text-slate-500">Entradas (mar)</span>
                <span className="font-bold text-emerald-600">{formatBRL(KPI_CURRENT.entradas)}</span>
              </div>
              <div className="flex justify-between items-center text-[0.85rem] pb-3 border-b border-slate-100">
                <span className="text-slate-500">Saídas (mar)</span>
                <span className="font-bold text-red-500">{formatBRL(KPI_CURRENT.saidas)}</span>
              </div>
              <div className="flex justify-between items-center text-[0.85rem] pb-3 border-b border-slate-100">
                <span className="text-slate-500">Saldo do mês</span>
                <span className="font-bold text-blue-600">{formatBRL(KPI_CURRENT.saldo)}</span>
              </div>
              <div className="flex justify-between items-center text-[0.85rem]">
                <span className="text-slate-500 truncate">Acumulado</span>
                <span className="font-bold text-slate-800">{formatBRL(KPI_CURRENT.acumulado)}</span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <h4 className="text-[0.7rem] font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-1.5">
              <MessageSquarePlus size={14} className="text-slate-500" /> Comandos Úteis
            </h4>
            <div className="space-y-2">
              {[
                { title:'Consulta de saldo', ex:'"Qual meu saldo do mês?"', icon: DollarSign, color:'text-blue-500', bg:'bg-blue-50' },
                { title:'Lançar saída', ex:'"Gastei R$350 em cabos"', icon: ArrowDownCircle, color:'text-red-500', bg:'bg-red-50' },
                { title:'Lançar entrada', ex:'"Recebi R$1500 pela OS 23"', icon: ArrowUpCircle, color:'text-emerald-500', bg:'bg-emerald-50' },
              ].map((cmd, i) => (
                <div key={i} className="p-3 border border-slate-100 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors" onClick={() => send(cmd.ex.replace(/"/g, ''))}>
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`p-1 rounded-md ${cmd.bg} ${cmd.color}`}><cmd.icon size={12} strokeWidth={3} /></div>
                    <span className="text-[0.75rem] font-bold text-slate-700">{cmd.title}</span>
                  </div>
                  <div className="text-[0.7rem] text-slate-500 ml-6 italic">{cmd.ex}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-700 to-blue-500 rounded-2xl p-5 text-white shadow-lg shadow-blue-600/20">
            <h4 className="font-bold text-[0.9rem] mb-2 flex items-center gap-1.5">
              <span>📱</span> Acesso via WhatsApp
            </h4>
            <p className="text-[0.75rem] text-blue-100 leading-relaxed mb-4">
              Com o plano Pro, você usa o mesmo agente financeiro diretamente pelo seu WhatsApp, onde estiver.
            </p>
            <button className="w-full py-2 bg-white text-blue-700 font-bold rounded-xl text-[0.75rem] shadow-sm hover:opacity-90 transition-opacity">
              Saber mais →
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}
