import { useState, useMemo } from 'react'
import { Eye, Download, CheckCircle, XCircle, Search, FileText } from 'lucide-react'
import { PROPOSTAS_MOCK } from '../data/mock'

function formatBRL(value) {
  return `R$ ${Number(value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
}

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
    slate: 'hover:bg-slate-100 hover:text-slate-800 text-slate-500 border-slate-200',
    emerald: 'hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 text-emerald-600 border-emerald-200',
    red: 'hover:bg-red-50 hover:text-red-700 hover:border-red-300 text-red-600 border-red-200',
    blue: 'hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 text-blue-600 border-blue-200'
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

export default function Propostas() {
  const [filter, setFilter] = useState('todas')
  const [search, setSearch] = useState('')
  const [propostas, setPropostas] = useState(PROPOSTAS_MOCK)
  const [selectedProp, setSelectedProp] = useState(null)

  const filteredPropostas = useMemo(() => {
    return propostas.filter(p => {
      const matchFilter = filter === 'todas' || p.status === filter
      const matchSearch = p.client_name.toLowerCase().includes(search.toLowerCase()) || 
                          p.service.toLowerCase().includes(search.toLowerCase())
      return matchFilter && matchSearch
    })
  }, [propostas, filter, search])

  const kpis = useMemo(() => {
    const total = propostas.length
    const aprovadas = propostas.filter(p => p.status === 'aprovada').length
    const pendentes = propostas.filter(p => p.status === 'pendente' || p.status === 'draft').length
    const valor = propostas.reduce((acc, p) => acc + (p.value || 0), 0)
    return { total, aprovadas, pendentes, valor }
  }, [propostas])

  const handleApprove = (id) => {
    setPropostas(prev => prev.map(p => p.id === id ? { ...p, status: 'aprovada' } : p))
  }

  const handleReject = (id) => {
    setPropostas(prev => prev.map(p => p.id === id ? { ...p, status: 'rejeitada' } : p))
  }

  return (
    <div className="p-7 space-y-5 animate-fade-up">

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

            <button className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 text-white rounded-lg text-[0.75rem] font-bold shadow-md shadow-blue-600/20 hover:bg-blue-700 transition-colors">
              Nova Proposta
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-3 text-[0.68rem] font-bold uppercase tracking-wider text-slate-400">Cliente</th>
                <th className="px-6 py-3 text-[0.68rem] font-bold uppercase tracking-wider text-slate-400">Serviço</th>
                <th className="px-6 py-3 text-[0.68rem] font-bold uppercase tracking-wider text-slate-400">Valor</th>
                <th className="px-6 py-3 text-[0.68rem] font-bold uppercase tracking-wider text-slate-400">Status</th>
                <th className="px-6 py-3 text-[0.68rem] font-bold uppercase tracking-wider text-slate-400">Data</th>
                <th className="px-6 py-3 text-[0.68rem] font-bold uppercase tracking-wider text-slate-400">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPropostas.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    <div className="text-4xl mb-3">📭</div>
                    <p className="text-[0.85rem]">Nenhuma proposta encontrada.</p>
                  </td>
                </tr>
              ) : (
                filteredPropostas.map(p => {
                  const s = p.status
                  const iconMap = { AC:'❄️', CFTV:'📷', TI:'🖥️', ELETRICA:'⚡', HIDRAULICA:'🔧' }
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-lg">
                            {iconMap[p.segment?.toUpperCase()] || '📄'}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-800 text-[0.85rem]">{p.client_name}</div>
                            <div className="text-slate-400 text-[0.75rem]">{p.client_email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-[0.8rem] text-slate-600 max-w-[200px] truncate">
                        {p.service}
                      </td>
                      <td className="px-6 py-4 text-[0.85rem] font-bold text-slate-800">
                        {formatBRL(p.value)}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={s} />
                      </td>
                      <td className="px-6 py-4 text-[0.75rem] text-slate-500">
                        {new Date(p.created_at).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                          <ActionButton icon={Eye} label="Ver" onClick={() => setSelectedProp(p)} />
                          <ActionButton icon={Download} label=".docx" onClick={() => {}} color="blue" />
                          
                          {(s === 'pendente' || s === 'draft' || s === 'enviada') && (
                            <ActionButton icon={CheckCircle} label="Aprovar" onClick={() => handleApprove(p.id)} color="emerald" />
                          )}
                          {(s !== 'aprovada' && s !== 'rejeitada') && (
                            <ActionButton icon={XCircle} label="Rejeitar" onClick={() => handleReject(p.id)} color="red" />
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
                <div className="font-medium text-slate-800 text-[0.85rem]">{selectedProp.client_email}</div>
              </div>
              <div>
                <div className="text-[0.65rem] font-bold uppercase tracking-wider text-slate-400 mb-1">Status</div>
                <StatusBadge status={selectedProp.status} />
              </div>
              <div>
                <div className="text-[0.65rem] font-bold uppercase tracking-wider text-slate-400 mb-1">Total</div>
                <div className="font-serif font-black text-emerald-600 text-xl">{formatBRL(selectedProp.value)}</div>
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
                      {selectedProp.equipments?.length > 0 ? selectedProp.equipments.map((eq, i) => (
                        <tr key={i}>
                          <td className="px-4 py-2.5 text-slate-700">{eq.description}</td>
                          <td className="px-4 py-2.5 text-slate-600 font-medium">{eq.quantity}</td>
                          <td className="px-4 py-2.5 text-slate-600">{formatBRL(eq.unit_price)}</td>
                          <td className="px-4 py-2.5 text-slate-800 font-medium">{formatBRL(eq.quantity * eq.unit_price)}</td>
                        </tr>
                      )) : (
                        <tr><td colSpan={4} className="px-4 py-3 text-center text-slate-400">Nenhum equipamento listado.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 flex items-center justify-end gap-3 bg-white">
              <button className="px-4 py-2 text-[0.8rem] font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors" onClick={() => setSelectedProp(null)}>
                Fechar
              </button>
              <button className="flex items-center gap-1.5 px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-lg text-[0.8rem] font-bold transition-colors">
                <Download size={14} /> Baixar PDF/.docx
              </button>
              {(selectedProp.status === 'pendente' || selectedProp.status === 'draft') && (
                <button 
                  onClick={() => { handleApprove(selectedProp.id); setSelectedProp(null) }}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[0.8rem] font-bold shadow-md shadow-emerald-600/20 transition-colors"
                >
                  <CheckCircle size={14} /> Aprovar Proposta
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
