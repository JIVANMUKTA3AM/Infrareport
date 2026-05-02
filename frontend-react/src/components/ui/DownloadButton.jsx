import { useState } from 'react'
import { Download, Loader2, CheckCircle, AlertCircle } from 'lucide-react'

const API_BASE = import.meta.env.VITE_API_URL || ''

/**
 * Botão de download seguro para arquivos do InfraReport.
 *
 * Props:
 *   fileId   — UUID do arquivo na tabela files
 *   userId   — UUID do usuário autenticado
 *   label    — texto do botão (default: "Baixar arquivo")
 *   variant  — 'primary' | 'outline' | 'ghost'
 *   size     — 'sm' | 'md'
 */
export default function DownloadButton({
  fileId,
  userId,
  label = 'Baixar arquivo',
  variant = 'outline',
  size = 'sm',
}) {
  const [status, setStatus] = useState('idle') // idle | loading | success | error
  const [errorMsg, setErrorMsg] = useState('')

  async function handleDownload() {
    if (status === 'loading') return
    setStatus('loading')
    setErrorMsg('')

    try {
      const url = `${API_BASE}/files/${fileId}/download?user_id=${userId}`
      const res = await fetch(url)

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.detail || `Erro ${res.status}`)
      }

      // Extrai nome do arquivo do header Content-Disposition
      const cd = res.headers.get('Content-Disposition') || ''
      const match = cd.match(/filename="?([^"]+)"?/)
      const filename = match?.[1] || 'arquivo'

      // Cria blob e dispara download
      const blob = await res.blob()
      const blobUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = filename
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(blobUrl)

      setStatus('success')
      setTimeout(() => setStatus('idle'), 2500)
    } catch (err) {
      setErrorMsg(err.message)
      setStatus('error')
      setTimeout(() => setStatus('idle'), 3500)
    }
  }

  // ── estilos por variante ──────────────────────────────────────────────────
  const base = 'inline-flex items-center gap-1.5 font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed'

  const variants = {
    primary: 'bg-primary text-white hover:bg-sidebar2 hover:-translate-y-px hover:shadow-lg',
    outline: 'border border-slate-300 text-slate-600 hover:border-blue-400 hover:text-primary hover:bg-blue-50',
    ghost:   'text-slate-500 hover:text-primary hover:bg-blue-50',
  }

  const sizes = {
    sm: 'px-3 py-1.5 text-[0.72rem]',
    md: 'px-4 py-2 text-[0.82rem]',
  }

  const cls = `${base} ${variants[variant]} ${sizes[size]}`

  // ── ícone de estado ───────────────────────────────────────────────────────
  const Icon = () => {
    if (status === 'loading') return <Loader2 size={13} className="animate-spin" />
    if (status === 'success') return <CheckCircle size={13} className="text-emerald-500" />
    if (status === 'error')   return <AlertCircle size={13} className="text-red-500" />
    return <Download size={13} />
  }

  const text = {
    idle:    label,
    loading: 'Baixando...',
    success: 'Baixado!',
    error:   errorMsg || 'Erro',
  }[status]

  return (
    <button
      className={cls}
      onClick={handleDownload}
      disabled={status === 'loading'}
      title={status === 'error' ? errorMsg : label}
    >
      <Icon />
      {text}
    </button>
  )
}
