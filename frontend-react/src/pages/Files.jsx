import { useState, useEffect, useCallback } from 'react'
import { FileText, FileSpreadsheet, File, RefreshCw, Search } from 'lucide-react'
import DownloadButton from '../components/ui/DownloadButton'
import { useAuth } from '../context/AuthContext'

const API_BASE = import.meta.env.VITE_API_URL || ''

const TYPE_CONFIG = {
  proposta:   { label: 'Proposta',   icon: FileText,        color: 'text-blue-600',   bg: 'bg-blue-50' },
  relatorio:  { label: 'Relatório',  icon: File,            color: 'text-purple-600', bg: 'bg-purple-50' },
  financeiro: { label: 'Financeiro', icon: FileSpreadsheet, color: 'text-emerald-600',bg: 'bg-emerald-50' },
}

const FILTERS = [
  { value: '',          label: 'Todos'      },
  { value: 'proposta',  label: 'Propostas'  },
  { value: 'relatorio', label: 'Relatórios' },
  { value: 'financeiro',label: 'Financeiro' },
]

function FileTypeIcon({ type }) {
  const cfg = TYPE_CONFIG[type] || TYPE_CONFIG.proposta
  const Icon = cfg.icon
  return (
    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${cfg.bg} shrink-0`}>
      <Icon size={16} className={cfg.color} />
    </div>
  )
}

function FileRow({ file, userId }) {
  const cfg = TYPE_CONFIG[file.file_type] || TYPE_CONFIG.proposta
  const date = new Date(file.created_at).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'short', year: 'numeric',
  })

  return (
    <tr className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-3">
          <FileTypeIcon type={file.file_type} />
          <div>
            <div className="text-[0.83rem] font-medium text-slate-800 leading-tight">{file.file_name}</div>
            <div className="text-[0.72rem] text-slate-400 mt-0.5">{file.size_fmt}</div>
          </div>
        </div>
      </td>
      <td className="px-5 py-3.5">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[0.7rem] font-semibold ${cfg.bg} ${cfg.color}`}>
          {cfg.label}
        </span>
      </td>
      <td className="px-5 py-3.5 text-[0.78rem] text-slate-500 whitespace-nowrap">{date}</td>
      <td className="px-5 py-3.5">
        <DownloadButton fileId={file.id} userId={userId} label="Baixar arquivo" variant="outline" size="sm" />
      </td>
    </tr>
  )
}

function EmptyState({ filter }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
      <FileText size={40} strokeWidth={1.2} />
      <p className="text-[0.9rem] font-medium text-slate-600">Nenhum arquivo encontrado</p>
      <p className="text-[0.8rem]">
        {filter ? `Sem arquivos do tipo "${filter}"` : 'Gere propostas ou relatórios para vê-los aqui.'}
      </p>
    </div>
  )
}

export default function Files() {
  const { user }  = useAuth()
  const userId    = user?.id
  const [files,   setFiles]   = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')
  const [filter,  setFilter]  = useState('')
  const [search,  setSearch]  = useState('')

  const fetchFiles = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    setError('')
    try {
      const qs = new URLSearchParams({ user_id: userId })
      if (filter) qs.set('file_type', filter)
      const res = await fetch(`${API_BASE}/files?${qs}`)
      if (!res.ok) throw new Error(`Erro ${res.status}`)
      setFiles(await res.json())
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [filter, userId])

  useEffect(() => { fetchFiles() }, [fetchFiles])

  const displayed = files.filter(f =>
    !search || f.file_name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-8 space-y-5">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-[1rem] font-semibold text-slate-800">Arquivos Gerados</h2>
          <p className="text-[0.78rem] text-slate-400 mt-0.5">Propostas, relatórios e exportações</p>
        </div>
        <button
          onClick={fetchFiles}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-[0.78rem] font-medium text-slate-500
            border border-slate-200 rounded-lg hover:border-blue-300 hover:text-primary transition-colors"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          Atualizar
        </button>
      </div>

      {/* ── Filtros + Busca ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex bg-slate-100 rounded-lg p-1 gap-0.5">
          {FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-3.5 py-1.5 rounded-md text-[0.75rem] font-medium transition-all
                ${filter === f.value
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'}`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar arquivo..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-[0.78rem] border border-slate-200 rounded-lg
              bg-white focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400/30"
          />
        </div>
      </div>

      {/* ── Tabela ─────────────────────────────────────────────────────── */}
      <div className="card overflow-hidden">
        {error ? (
          <div className="flex items-center gap-2 p-6 text-red-600 text-[0.82rem]">
            ⚠️ {error}
            <button onClick={fetchFiles} className="underline ml-1">Tentar novamente</button>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center py-20 gap-2 text-slate-400">
            <RefreshCw size={18} className="animate-spin" />
            <span className="text-[0.85rem]">Carregando arquivos...</span>
          </div>
        ) : displayed.length === 0 ? (
          <EmptyState filter={filter} />
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-5 py-3 text-left text-[0.7rem] font-bold uppercase tracking-wider text-slate-400">Arquivo</th>
                <th className="px-5 py-3 text-left text-[0.7rem] font-bold uppercase tracking-wider text-slate-400">Tipo</th>
                <th className="px-5 py-3 text-left text-[0.7rem] font-bold uppercase tracking-wider text-slate-400">Data</th>
                <th className="px-5 py-3 text-left text-[0.7rem] font-bold uppercase tracking-wider text-slate-400">Ação</th>
              </tr>
            </thead>
            <tbody>
              {displayed.map(file => <FileRow key={file.id} file={file} userId={userId} />)}
            </tbody>
          </table>
        )}

        {/* Rodapé com contagem */}
        {!loading && !error && displayed.length > 0 && (
          <div className="px-5 py-3 border-t border-slate-100 text-[0.72rem] text-slate-400">
            {displayed.length} arquivo{displayed.length !== 1 ? 's' : ''} encontrado{displayed.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

    </div>
  )
}
