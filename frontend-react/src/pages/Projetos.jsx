import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import {
  FolderOpen, Plus, Search, Filter, CheckCircle2, Clock, XCircle,
  ChevronRight, TrendingUp, DollarSign, Calendar, Users, FileText,
  History, Loader2, Download, X, Edit2, CheckCheck, Briefcase,
  Paperclip, Wrench, AlertCircle,
} from 'lucide-react'

const API = 'https://api.infrareport.3amgflowz.com.br'

// ── Constantes ────────────────────────────────────────────────────────────────

const STATUS_CFG = {
  aguardando:   { label: 'Aguardando',   color: '#D97706', bg: '#FEF3C7', Icon: Clock        },
  em_andamento: { label: 'Em Andamento', color: '#2563EB', bg: '#DBEAFE', Icon: Wrench       },
  concluido:    { label: 'Concluído',    color: '#059669', bg: '#D1FAE5', Icon: CheckCircle2 },
  cancelado:    { label: 'Cancelado',    color: '#DC2626', bg: '#FEE2E2', Icon: XCircle      },
}

const SEGMENT_LABELS = {
  ac: 'Ar-Condicionado', cftv: 'CFTV', ti: 'TI / Redes',
  eletrica: 'Elétrica', hidraulica: 'Hidráulica',
  alarme: 'Alarme', automacao: 'Automação', telecom: 'Telecom',
}

// ── Utilitários ───────────────────────────────────────────────────────────────

function fmt(v) {
  return Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function fmtDate(d) {
  if (!d) return '—'
  const [y, m, day] = String(d).split('T')[0].split('-')
  return `${day}/${m}/${y}`
}

function parseTeam(team) {
  if (!team) return []
  if (Array.isArray(team)) return team
  try { return JSON.parse(team) } catch { return [] }
}

function marginColor(m) {
  if (m >= 30) return '#059669'
  if (m >= 15) return '#D97706'
  return '#DC2626'
}

// ── Componentes pequenos ──────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const cfg = STATUS_CFG[status] || { label: status, color: '#64748B', bg: '#F1F5F9', Icon: Clock }
  const { Icon } = cfg
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap"
      style={{ color: cfg.color, background: cfg.bg }}
    >
      <Icon size={11} /> {cfg.label}
    </span>
  )
}

// ── Abas do detalhe ───────────────────────────────────────────────────────────

const TABS = [
  { id: 'resumo',     label: 'Resumo',         Icon: Briefcase  },
  { id: 'financeiro', label: 'Financeiro',      Icon: DollarSign },
  { id: 'arquivos',   label: 'Arquivos',        Icon: Paperclip  },
  { id: 'historico',  label: 'Linha do Tempo',  Icon: History    },
]

// ── Tab Resumo ────────────────────────────────────────────────────────────────

