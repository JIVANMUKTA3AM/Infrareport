import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import {
  FileText, TrendingUp, FileSpreadsheet, Download,
  Calendar, Filter, ChevronRight, Loader2, CheckCircle2,
  BarChart3, Users, AlertCircle,
} from 'lucide-react'

// ── Helpers ───────────────────────────────────────────────────────────────────
const BASE = 'https://api.infrareport.3amgflowz.com.br'
const API = (path, body) =>
  fetch(`${BASE}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })

const fmt = (bytes) => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

const today = () => new Date().toISOString().split('T')[0]
const monthStart = () => {
  const d = new Date(); d.setDate(1)
  return d.toISOString().split('T')[0]
}

// ── Sub-components ────────────────────────────────────────────────────────────
function StatusBadge({ status, text }) {
  const map = {
    idle:    { bg: '#F1F5F9', color: '#64748B' },
    loading: { bg: '#DBEAFE', color: '#1D4ED8' },
    success: { bg: '#D1FAE5', color: '#059669' },
    error:   { bg: '#FEE2E2', color: '#DC2626' },
  }
  const s = map[status] || map.idle
  return (
    <span style={{ background: s.bg, color: s.color, padding: '3px 10px',
      borderRadius: 99, fontSize: 11, fontWeight: 600 }}>
      {text}
    </span>
  )
}

function ReportCard({ icon: Icon, title, description, accent, children }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 14, padding: 24,
      boxShadow: '0 1px 4px rgba(0,0,0,.06)', border: '1px solid #F1F5F9',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
        <div style={{
          width: 42, height: 42, borderRadius: 10, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          background: `${accent}18`,
        }}>
          <Icon size={20} style={{ color: accent }} />
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, color: '#1E293B' }}>{title}</div>
          <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 1 }}>{description}</div>
        </div>
      </div>
      {children}
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ fontSize: 11, fontWeight: 600, color: '#64748B',
        textTransform: 'uppercase', letterSpacing: '.4px', display: 'block', marginBottom: 4 }}>
        {label}
      </label>
      {children}
    </div>
  )
}

const inputStyle = {
  width: '100%', padding: '7px 10px', borderRadius: 8, border: '1px solid #E2E8F0',
  fontSize: 13, color: '#1E293B', background: '#fff', outline: 'none',
}

function ExportButtons({ onPdf, onXlsx, state }) {
  const loading = state === 'loading'
  const btnBase = {
    display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
    borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
    border: 'none', transition: 'opacity .15s',
    opacity: loading ? .6 : 1,
  }
  return (
    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
      <button onClick={onPdf} disabled={loading}
        style={{ ...btnBase, background: '#1D4ED8', color: '#fff' }}>
        {loading
          ? <Loader2 size={14} className="animate-spin" />
          : <FileText size={14} />}
        Exportar PDF
      </button>
      <button onClick={onXlsx} disabled={loading}
        style={{ ...btnBase, background: '#059669', color: '#fff' }}>
        {loading
          ? <Loader2 size={14} className="animate-spin" />
          : <FileSpreadsheet size={14} />}
        Exportar Excel
      </button>
    </div>
  )
}

function SuccessResult({ result, onReset }) {
  return (
    <div style={{
      background: '#D1FAE5', border: '1px solid #A7F3D0', borderRadius: 10,
      padding: '12px 16px', display: 'flex', alignItems: 'center',
      justifyContent: 'space-between', marginTop: 10,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <CheckCircle2 size={16} style={{ color: '#059669' }} />
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#065F46' }}>
            {result.file_name}
          </div>
          <div style={{ fontSize: 11, color: '#047857' }}>{fmt(result.size_bytes)}</div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <a href={result.download_url} target="_blank" rel="noreferrer"
          style={{
            display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px',
            background: '#059669', color: '#fff', borderRadius: 7,
            fontSize: 12, fontWeight: 700, textDecoration: 'none',
          }}>
          <Download size={13} /> Baixar
        </a>
        <button onClick={onReset} style={{
          padding: '6px 12px', background: '#fff', border: '1px solid #A7F3D0',
          borderRadius: 7, fontSize: 12, color: '#059669', fontWeight: 600, cursor: 'pointer',
        }}>
          Novo
        </button>
      </div>
    </div>
  )
}

function ErrorResult({ message }) {
  return (
    <div style={{
      background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10,
      padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8, marginTop: 10,
    }}>
      <AlertCircle size={15} style={{ color: '#DC2626', flexShrink: 0 }} />
      <span style={{ fontSize: 12, color: '#B91C1C' }}>{message}</span>
    </div>
  )
}

// ── Recent files ──────────────────────────────────────────────────────────────
function RecentReports({ userId, refreshKey }) {
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) return
    setLoading(true)
    fetch(`/files?user_id=${userId}&file_type=relatorio`)
      .then(r => r.ok ? r.json() : [])
      .then(data => setFiles(Array.isArray(data) ? data.slice(0, 10) : []))
      .finally(() => setLoading(false))
  }, [userId, refreshKey])

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}>
      <Loader2 size={18} className="animate-spin" style={{ color: '#94A3B8' }} />
    </div>
  )

  if (!files.length) return (
    <div style={{ textAlign: 'center', padding: '28px 0', color: '#94A3B8', fontSize: 13 }}>
      Nenhum relatório gerado ainda.
    </div>
  )

  const fmtDate = (s) => {
    if (!s) return '—'
    const d = new Date(s)
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {files.map(f => (
        <div key={f.id} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 14px', background: '#F8FAFC', borderRadius: 9,
          border: '1px solid #F1F5F9',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <FileText size={15} style={{ color: '#1D4ED8', flexShrink: 0 }} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#1E293B',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 300 }}>
                {f.file_name}
              </div>
              <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 1 }}>
                {fmtDate(f.created_at)} · {fmt(f.size_bytes || 0)}
              </div>
            </div>
          </div>
          <a href={`/files/${f.id}/download?user_id=${userId}`} target="_blank" rel="noreferrer"
            style={{
              display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px',
              background: '#EFF6FF', color: '#1D4ED8', borderRadius: 7,
              fontSize: 11, fontWeight: 700, textDecoration: 'none', flexShrink: 0,
            }}>
            <Download size={12} /> Baixar
          </a>
        </div>
      ))}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function Relatorios() {
  const { user } = useAuth()
  const userId = user?.id

  const [refreshKey, setRefreshKey] = useState(0)

  // ── Financeiro state ──────────────────────────────────────────────────────
  const [finState, setFinState] = useState('idle')
  const [finResult, setFinResult] = useState(null)
  const [finError, setFinError]   = useState(null)
  const [finForm, setFinForm]     = useState({ date_from: monthStart(), date_to: today(), category: '', project_id: '' })

  // ── Projetos state ────────────────────────────────────────────────────────
  const [projState, setProjState] = useState('idle')
  const [projResult, setProjResult] = useState(null)
  const [projError, setProjError]   = useState(null)
  const [projForm, setProjForm]     = useState({ date_from: '', date_to: '', status: '', client: '' })

  // ── Propostas state ───────────────────────────────────────────────────────
  const [propState, setPropState] = useState('idle')
  const [propResult, setPropResult] = useState(null)
  const [propError, setPropError]   = useState(null)
  const [propForm, setPropForm]     = useState({ date_from: monthStart(), date_to: today(), status: '', client: '' })

  // ── Generators ────────────────────────────────────────────────────────────
  const generate = useCallback(async (endpoint, payload, setS, setR, setE) => {
    if (!userId) return
    setS('loading'); setR(null); setE(null)
    try {
      const r = await API(`/api/reports/${endpoint}`, { user_id: userId, ...payload })
      if (!r.ok) {
        const d = await r.json().catch(() => ({}))
        throw new Error(d.detail || `Erro ${r.status}`)
      }
      const data = await r.json()
      setR(data)
      setS('success')
      setRefreshKey(k => k + 1)
    } catch (err) {
      setE(err.message || 'Erro ao gerar relatório.')
      setS('error')
    }
  }, [userId])

  const genFin = (format) => generate('financeiro',
    { format, ...finForm, category: finForm.category || undefined, project_id: finForm.project_id || undefined },
    setFinState, setFinResult, setFinError,
  )
  const genProj = (format) => generate('projetos',
    { format, ...projForm, status: projForm.status || undefined, client: projForm.client || undefined },
    setProjState, setProjResult, setProjError,
  )
  const genProp = (format) => generate('propostas',
    { format, ...propForm, status: propForm.status || undefined, client: propForm.client || undefined },
    setPropState, setPropResult, setPropError,
  )

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1100 }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1E293B', margin: 0 }}>Relatórios</h1>
        <p style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>
          Gere relatórios em PDF ou Excel. Todos são salvos automaticamente em Arquivos.
        </p>
      </div>

      {/* Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20, marginBottom: 32 }}>

        {/* ── FINANCEIRO ── */}
        <ReportCard icon={TrendingUp} title="Relatório Financeiro" accent="#1D4ED8"
          description="Entradas × saídas, saldo, por categoria">

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 4 }}>
            <Field label="De">
              <input type="date" value={finForm.date_from} style={inputStyle}
                onChange={e => setFinForm(f => ({ ...f, date_from: e.target.value }))} />
            </Field>
            <Field label="Até">
              <input type="date" value={finForm.date_to} style={inputStyle}
                onChange={e => setFinForm(f => ({ ...f, date_to: e.target.value }))} />
            </Field>
          </div>

          <Field label="Categoria (opcional)">
            <input type="text" value={finForm.category} placeholder="ex: material, mao_de_obra"
              style={inputStyle}
              onChange={e => setFinForm(f => ({ ...f, category: e.target.value }))} />
          </Field>

          {finState === 'success' && finResult
            ? <SuccessResult result={finResult} onReset={() => { setFinState('idle'); setFinResult(null) }} />
            : <>
              {finState === 'error' && <ErrorResult message={finError} />}
              <ExportButtons onPdf={() => genFin('pdf')} onXlsx={() => genFin('xlsx')} state={finState} />
            </>
          }
        </ReportCard>

        {/* ── PROJETOS ── */}
        <ReportCard icon={BarChart3} title="Relatório de Projetos" accent="#7C3AED"
          description="Status, margem, tempo médio de execução">

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 4 }}>
            <Field label="Início a partir de">
              <input type="date" value={projForm.date_from} style={inputStyle}
                onChange={e => setProjForm(f => ({ ...f, date_from: e.target.value }))} />
            </Field>
            <Field label="Início até">
              <input type="date" value={projForm.date_to} style={inputStyle}
                onChange={e => setProjForm(f => ({ ...f, date_to: e.target.value }))} />
            </Field>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Field label="Status">
              <select value={projForm.status} style={inputStyle}
                onChange={e => setProjForm(f => ({ ...f, status: e.target.value }))}>
                <option value="">Todos</option>
                <option value="aguardando">Aguardando</option>
                <option value="em_andamento">Em Andamento</option>
                <option value="concluido">Concluído</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </Field>
            <Field label="Cliente (opcional)">
              <input type="text" value={projForm.client} placeholder="Buscar cliente"
                style={inputStyle}
                onChange={e => setProjForm(f => ({ ...f, client: e.target.value }))} />
            </Field>
          </div>

          {projState === 'success' && projResult
            ? <SuccessResult result={projResult} onReset={() => { setProjState('idle'); setProjResult(null) }} />
            : <>
              {projState === 'error' && <ErrorResult message={projError} />}
              <ExportButtons onPdf={() => genProj('pdf')} onXlsx={() => genProj('xlsx')} state={projState} />
            </>
          }
        </ReportCard>

        {/* ── PROPOSTAS ── */}
        <ReportCard icon={Users} title="Relatório de Propostas" accent="#D97706"
          description="Taxa de conversão, valor médio, funil">

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 4 }}>
            <Field label="De">
              <input type="date" value={propForm.date_from} style={inputStyle}
                onChange={e => setPropForm(f => ({ ...f, date_from: e.target.value }))} />
            </Field>
            <Field label="Até">
              <input type="date" value={propForm.date_to} style={inputStyle}
                onChange={e => setPropForm(f => ({ ...f, date_to: e.target.value }))} />
            </Field>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Field label="Status">
              <select value={propForm.status} style={inputStyle}
                onChange={e => setPropForm(f => ({ ...f, status: e.target.value }))}>
                <option value="">Todos</option>
                <option value="pendente">Pendente</option>
                <option value="enviada">Enviada</option>
                <option value="aprovada">Aprovada</option>
                <option value="rejeitada">Rejeitada</option>
              </select>
            </Field>
            <Field label="Cliente (opcional)">
              <input type="text" value={propForm.client} placeholder="Buscar cliente"
                style={inputStyle}
                onChange={e => setPropForm(f => ({ ...f, client: e.target.value }))} />
            </Field>
          </div>

          {propState === 'success' && propResult
            ? <SuccessResult result={propResult} onReset={() => { setPropState('idle'); setPropResult(null) }} />
            : <>
              {propState === 'error' && <ErrorResult message={propError} />}
              <ExportButtons onPdf={() => genProp('pdf')} onXlsx={() => genProp('xlsx')} state={propState} />
            </>
          }
        </ReportCard>
      </div>

      {/* Recent reports */}
      <div style={{
        background: '#fff', borderRadius: 14, padding: 24,
        boxShadow: '0 1px 4px rgba(0,0,0,.06)', border: '1px solid #F1F5F9',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <FileText size={17} style={{ color: '#1D4ED8' }} />
          <h2 style={{ fontSize: 15, fontWeight: 700, color: '#1E293B', margin: 0 }}>Relatórios Recentes</h2>
          <a href="#arquivos" style={{ marginLeft: 'auto', fontSize: 12, color: '#1D4ED8',
            fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
            Ver todos <ChevronRight size={14} />
          </a>
        </div>
        <RecentReports userId={userId} refreshKey={refreshKey} />
      </div>
    </div>
  )
}
