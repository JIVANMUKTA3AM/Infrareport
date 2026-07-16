import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from '../context/AuthContext'
import {
  ChevronLeft, ChevronRight, Plus, X, Loader2, Trash2,
  MapPin, RefreshCw, Calendar,
} from 'lucide-react'

const API = 'https://api.infrareport.3amgflowz.com.br'

const EVENT_TYPES = {
  visita:     { label: 'Visita Técnica',  color: '#2563EB', bg: '#DBEAFE', emoji: '🔍' },
  execucao:   { label: 'Execução / OS',   color: '#D97706', bg: '#FEF3C7', emoji: '🔧' },
  vencimento: { label: 'Vencimento',      color: '#DC2626', bg: '#FEE2E2', emoji: '⏰' },
  followup:   { label: 'Follow-up',       color: '#7C3AED', bg: '#EDE9FE', emoji: '📞' },
  outro:      { label: 'Outro',           color: '#475569', bg: '#F1F5F9', emoji: '📌' },
}

const WEEKDAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']
const MONTHS   = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

// Monday-first offset: Mon=0 … Sun=6
function weekOffset(jsDay) { return (jsDay + 6) % 7 }

function toIso(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

function todayIso() { return toIso(new Date()) }

function fmtBR(iso) {
  if (!iso) return ''
  const [y, m, d] = iso.split('T')[0].split('-')
  return `${d}/${m}/${y}`
}

// 42-cell grid for month view (Mon-first)
function buildMonthGrid(year, month) {
  const first  = new Date(year, month - 1, 1)
  const offset = weekOffset(first.getDay())
  const daysIn = new Date(year, month, 0).getDate()
  const prevDays = new Date(year, month - 1, 0).getDate()
  const pm = month === 1 ? 12 : month - 1
  const py = month === 1 ? year - 1 : year
  const nm = month === 12 ? 1 : month + 1
  const ny = month === 12 ? year + 1 : year
  const cells = []

  for (let i = offset - 1; i >= 0; i--)
    cells.push({ iso: `${py}-${String(pm).padStart(2,'0')}-${String(prevDays-i).padStart(2,'0')}`, current: false })

  for (let d = 1; d <= daysIn; d++)
    cells.push({ iso: `${year}-${String(month).padStart(2,'0')}-${String(d).padStart(2,'0')}`, current: true })

  let nd = 1
  while (cells.length < 42)
    cells.push({ iso: `${ny}-${String(nm).padStart(2,'0')}-${String(nd++).padStart(2,'0')}`, current: false })

  return cells
}

// 7 days Mon→Sun for the week containing `isoDate`
function buildWeekDays(isoDate) {
  const [y, m, d] = isoDate.split('-').map(Number)
  const ref    = new Date(y, m - 1, d)
  const offset = weekOffset(ref.getDay())
  return Array.from({ length: 7 }, (_, i) =>
    toIso(new Date(y, m - 1, d - offset + i))
  )
}

// ── EventPill ─────────────────────────────────────────────────────────────────
function EventPill({ event, onClick }) {
  const cfg = EVENT_TYPES[event.type] || EVENT_TYPES.outro
  return (
    <button
      onClick={e => { e.stopPropagation(); onClick(event) }}
      className="w-full text-left rounded px-1.5 py-0.5 text-[10px] font-medium truncate hover:opacity-80 transition leading-snug"
      style={{ background: cfg.bg, color: cfg.color }}
      title={event.title}
    >
      {event.start_time ? event.start_time.slice(0,5) + ' ' : ''}{event.title}
    </button>
  )
}

// ── EventModal (create / edit) ────────────────────────────────────────────────
function EventModal({ initial, userId, onClose, onSaved, onDeleted }) {
  const isEdit = !!initial?.id
  const [form, setForm] = useState({
    title: '', type: 'visita', date: todayIso(), start_time: '',
    end_time: '', all_day: false, client_name: '', location: '',
    notes: '', responsible: '', reminder_minutes: 60, status: 'agendado',
    project_id: null,
    ...initial,
  })
  const [saving,   setSaving]   = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [pushGcal, setPushGcal] = useState(false)
  const [projects, setProjects] = useState([])

  useEffect(() => {
    fetch(`${API}/api/projects?user_id=${userId}&status=em_andamento`)
      .then(r => r.ok ? r.json() : [])
      .then(d => Array.isArray(d) ? setProjects(d) : {})
      .catch(() => {})
  }, [userId])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    if (!form.title?.trim() || !form.date) return
    setSaving(true)
    try {
      const url    = isEdit ? `${API}/api/events/${form.id}` : `${API}/api/events`
      const method = isEdit ? 'PATCH' : 'POST'
      const r = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, user_id: userId }),
      })
      if (!r.ok) { let msg = 'Erro ao salvar'; try { const e = await r.json(); msg = e.detail || msg } catch {} throw new Error(msg) }
      const saved = await r.json()
      if (pushGcal) {
        await fetch(`${API}/api/events/${saved.id}/gcal-push`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: userId }),
        }).catch(() => {})
      }
      onSaved(saved, isEdit)
    } catch (err) { alert(err.message) }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (!window.confirm('Excluir este evento?')) return
    setDeleting(true)
    try {
      await fetch(`${API}/api/events/${form.id}?user_id=${userId}`, { method: 'DELETE' })
      onDeleted(form.id)
    } finally { setDeleting(false) }
  }

  const inp = 'w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(15,23,42,.6)', backdropFilter: 'blur(4px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col"
        style={{ maxHeight: '92vh', border: '1px solid #E2E8F0' }}>

        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">{isEdit ? 'Editar Evento' : 'Novo Evento'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition"><X size={18}/></button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Tipo */}
          <div>
            <label className="block text-[11px] text-slate-400 uppercase tracking-wide mb-2">Tipo</label>
            <div className="flex flex-wrap gap-2">
              {Object.entries(EVENT_TYPES).map(([v, cfg]) => (
                <button key={v} onClick={() => set('type', v)}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold transition"
                  style={form.type === v ? { background: cfg.color, color: '#fff' } : { background: cfg.bg, color: cfg.color }}>
                  {cfg.emoji} {cfg.label}
                </button>
              ))}
            </div>
          </div>

          {/* Título */}
          <div>
            <label className="block text-[11px] text-slate-400 uppercase tracking-wide mb-1">Título *</label>
            <input value={form.title} onChange={e => set('title', e.target.value)} className={inp} />
          </div>

          {/* Data + horários */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] text-slate-400 uppercase tracking-wide mb-1">Data *</label>
              <input type="date" value={form.date} onChange={e => set('date', e.target.value)} className={inp} />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 uppercase tracking-wide mb-1">Início</label>
              <input type="time" value={form.start_time || ''} onChange={e => set('start_time', e.target.value)}
                disabled={form.all_day} className={inp + (form.all_day ? ' opacity-40' : '')} />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 uppercase tracking-wide mb-1">Fim</label>
              <input type="time" value={form.end_time || ''} onChange={e => set('end_time', e.target.value)}
                disabled={form.all_day} className={inp + (form.all_day ? ' opacity-40' : '')} />
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.all_day} onChange={e => set('all_day', e.target.checked)} className="rounded" />
            <span className="text-sm text-slate-600">Dia inteiro</span>
          </label>

          {/* Cliente + Projeto */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-slate-400 uppercase tracking-wide mb-1">Cliente</label>
              <input value={form.client_name || ''} onChange={e => set('client_name', e.target.value)} className={inp} />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 uppercase tracking-wide mb-1">Vincular OS</label>
              <select value={form.project_id || ''} onChange={e => {
                set('project_id', e.target.value || null)
                const p = projects.find(x => x.id === e.target.value)
                if (p) set('client_name', p.client)
              }} className={inp}>
                <option value="">Nenhum</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>

          {/* Local + Responsável */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-slate-400 uppercase tracking-wide mb-1">Local</label>
              <input value={form.location || ''} onChange={e => set('location', e.target.value)} className={inp} />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 uppercase tracking-wide mb-1">Responsável</label>
              <input value={form.responsible || ''} onChange={e => set('responsible', e.target.value)} className={inp} />
            </div>
          </div>

          {/* Notas */}
          <div>
            <label className="block text-[11px] text-slate-400 uppercase tracking-wide mb-1">Notas</label>
            <textarea value={form.notes || ''} onChange={e => set('notes', e.target.value)}
              rows={2} className={inp + ' resize-none'} />
          </div>

          {/* Status (edit only) */}
          {isEdit && (
            <div>
              <label className="block text-[11px] text-slate-400 uppercase tracking-wide mb-1">Status</label>
              <select value={form.status} onChange={e => set('status', e.target.value)} className={inp}>
                <option value="agendado">Agendado</option>
                <option value="concluido">Concluído</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </div>
          )}

          {/* Google Calendar */}
          <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100 transition">
            <input type="checkbox" checked={pushGcal} onChange={e => setPushGcal(e.target.checked)} className="rounded" />
            <div>
              <p className="text-sm font-medium text-slate-700">Salvar no Google Agenda</p>
              <p className="text-xs text-slate-400">Requer Gmail conectado em Configurações</p>
            </div>
          </label>
        </div>

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
            <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition">
              Cancelar
            </button>
            <button onClick={handleSave} disabled={saving || !form.title || !form.date}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition disabled:opacity-50">
              {saving && <Loader2 size={13} className="animate-spin"/>}
              {isEdit ? 'Salvar' : 'Criar Evento'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Month View ────────────────────────────────────────────────────────────────
function MonthView({ year, month, events, onDayClick, onEventClick }) {
  const today  = todayIso()
  const cells  = useMemo(() => buildMonthGrid(year, month), [year, month])
  const evMap  = useMemo(() => {
    const m = {}
    events.forEach(e => {
      const k = e.date?.split('T')[0]
      if (!m[k]) m[k] = []
      m[k].push(e)
    })
    return m
  }, [events])

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/50">
        {WEEKDAYS.map(d => (
          <div key={d} className="py-2.5 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wide">{d}</div>
        ))}
      </div>
      <div className="flex-1 grid grid-cols-7" style={{ gridTemplateRows: 'repeat(6,minmax(0,1fr))' }}>
        {cells.map((cell, i) => {
          const dayEvs  = evMap[cell.iso] || []
          const isToday = cell.iso === today
          const dayNum  = parseInt(cell.iso.split('-')[2])
          const visible = dayEvs.slice(0, 3)
          const extra   = dayEvs.length - 3

          return (
            <div key={i} onClick={() => onDayClick(cell.iso)}
              className={`border-r border-b border-slate-100 p-1 cursor-pointer hover:bg-blue-50/40 transition flex flex-col gap-0.5 min-h-0
                ${!cell.current ? 'bg-slate-50/60' : 'bg-white'}
                ${i % 7 === 6 ? 'border-r-0' : ''}`}>
              <div className="flex justify-end mb-0.5">
                <span className={`text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full text-center
                  ${isToday ? 'bg-blue-600 text-white' : cell.current ? 'text-slate-700' : 'text-slate-300'}`}>
                  {dayNum}
                </span>
              </div>
              {visible.map(ev => <EventPill key={ev.id} event={ev} onClick={onEventClick} />)}
              {extra > 0 && (
                <span className="text-[9px] text-blue-500 font-medium pl-1">+{extra} mais</span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Week View ─────────────────────────────────────────────────────────────────
function WeekView({ weekDays, events, onDayClick, onEventClick }) {
  const today = todayIso()
  const evMap = useMemo(() => {
    const m = {}
    events.forEach(e => { const k = e.date?.split('T')[0]; if (!m[k]) m[k] = []; m[k].push(e) })
    return m
  }, [events])

  return (
    <div className="flex-1 overflow-x-auto">
      <div className="min-w-[540px] grid grid-cols-7 h-full">
        {weekDays.map((iso, i) => {
          const dayEvs  = evMap[iso] || []
          const isToday = iso === today
          const dayNum  = parseInt(iso.split('-')[2])

          return (
            <div key={iso} className={`border-r last:border-r-0 border-slate-100 flex flex-col ${isToday ? 'bg-blue-50/30' : 'bg-white'}`}>
              <div onClick={() => onDayClick(iso)}
                className="py-3 text-center border-b border-slate-100 cursor-pointer hover:bg-slate-50 transition">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{WEEKDAYS[i]}</p>
                <p className={`text-xl font-bold mt-0.5 ${isToday ? 'text-blue-600' : 'text-slate-700'}`}>{dayNum}</p>
              </div>
              <div className="flex-1 p-1.5 space-y-1 overflow-y-auto">
                {dayEvs.length === 0 ? (
                  <button onClick={() => onDayClick(iso)}
                    className="w-full mt-2 h-8 rounded-lg border-2 border-dashed border-slate-200 text-slate-300 text-sm hover:border-blue-300 hover:text-blue-400 transition">
                    +
                  </button>
                ) : dayEvs.map(ev => {
                  const cfg = EVENT_TYPES[ev.type] || EVENT_TYPES.outro
                  return (
                    <div key={ev.id} onClick={() => onEventClick(ev)}
                      className="cursor-pointer rounded-lg p-2 hover:opacity-80 transition"
                      style={{ background: cfg.bg, borderLeft: `3px solid ${cfg.color}` }}>
                      <p className="text-[11px] font-semibold truncate" style={{ color: cfg.color }}>
                        {ev.start_time ? ev.start_time.slice(0,5) + ' ' : ''}{ev.title}
                      </p>
                      {ev.client_name && <p className="text-[10px] text-slate-500 truncate mt-0.5">{ev.client_name}</p>}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Day View ──────────────────────────────────────────────────────────────────
function DayView({ isoDate, events, onNewEvent, onEventClick }) {
  const today  = todayIso()
  const dayEvs = events
    .filter(e => e.date?.split('T')[0] === isoDate)
    .sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''))

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className={`text-xl font-bold ${isoDate === today ? 'text-blue-600' : 'text-slate-800'}`}>
            {fmtBR(isoDate)}
            {isoDate === today && <span className="ml-2 text-sm text-blue-400 font-medium">Hoje</span>}
          </h2>
          <button onClick={() => onNewEvent(isoDate)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 transition">
            <Plus size={14}/> Adicionar
          </button>
        </div>

        {dayEvs.length === 0 ? (
          <div className="text-center py-20">
            <Calendar size={40} className="mx-auto mb-3 text-slate-200"/>
            <p className="text-sm text-slate-400">Nenhum evento neste dia</p>
            <button onClick={() => onNewEvent(isoDate)} className="mt-3 text-blue-500 text-sm hover:underline">Criar evento</button>
          </div>
        ) : (
          <div className="space-y-3">
            {dayEvs.map(ev => {
              const cfg = EVENT_TYPES[ev.type] || EVENT_TYPES.outro
              return (
                <div key={ev.id} onClick={() => onEventClick(ev)}
                  className="cursor-pointer rounded-2xl p-4 border hover:shadow-md transition"
                  style={{ borderColor: cfg.color + '30', background: cfg.bg + 'aa' }}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{cfg.emoji}</span>
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                          style={{ background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
                        {ev.status !== 'agendado' && (
                          <span className="text-[11px] text-slate-400">
                            {ev.status === 'concluido' ? '✓ Concluído' : '✗ Cancelado'}
                          </span>
                        )}
                      </div>
                      <p className="font-semibold text-slate-800">{ev.title}</p>
                      {ev.client_name && <p className="text-sm text-slate-500 mt-0.5">{ev.client_name}</p>}
                      {ev.location && (
                        <div className="flex items-center gap-1.5 mt-1.5 text-xs text-slate-500">
                          <MapPin size={11}/> {ev.location}
                        </div>
                      )}
                      {ev.notes && <p className="mt-1.5 text-xs text-slate-400 line-clamp-2">{ev.notes}</p>}
                    </div>
                    <div className="text-right shrink-0">
                      {ev.start_time && (
                        <p className="text-sm font-bold" style={{ color: cfg.color }}>
                          {ev.start_time.slice(0,5)}{ev.end_time ? ` – ${ev.end_time.slice(0,5)}` : ''}
                        </p>
                      )}
                      {ev.all_day && <p className="text-xs text-slate-400">Dia inteiro</p>}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Agenda() {
  const { user }   = useAuth()
  const userId     = user?.id

  const now   = new Date()
  const [view,   setView]   = useState('mes')
  const [year,   setYear]   = useState(now.getFullYear())
  const [month,  setMonth]  = useState(now.getMonth() + 1)
  const [curDay, setCurDay] = useState(todayIso())

  const [events,    setEvents]    = useState([])
  const [loading,   setLoading]   = useState(true)
  const [modal,     setModal]     = useState(false)
  const [editEvent, setEditEvent] = useState(null)
  const [newDate,   setNewDate]   = useState(null)
  const [syncing,   setSyncing]   = useState(false)
  const [syncMsg,   setSyncMsg]   = useState('')

  const weekDays = useMemo(() => buildWeekDays(curDay), [curDay])

  const fetchEvents = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    try {
      const p = new URLSearchParams({ user_id: userId })
      if (view === 'mes')    { p.set('year', year); p.set('month', month) }
      else if (view === 'semana') { p.set('date_from', weekDays[0]); p.set('date_to', weekDays[6]) }
      else                        { p.set('date_from', curDay); p.set('date_to', curDay) }
      const r = await fetch(`${API}/api/events?${p}`)
      setEvents(r.ok ? await r.json() : [])
    } catch { setEvents([]) }
    finally { setLoading(false) }
  }, [userId, view, year, month, weekDays, curDay])

  useEffect(() => { fetchEvents() }, [fetchEvents])

  const openCreate = (iso) => { setEditEvent(null); setNewDate(iso); setModal(true) }
  const openEdit   = (ev)  => { setEditEvent(ev);  setNewDate(null); setModal(true) }

  const handleDayClick = (iso) => {
    if (view === 'mes') { setCurDay(iso); setView('dia') }
    else openCreate(iso)
  }

  const handleSaved = (saved, isEdit) => {
    setEvents(prev => isEdit ? prev.map(e => e.id === saved.id ? saved : e) : [saved, ...prev])
    setModal(false)
  }
  const handleDeleted = (id) => { setEvents(prev => prev.filter(e => e.id !== id)); setModal(false) }

  const handleSync = async () => {
    setSyncing(true); setSyncMsg('')
    try {
      const r = await fetch(`${API}/api/events/gcal-sync?user_id=${userId}&date_from=${year}-${String(month).padStart(2,'0')}-01`)
      const d = await r.json()
      setSyncMsg(r.ok ? `✓ ${d.synced} evento(s) sincronizado(s)` : `⚠ ${d.detail || 'Erro'}`)
      if (r.ok) fetchEvents()
    } finally {
      setSyncing(false)
      setTimeout(() => setSyncMsg(''), 5000)
    }
  }

  const goPrev = () => {
    if (view === 'mes') {
      if (month === 1) { setMonth(12); setYear(y => y - 1) } else setMonth(m => m - 1)
    } else if (view === 'semana') {
      const [y, m, d] = weekDays[0].split('-').map(Number)
      setCurDay(toIso(new Date(y, m - 1, d - 7)))
    } else {
      const [y, m, d] = curDay.split('-').map(Number)
      setCurDay(toIso(new Date(y, m - 1, d - 1)))
    }
  }

  const goNext = () => {
    if (view === 'mes') {
      if (month === 12) { setMonth(1); setYear(y => y + 1) } else setMonth(m => m + 1)
    } else if (view === 'semana') {
      const [y, m, d] = weekDays[0].split('-').map(Number)
      setCurDay(toIso(new Date(y, m - 1, d + 7)))
    } else {
      const [y, m, d] = curDay.split('-').map(Number)
      setCurDay(toIso(new Date(y, m - 1, d + 1)))
    }
  }

  const goToday = () => {
    const t = new Date()
    setYear(t.getFullYear()); setMonth(t.getMonth() + 1); setCurDay(todayIso())
  }

  const headerLabel = () => {
    if (view === 'mes')    return `${MONTHS[month - 1]} ${year}`
    if (view === 'semana') return `${fmtBR(weekDays[0])} – ${fmtBR(weekDays[6])}`
    return fmtBR(curDay)
  }

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 60px)' }}>

      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-6 py-3 border-b border-slate-100 bg-white flex-wrap shrink-0">
        <div className="flex items-center gap-2">
          <button onClick={goPrev} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 transition"><ChevronLeft size={17}/></button>
          <span className="text-sm font-bold text-slate-800 min-w-[180px] text-center">{headerLabel()}</span>
          <button onClick={goNext} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 transition"><ChevronRight size={17}/></button>
          <button onClick={goToday}
            className="ml-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 transition">
            Hoje
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* View switcher */}
          <div className="flex rounded-xl overflow-hidden border border-slate-200">
            {[['mes','Mês'],['semana','Semana'],['dia','Dia']].map(([v,l]) => (
              <button key={v} onClick={() => setView(v)}
                className={`px-3 py-1.5 text-xs font-semibold transition ${
                  view === v ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-50'
                }`}>{l}
              </button>
            ))}
          </div>

          {/* Sync GCal */}
          <button onClick={handleSync} disabled={syncing} title="Sincronizar com Google Agenda"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition">
            {syncing ? <Loader2 size={12} className="animate-spin"/> : <RefreshCw size={12}/>}
            Sync GCal
          </button>

          {/* Novo evento */}
          <button onClick={() => openCreate(curDay)}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-sm font-semibold text-white shadow hover:shadow-md transition"
            style={{ background: 'linear-gradient(135deg,#1D4ED8,#2563EB)' }}>
            <Plus size={14}/> Novo Evento
          </button>
        </div>

        {syncMsg && (
          <div className="w-full text-xs text-center py-1 px-3 rounded-lg bg-blue-50 text-blue-700">{syncMsg}</div>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 px-6 py-2 border-b border-slate-100 overflow-x-auto shrink-0 bg-white/70">
        {Object.entries(EVENT_TYPES).map(([k, v]) => (
          <span key={k} className="flex items-center gap-1.5 text-[11px] text-slate-500 whitespace-nowrap">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: v.color }}/>
            {v.label}
          </span>
        ))}
      </div>

      {/* Calendar body */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 size={24} className="animate-spin text-blue-400"/>
        </div>
      ) : (
        <>
          {view === 'mes'    && <MonthView year={year} month={month} events={events} onDayClick={handleDayClick} onEventClick={openEdit}/>}
          {view === 'semana' && <WeekView weekDays={weekDays} events={events} onDayClick={handleDayClick} onEventClick={openEdit}/>}
          {view === 'dia'    && <DayView isoDate={curDay} events={events} onNewEvent={openCreate} onEventClick={openEdit}/>}
        </>
      )}

      {/* Modal */}
      {modal && (
        <EventModal
          initial={editEvent || (newDate ? { date: newDate } : null)}
          userId={userId}
          onClose={() => { setModal(false); setEditEvent(null) }}
          onSaved={handleSaved}
          onDeleted={handleDeleted}
        />
      )}
    </div>
  )
}