function TabResumo({ project: p, editing, editData, setEditData, onSave, saving, onCancel }) {
  const totalCost = p.total_cost ?? (Number(p.material_cost || 0) + Number(p.labor_cost || 0))
  const margin    = p.margin    ?? (p.revenue > 0 ? (p.revenue - totalCost) / p.revenue * 100 : 0)
  const mc        = marginColor(margin)
  const team      = parseTeam(editing ? (editData.team ?? p.team) : p.team)

  const inp = 'w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'

  const Field = ({ label, field, type = 'text', opts }) => (
    <div>
      <label className="block text-[11px] text-slate-400 uppercase tracking-wide mb-1">{label}</label>
      {editing ? (
        type === 'textarea' ? (
          <textarea
            value={editData[field] ?? p[field] ?? ''}
            onChange={e => setEditData(d => ({ ...d, [field]: e.target.value }))}
            rows={3} className={inp + ' resize-none'}
          />
        ) : type === 'select' ? (
          <select
            value={editData[field] ?? p[field] ?? ''}
            onChange={e => setEditData(d => ({ ...d, [field]: e.target.value }))}
            className={inp}
          >
            {opts.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
          </select>
        ) : (
          <input
            type={type}
            value={editData[field] ?? p[field] ?? ''}
            onChange={e => setEditData(d => ({ ...d, [field]: e.target.value }))}
            className={inp}
          />
        )
      ) : (
        <p className="text-sm font-medium text-slate-800">
          {type === 'number' ? fmt(p[field]) : (p[field] || '—')}
        </p>
      )}
    </div>
  )

  return (
    <div className="space-y-6">
      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { l: 'Receita',     v: fmt(p.revenue),            c: '#2563EB', bg: '#EFF6FF' },
          { l: 'Custo Total', v: fmt(totalCost),            c: '#DC2626', bg: '#FEF2F2' },
          { l: 'Margem',      v: `${margin.toFixed(1)}%`,   c: mc,         bg: '#F0FDF4' },
          { l: 'Resultado',   v: fmt(p.revenue - totalCost),c: '#059669', bg: '#ECFDF5' },
        ].map(k => (
          <div key={k.l} className="rounded-xl p-3 border" style={{ borderColor: k.c + '22', background: k.bg }}>
            <p className="text-[11px] font-medium mb-0.5" style={{ color: k.c }}>{k.l}</p>
            <p className="text-base font-bold" style={{ color: k.c }}>{k.v}</p>
          </div>
        ))}
      </div>

      {/* Grid de campos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Cliente"   field="client" />
        <Field label="Endereço"  field="address" />
        <Field label="Status"    field="status" type="select"
          opts={Object.entries(STATUS_CFG).map(([v, c]) => ({ v, l: c.label }))} />
        <Field label="Segmento"  field="segment" type="select"
          opts={[{ v: '', l: '—' }, ...Object.entries(SEGMENT_LABELS).map(([v, l]) => ({ v, l }))]} />
        <Field label="Início"                field="start_date"         type="date" />
        <Field label="Previsão de Conclusão" field="expected_end_date"  type="date" />
        <Field label="Custo Materiais" field="material_cost" type="number" />
        <Field label="Mão de Obra"     field="labor_cost"    type="number" />
      </div>

      <Field label="Escopo" field="scope" type="textarea" />

      {/* Equipe */}
      <div>
        <label className="block text-[11px] text-slate-400 uppercase tracking-wide mb-2">Equipe</label>
        {editing ? (
          <input
            value={(editData.team !== undefined ? editData.team : team).join
              ? (editData.team !== undefined ? editData.team : team).join(', ')
              : editData.team ?? ''}
            onChange={e => setEditData(d => ({
              ...d,
              team: e.target.value.split(',').map(s => s.trim()).filter(Boolean),
            }))}
            placeholder="Nomes separados por vírgula"
            className={inp}
          />
        ) : team.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {team.map((t, i) => (
              <span key={i} className="inline-flex items-center gap-1 px-3 py-1 bg-slate-100 rounded-full text-xs font-medium text-slate-700">
                <Users size={11} /> {t}
              </span>
            ))}
          </div>
        ) : <p className="text-sm text-slate-400">Nenhum membro informado</p>}
      </div>

      {editing && (
        <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
          <button onClick={onCancel} className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition">
            Cancelar
          </button>
          <button onClick={onSave} disabled={saving}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-1.5">
            {saving && <Loader2 size={13} className="animate-spin" />} Salvar
          </button>
        </div>
      )}
    </div>
  )
}

// ── Tab Financeiro ────────────────────────────────────────────────────────────

