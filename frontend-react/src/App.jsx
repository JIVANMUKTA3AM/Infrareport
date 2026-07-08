import { useState, useEffect, Component } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import Sidebar      from './components/layout/Sidebar'
import Topbar       from './components/layout/Topbar'
import Dashboard    from './pages/Dashboard'
import Files        from './pages/Files'
import AgenteTecnico  from './pages/AgenteTecnico'
import Configuracoes  from './pages/Configuracoes'
import Login           from './pages/Login'
import InfraReportLanding from './pages/InfraReportLanding'
import SetNewPassword  from './pages/SetNewPassword'
import AgenteComercial   from './pages/AgenteComercial'
import Placeholder       from './pages/Placeholder'
import Propostas         from './pages/Propostas'
import Projetos          from './pages/Projetos'
import Agenda            from './pages/Agenda'
import Entradas          from './pages/Entradas'
import Saidas            from './pages/Saidas'
import Categorias        from './pages/Categorias'
import AgenteFinanceiro  from './pages/AgenteFinanceiro'
import Relatorios        from './pages/Relatorios'
import { Loader2, AlertTriangle, RefreshCw }  from 'lucide-react'

// ── Error Boundary ────────────────────────────────────────────────────────────
class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info?.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-5 p-8">
          <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center">
            <AlertTriangle size={26} className="text-red-500" />
          </div>
          <div className="text-center max-w-sm">
            <h2 className="font-bold text-slate-800 text-lg mb-1">Ocorreu um erro nesta tela</h2>
            <p className="text-[0.82rem] text-slate-500 mb-1">
              {this.state.error?.message || 'Erro inesperado de renderização.'}
            </p>
            <p className="text-[0.75rem] text-slate-400">
              As outras telas continuam funcionando normalmente.
            </p>
          </div>
          <button
            onClick={() => this.setState({ error: null })}
            className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-[0.82rem] font-bold rounded-lg transition-colors"
          >
            <RefreshCw size={14} /> Tentar novamente
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

const PAGE_LABELS = {
  propostas:           'Propostas Comerciais',
  projetos:            'Projetos / OS',
  agenda:              'Agenda',
  entradas:            'Entradas',
  saidas:              'Saídas',
  categorias:          'Categorias',
  relatorios:          'Relatórios',
  arquivos:            'Arquivos',
  'agente-tecnico':    'Agente Técnico',
  'agente-comercial':  'Agente Comercial',
  'agente-financeiro': 'Agente Financeiro',
  'agente-whatsapp':   'Agente WhatsApp',
  configuracoes:       'Configurações',
}

function PageContent({ page }) {
  if (page === 'dashboard')      return <Dashboard />
  if (page === 'arquivos')       return <Files />
  if (page === 'agente-tecnico')  return <AgenteTecnico />
  if (page === 'configuracoes')   return <Configuracoes />
  if (page === 'propostas')         return <Propostas />
  if (page === 'projetos')          return <Projetos />
  if (page === 'agenda')            return <Agenda />
  if (page === 'entradas')          return <Entradas />
  if (page === 'saidas')            return <Saidas />
  if (page === 'categorias')        return <Categorias />
  if (page === 'agente-financeiro') return <AgenteFinanceiro />
  if (page === 'agente-comercial')  return <AgenteComercial />
  if (page === 'relatorios')        return <Relatorios />
  return <Placeholder title={PAGE_LABELS[page] || page} />
}

// ── Loading screen ────────────────────────────────────────────────────────
function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center"
      style={{ background:'linear-gradient(145deg,#EEF2FF,#F0F9FF,#F5F3FF)' }}>
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
          style={{ background:'linear-gradient(135deg,#1D4ED8,#06B6D4)', boxShadow:'0 8px 32px rgba(37,99,235,0.4)' }}>
          <Loader2 size={22} className="text-white animate-spin" />
        </div>
        <p className="text-[0.8rem] text-slate-400 font-medium">Carregando InfraReport...</p>
      </div>
    </div>
  )
}

// ── App autenticado ───────────────────────────────────────────────────────
function AuthenticatedApp() {
  const { user, loading, signOut, recoveryMode } = useAuth()

  const [page, setPage] = useState(() => {
    const hash = location.hash.replace('#', '')
    return hash || 'dashboard'
  })

  const navigate = (id) => {
    setPage(id)
    history.pushState({ page: id }, '', `#${id}`)
  }

  useEffect(() => {
    const onPop = (e) => { if (e.state?.page) setPage(e.state.page) }
    const onHash = () => {
      const h = location.hash.replace('#', '')
      if (h) setPage(h)
    }
    window.addEventListener('popstate', onPop)
    window.addEventListener('hashchange', onHash)
    return () => {
      window.removeEventListener('popstate', onPop)
      window.removeEventListener('hashchange', onHash)
    }
  }, [])

  const [view, setView] = useState('landing') // 'landing' | 'login' | 'register'

  if (loading) return <LoadingScreen />

  if (recoveryMode) return <SetNewPassword />

  if (!user) {
    if (view === 'login')    return <Login onBack={() => setView('landing')} defaultTab="login"    />
    if (view === 'register') return <Login onBack={() => setView('landing')} defaultTab="register" />
    return (
      <InfraReportLanding
        onLogin={()    => setView('login')}
        onRegister={() => setView('register')}
      />
    )
  }

  return (
    <div className="flex min-h-screen" style={{ background:'linear-gradient(145deg,#EEF2FF,#F0F9FF,#F5F3FF)' }}>
      <Sidebar active={page} onNavigate={navigate} user={user} onSignOut={signOut} />

      <div className="flex-1 flex flex-col min-h-screen" style={{ marginLeft: 230 }}>
        <Topbar page={page} onRefresh={() => navigate(page)} user={user} />

        <main className="flex-1">
          <ErrorBoundary key={page}>
            <PageContent page={page} />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  )
}

// ── Root ──────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <AuthProvider>
      <AuthenticatedApp />
    </AuthProvider>
  )
}
