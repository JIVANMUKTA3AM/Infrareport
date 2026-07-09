import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from '../context/AuthContext'
import { useCategories } from '../hooks/useCategories'
import {
  Plus, X, Loader2, Trash2, Edit2, Search,
  TrendingUp, ChevronLeft, ChevronRight, CheckCircle2, ExternalLink,
} from 'lucide-react'

const API = ''

const MONTHS_PT    = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
const MONTHS_SHORT = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

const PAYMENT_METHODS = {
  pix:          'PIX',
  dinheiro:     'Dinheiro',
  cartao:       'Cartão',
  boleto:       'Boleto',
  transferencia:'Transferência',
  cheque:       'Cheque',
}

const PAY_ICONS = {
  pix: '⚡', dinheiro: '💵', cartao: '💳', boleto: '📄', transferencia: '🏦', cheque: '📝',
}

const catStyle = (color = '#64748B') => ({ background: color + '26', color })

const fmtBRL  = (v) => `R$ ${Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const fmtDate = (iso) => { if (!iso) return ''; const [y,m,d] = iso.split('T')[0].split('-'); return `${d}/${m}/${y}` }

// ── EntryModal ────────────────────────────────────────────────────────────────
function EntryModal({ initial, userId, categories, onClose, onSaved, onDeleted }) {
  const isEdit = !!initial?.id
  const today  = new Date().toISOString().split('T')[0]

  const [form, setForm] = useState({
    value: '',
    date: today,
    category: 'receita',
    payment_method: 'pix',
    description: '',
    client_name: '',
    project_id: null,
    attachment_url: '',
    ...initial,
    value: initial?.value != null ? String(initial.value) : '',
  })
  const [saving,   setSaving]   = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [projects, setProjects] = useState([])
  const [error,    setError]    = useState('')

  useEffect(() => {
    fetch(`${API}/api/projects?user_id=${userId}&status=em_andamento`)
      .then(r => r.ok ? r.json() : [])
      .then(d => Array.isArray(d) ? setProjects(d) : {})
      .catch(() => {})
  }, [userId])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    setError('')
    const val = parseFloat(form.value)
    if (!val || val <= 0) { setError('Valor inválido'); return }
    if (!form.date)       { setError('Data obrigatória'); return }

    setSaving(true)
    try {
      // Build description: prepend client name if filled
      const desc = form.client_name
        ? `${form.client_name}${form.description ? ' — ' + form.description : ''}`
        : form.description

      const payload = {
        user_id:        userId,
        type:           'entrada',
        value:          val,
        category:       form.category,
        payment_method: form.payment_method,
        description:    desc,
        date:           form.date,
        project_id:     form.project_id || null,
        attachment_url: form.attachment_url || null,
      }

      const url    = isEdit ? `${API}/api/financial/entries/${form.id}` : `${API}/api/financial/entries`
      const method = isEdit ? 'PATCH' : 'POST'
      const r = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!r.ok) { let msg = 'Erro ao salvar'; try { const e = await r.json(); msg = e.detail || msg } catch {} throw new Error(msg) }
      const saved = await r.json()
      onSaved(saved, isEdit)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('Excluir este lançamento?')) return
    setDeleting(true)
    try {
      await fetch(`${API}/api/financial/entries/${form.id}?user_id=${userId}`, { method: 'DELETE' })
      onDeleted(form.id)
    } finally { setDeleting(false) }
  }

  const inp = 'w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(15,23,42,.6)', backdropFilter: 'blur(4px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col"
        style={{ maxHeight: '92vh', border: '1px solid #E2E8F0' }}>

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center">
              <TrendingUp size={15} className="text-emerald-600" />
            </div>
            <h2 className="text-lg font-bold text-slate-800">{isEdit ? 'Editar Entrada' : 'Nova Entrada'}</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition"><X size={18}/></button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {error && (
            <div className="px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">{error}</div>
          )}

          {/* Valor */}
          <div>
            <label className="block text-[11px] text-slate-400 uppercase tracking-wide mb-1">Valor *</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-semibold">R$</span>
              <input
                type="number" step="0.01" min="0"
                value={form.value} onChange={e => set('value', e.target.value)}
                className={inp + ' pl-9'}
                placeholder="0,00"
              />
            </div>
          </div>

          {/* Data + Categoria */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-slate-400 uppercase tracking-wide mb-1">Data *</label>
              <input type="date" value={form.date} onChange={e => set('date', e.target.value)} className={inp} />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 uppercase tracking-wide mb-1">Categoria</label>
              <select value={form.category} onChange={e => set('category', e.target.value)} className={inp}>
                {categories.filter(c => c.is_active).map(c => (
                  <option key={c.slug} value={c.slug}>{c.icon} {c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Forma de Recebimento */}
          <div>
            <label className="block text-[11px] text-slate-400 uppercase tracking-wide mb-2">Forma de Recebimento</label>
            <div className="flex flex-wrap gap-2">
              {Object.entries(PAYMENT_METHODS).map(([v, l]) => (
                <button key={v} onClick={() => set('payment_method', v)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                    form.payment_method === v
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-400'
                  }`}>
                  {PAY_ICONS[v]} {l}
                </button>
              ))}
            </div>
          </div>

          {/* Cliente + Projeto */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-slate-400 uppercase tracking-wide mb-1">Cliente</label>
              <input value={form.client_name || ''} onChange={e => set('client_name', e.target.value)} className={inp} placeholder="Nome do cliente" />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 uppercase tracking-wide mb-1">Vincular OS</label>
              <select value={form.project_id || ''} onChange={e => {
                set('project_id', e.target.value || null)
                const p = projects.find(x => x.id === e.target.value)
                if (p && !form.client_name) set('client_name', p.client)
              }} className={inp}>
                <option value="">Nenhum</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-[11px] text-slate-400 uppercase tracking-wide mb-1">Descrição</label>
            <textarea value={form.description || ''} onChange={e => set('description', e.target.value)}
              rows={2} className={inp + ' resize-none'} placeholder="Detalhes do recebimento..." />
          </div>

          {/* URL do Comprovante */}
          <div>
            <label className="block text-[11px] text-slate-400 uppercase tracking-wide mb-1">URL do Comprovante (opcional)</label>
            <input value={form.attachment_url || ''} onChange={e => set('attachment_url', e.target.value)}
              className={inp} placeholder="https://drive.google.com/..." />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-5 border-t border-slate-100">
          <div>
            {isEdit && (
              <button onClick={handleDelete} disabled={deleting}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition">
                {deleting ? <Loader2 size={13} className="animate-spin"/> : <Trash2 size={13}/>}
                Excluir
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition">Cancelar</button>
            <button onClick={handleSave} disabled={saving || !form.value || !form.date}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition disabled:opacity-50">
              {saving && <Loader2 size={13} className="animate-spin"/>}
              {isEdit ? 'Salvar' : 'Registrar Entrada'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── KPI Card ─────────────────────────────────────────────────────────────────
function KPI({ label, value, sub, color = '#10B981' }) {
  return (
    <div className="card p-4 flex flex-col gap-1">
      <p className="text-[0.7rem] text-slate-400 font-medium">{label}</p>
      <p className="text-xl font-bold" style={{ color }}>{value}</p>
      {sub && <p className="text-[0.7rem] text-slate-400">{sub}</p>}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Entradas() {
  const { user }  = useAuth()
  const userId    = user?.id

  const { categories } = useCategories(userId, 'entrada')
  const catMap = useMemo(() => Object.fromEntries(categories.map(c => [c.slug, c])), [categories])

  const now   = new Date()
  const [month,   setMonth]   = useState(now.getMonth() + 1)
  const [year,    setYear]    = useState(now.getFullYear())
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal,   setModal]   = useState(false)
  const [editEntry, setEditEntry] = useState(null)
  const [search,    setSearch]    = useState('')
  const [filterCat, setFilterCat] = useState('')

  const fetchEntries = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    try {
      const p = new URLSearchParams({ user_id: userId, type: 'entrada', month, year })
      const r = await fetch(`${API}/api/financial/entries?${p}`)
      setEntries(r.ok ? await r.json() : [])
    } catch { setEntries([]) }
    finally { setLoading(false) }
  }, [userId, month, year])

  useEffect(() => { fetchEntries() }, [fetchEntries])

  // Filtered list
  const filtered = useMemo(() => {
    let list = entries
    if (filterCat) list = list.filter(e => e.category === filterCat)
    if (search.trim()) {
      const s = search.toLowerCase()
      list = list.filter(e => (e.description || '').toLowerCase().includes(s))
    }
    return list
  }, [entries, filterCat, search])

  // Totals
  const total    = useMemo(() => filtered.reduce((s, e) => s + Number(e.value), 0), [filtered])
  const count    = filtered.length
  const avg      = count > 0 ? total / count : 0
  const biggest  = count > 0 ? Math.max(...filtered.map(e => Number(e.value))) : 0

  const openCreate = () => { setEditEntry(null); setModal(true) }
  const openEdit   = (e)  => { setEditEntry(e);   setModal(true) }

  const handleSaved = (saved, isEdit) => {
    setEntries(prev => isEdit ? prev.map(e => e.id === saved.id ? saved : e) : [saved, ...prev])
    setModal(false)
  }
  const handleDeleted = (id) => { setEntries(prev => prev.filter(e => e.id !== id)); setModal(false) }

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(y => y - 1) } else setMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear(y => y + 1) } else setMonth(m => m + 1)
  }

  return (
    <div className="p-7 space-y-5 animate-fade-up">

      {/* Page header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-[1.1rem] font-bold text-slate-800">Entradas</h2>
          <p className="text-[0.78rem] text-slate-400 mt-0.5">Receitas e recebimentos registrados</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white shadow-md hover:shadow-lg transition"
          style={{ background: 'linear-gradient(135deg,#059669,#10B981)' }}>
          <Plus size={15}/> Nova Entrada
        </button>
      </div>

      {/* Month nav */}
      <div className="flex items-center gap-2">
        <button onClick={prevMonth} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 transition"><ChevronLeft size={16}/></button>
        <span className="text-sm font-bold text-slate-700 min-w-[140px] text-center">
          {MONTHS_PT[month - 1]} {year}
        </span>
        <button onClick={nextMonth} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 transition"><ChevronRight size={16}/></button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPI label="Total do Mês"   value={fmtBRL(total)}   sub={`${count} lançamentos`} color="#059669" />
        <KPI label="Maior Entrada"  value={fmtBRL(biggest)} sub="no período"              color="#2563EB" />
        <KPI label="Média"          value={fmtBRL(avg)}     sub="por lançamento"          color="#7C3AED" />
        <KPI label="Lançamentos"    value={count}           sub={`${MONTHS_SHORT[month-1]}/${year}`} color="#0F172A" />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-1 min-w-[200px] px-3 py-2 rounded-xl border border-slate-200 bg-white focus-within:ring-2 focus-within:ring-emerald-400 transition">
          <Search size={14} className="text-slate-400 shrink-0"/>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por descrição..."
            className="flex-1 text-sm outline-none text-slate-700 bg-transparent" />
        </div>
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
          className="px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-600 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400">
          <option value="">Todas as categorias</option>
          {categories.map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={22} className="animate-spin text-emerald-400"/>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center">
              <TrendingUp size={24} className="text-emerald-300"/>
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-slate-600">Nenhuma entrada em {MONTHS_PT[month-1]}</p>
              <p className="text-[0.78rem] text-slate-400 mt-1">Registre seu primeiro recebimento do mês</p>
            </div>
            <button onClick={openCreate}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white"
              style={{ background: 'linear-gradient(135deg,#059669,#10B981)' }}>
              <Plus size={14}/> Nova Entrada
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100">
                    <th className="px-5 py-3 text-left text-[0.7rem] font-bold text-slate-400 uppercase tracking-wide">Data</th>
                    <th className="px-5 py-3 text-left text-[0.7rem] font-bold text-slate-400 uppercase tracking-wide">Descrição</th>
                    <th className="px-5 py-3 text-left text-[0.7rem] font-bold text-slate-400 uppercase tracking-wide hidden md:table-cell">Categoria</th>
                    <th className="px-5 py-3 text-left text-[0.7rem] font-bold text-slate-400 uppercase tracking-wide hidden lg:table-cell">Pagamento</th>
                    <th className="px-5 py-3 text-right text-[0.7rem] font-bold text-slate-400 uppercase tracking-wide">Valor</th>
                    <th className="px-5 py-3 text-center text-[0.7rem] font-bold text-slate-400 uppercase tracking-wide">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.map(e => {
                    const cat      = catMap[e.category]
                    const catLabel = cat?.name  || e.category || 'Outro'
                    const catColor = cat?.color || '#64748B'
                    const pay = e.payment_method || 'pix'
                    return (
                      <tr key={e.id} className="hover:bg-slate-50/50 transition">
                        <td className="px-5 py-3.5 text-sm text-slate-600 whitespace-nowrap font-medium">{fmtDate(e.date)}</td>
                        <td className="px-5 py-3.5 max-w-[240px]">
                          <p className="text-sm text-slate-800 font-medium truncate">{e.description || '—'}</p>
                          {e.attachment_url && (
                            <a href={e.attachment_url} target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-1 text-[10px] text-blue-500 hover:underline mt-0.5">
                              <ExternalLink size={9}/> Comprovante
                            </a>
                          )}
                        </td>
                        <td className="px-5 py-3.5 hidden md:table-cell">
                          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                            style={catStyle(catColor)}>{catLabel}</span>
                        </td>
                        <td className="px-5 py-3.5 hidden lg:table-cell text-sm text-slate-600">
                          {PAY_ICONS[pay]} {PAYMENT_METHODS[pay] || pay}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <span className="text-base font-bold text-emerald-600">{fmtBRL(e.value)}</span>
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <button onClick={() => openEdit(e)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition">
                            <Edit2 size={13}/>
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Footer total */}
            <div className="flex items-center justify-between px-5 py-3 bg-emerald-50/60 border-t border-emerald-100">
              <span className="text-sm text-slate-600 font-medium">{count} lançamento{count !== 1 ? 's' : ''}</span>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 size={15} className="text-emerald-500"/>
                <span className="text-sm font-bold text-emerald-700">Total: {fmtBRL(total)}</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <EntryModal
          initial={editEntry}
          userId={userId}
          categories={categories}
          onClose={() => { setModal(false); setEditEntry(null) }}
          onSaved={handleSaved}
          onDeleted={handleDeleted}
        />
      )}
    </div>
  )
}