function TabFinanceiro({ entries }) {
  if (!entries) return <Spinner />

  const total_in  = entries.filter(e => e.type === 'entrada').reduce((s, e) => s + Number(e.value), 0)
  const total_out = entries.filter(e => e.type === 'saida').reduce((s, e) => s + Number(e.value), 0)
  const balance   = total_in - total_out

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <Kpi label="Entradas"        value={fmt(total_in)}  color="#059669" bg="#D1FAE5" />
        <Kpi label="Saídas"          value={fmt(total_out)} color="#DC2626" bg="#FEE2E2" />
        <Kpi label="Saldo do Projeto" value={fmt(balance)}
          color={balance >= 0 ? '#2563EB' : '#DC2626'}
          bg={balance >= 0 ? '#DBEAFE' : '#FEE2E2'} />
      </div>

      {entries.length === 0 ? (
        <Empty icon={<DollarSign size={32} />}
          msg="Nenhum lançamento vinculado a este projeto"
          sub="Use o Agente Financeiro e mencione o projeto ao registrar" />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full min-w-[480px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {['Data', 'Tipo', 'Categoria', 'Descrição', 'Valor'].map(h => (
                  <th key={h} className="text-left text-[11px] font-semibold text-slate-500 px-4 py-3 last:text-right">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {entries.map((e, i) => (
                <tr key={e.id} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                  <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">{fmtDate(e.date)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      e.type === 'entrada' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                    }`}>{e.type === 'entrada' ? 'Entrada' : 'Saída'}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">{e.category || '—'}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{e.description || '—'}</td>
                  <td className={`px-4 py-3 text-sm font-semibold text-right ${
                    e.type === 'entrada' ? 'text-emerald-600' : 'text-red-500'
                  }`}>{e.type === 'saida' ? '−' : '+'}{fmt(e.value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ── Tab Arquivos ──────────────────────────────────────────────────────────────

function TabArquivos({ files }) {
  if (!files) return <Spinner />
  if (files.length === 0) return (
    <Empty icon={<Paperclip size={32} />} msg="Nenhum arquivo vinculado a este projeto" />
  )
  return (
    <div className="space-y-2">
      {files.map(f => (
        <div key={f.id}
          className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
              <FileText size={16} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-800">{f.file_name}</p>
              <p className="text-xs text-slate-400">{f.file_type} · {fmtDate(f.created_at)}</p>
            </div>
          </div>
          <a href={`/files/${f.id}/download`} target="_blank" rel="noreferrer"
            className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition">
            <Download size={15} />
          </a>
        </div>
      ))}
    </div>
  )
}

// ── Tab Histórico ─────────────────────────────────────────────────────────────

function TabHistorico({ entries }) {
  if (!entries) return <Spinner />
  if (entries.length === 0) return (
    <Empty icon={<History size={32} />} msg="Nenhum evento registrado ainda" />
  )
  return (
    <div className="relative pl-6">
      <div className="absolute left-[11px] top-2 bottom-2 w-px bg-slate-200" />
      {entries.map(e => {
        const cfg = STATUS_CFG[e.status_to] || { color: '#64748B' }
        const dt  = new Date(e.created_at)
        const ds  = dt.toLocaleString('pt-BR', {
          day: '2-digit', month: '2-digit', year: 'numeric',
          hour: '2-digit', minute: '2-digit',
        })
        const fromLabel = STATUS_CFG[e.status_from]?.label
        const toLabel   = STATUS_CFG[e.status_to]?.label || e.status_to

        return (
          <div key={e.id} className="relative mb-5 last:mb-0">
            <div
              className="absolute -left-[21px] w-5 h-5 rounded-full border-2 border-white flex items-center justify-center shadow-sm"
              style={{ background: cfg.color }}
            >
              <div className="w-2 h-2 rounded-full bg-white/80" />
            </div>
            <div className="bg-white rounded-xl border border-slate-100 p-3 shadow-sm">
              <div className="flex items-start justify-between gap-2 mb-1">
                <p className="text-xs font-semibold text-slate-700">
                  {fromLabel ? `${fromLabel} → ` : ''}
                  <span style={{ color: cfg.color }}>{toLabel}</span>
                </p>
                <span className="text-[11px] text-slate-400 whitespace-nowrap">{ds}</span>
              </div>
              {e.note && <p className="text-xs text-slate-500">{e.note}</p>}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Modal de detalhe ──────────────────────────────────────────────────────────

function ProjectDetail({ project: initial, userId, onClose, onUpdated }) {
  const [project, setProject] = useState(initial)
  const [tab, setTab]         = useState('resumo')
  const [financeiro, setFin]  = useState(null)
  const [arquivos, setArq]    = useState(null)
  const [historico, setHist]  = useState(null)
  const [editing, setEditing] = useState(false)
  const [editData, setEdit]   = useState({})
  const [saving, setSaving]   = useState(false)
  const [closing, setClosing] = useState(false)

  useEffect(() => {
    if (tab === 'financeiro' && !financeiro)
      fetch(`${API}/api/projects/${project.id}/financeiro?user_id=${userId}`)
        .then(r => r.json()).then(setFin).catch(() => setFin([]))
    if (tab === 'arquivos' && !arquivos)
      fetch(`${API}/api/projects/${project.id}/arquivos?user_id=${userId}`)
        .then(r => r.json()).then(setArq).catch(() => setArq([]))
    if (tab === 'historico' && !historico)
      fetch(`${API}/api/projects/${project.id}/historico?user_id=${userId}`)
        .then(r => r.json()).then(setHist).catch(() => setHist([]))
  }, [tab]) // eslint-disable-line

  const applyUpdate = (updated) => {
    setProject(updated)
    onUpdated(updated)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const body = { ...editData, user_id: userId, _old_status: project.status }
      const r    = await fetch(`${API}/api/projects/${project.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!r.ok) throw new Error(await r.text())
      const updated = await r.json()
      applyUpdate(updated)
      setEditing(false)
      setEdit({})
      // Recarrega histórico
      setHist(null)
    } finally {
      setSaving(false)
    }
  }

  const handleClose = async () => {
    if (!window.confirm('Encerrar esta OS e gerar relatório PDF final?')) return
    setClosing(true)
    try {
      const r = await fetch(`${API}/api/projects/${project.id}/close`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, note: 'OS encerrada pelo responsável' }),
      })
      if (!r.ok) throw new Error(await r.text())
      const updated = await r.json()
      applyUpdate(updated)
      setHist(null)
    } finally {
      setClosing(false)
    }
  }

  const isFinished = project.status === 'concluido' || project.status === 'cancelado'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(15,23,42,.65)', backdropFilter: 'blur(4px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col"
        style={{ maxHeight: '92vh', border: '1px solid #E2E8F0' }}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-slate-100 gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <StatusBadge status={project.status} />
              {project.segment && (
                <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                  {SEGMENT_LABELS[project.segment] || project.segment}
                </span>
              )}
            </div>
            <h2 className="text-lg font-bold text-slate-800 truncate">{project.name}</h2>
            <p className="text-sm text-slate-400 mt-0.5">{project.client}</p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {!isFinished && (
              <button onClick={() => { setEditing(e => !e); setEdit({}) }}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 transition">
                <Edit2 size={13} /> Editar
              </button>
            )}
            {project.status === 'em_andamento' && (
              <button onClick={handleClose} disabled={closing}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition">
                {closing ? <Loader2 size={13} className="animate-spin" /> : <CheckCheck size={13} />}
                Encerrar OS
              </button>
            )}
            {project.report_url && (
              <a href={`${API}/api/projects/${project.id}/report`} target="_blank" rel="noreferrer"
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition">
                <Download size={13} /> Relatório
              </a>
            )}
            <button onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100 px-5 overflow-x-auto">
          {TABS.map(t => {
            const { Icon } = t
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition whitespace-nowrap ${
                  tab === t.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}>
                <Icon size={14} /> {t.label}
              </button>
            )
          })}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {tab === 'resumo'     && (
            <TabResumo
              project={project} editing={editing}
              editData={editData} setEditData={setEdit}
              onSave={handleSave} saving={saving}
              onCancel={() => { setEditing(false); setEdit({}) }}
            />
          )}
          {tab === 'financeiro' && <TabFinanceiro entries={financeiro} project={project} />}
          {tab === 'arquivos'   && <TabArquivos   files={arquivos} />}
          {tab === 'historico'  && <TabHistorico  entries={historico} />}
        </div>
      </div>
    </div>
  )
}

// ── Modal de criação ──────────────────────────────────────────────────────────

function CreateModal({ userId, onClose, onCreated }) {
  const [form, setForm] = useState({
    name: '', client: '', address: '', scope: '',
    revenue: '', material_cost: '', labor_cost: '',
    start_date: '', expected_end_date: '', team: '',
    notes: '', segment: '', status: 'em_andamento',
  })
  const [saving, setSaving] = useState(false)
  const [err, setErr]       = useState('')

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.client.trim()) {
      setErr('Nome e cliente são obrigatórios.')
      return
    }
    setSaving(true)
    setErr('')
    try {
      const body = {
        user_id:           userId,
        name:              form.name.trim(),
        client:            form.client.trim(),
        address:           form.address.trim() || null,
        scope:             form.scope.trim() || null,
        revenue:           Number(form.revenue) || 0,
        material_cost:     Number(form.material_cost) || 0,
        labor_cost:        Number(form.labor_cost) || 0,
        start_date:        form.start_date || null,
        expected_end_date: form.expected_end_date || null,
        team:              form.team ? form.team.split(',').map(s => s.trim()).filter(Boolean) : [],
        notes:             form.notes.trim() || null,
        segment:           form.segment || null,
        status:            form.status,
      }
      const r = await fetch(`${API}/api/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!r.ok) { setErr('Erro ao criar projeto. Tente novamente.'); return }
      const created = await r.json()
      onCreated(created)
    } finally {
      setSaving(false)
    }
  }

  const inp = 'w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(15,23,42,.65)', backdropFilter: 'blur(4px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col"
        style={{ maxHeight: '92vh', border: '1px solid #E2E8F0' }}
      >
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">Novo Projeto / OS</h2>
          <button onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-[11px] text-slate-400 uppercase tracking-wide mb-1">Nome do Projeto / OS *</label>
              <input value={form.name} onChange={e => set('name', e.target.value)}
                placeholder="Ex: OS #001 – Instalação AC Escritório" className={inp} />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 uppercase tracking-wide mb-1">Cliente *</label>
              <input value={form.client} onChange={e => set('client', e.target.value)} className={inp} />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 uppercase tracking-wide mb-1">Segmento</label>
              <select value={form.segment} onChange={e => set('segment', e.target.value)} className={inp}>
                <option value="">Selecionar...</option>
                {Object.entries(SEGMENT_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-[11px] text-slate-400 uppercase tracking-wide mb-1">Endereço</label>
              <input value={form.address} onChange={e => set('address', e.target.value)} className={inp} />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-[11px] text-slate-400 uppercase tracking-wide mb-1">Escopo</label>
              <textarea value={form.scope} onChange={e => set('scope', e.target.value)}
                rows={3} className={inp + ' resize-none'} />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 uppercase tracking-wide mb-1">Receita (R$)</label>
              <input type="number" min="0" value={form.revenue} onChange={e => set('revenue', e.target.value)}
                placeholder="0.00" className={inp} />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 uppercase tracking-wide mb-1">Status</label>
              <select value={form.status} onChange={e => set('status', e.target.value)} className={inp}>
                {Object.entries(STATUS_CFG).map(([v, c]) => <option key={v} value={v}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 uppercase tracking-wide mb-1">Custo Materiais (R$)</label>
              <input type="number" min="0" value={form.material_cost} onChange={e => set('material_cost', e.target.value)}
                placeholder="0.00" className={inp} />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 uppercase tracking-wide mb-1">Mão de Obra (R$)</label>
              <input type="number" min="0" value={form.labor_cost} onChange={e => set('labor_cost', e.target.value)}
                placeholder="0.00" className={inp} />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 uppercase tracking-wide mb-1">Data de Início</label>
              <input type="date" value={form.start_date} onChange={e => set('start_date', e.target.value)} className={inp} />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 uppercase tracking-wide mb-1">Previsão de Conclusão</label>
              <input type="date" value={form.expected_end_date} onChange={e => set('expected_end_date', e.target.value)} className={inp} />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-[11px] text-slate-400 uppercase tracking-wide mb-1">Equipe (nomes separados por vírgula)</label>
              <input value={form.team} onChange={e => set('team', e.target.value)}
                placeholder="João Silva, Maria Costa" className={inp} />
            </div>
          </div>

          {err && (
            <div className="mt-4 flex items-center gap-2 p-3 rounded-xl bg-red-50 text-red-600 text-sm">
              <AlertCircle size={15} /> {err}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 p-5 border-t border-slate-100">
          <button onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition">
            Cancelar
          </button>
          <button onClick={handleSubmit} disabled={saving || !form.name || !form.client}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition disabled:opacity-50">
            {saving ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
            Criar Projeto
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Helpers visuais ───────────────────────────────────────────────────────────

function Spinner() {
  return (
    <div className="flex items-center justify-center py-14">
      <Loader2 size={22} className="animate-spin text-blue-400" />
    </div>
  )
}

function Empty({ icon, msg, sub }) {
  return (
    <div className="text-center py-12 text-slate-400">
      <div className="mx-auto mb-3 opacity-30">{icon}</div>
      <p className="text-sm font-medium text-slate-500">{msg}</p>
      {sub && <p className="text-xs mt-1">{sub}</p>}
    </div>
  )
}

function Kpi({ label, value, color, bg }) {
  return (
    <div className="rounded-xl p-3" style={{ background: bg }}>
      <p className="text-[11px] font-medium mb-0.5" style={{ color }}>{label}</p>
      <p className="text-base font-bold" style={{ color }}>{value}</p>
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────

export default function Projetos() {
  const { user }   = useAuth()
  const userId     = user?.id

  const [projects, setProjects]     = useState([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState(null)
  const [selected, setSelected]     = useState(null)
  const [showCreate, setShowCreate] = useState(false)

  // Filtros
  const [fStatus, setFStatus] = useState('')
  const [fClient, setFClient] = useState('')
  const [fStart,  setFStart]  = useState('')
  const [fEnd,    setFEnd]    = useState('')

  const fetchProjects = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    setError(null)
    try {
      const p = new URLSearchParams({ user_id: userId })
      if (fStatus) p.set('status', fStatus)
      if (fClient) p.set('client', fClient)
      if (fStart)  p.set('start',  fStart)
      if (fEnd)    p.set('end',    fEnd)
      const r = await fetch(`${API}/api/projects?${p}`)
      if (!r.ok) throw new Error('Erro ao carregar projetos')
      setProjects(await r.json())
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [userId, fStatus, fClient, fStart, fEnd])

  useEffect(() => { fetchProjects() }, [fetchProjects])

  const handleUpdated = (updated) => {
    setProjects(ps => ps.map(p => p.id === updated.id ? updated : p))
    setSelected(updated)
  }

  const handleCreated = (created) => {
    setProjects(ps => [created, ...ps])
    setShowCreate(false)
    setSelected(created)
  }

  // KPIs
  const total        = projects.length
  const emAndamento  = projects.filter(p => p.status === 'em_andamento').length
  const concluidos   = projects.filter(p => p.status === 'concluido').length
  const receitaTotal = projects.reduce((s, p) => s + Number(p.revenue || 0), 0)

  return (
    <div className="p-5 md:p-6 max-w-[1400px] mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-6 gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-800">Projetos / OS</h1>
          <p className="text-sm text-slate-500 mt-0.5">Gerencie ordens de serviço e acompanhe margens</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white shadow-md hover:shadow-lg active:scale-95 transition shrink-0"
          style={{ background: 'linear-gradient(135deg,#1D4ED8,#2563EB)' }}
        >
          <Plus size={16} /> Novo Projeto
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4 mb-6">
        {[
          { label: 'Total',         value: total,             Icon: FolderOpen,   grad: '#1D4ED8,#3B82F6' },
          { label: 'Em Andamento',  value: emAndamento,       Icon: Wrench,       grad: '#D97706,#F59E0B' },
          { label: 'Concluídos',    value: concluidos,        Icon: CheckCircle2, grad: '#059669,#10B981' },
          { label: 'Receita Total', value: fmt(receitaTotal), Icon: DollarSign,   grad: '#7C3AED,#8B5CF6' },
        ].map(k => {
          const { Icon } = k
          return (
            <div key={k.label} className="rounded-2xl p-4 text-white shadow-md"
              style={{ background: `linear-gradient(135deg,${k.grad})` }}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium opacity-80 leading-tight">{k.label}</p>
                <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                  <Icon size={15} />
                </div>
              </div>
              <p className="text-2xl font-bold">{k.value}</p>
            </div>
          )
        })}
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 mb-5">
        <div className="flex flex-wrap gap-2 md:gap-3">
          <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2 flex-1 min-w-[140px]">
            <Search size={14} className="text-slate-400 shrink-0" />
            <input
              value={fClient} onChange={e => setFClient(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && fetchProjects()}
              placeholder="Buscar cliente..."
              className="bg-transparent text-sm text-slate-700 placeholder:text-slate-400 outline-none w-full"
            />
          </div>

          <select
            value={fStatus} onChange={e => setFStatus(e.target.value)}
            className="bg-slate-50 border-0 rounded-xl px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos os status</option>
            {Object.entries(STATUS_CFG).map(([v, c]) => (
              <option key={v} value={v}>{c.label}</option>
            ))}
          </select>

          <div className="flex items-center gap-1">
            <Calendar size={14} className="text-slate-400 hidden sm:block" />
            <input type="date" value={fStart} onChange={e => setFStart(e.target.value)}
              className="bg-slate-50 border-0 rounded-xl px-3 py-2 text-sm text-slate-700 outline-none" />
            <span className="text-xs text-slate-400">até</span>
            <input type="date" value={fEnd} onChange={e => setFEnd(e.target.value)}
              className="bg-slate-50 border-0 rounded-xl px-3 py-2 text-sm text-slate-700 outline-none" />
          </div>

          <button onClick={fetchProjects}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 transition">
            <Filter size={13} /> Filtrar
          </button>
        </div>
      </div>

      {/* Tabela — responsiva sem scroll horizontal em telas médias */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60">
                <th className="text-left text-[11px] font-semibold text-slate-500 px-5 py-3.5 uppercase tracking-wide">
                  Projeto / OS
                </th>
                <th className="text-left text-[11px] font-semibold text-slate-500 px-4 py-3.5 uppercase tracking-wide hidden sm:table-cell">
                  Segmento
                </th>
                <th className="text-left text-[11px] font-semibold text-slate-500 px-4 py-3.5 uppercase tracking-wide">
                  Status
                </th>
                <th className="text-right text-[11px] font-semibold text-slate-500 px-4 py-3.5 uppercase tracking-wide hidden md:table-cell">
                  Receita
                </th>
                <th className="text-right text-[11px] font-semibold text-slate-500 px-4 py-3.5 uppercase tracking-wide hidden md:table-cell">
                  Margem
                </th>
                <th className="text-left text-[11px] font-semibold text-slate-500 px-4 py-3.5 uppercase tracking-wide hidden lg:table-cell">
                  Início
                </th>
                <th className="text-left text-[11px] font-semibold text-slate-500 px-4 py-3.5 uppercase tracking-wide hidden lg:table-cell">
                  Previsão
                </th>
                <th className="w-8 px-4" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center">
                    <Loader2 size={24} className="animate-spin text-blue-400 mx-auto mb-2" />
                    <p className="text-sm text-slate-400">Carregando projetos...</p>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center">
                    <AlertCircle size={24} className="text-red-400 mx-auto mb-2" />
                    <p className="text-sm text-red-500">{error}</p>
                    <button onClick={fetchProjects}
                      className="mt-3 text-xs text-blue-600 hover:underline">Tentar novamente</button>
                  </td>
                </tr>
              ) : projects.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center">
                    <FolderOpen size={40} className="text-slate-300 mx-auto mb-3" />
                    <p className="text-sm font-medium text-slate-500">Nenhum projeto encontrado</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Crie manualmente ou aprove uma proposta em <strong>Propostas</strong>
                    </p>
                    <button onClick={() => setShowCreate(true)}
                      className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition">
                      <Plus size={13} /> Criar primeiro projeto
                    </button>
                  </td>
                </tr>
              ) : (
                projects.map(p => {
                  const mg = Number(p.margin || 0)
                  const mc = marginColor(mg)
                  return (
                    <tr key={p.id}
                      onClick={() => setSelected(p)}
                      className="border-b border-slate-50 last:border-0 hover:bg-blue-50/30 cursor-pointer transition group">
                      <td className="px-5 py-4">
                        <p className="text-sm font-semibold text-slate-800 group-hover:text-blue-700 transition line-clamp-1">
                          {p.name}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{p.client}</p>
                      </td>
                      <td className="px-4 py-4 hidden sm:table-cell">
                        <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                          {SEGMENT_LABELS[p.segment] || p.segment || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge status={p.status} />
                      </td>
                      <td className="px-4 py-4 text-right text-sm font-semibold text-slate-700 hidden md:table-cell">
                        {fmt(p.revenue)}
                      </td>
                      <td className="px-4 py-4 text-right hidden md:table-cell">
                        <span className="text-sm font-bold tabular-nums" style={{ color: mc }}>
                          {mg.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-500 hidden lg:table-cell whitespace-nowrap">
                        {fmtDate(p.start_date)}
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-500 hidden lg:table-cell whitespace-nowrap">
                        {fmtDate(p.expected_end_date)}
                      </td>
                      <td className="px-4 py-4">
                        <ChevronRight size={15} className="text-slate-300 group-hover:text-blue-400 transition" />
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modais */}
      {selected && (
        <ProjectDetail
          project={selected}
          userId={userId}
          onClose={() => setSelected(null)}
          onUpdated={handleUpdated}
        />
      )}
      {showCreate && (
        <CreateModal
          userId={userId}
          onClose={() => setShowCreate(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  )
}
