import { useState, useRef, useCallback, useEffect } from 'react'
import {
  Send, Bot, User, Camera, X, FileText, CheckCircle,
  Loader2, RefreshCw, ImagePlus,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useAgentHistory, saveAgentMessage, clearAgentHistory } from '../hooks/useAgentHistory'

const API_BASE = import.meta.env.VITE_API_URL || ''
const AGENT    = 'comercial'

const WELCOME_MSG = {
  role: 'assistant',
  content:
    'Olá! 👋 Sou seu **Agente Comercial.**\n\n' +
    'Envie fotos do local, do equipamento ou da situação — vou analisar e montar uma proposta completa para você.\n\n' +
    'Você também pode descrever o serviço diretamente.',
  time: '',
}

// ── Utilitários ──────────────────────────────────────────────

function formatMessage(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br/>')
}

async function compressImage(file) {
  return new Promise((resolve) => {
    const img = new Image()
    const previewUrl = URL.createObjectURL(file)
    img.onload = () => {
      const MAX = 1024
      let { width: w, height: h } = img
      if (w > MAX || h > MAX) {
        if (w > h) { h = Math.round((h * MAX) / w); w = MAX }
        else       { w = Math.round((w * MAX) / h); h = MAX }
      }
      const c = document.createElement('canvas')
      c.width = w; c.height = h
      c.getContext('2d').drawImage(img, 0, 0, w, h)
      resolve({ base64: c.toDataURL('image/jpeg', 0.82), previewUrl })
    }
    img.onerror = () => resolve(null)
    img.src = previewUrl
  })
}

// ── Componentes ──────────────────────────────────────────────

function Message({ msg }) {
  const isBot = msg.role === 'assistant'
  return (
    <div className={`flex gap-3 ${isBot ? 'justify-start' : 'justify-end'} animate-fade-up`}>
      {isBot && (
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
          style={{ background: 'linear-gradient(135deg,#1D4ED8,#3B82F6)', boxShadow: '0 4px 12px rgba(37,99,235,0.3)' }}
        >
          <Bot size={14} className="text-white" />
        </div>
      )}

      <div className={`group max-w-[82%] ${isBot ? '' : 'flex flex-col items-end'}`}>
        {msg.imageUrls?.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2 justify-end">
            {msg.imageUrls.map((url, i) => (
              <img key={i} src={url} alt="" className="h-20 w-20 object-cover rounded-xl border border-slate-200" />
            ))}
          </div>
        )}
        <div
          className="rounded-2xl px-4 py-3 text-[0.83rem] leading-relaxed"
          style={
            isBot
              ? { background: 'white', border: '1px solid rgba(226,232,240,0.8)', color: '#1E293B' }
              : { background: 'linear-gradient(135deg,#1D4ED8,#2563EB)', color: '#fff', boxShadow: '0 4px 16px rgba(37,99,235,0.25)' }
          }
        >
          {isBot
            ? <div dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }} />
            : <p>{msg.content}</p>}
        </div>
        {msg.time && <div className="text-[0.65rem] text-slate-400 mt-1 px-1">{msg.time}</div>}
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
      <div
        className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: 'linear-gradient(135deg,#1D4ED8,#3B82F6)' }}
      >
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

