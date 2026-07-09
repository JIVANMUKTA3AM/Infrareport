import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useAuth } from '../context/AuthContext'
import {
  Plus, X, Loader2, Trash2, Edit2, Shield, Lock,
  TrendingUp, TrendingDown, AlertTriangle, CheckCircle2,
} from 'lucide-react'

const API = ''

// ── Helpers ───────────────────────────────────────────────────────────────────
const hex15 = (hex) => hex + '26'   // ~15% opacity suffix

// ── CategoryModal ─────────────────────────────────────────────────────────────
function CategoryModal({ initial, type, userId, onClose, onSaved }) {
  const isEdit = !!initial?.id
  const colorRef = useRef(null)

  const [form, setForm] = useState({
    name:       initial?.name       || '',
    color:      initial?.color      || '#3B82F6',
    icon:       initial?.icon       || '📌',
    sort_order: initial?.sort_order ?? 0,
    is_active:  initial?.is_active  ?? true,
  })
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState('')

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    setError('')
    if (!form.name.trim()) { setError('Nome obrigatório'); return }
    setSaving(true)
    try {
      const url    = isEdit ? `${API}/api/categories/${initial.id}` : `${API}/api/categories`
      const method = isEdit ? 'PATCH' : 'POST'
      const payload = isEdit
        ? { name: form.name, color: form.color, icon: form.icon, is_active: form.is_active, sort_order: form.sort_order }
        : { user_id: userId, type, name: form.name, color: form.color, icon: form.icon, sort_order: form.sort_order }

      const r = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!r.ok) { let msg = 'Erro ao salvar'; try { const e = await r.json(); msg = e.detail || msg } catch {} throw new Error(msg) }
      onSaved(await r.json(), isEdit)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const typeLabel = type === 'entrada' ? 'Entrada' : 'Saída'
  const inp = 'w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(15,23,42,.6)', backdropFilter: 'blur(4px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm flex flex-col"
        style={{ border: '1px solid #E2E8F0' }}>

        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: hex15(form.color), color: form.color }}>
              <span className="text-sm">{form.icon}</span>
            </div>
            <h2 className="text-base font-bold text-slate-800">
              {isEdit ? 'Editar Categoria' : `Nova Categoria · ${typeLabel}`}
            </h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"><X size={18}/></button>
        </div>

        <div className="p-5 space-y-4">
          {error && <div className="px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">{error}</div>}

          {/* Nome */}
          <div>
            <label className="block text-[11px] text-slate-400 uppercase tracking-wide mb-1">Nome *</label>
            <input value={form.name} onChange={e => set('name', e.target.value)}
              className={inp} placeholder="Ex.: Impostos e Taxas" autoFocus />
          </div>

          {/* Cor + Ícone */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-slate-400 uppercase tracking-wide mb-1">Cor</label>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => colorRef.current?.click()}
                  className="w-9 h-9 rounded-xl border-2 border-slate-200 shadow-sm cursor-pointer flex-shrink-0"
                  style={{ background: form.color }} />
                <input ref={colorRef} type="color" value={form.color}
                  onChange={e => set('color', e.target.value)} className="sr-only" />
                <span className="text-xs font-mono text-slate-500">{form.color}</span>
              </div>
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 uppercase tracking-wide mb-1">Ícone (emoji)</label>
              <div className="flex items-center gap-2">
                <span className="text-2xl w-9 text-center">{form.icon || '📌'}</span>
                <input value={form.icon} onChange={e => set('icon', e.target.value)}
                  className={inp} placeholder="📌" maxLength={4} />
              </div>
            </div>
          </div>

          {/* Ativo (apenas na edição) */}
          {isEdit && (
            <div className="flex items-center justify-between py-1">
              <span className="text-sm text-slate-700 font-medium">Ativa</span>
              <button onClick={() => set('is_active', !form.is_active)}
                className={`w-11 h-6 rounded-full transition-colors ${form.is_active ? 'bg-blue-500' : 'bg-slate-200'}`}>
                <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform mx-0.5 ${form.is_active ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 p-5 border-t border-slate-100">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition">Cancelar</button>
          <button onClick={handleSave} disabled={saving || !form.name.trim()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition disabled:opacity-50">
            {saving && <Loader2 size={13} className="animate-spin"/>}
            {isEdit ? 'Salvar' : 'Criar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── DeleteDialog ──────────────────────────────────────────────────────────────
function DeleteDialog({ cat, allCats, userId, onClose, onDeleted }) {
  const inUse   = cat.usage_count > 0
  const targets = allCats.filter(c => c.type === cat.type && c.id !== cat.id)

  const [mergeTarget, setMergeTarget] = useState(targets[0]?.id || '')
  const [working, setWorking] = useState(false)
  const [error,   setError]   = useState('')

  const handleDelete = async () => {
    setWorking(true); setError('')
    try {
      const r = await fetch(`${API}/api/categories/${cat.id}?user_id=${userId}`, { method: 'DELETE' })
      if (!r.ok) { let msg = 'Erro ao excluir'; try { const e = await r.json(); msg = e.detail?.message || e.detail || msg } catch {} throw new Error(msg) }
      onDeleted(cat.id)
    } catch (err) { setError(err.message) }
    finally { setWorking(false) }
  }

  const handleMerge = async () => {
    if (!mergeTarget) { setError('Selecione uma categoria destino'); return }
    setWorking(true); setError('')
    try {
      const r = await fetch(`${API}/api/categories/${cat.id}/merge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, target_id: mergeTarget }),
      })
      if (!r.ok) { let msg = 'Erro ao mesclar'; try { const e = await r.json(); msg = e.detail || msg } catch {} throw new Error(msg) }
      onDeleted(cat.id)
    } catch (err) { setError(err.message) }
    finally { setWorking(false) }
  }

  const inp = 'w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 bg-white'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(15,23,42,.6)', backdropFilter: 'blur(4px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm" style={{ border: '1px solid #E2E8F0' }}>
        <div className="p-5 border-b border-slate-100 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
            <AlertTriangle size={16} className="text-red-600" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">Excluir categoria</h3>
            <p className="text-xs text-slate-500 mt-0.5">"{cat.name}"</p>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {error && <div className="px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">{error}</div>}

          {!inUse ? (
            <p className="text-sm text-slate-600">
              Tem certeza que deseja excluir esta categoria? Esta ação não pode ser desfeita.
            </p>
          ) : (
            <>
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-800">
                Esta categoria está em uso em <strong>{cat.usage_count} lançamento{cat.usage_count !== 1 ? 's' : ''}</strong>.
                Escolha para onde reatribuir os lançamentos antes de excluir.
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 uppercase tracking-wide mb-1">Mesclar com</label>
                <select value={mergeTarget} onChange={e => setMergeTarget(e.target.value)} className={inp}>
                  <option value="">— Selecione —</option>
                  {targets.map(t => (
                    <option key={t.id} value={t.id}>{t.icon} {t.name}</option>
                  ))}
                </select>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 p-5 border-t border-slate-100">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition">Cancelar</button>
          {!inUse ? (
            <button onClick={handleDelete} disabled={working}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition disabled:opacity-50">
              {working && <Loader2 size={13} className="animate-spin"/>}
              Excluir
            </button>
          ) : (
            <button onClick={handleMerge} disabled={working || !mergeTarget}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition disabled:opacity-50">
              {working && <Loader2 size={13} className="animate-spin"/>}
              Mesclar e Excluir
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── CategoryCard ──────────────────────────────────────────────────────────────
function CategoryCard({ cat, onEdit, onDelete, onToggleActive }) {
  return (
    <div className={`card p-4 transition-opacity ${cat.is_active ? '' : 'opacity-50'}`}>
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 text-xl"
          style={{ background: hex15(cat.color), color: cat.color }}>
          {cat.icon}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-sm font-bold text-slate-800 leading-tight">{cat.name}</span>
            {cat.is_default && (
              <span className="flex items-center gap-0.5 text-[10px] font-semibold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full">
                <Lock size={8}/> Padrão
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[11px] font-mono text-slate-400">{cat.slug}</span>
            <span className="text-slate-200">·</span>
            <span className="text-[11px] text-slate-500">{cat.usage_count} lançamento{cat.usage_count !== 1 ? 's' : ''}</span>
          </div>
        </div>

        {/* Active dot */}
        <button onClick={() => onToggleActive(cat)}
          title={cat.is_active ? 'Ativa — clique para desativar' : 'Inativa — clique para ativar'}
          className={`w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1 transition-colors ${cat.is_active ? 'bg-emerald-400' : 'bg-slate-300'}`}
        />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-1 mt-3 pt-3 border-t border-slate-50">
        <button onClick={() => onEdit(cat)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition">
          <Edit2 size={13}/>
        </button>
        <button onClick={() => onDelete(cat)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition">
          <Trash2 size={13}/>
        </button>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Categorias() {
  const { user }  = useAuth()
  const userId    = user?.id

  const [tab,      setTab]      = useState('entrada')
  const [allCats,  setAllCats]  = useState([])
  const [loading,  setLoading]  = useState(true)
  const [modal,    setModal]    = useState(null)    // null | { mode, cat }
  const [delDlg,   setDelDlg]   = useState(null)    // null | cat

  const loadCats = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    try {
      const r = await fetch(`${API}/api/categories?user_id=${userId}`)
      if (r.ok) setAllCats(await r.json())
    } catch {}
    finally { setLoading(false) }
  }, [userId])

  useEffect(() => { loadCats() }, [loadCats])

  const tabCats = useMemo(() =>
    allCats
      .filter(c => c.type === tab)
      .sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name)),
    [allCats, tab]
  )

  const counts = useMemo(() => ({
    entrada: allCats.filter(c => c.type === 'entrada').length,
    saida:   allCats.filter(c => c.type === 'saida').length,
  }), [allCats])

  const handleSaved = (saved, isEdit) => {
    setAllCats(prev => isEdit
      ? prev.map(c => c.id === saved.id ? { ...saved, usage_count: c.usage_count } : c)
      : [...prev, { ...saved, usage_count: 0 }]
    )
    setModal(null)
  }

  const handleDeleted = (id) => {
    setAllCats(prev => prev.filter(c => c.id !== id))
    setDelDlg(null)
  }

  const handleToggleActive = async (cat) => {
    try {
      const r = await fetch(`${API}/api/categories/${cat.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !cat.is_active }),
      })
      if (r.ok) {
        const updated = await r.json()
        setAllCats(prev => prev.map(c => c.id === cat.id ? { ...updated, usage_count: cat.usage_count } : c))
      }
    } catch {}
  }

  return (
    <div className="p-7 space-y-5 animate-fade-up">

      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-[1.1rem] font-bold text-slate-800">Categorias</h2>
          <p className="text-[0.78rem] text-slate-400 mt-0.5">Organize categorias de Entradas e Saídas</p>
        </div>
        <button onClick={() => setModal({ mode: 'create' })}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white shadow-md hover:shadow-lg transition"
          style={{ background: 'linear-gradient(135deg,#1D4ED8,#3B82F6)' }}>
          <Plus size={15}/> Nova Categoria
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {[
          { key: 'entrada', label: 'Entradas', icon: TrendingUp,   color: 'text-emerald-600', activeBg: 'bg-emerald-600' },
          { key: 'saida',   label: 'Saídas',   icon: TrendingDown, color: 'text-red-600',     activeBg: 'bg-red-600'     },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition ${
              tab === t.key ? `${t.activeBg} text-white shadow-sm` : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
            }`}>
            <t.icon size={14}/>
            {t.label}
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
              tab === t.key ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
            }`}>{counts[t.key]}</span>
          </button>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-[0.72rem] text-slate-400">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"/>{' '}Ativa</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-300 inline-block"/>{' '}Inativa</span>
        <span className="flex items-center gap-1"><Lock size={9}/>{' '}Padrão do sistema</span>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={22} className="animate-spin text-blue-400"/>
        </div>
      ) : tabCats.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center">
            <Shield size={24} className="text-blue-300"/>
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-slate-600">Nenhuma categoria criada</p>
            <p className="text-[0.78rem] text-slate-400 mt-1">Crie categorias para organizar seus lançamentos</p>
          </div>
          <button onClick={() => setModal({ mode: 'create' })}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white"
            style={{ background: 'linear-gradient(135deg,#1D4ED8,#3B82F6)' }}>
            <Plus size={14}/> Nova Categoria
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tabCats.map(cat => (
            <CategoryCard
              key={cat.id}
              cat={cat}
              onEdit={c => setModal({ mode: 'edit', cat: c })}
              onDelete={c => setDelDlg(c)}
              onToggleActive={handleToggleActive}
            />
          ))}
        </div>
      )}

      {/* Category Modal */}
      {modal && (
        <CategoryModal
          initial={modal.cat}
          type={modal.cat?.type || tab}
          userId={userId}
          onClose={() => setModal(null)}
          onSaved={handleSaved}
        />
      )}

      {/* Delete Dialog */}
      {delDlg && (
        <DeleteDialog
          cat={delDlg}
          allCats={allCats}
          userId={userId}
          onClose={() => setDelDlg(null)}
          onDeleted={handleDeleted}
        />
      )}
    </div>
  )
}
