import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { Eye, Download, CheckCircle, XCircle, Search, RefreshCw, Mail, ChevronDown, Plus, Bot } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const API_BASE = import.meta.env.VITE_API_URL || ''

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatBRL(value) {
  return `R$ ${Number(value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
}

/** Garante que `v` seja sempre um array, mesmo se vier como JSON string do backend. */
function safeArr(v) {
  if (Array.isArray(v)) return v
  if (typeof v === 'string' && v) {
    try { return JSON.parse(v) } catch { return [] }
  }
  return []
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const s = status?.toLowerCase()
  let bg = 'bg-slate-100', text = 'text-slate-600', dot = 'bg-slate-400'

  if (s === 'aprovada') { bg = 'bg-emerald-50'; text = 'text-emerald-700'; dot = 'bg-emerald-500' }
  else if (s === 'pendente') { bg = 'bg-amber-50'; text = 'text-amber-700'; dot = 'bg-amber-500' }
  else if (s === 'rejeitada') { bg = 'bg-red-50'; text = 'text-red-700'; dot = 'bg-red-500' }
  else if (s === 'enviada' || s === 'sent') { bg = 'bg-blue-50'; text = 'text-blue-700'; dot = 'bg-blue-500' }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[0.68rem] font-bold capitalize ${bg} ${text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {s || 'rascunho'}
    </span>
  )
}

function ActionButton({ icon: Icon, label, onClick, color = 'slate' }) {
  const colors = {
    slate:   'hover:bg-slate-100 hover:text-slate-800 text-slate-500 border-slate-200',
    emerald: 'hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 text-emerald-600 border-emerald-200',
    red:     'hover:bg-red-50 hover:text-red-700 hover:border-red-300 text-red-600 border-red-200',
    blue:    'hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 text-blue-600 border-blue-200',
  }
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[0.7rem] font-semibold transition-colors ${colors[color]}`}
    >
      <Icon size={12} strokeWidth={2.5} />
      {label}
    </button>
  )
}

function downloadProposal(id, ext) {
  const path = ext === 'pdf'
    ? `/api/proposals/${id}/download-pdf`
    : `/api/proposals/${id}/download`
  const a = document.createElement('a')
  a.href = `${API_BASE}${path}`
  a.download = `proposta_${id}.${ext}`
  document.body.appendChild(a)
  a.click()
  a.remove()
}

// ── Nova Proposta — split button ──────────────────────────────────────────────

function NewProposalButton({ onManual }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  return (
    <div ref={ref} className="relative flex items-stretch">
      {/* primary action */}
      <button
        onClick={() => { window.location.hash = '#agente-comercial' }}
        className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 text-white text-[0.75rem] font-bold rounded-l-lg shadow-md shadow-blue-600/20 hover:bg-blue-700 transition-colors"
      >
        <Bot size={13} /> Via Agente IA
      </button>
      {/* dropdown trigger */}
      <button
        onClick={() => setOpen(o => !o)}
        className="px-2 py-1.5 bg-blue-700 text-white rounded-r-lg border-l border-blue-500/40 hover:bg-blue-800 transition-colors"
        aria-label="Mais opções"
      >
        <ChevronDown size={12} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-slate-200 rounded-xl shadow-xl z-20 overflow-hidden">
          <button
            onClick={() => { setOpen(false); window.location.hash = '#agente-comercial' }}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[0.8rem] text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
          >
            <Bot size={14} /> Gerar com IA
          </button>
          <button
            onClick={() => { setOpen(false); onManual() }}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[0.8rem] text-slate-700 hover:bg-slate-50 transition-colors border-t border-slate-100"
          >
            <Plus size={14} /> Formulário manual
          </button>
        </div>
      )}
    </div>
  )
}

// ── Formulário manual rápido ──────────────────────────────────────────────────

const SEGMENTS = [
  { value: '', label: 'Selecione o segmento' },
  { value: 'ac', label: '❄️ Ar-Condicionado' },
  { value: 'cftv', label: '📷 CFTV / Segurança' },
  { value: 'ti', label: '🖥️ TI / Redes' },
  { value: 'eletrica', label: '⚡ Elétrica' },
  { value: 'hidraulica', label: '🔧 Hidráulica' },
  { value: 'outro', label: '📋 Outro' },
]

