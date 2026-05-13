import { useState, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { FileText, Plus, Trash2, Send, Loader2, CheckCircle, ChevronDown, ImagePlus, X } from 'lucide-react'

const API_BASE = import.meta.env.VITE_API_URL || ''

const SEGMENTS = [
  { value: 'ac',       label: 'Climatização / AC' },
  { value: 'cftv',     label: 'CFTV / Segurança' },
  { value: 'ti',       label: 'TI / Redes' },
  { value: 'eletrica', label: 'Instalações Elétricas' },
  { value: 'hidraulica', label: 'Hidráulica' },
  { value: 'alarme',   label: 'Alarme / Monitoramento' },
  { value: 'automacao', label: 'Automação Predial' },
  { value: 'telecom',  label: 'Telecomunicações' },
]

const EMPTY_EQUIP = { description: '', quantity: 1, unit_price: 0 }

export default function AgenteComercial() {
  const { user } = useAuth()
  const [loading,  setLoading]  = useState(false)
  const [success,  setSuccess]  = useState(null)
  const [error,    setError]    = useState('')
  const [form, setForm] = useState({
    client_name:   '',
    client_email:  '',
    service:       '',
    segment:       'ac',
    notes:         '',
    company_name:  '',
  })
  const [equipments, setEquipments] = useState([{ ...EMPTY_EQUIP }])
  const [logoBase64, setLogoBase64] = useState(null)
  const logoInputRef = useRef(null)

  const setField = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  function handleLogoChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setLogoBase64(ev.target.result)
    reader.readAsDataURL(file)
  }

  function addEquip() { setEquipments(e => [...e, { ...EMPTY_EQUIP }]) }
  function removeEquip(i) { setEquipments(e => e.filter((_, idx) => idx !== i)) }
  function setEquip(i, k, v) {
    setEquipments(e => e.map((eq, idx) => idx === i ? { ...eq, [k]: v } : eq))
  }

  const total = equipments.reduce((s, e) => s + (Number(e.quantity) * Number(e.unit_price)), 0)

  async function handleSubmit(ev) {
    ev.preventDefault()
    setError(''); setSuccess(null); setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/proposals/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user?.id,
          ...form,
          equipments: equipments.map(e => ({
            description: e.description,
            quantity:    Number(e.quantity),
            unit_price:  Number(e.unit_price),
          })),
          logo_base64:  logoBase64 || null,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || `Erro ${res.status}`)
      }
      const data = await res.json()
      setSuccess(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (success) return (
    <div className="flex items-center justify-center min-h-[60vh] p-8">
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
          style={{ background: 'rgba(16,185,129,0.1)' }}>
          <CheckCircle size={32} className="text-emerald-500" />
        </div>
        <h2 className="text-[1.2rem] font-black text-slate-800 mb-2">Proposta gerada!</h2>
        <p className="text-[0.83rem] text-slate-500 mb-6">{success.message}</p>
        <div className="rounded-2xl p-4 mb-6 text-left space-y-2"
          style={{ background: 'rgba(37,99,235,0.05)', border: '1px solid rgba(37,99,235,0.12)' }}>
          <div className="flex justify-between text-[0.8rem]">
            <span className="text-slate-500">Valor total</span>
            <span className="font-bold text-slate-800">R$ {Number(success.total_value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between text-[0.8rem]">
            <span className="text-slate-500">E-mail enviado</span>
            <span className={`font-semibold ${success.email_sent ? 'text-emerald-600' : 'text-orange-500'}`}>
              {success.email_sent ? 'Sim' : 'Não'}
            </span>
          </div>
        </div>
        {success.docx_url && (
          <a href={`${API_BASE}${success.docx_url}`} target="_blank" rel="noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-[0.85rem] font-bold text-white mb-4 w-full justify-center"
            style={{ background: 'linear-gradient(135deg,#1D4ED8,#3B82F6)', boxShadow: '0 4px 16px rgba(37,99,235,0.35)' }}>
            <FileText size={15} /> Baixar proposta .docx
          </a>
        )}
        <button onClick={() => { setSuccess(null); setForm({ client_name:'', client_email:'', service:'', segment:'ac', notes:'', company_name:'' }); setEquipments([{...EMPTY_EQUIP}]); setLogoBase64(null) }}
          className="text-[0.8rem] text-slate-400 hover:text-slate-600 transition-colors">
          Gerar nova proposta
        </button>
      </div>
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="flex items-center gap-3 mb-7">
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg,#1D4ED8,#06B6D4)', boxShadow: '0 4px 16px rgba(37,99,235,0.3)' }}>
          <FileText size={18} className="text-white" />
        </div>
        <div>
          <h1 className="text-[1.1rem] font-black text-slate-800">Agente Comercial</h1>
          <p className="text-[0.75rem] text-slate-500">Gere propostas profissionais em segundos com IA</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Cliente */}
        <Section title="Dados do Cliente">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Nome do cliente" value={form.client_name} onChange={setField('client_name')} placeholder="Empresa ABC Ltda" required />
            <Field label="E-mail do cliente" type="email" value={form.client_email} onChange={setField('client_email')} placeholder="contato@empresa.com" required />
          </div>
        </Section>

        {/* Serviço */}
        <Section title="Serviço">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[0.73rem] font-bold text-slate-600 mb-1.5">Segmento</label>
              <div className="relative">
                <select value={form.segment} onChange={setField('segment')} required
                  className="w-full appearance-none px-3 py-2.5 rounded-xl text-[0.83rem] text-slate-800 outline-none pr-8"
                  style={{ background:'rgba(255,255,255,0.9)', border:'1.5px solid rgba(37,99,235,0.15)' }}
                  onFocus={e => e.target.style.borderColor='#3B82F6'}
                  onBlur={e => e.target.style.borderColor='rgba(37,99,235,0.15)'}>
                  {SEGMENTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>
            <Field label="Descrição do serviço" value={form.service} onChange={setField('service')} placeholder="Instalação de sistema CFTV" required />
          </div>
          <Field label="Observações (opcional)" value={form.notes} onChange={setField('notes')} placeholder="Informações adicionais para a proposta..." />
        </Section>

        {/* Identidade Visual */}
        <Section title="Identidade Visual (opcional)">
          <div className="grid grid-cols-2 gap-3 items-start">
            {/* Upload de logo */}
            <div>
              <label className="block text-[0.73rem] font-bold text-slate-600 mb-1.5">Logo da empresa</label>
              <input
                ref={logoInputRef}
                type="file"
                accept="image/png,image/jpeg,image/svg+xml,image/webp"
                className="hidden"
                onChange={handleLogoChange}
              />
              {logoBase64 ? (
                <div className="relative w-full h-[72px] rounded-xl border border-blue-200 bg-blue-50 flex items-center justify-center overflow-hidden">
                  <img src={logoBase64} alt="logo" className="max-h-[56px] max-w-full object-contain" />
                  <button type="button" onClick={() => { setLogoBase64(null); logoInputRef.current.value = '' }}
                    className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-red-500 shadow-sm">
                    <X size={10} />
                  </button>
                </div>
              ) : (
                <button type="button" onClick={() => logoInputRef.current.click()}
                  className="w-full h-[72px] rounded-xl border-2 border-dashed border-blue-200 flex flex-col items-center justify-center gap-1 text-slate-400 hover:border-blue-400 hover:text-blue-500 transition-colors bg-white">
                  <ImagePlus size={18} />
                  <span className="text-[0.7rem] font-medium">Clique para enviar</span>
                </button>
              )}
              <p className="text-[0.66rem] text-slate-400 mt-1">PNG, JPG ou SVG · máx 2 MB</p>
            </div>

            {/* Nome da empresa */}
            <Field
              label="Nome da empresa (no docx)"
              value={form.company_name}
              onChange={setField('company_name')}
              placeholder="Ex: TechInfra Soluções"
            />
          </div>
        </Section>

        {/* Equipamentos */}
        <Section title="Equipamentos / Itens">
          <div className="space-y-2">
            {equipments.map((eq, i) => (
              <div key={i} className="grid gap-2 items-end" style={{ gridTemplateColumns: '1fr 80px 110px 36px' }}>
                <Field label={i === 0 ? 'Descrição' : ''} value={eq.description}
                  onChange={e => setEquip(i, 'description', e.target.value)}
                  placeholder="Ex: Câmera IP 4MP" required />
                <Field label={i === 0 ? 'Qtd' : ''} type="number" min="1" value={eq.quantity}
                  onChange={e => setEquip(i, 'quantity', e.target.value)} required />
                <Field label={i === 0 ? 'Valor unit. (R$)' : ''} type="number" min="0" step="0.01" value={eq.unit_price}
                  onChange={e => setEquip(i, 'unit_price', e.target.value)} placeholder="0,00" required />
                <button type="button" onClick={() => removeEquip(i)}
                  disabled={equipments.length === 1}
                  className="h-[38px] w-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all disabled:opacity-30 disabled:pointer-events-none"
                  style={{ border: '1.5px solid rgba(37,99,235,0.12)', marginTop: i === 0 ? '22px' : 0 }}>
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>

          <button type="button" onClick={addEquip}
            className="mt-3 flex items-center gap-1.5 text-[0.75rem] font-semibold text-blue-600 hover:text-blue-800 transition-colors">
            <Plus size={13} /> Adicionar item
          </button>

          <div className="flex justify-end mt-3 pt-3" style={{ borderTop: '1px solid rgba(37,99,235,0.08)' }}>
            <span className="text-[0.8rem] text-slate-500 mr-2">Total estimado:</span>
            <span className="text-[0.9rem] font-black text-slate-800">
              R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </Section>

        {error && (
          <div className="px-4 py-3 rounded-xl text-[0.78rem] font-medium text-red-700"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
            {error}
          </div>
        )}

        <button type="submit" disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-[0.88rem] font-bold text-white transition-all disabled:opacity-60 hover:opacity-90"
          style={{ background: 'linear-gradient(135deg,#1D4ED8,#3B82F6)', boxShadow: '0 4px 20px rgba(37,99,235,0.4)' }}>
          {loading ? <Loader2 size={16} className="animate-spin" /> : <><Send size={15} /> Gerar proposta com IA</>}
        </button>
      </form>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.8)', border: '1px solid rgba(37,99,235,0.08)', boxShadow: '0 2px 12px rgba(37,99,235,0.04)' }}>
      <h3 className="text-[0.72rem] font-bold text-slate-400 uppercase tracking-wider mb-3">{title}</h3>
      {children}
    </div>
  )
}

function Field({ label, ...props }) {
  return (
    <div>
      {label && <label className="block text-[0.73rem] font-bold text-slate-600 mb-1.5">{label}</label>}
      <input
        {...props}
        className="w-full px-3 py-2.5 rounded-xl text-[0.83rem] text-slate-800 outline-none transition-all"
        style={{ background: 'rgba(255,255,255,0.9)', border: '1.5px solid rgba(37,99,235,0.15)', boxShadow: '0 1px 4px rgba(0,0,0,0.03)' }}
        onFocus={e => e.target.style.borderColor = '#3B82F6'}
        onBlur={e => e.target.style.borderColor = 'rgba(37,99,235,0.15)'}
      />
    </div>
  )
}
