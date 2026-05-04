import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { Zap, Eye, EyeOff, Loader2, CheckCircle } from 'lucide-react'

export default function SetNewPassword() {
  const { updatePassword } = useAuth()
  const [password,  setPassword]  = useState('')
  const [confirm,   setConfirm]   = useState('')
  const [showPass,  setShowPass]  = useState(false)
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')
  const [success,   setSuccess]   = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (password.length < 8) { setError('A senha deve ter pelo menos 8 caracteres.'); return }
    if (password !== confirm)  { setError('As senhas não coincidem.'); return }
    setLoading(true)
    try {
      await updatePassword(password)
      setSuccess(true)
    } catch (err) {
      setError(err.message || 'Não foi possível atualizar a senha.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6"
      style={{ background: 'linear-gradient(145deg,#EEF2FF,#F0F9FF,#F5F3FF)' }}>
      <div className="w-full max-w-[400px]">

        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-8 justify-center">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#1D4ED8,#06B6D4)', boxShadow: '0 4px 20px rgba(37,99,235,0.4)' }}>
            <Zap size={18} className="text-white" fill="white" />
          </div>
          <span className="text-[1.3rem] font-black text-slate-800">
            Infra<span style={{ background: 'linear-gradient(90deg,#2563EB,#06B6D4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Report</span>
          </span>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-sm"
          style={{ border: '1px solid rgba(37,99,235,0.1)' }}>

          {success ? (
            <div className="text-center">
              <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ background: 'rgba(16,185,129,0.1)' }}>
                <CheckCircle size={28} className="text-emerald-500" />
              </div>
              <h2 className="text-[1.2rem] font-black text-slate-800 mb-2">Senha atualizada!</h2>
              <p className="text-[0.82rem] text-slate-500">Você já pode usar a nova senha para entrar no sistema.</p>
            </div>
          ) : (
            <>
              <h2 className="text-[1.3rem] font-black text-slate-800 mb-1">Criar nova senha</h2>
              <p className="text-[0.8rem] text-slate-500 mb-6">Digite e confirme a sua nova senha de acesso.</p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-[0.75rem] font-bold text-slate-600 mb-1.5">Nova senha</label>
                  <div className="relative">
                    <input
                      type={showPass ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Mínimo 8 caracteres"
                      required
                      className="w-full pr-10 pl-4 py-2.5 rounded-xl text-[0.85rem] text-slate-800 outline-none transition-all"
                      style={{ background: 'rgba(255,255,255,0.9)', border: '1.5px solid rgba(37,99,235,0.15)', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
                      onFocus={e => e.target.style.borderColor = '#3B82F6'}
                      onBlur={e => e.target.style.borderColor = 'rgba(37,99,235,0.15)'}
                    />
                    <button type="button" onClick={() => setShowPass(s => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[0.75rem] font-bold text-slate-600 mb-1.5">Confirmar senha</label>
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    placeholder="Repita a nova senha"
                    required
                    className="w-full px-4 py-2.5 rounded-xl text-[0.85rem] text-slate-800 outline-none transition-all"
                    style={{ background: 'rgba(255,255,255,0.9)', border: '1.5px solid rgba(37,99,235,0.15)', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
                    onFocus={e => e.target.style.borderColor = '#3B82F6'}
                    onBlur={e => e.target.style.borderColor = 'rgba(37,99,235,0.15)'}
                  />
                </div>

                {error && (
                  <div className="px-4 py-2.5 rounded-xl text-[0.78rem] font-medium text-red-700"
                    style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-[0.88rem] font-bold text-white transition-all disabled:opacity-60 hover:opacity-90 mt-2"
                  style={{ background: 'linear-gradient(135deg,#1D4ED8,#3B82F6)', boxShadow: '0 4px 20px rgba(37,99,235,0.4)' }}
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : 'Salvar nova senha'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