function ProposalCard({ data, onConfirm, onReject, loading }) {
  const total = (data.equipments || []).reduce((s, e) => s + e.quantity * e.unit_price, 0)
  return (
    <div className="mx-1 rounded-2xl p-5 animate-fade-up" style={{ border: '2px solid #3B82F6', background: '#EFF6FF' }}>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center shrink-0">
          <FileText size={14} className="text-white" />
        </div>
        <div>
          <p className="text-[0.85rem] font-bold text-slate-800">Proposta pronta para gerar</p>
          <p className="text-[0.7rem] text-slate-500">Revise os dados e confirme</p>
        </div>
      </div>

      <div className="space-y-1.5 mb-4">
        {[
          ['Cliente',  data.client_name],
          ['E-mail',   data.client_email],
          ['Serviço',  data.service],
        ].map(([k, v]) => (
          <div key={k} className="flex justify-between text-[0.8rem]">
            <span className="text-slate-500">{k}</span>
            <span className="font-semibold text-slate-800 text-right max-w-[230px]">{v}</span>
          </div>
        ))}
      </div>

      <div className="rounded-xl overflow-hidden border border-blue-200 mb-4">
        <div className="grid grid-cols-4 bg-blue-700 text-white text-[0.68rem] font-bold px-3 py-1.5">
          <span className="col-span-2">Item</span>
          <span className="text-center">Qtd</span>
          <span className="text-right">Subtotal</span>
        </div>
        {(data.equipments || []).map((eq, i) => (
          <div key={i} className={`grid grid-cols-4 px-3 py-1.5 text-[0.75rem] ${i % 2 === 1 ? 'bg-slate-50' : 'bg-white'}`}>
            <span className="col-span-2 text-slate-700">{eq.description}</span>
            <span className="text-center text-slate-500">{eq.quantity}×</span>
            <span className="text-right font-semibold text-slate-800">
              R$ {(eq.quantity * eq.unit_price).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
            </span>
          </div>
        ))}
        <div className="grid grid-cols-4 px-3 py-2 bg-blue-800 text-white text-[0.78rem]">
          <span className="col-span-3 font-bold text-right pr-3">TOTAL</span>
          <span className="text-right font-black">R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</span>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={onConfirm}
          disabled={loading}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[0.82rem] font-bold text-white transition-all disabled:opacity-60"
          style={{ background: 'linear-gradient(135deg,#1D4ED8,#3B82F6)', boxShadow: '0 4px 12px rgba(37,99,235,0.35)' }}
        >
          {loading
            ? <Loader2 size={14} className="animate-spin" />
            : <><CheckCircle size={14} /> Confirmar e Gerar PDF</>}
        </button>
        <button
          onClick={onReject}
          disabled={loading}
          className="px-4 py-2.5 rounded-xl text-[0.82rem] font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-colors disabled:opacity-50"
        >
          Ajustar
        </button>
      </div>
    </div>
  )
}

function SuccessView({ success, onReset }) {
  return (
    <div className="flex items-center justify-center min-h-[60vh] p-8">
      <div className="max-w-md w-full text-center">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
          style={{ background: 'rgba(16,185,129,0.1)' }}
        >
          <CheckCircle size={32} className="text-emerald-500" />
        </div>
        <h2 className="text-[1.2rem] font-black text-slate-800 mb-2">Proposta gerada!</h2>
        <p className="text-[0.83rem] text-slate-500 mb-6">{success.message}</p>

        <div
          className="rounded-2xl p-4 mb-6 text-left space-y-2"
          style={{ background: 'rgba(37,99,235,0.05)', border: '1px solid rgba(37,99,235,0.12)' }}
        >
          <div className="flex justify-between text-[0.8rem]">
            <span className="text-slate-500">Valor total</span>
            <span className="font-bold text-slate-800">
              R$ {Number(success.total_value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex justify-between text-[0.8rem]">
            <span className="text-slate-500">E-mail enviado</span>
            <span className={`font-semibold ${success.email_sent ? 'text-emerald-600' : 'text-orange-500'}`}>
              {success.email_sent ? 'Sim' : 'Não'}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {success.pdf_url && (
            <a
              href={`${API_BASE}${success.pdf_url}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-[0.85rem] font-bold text-white justify-center"
              style={{ background: 'linear-gradient(135deg,#1D4ED8,#3B82F6)', boxShadow: '0 4px 16px rgba(37,99,235,0.35)' }}
            >
              <FileText size={15} /> Baixar PDF da proposta
            </a>
          )}
          {success.docx_url && (
            <a
              href={`${API_BASE}${success.docx_url}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-[0.85rem] font-bold text-slate-700 bg-white border border-slate-200 justify-center hover:bg-slate-50 transition-colors"
            >
              <FileText size={15} /> Baixar versão .docx
            </a>
          )}
        </div>
        <button onClick={onReset} className="mt-5 text-[0.8rem] text-slate-400 hover:text-slate-600 transition-colors">
          Nova proposta
        </button>
      </div>
    </div>
  )
}

// ── Componente principal ─────────────────────────────────────

export default function AgenteComercial() {
  const { user } = useAuth()
  const [messages,      setMessages]      = useState([WELCOME_MSG])
  const [history,       setHistory]       = useState([])
  const [pendingImages, setPendingImages] = useState([])
  const [input,         setInput]         = useState('')
  const [loading,       setLoading]       = useState(false)
  const [generating,    setGenerating]    = useState(false)
  const [proposalData,  setProposalData]  = useState(null)
  const [success,       setSuccess]       = useState(null)
  const bottomRef    = useRef(null)
  const inputRef     = useRef(null)
  const fileInputRef = useRef(null)

  // Carrega histórico e reconstrói o history text-only para a API
  useAgentHistory(AGENT, user?.id, setMessages, (rawData) => {
    setHistory(rawData.map(m => ({ role: m.role, content: m.content })))
  })

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading, proposalData])

  const addImages = useCallback(async (files) => {
    const processed = await Promise.all(
      Array.from(files)
        .filter(f => f.type.startsWith('image/'))
        .slice(0, 5)
        .map(compressImage)
    )
    setPendingImages(prev => [...prev, ...processed.filter(Boolean)].slice(0, 5))
  }, [])

  function handleFileInput(e) {
    if (e.target.files?.length) addImages(e.target.files)
    e.target.value = ''
  }

  function handleDrop(e) {
    e.preventDefault()
    if (e.dataTransfer.files?.length) addImages(e.dataTransfer.files)
  }

  async function send() {
    const text = input.trim()
    if ((!text && pendingImages.length === 0) || loading) return

    const imageBase64s = pendingImages.map(i => i.base64)
    const imageUrls    = pendingImages.map(i => i.previewUrl)
    const msgText      = text || '(imagens enviadas)'

    setInput('')
    setPendingImages([])

    setMessages(prev => [...prev, {
      role: 'user',
      content:   msgText,
      imageUrls: imageUrls.length ? imageUrls : undefined,
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    }])
    saveAgentMessage(AGENT, user?.id, 'user', msgText)

    const currentHistory = history
    setLoading(true)

    try {
      const res = await fetch(`${API_BASE}/api/proposals/chat`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id:         user?.id,
          messages:        currentHistory,
          current_message: text || 'Analise as imagens enviadas.',
          images:          imageBase64s,
        }),
      })
      if (!res.ok) throw new Error(`Erro ${res.status}`)
      const data = await res.json()

      setMessages(prev => [...prev, {
        role:    'assistant',
        content: data.reply,
        time:    new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      }])
      saveAgentMessage(AGENT, user?.id, 'assistant', data.reply)

      setHistory([
        ...currentHistory,
        { role: 'user',      content: text || 'Analise as imagens enviadas.' },
        { role: 'assistant', content: data.reply },
      ])

      if (data.ready && data.proposal_data) {
        setProposalData(data.proposal_data)
      }
    } catch (err) {
      setMessages(prev => [...prev, {
        role:    'assistant',
        content: `⚠️ Erro ao conectar com o agente: ${err.message}`,
        time:    new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      }])
    } finally {
      setLoading(false)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }

  async function confirmProposal() {
    if (!proposalData) return
    setGenerating(true)
    try {
      const res = await fetch(`${API_BASE}/api/proposals/generate`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id:      user?.id,
          client_name:  proposalData.client_name,
          client_email: proposalData.client_email,
          service:      proposalData.service,
          segment:      proposalData.segment || 'ac',
          equipments:   proposalData.equipments || [],
          notes:        proposalData.notes || '',
        }),
      })
      if (!res.ok) throw new Error(`Erro ${res.status}`)
      const data = await res.json()
      setSuccess(data)
      setProposalData(null)
    } catch (err) {
      alert(`Erro ao gerar proposta: ${err.message}`)
    } finally {
      setGenerating(false)
    }
  }

  function reset() {
    clearAgentHistory(AGENT, user?.id, () => {
      setMessages([WELCOME_MSG])
      setHistory([])
      setPendingImages([])
      setInput('')
      setProposalData(null)
      setSuccess(null)
    })
  }

  if (success) return <SuccessView success={success} onReset={reset} />

  return (
    <div className="p-7 h-[calc(100vh-60px)] animate-fade-up">
      <div className="h-full max-h-[860px] bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col overflow-hidden">

        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md"
              style={{ background: 'linear-gradient(135deg,#1D4ED8,#06B6D4)', boxShadow: '0 4px 12px rgba(37,99,235,0.25)' }}
            >
              <Bot size={18} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-[0.9rem]">Agente Comercial</h3>
              <div className="flex items-center gap-1.5 text-[0.7rem] font-semibold text-emerald-600 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Análise de imagens com IA
              </div>
            </div>
          </div>
          <button
            onClick={reset}
            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            title="Nova proposta"
          >
            <RefreshCw size={16} />
          </button>
        </div>

        {/* Mensagens */}
        <div
          className="flex-1 overflow-y-auto p-6 space-y-5 bg-[#F8FAFC]"
          onDragOver={e => e.preventDefault()}
          onDrop={handleDrop}
        >
          {messages.map((msg, i) => <Message key={i} msg={msg} />)}
          {loading && <TypingIndicator />}
          {proposalData && !loading && (
            <ProposalCard
              data={proposalData}
              onConfirm={confirmProposal}
              onReject={() => setProposalData(null)}
              loading={generating}
            />
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="p-5 border-t border-slate-100 bg-white">
          {/* Miniaturas das imagens pendentes */}
          {pendingImages.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {pendingImages.map((img, i) => (
                <div key={i} className="relative">
                  <img src={img.previewUrl} alt="" className="h-16 w-16 object-cover rounded-xl border border-slate-200" />
                  <button
                    onClick={() => setPendingImages(p => p.filter((_, idx) => idx !== i))}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center text-white shadow"
                  >
                    <X size={10} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-end gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileInput}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-10 h-10 flex items-center justify-center rounded-xl border border-slate-200 text-slate-400 hover:text-blue-500 hover:border-blue-300 hover:bg-blue-50 transition-all shrink-0"
              title="Anexar imagens"
            >
              <Camera size={17} />
            </button>

            <div className="flex-1 flex items-end gap-2 bg-slate-50 border border-slate-200 rounded-xl p-2 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
                placeholder={
                  pendingImages.length
                    ? 'Descreva o contexto das imagens (ou só envie)...'
                    : 'Descreva o serviço, envie fotos ou faça uma pergunta...'
                }
                className="flex-1 resize-none bg-transparent outline-none text-[0.85rem] text-slate-700 py-1.5 px-2"
                style={{ maxHeight: 80, minHeight: 24 }}
                onInput={e => {
                  e.target.style.height = 'auto'
                  e.target.style.height = Math.min(e.target.scrollHeight, 80) + 'px'
                }}
              />
              <button
                onClick={send}
                disabled={(!input.trim() && pendingImages.length === 0) || loading}
                className="w-9 h-9 flex items-center justify-center rounded-lg bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 shrink-0 transition-colors"
              >
                <Send size={15} />
              </button>
            </div>
          </div>

          <p className="text-[0.68rem] text-slate-400 mt-2 text-center">
            Arraste imagens aqui · <span className="cursor-pointer hover:text-blue-500" onClick={() => fileInputRef.current?.click()}>Câmera <ImagePlus size={10} className="inline" /></span> · Enter para enviar
          </p>
        </div>
      </div>
    </div>
  )
}