const EMPTY_FORM = {
  client_name: '', client_email: '', client_phone: '',
  service: '', segment: '', value: '', notes: '', status: 'pendente',
}

function QuickProposalModal({ userId, onClose, onCreated }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.client_name.trim()) { setError('Nome do cliente obrigatório.'); return }
    if (!form.service.trim()) { setError('Descrição do serviço obrigatória.'); return }

    setSaving(true); setError('')
    try {
      const res = await fetch(`${API_BASE}/api/proposals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, user_id: userId, value: parseFloat(form.value) || 0 }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.detail || `Erro ${res.status}`)
      }
      const created = await res.json()
      onCreated(created)
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const iStyle = 'w-full px-3 py-2 text-[0.82rem] border border-slate-200 rounded-lg outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all'
  const lStyle = 'block text-[0.68rem] font-bold uppercase tracking-wider text-slate-400 mb-1'

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-800 text-base">Nova Proposta Manual</h3>
            <p className="text-[0.75rem] text-slate-400 mt-0.5">Preencha os dados principais; edite os itens depois.</p>
          </div>
          <button onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className={lStyle}>Cliente *</label>
              <input className={iStyle} placeholder="Nome do cliente ou empresa"
                value={form.client_name} onChange={set('client_name')} />
            </div>
            <div>
              <label className={lStyle}>E-mail</label>
              <input className={iStyle} type="email" placeholder="cliente@email.com"
                value={form.client_email} onChange={set('client_email')} />
            </div>
            <div>
              <label className={lStyle}>Telefone</label>
              <input className={iStyle} placeholder="(11) 99999-9999"
                value={form.client_phone} onChange={set('client_phone')} />
            </div>
            <div className="col-span-2">
              <label className={lStyle}>Descrição do serviço *</label>
              <input className={iStyle} placeholder="Ex: Instalação de 8 câmeras CFTV no galpão"
                value={form.service} onChange={set('service')} />
            </div>
            <div>
              <label className={lStyle}>Segmento</label>
              <select className={iStyle} value={form.segment} onChange={set('segment')}>
                {SEGMENTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label className={lStyle}>Valor total (R$)</label>
              <input className={iStyle} type="number" min="0" step="0.01" placeholder="0,00"
                value={form.value} onChange={set('value')} />
            </div>
            <div>
              <label className={lStyle}>Status inicial</label>
              <select className={iStyle} value={form.status} onChange={set('status')}>
                <option value="pendente">Pendente</option>
                <option value="enviada">Enviada</option>
                <option value="aprovada">Aprovada</option>
              </select>
            </div>
            <div>
              <label className={lStyle}>Observações</label>
              <input className={iStyle} placeholder="Condições especiais, prazo..."
                value={form.notes} onChange={set('notes')} />
            </div>
          </div>

          {error && (
            <p className="text-[0.8rem] text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}

          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-[0.8rem] font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={saving}
              className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-[0.82rem] font-bold rounded-lg shadow-md shadow-blue-600/20 transition-colors disabled:opacity-60">
              {saving ? <RefreshCw size={13} className="animate-spin" /> : <Plus size={13} />}
              {saving ? 'Salvando...' : 'Criar Proposta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function Propostas() {
  const { user } = useAuth()
  const userId = user?.id

  const [filter, setFilter] = useState('todas')
  const [search, setSearch] = useState('')
  const [propostas, setPropostas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedProp, setSelectedProp] = useState(null)
  const [toast, setToast] = useState(null)
  const [showManual, setShowManual] = useState(false)

  const fetchPropostas = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${API_BASE}/api/proposals?user_id=${userId}`)
      if (!res.ok) throw new Error(`Erro ${res.status}`)
      setPropostas(await res.json())
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => { fetchPropostas() }, [fetchPropostas])

  const filteredPropostas = useMemo(() => {
    return propostas.filter(p => {
      const matchFilter = filter === 'todas' || p.status === filter
      const matchSearch = !search ||
        p.client_name?.toLowerCase().includes(search.toLowerCase()) ||
        p.service?.toLowerCase().includes(search.toLowerCase())
      return matchFilter && matchSearch
    })
  }, [propostas, filter, search])

  const kpis = useMemo(() => {
    const total     = propostas.length
    const aprovadas = propostas.filter(p => p.status === 'aprovada').length
    const pendentes = propostas.filter(p => p.status === 'pendente' || p.status === 'draft').length
    const valor     = propostas.reduce((acc, p) => acc + (p.value || p.total_value || 0), 0)
    return { total, aprovadas, pendentes, valor }
  }, [propostas])

  function showToast(msg, type = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
  }

  /** Abre o modal normalizando campos que podem vir como JSON string do backend. */
  const openDetail = (p) => {
    setSelectedProp({ ...p, equipments: safeArr(p.equipments) })
  }

  const handleApprove = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/api/proposals/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'aprovada', user_id: userId }),
      })
      if (!res.ok) throw new Error(`Erro ${res.status}`)
      const data = await res.json()
      setPropostas(prev => prev.map(p => p.id === id ? { ...p, status: 'aprovada' } : p))
      if (selectedProp?.id === id) setSelectedProp(prev => prev ? { ...prev, status: 'aprovada' } : null)
      if (data.email_sent) {
        showToast('Proposta aprovada e e-mail enviado ao cliente!')
      } else {
        showToast('Proposta aprovada. E-mail não pôde ser enviado.', 'warn')
      }
    } catch (err) {
      showToast(`Erro ao aprovar: ${err.message}`, 'error')
    }
  }

  const handleReject = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/api/proposals/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'rejeitada', user_id: userId }),
      })
      if (!res.ok) throw new Error(`Erro ${res.status}`)
      setPropostas(prev => prev.map(p => p.id === id ? { ...p, status: 'rejeitada' } : p))
      if (selectedProp?.id === id) setSelectedProp(prev => prev ? { ...prev, status: 'rejeitada' } : null)
      showToast('Proposta marcada como rejeitada.', 'warn')
    } catch (err) {
      showToast(`Erro ao rejeitar: ${err.message}`, 'error')
    }
  }

  const handleCreated = (newProp) => {
    setPropostas(prev => [newProp, ...prev])
    showToast('Proposta criada com sucesso!')
  }

  return (
    <div className="p-7 space-y-5 animate-fade-up">

      {/* ── Toast ──────────────────────────────────────────────────────────── */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl text-[0.82rem] font-semibold animate-fade-up
          ${toast.type === 'error' ? 'bg-red-600 text-white' :
            toast.type === 'warn'  ? 'bg-amber-500 text-white' :
                                     'bg-emerald-600 text-white'}`}
        >
          {toast.type === 'success' && <Mail size={15} />}
          {toast.type === 'warn'    && <CheckCircle size={15} />}
          {toast.type === 'error'   && <XCircle size={15} />}
          {toast.msg}
        </div>
      )}

      {/* ── Formulário manual ─────────────────────────────────────────────── */}
      {showManual && (
        <QuickProposalModal
          userId={userId}
          onClose={() => setShowManual(false)}
          onCreated={handleCreated}
        />
      )}

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total do mês', value: kpis.total, color: 'text-blue-600' },
          { label: 'Aprovadas', value: kpis.aprovadas, color: 'text-emerald-600' },
          { label: 'Pendentes', value: kpis.pendentes, color: 'text-amber-500' },
          { label: 'Valor total', value: formatBRL(kpis.valor), color: 'text-emerald-600' },
        ].map(k => (
          <div key={k.label} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <div className="text-[0.68rem] font-bold uppercase tracking-wider text-slate-400 mb-2">{k.label}</div>
            <div className={`text-2xl font-black tracking-tight font-serif ${k.color}`}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Main Table Card */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-[0_4px_24px_rgba(0,0,0,0.02)] overflow-hidden">

        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-[1.05rem] font-bold text-slate-800 font-serif">Propostas Comerciais</h2>

          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input
                type="text"
                placeholder="Buscar cliente ou serviço..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 pr-4 py-1.5 text-[0.8rem] bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all w-64"
              />
            </div>

            {/* Filters */}
            <div className="flex bg-slate-100 p-1 rounded-lg">
              {['todas', 'aprovada', 'pendente', 'enviada', 'rejeitada'].map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1 text-[0.7rem] font-semibold rounded-md capitalize transition-all ${
                    filter === f ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            <button
              onClick={fetchPropostas}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-lg text-[0.75rem] font-medium text-slate-500 hover:border-blue-300 hover:text-blue-600 transition-colors"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            </button>

            <NewProposalButton onManual={() => setShowManual(true)} />
          </div>
        </div>

        {/* Table — 5 cols, padding compacto para caber em 820px (1050px viewport − 230px sidebar) */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse" style={{ minWidth: 580 }}>
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-4 py-3 text-[0.68rem] font-bold uppercase tracking-wider text-slate-400">Cliente</th>
                <th className="px-4 py-3 text-[0.68rem] font-bold uppercase tracking-wider text-slate-400">Serviço</th>
                <th className="px-4 py-3 text-[0.68rem] font-bold uppercase tracking-wider text-slate-400">Valor</th>
                <th className="px-4 py-3 text-[0.68rem] font-bold uppercase tracking-wider text-slate-400">Status</th>
                <th className="px-4 py-3 text-[0.68rem] font-bold uppercase tracking-wider text-slate-400">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center">
                    <div className="flex items-center justify-center gap-2 text-slate-400">
                      <RefreshCw size={18} className="animate-spin" />
                      <span className="text-[0.85rem]">Carregando propostas...</span>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center">
                    <div className="text-red-500 text-[0.85rem]">⚠️ {error}</div>
                    <button onClick={fetchPropostas} className="mt-2 text-blue-600 text-[0.8rem] underline">Tentar novamente</button>
                  </td>
                </tr>
              ) : filteredPropostas.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-slate-400">
                    <div className="text-4xl mb-3">📭</div>
                    <p className="text-[0.85rem]">Nenhuma proposta encontrada.</p>
                  </td>
                </tr>
              ) : (
                filteredPropostas.map(p => {
                  const s = p.status
                  const iconMap = { ac:'❄️', cftv:'📷', ti:'🖥️', eletrica:'⚡', hidraulica:'🔧' }
                  const valor = p.value || p.total_value || 0
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group">
                      {/* Cliente + data (fusão) */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-base shrink-0">
                            {iconMap[p.segment?.toLowerCase()] || '📄'}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-slate-800 text-[0.82rem] truncate max-w-[160px]">{p.client_name}</div>
                            <div className="text-slate-400 text-[0.68rem]">
                              {p.client_email
                                ? <span className="truncate max-w-[140px] block">{p.client_email}</span>
                                : new Date(p.created_at).toLocaleDateString('pt-BR')}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[0.78rem] text-slate-600 max-w-[180px]">
                        <span className="line-clamp-2 leading-snug">{p.service}</span>
                      </td>
                      <td className="px-4 py-3 text-[0.83rem] font-bold text-slate-800 whitespace-nowrap">
                        {formatBRL(valor)}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={s} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                          <ActionButton icon={Eye} label="Ver" onClick={() => openDetail(p)} />

                          {/* Download — ícone apenas */}
                          <button
                            onClick={() => downloadProposal(p.id, 'docx')}
                            title="Baixar .docx"
                            className="p-1.5 rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-50 transition-colors"
                          >
                            <Download size={13} strokeWidth={2.5} />
                          </button>

                          {(s === 'pendente' || s === 'draft' || s === 'enviada') && (
                            <ActionButton icon={CheckCircle} label="OK" onClick={() => handleApprove(p.id)} color="emerald" />
                          )}
                          {(s !== 'aprovada' && s !== 'rejeitada') && (
                            <ActionButton icon={XCircle} label="Negar" onClick={() => handleReject(p.id)} color="red" />
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Visualização */}
      {selectedProp && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-fade-up">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">📄 Proposta Comercial</h3>
                <p className="text-[0.8rem] text-slate-500 mt-0.5">{selectedProp.service}</p>
              </div>
              <button
                onClick={() => setSelectedProp(null)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-6 grid grid-cols-2 gap-6 bg-slate-50/50">
              <div>
                <div className="text-[0.65rem] font-bold uppercase tracking-wider text-slate-400 mb-1">Cliente</div>
                <div className="font-medium text-slate-800 text-[0.85rem]">{selectedProp.client_name}</div>
              </div>
              <div>
                <div className="text-[0.65rem] font-bold uppercase tracking-wider text-slate-400 mb-1">E-mail</div>
                <div className="font-medium text-slate-800 text-[0.85rem]">{selectedProp.client_email || '—'}</div>
              </div>
              <div>
                <div className="text-[0.65rem] font-bold uppercase tracking-wider text-slate-400 mb-1">Status</div>
                <StatusBadge status={selectedProp.status} />
              </div>
              <div>
                <div className="text-[0.65rem] font-bold uppercase tracking-wider text-slate-400 mb-1">Total</div>
                <div className="font-serif font-black text-emerald-600 text-xl">
                  {formatBRL(selectedProp.value || selectedProp.total_value || 0)}
                </div>
              </div>

              <div className="col-span-2 mt-2">
                <div className="text-[0.65rem] font-bold uppercase tracking-wider text-slate-400 mb-2">Itens Inclusos</div>
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-[0.8rem]">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-2 font-medium text-slate-500">Descrição</th>
                        <th className="px-4 py-2 font-medium text-slate-500">Qtd</th>
                        <th className="px-4 py-2 font-medium text-slate-500">Unit.</th>
                        <th className="px-4 py-2 font-medium text-slate-500">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {safeArr(selectedProp.equipments).length > 0
                        ? safeArr(selectedProp.equipments).map((eq, i) => (
                          <tr key={i}>
                            <td className="px-4 py-2.5 text-slate-700">{eq.description}</td>
                            <td className="px-4 py-2.5 text-slate-600 font-medium">{eq.quantity}</td>
                            <td className="px-4 py-2.5 text-slate-600">{formatBRL(eq.unit_price)}</td>
                            <td className="px-4 py-2.5 text-slate-800 font-medium">{formatBRL(eq.quantity * eq.unit_price)}</td>
                          </tr>
                        ))
                        : (
                          <tr><td colSpan={4} className="px-4 py-3 text-center text-slate-400">Nenhum item listado.</td></tr>
                        )
                      }
                    </tbody>
                  </table>
                </div>
              </div>

              {selectedProp.notes && (
                <div className="col-span-2">
                  <div className="text-[0.65rem] font-bold uppercase tracking-wider text-slate-400 mb-1">Observações</div>
                  <p className="text-[0.82rem] text-slate-600">{selectedProp.notes}</p>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-slate-100 flex items-center justify-end gap-3 bg-white">
              <button
                className="px-4 py-2 text-[0.8rem] font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                onClick={() => setSelectedProp(null)}
              >
                Fechar
              </button>
              <button
                onClick={() => downloadProposal(selectedProp.id, 'docx')}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-lg text-[0.8rem] font-bold transition-colors"
              >
                <Download size={14} /> Baixar .docx
              </button>
              <button
                onClick={() => downloadProposal(selectedProp.id, 'pdf')}
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200 rounded-lg text-[0.8rem] font-bold transition-colors"
              >
                <Download size={14} /> Baixar PDF
              </button>
              {(selectedProp.status === 'pendente' || selectedProp.status === 'draft' || selectedProp.status === 'enviada') && (
                <button
                  onClick={async () => { await handleApprove(selectedProp.id); setSelectedProp(null) }}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[0.8rem] font-bold shadow-md shadow-emerald-600/20 transition-colors"
                >
                  <CheckCircle size={14} /> Aprovar + Enviar E-mail
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
