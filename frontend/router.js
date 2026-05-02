/**
 * InfraReport — Router SPA
 *
 * Como funciona:
 *  1. Cada página é registrada em ROUTES com id, título, subtítulo
 *     e um callback opcional onEnter() para lógica ao entrar.
 *  2. navigate(routeId) esconde todas as páginas, exibe a alvo,
 *     atualiza topbar e marca o nav-item correto como active.
 *  3. O hash da URL (#dashboard, #propostas …) é mantido sincronizado,
 *     permitindo voltar/avançar pelo browser.
 */

// ─────────────────────────────────────────────────────────────────────────────
// REGISTRO DE ROTAS
// ─────────────────────────────────────────────────────────────────────────────
const ROUTES = {
  dashboard: {
    pageId:      'pageDashboard',
    navId:       'navDashboard',
    title:       'Dashboard Financeiro',
    subtitle:    'Atualizado em tempo real · Março 2025',
    showTopbar:  true,
    onEnter:     () => renderDashboard?.(),
  },
  propostas: {
    pageId:      'pagePropostas',
    navId:       'navPropostas',
    title:       'Propostas Comerciais',
    subtitle:    'Geração automática via agente IA',
    showTopbar:  false,
    onEnter:     () => _loadModule('propostas', 'proposals.html', 'proposals.js', loadProposals),
  },
  projetos: {
    pageId:      'pageProjetos',
    navId:       'navProjetos',
    title:       'Projetos / OS',
    subtitle:    'Ordens de serviço e acompanhamento',
    showTopbar:  false,
    onEnter:     () => loadProjects?.(),
  },
  agenda: {
    pageId:      'pageAgenda',
    navId:       'navAgenda',
    title:       'Agenda',
    subtitle:    'Visitas e serviços programados',
    showTopbar:  false,
    onEnter:     () => loadAgenda?.(),
  },
  entradas: {
    pageId:      'pageEntradas',
    navId:       'navEntradas',
    title:       'Entradas',
    subtitle:    'Receitas e recebimentos',
    showTopbar:  true,
    onEnter:     () => loadEntries?.(),
  },
  saidas: {
    pageId:      'pageSaidas',
    navId:       'navSaidas',
    title:       'Saídas',
    subtitle:    'Despesas e pagamentos',
    showTopbar:  true,
    onEnter:     () => loadExpenses?.(),
  },
  categorias: {
    pageId:      'pageCategorias',
    navId:       'navCategorias',
    title:       'Categorias',
    subtitle:    'Gerenciar categorias financeiras',
    showTopbar:  false,
    onEnter:     () => loadCategories?.(),
  },
  relatorios: {
    pageId:      'pageRelatorios',
    navId:       'navRelatorios',
    title:       'Relatórios',
    subtitle:    'Exportar e analisar dados',
    showTopbar:  true,
    onEnter:     () => loadReports?.(),
  },
  chat: {
    pageId:      'pageChat',
    navId:       'navChat',
    title:       'Chat com Agente',
    subtitle:    'Assistente financeiro inteligente',
    showTopbar:  false,
    onEnter:     () => {},
  },
  configuracoes: {
    pageId:      'pageConfiguracoes',
    navId:       'navConfiguracoes',
    title:       'Configurações',
    subtitle:    'Conta, plano e preferências',
    showTopbar:  false,
    onEnter:     () => loadSettings?.(),
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// ESTADO
// ─────────────────────────────────────────────────────────────────────────────
let currentRoute = null;

// ─────────────────────────────────────────────────────────────────────────────
// NAVEGAR
// ─────────────────────────────────────────────────────────────────────────────
function navigate(routeId) {
  const route = ROUTES[routeId];
  if (!route) { console.warn(`[router] Rota desconhecida: ${routeId}`); return; }

  // 1. Esconde todas as páginas
  Object.values(ROUTES).forEach(r => {
    const el = document.getElementById(r.pageId);
    if (el) el.classList.remove('active');
  });

  // 2. Exibe a página alvo (cria placeholder se ainda não existir no HTML)
  let page = document.getElementById(route.pageId);
  if (!page) {
    page = _createPlaceholderPage(route);
  }
  page.classList.add('active');

  // 3. Atualiza topbar
  const h1 = document.querySelector('.topbar-left h1');
  const p  = document.querySelector('.topbar-left p');
  const topbarRight = document.querySelector('.topbar-right');
  if (h1) h1.textContent = route.title;
  if (p)  p.textContent  = route.subtitle;
  if (topbarRight) topbarRight.style.display = route.showTopbar ? 'flex' : 'none';

  // 4. Atualiza nav-item active
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const navEl = document.getElementById(route.navId);
  if (navEl) navEl.classList.add('active');

  // 5. Sincroniza hash da URL
  history.pushState({ route: routeId }, '', `#${routeId}`);
  currentRoute = routeId;

  // 6. Callback da rota
  try { route.onEnter?.(); } catch(e) { console.error('[router] onEnter error:', e); }
}

// ─────────────────────────────────────────────────────────────────────────────
// LOADER DE MÓDULOS (HTML fragment + JS)
// Evita carregar o mesmo módulo duas vezes.
// ─────────────────────────────────────────────────────────────────────────────
const _loadedModules = new Set();

async function _loadModule(moduleId, htmlFile, jsFile, onReady) {
  const pageEl = document.getElementById(ROUTES[moduleId]?.pageId);
  if (!pageEl) return;

  // Já foi carregado antes — apenas chama onReady
  if (_loadedModules.has(moduleId)) {
    onReady?.();
    return;
  }

  // 1. Injeta HTML fragment
  try {
    const res = await fetch(htmlFile);
    if (res.ok) pageEl.innerHTML = await res.text();
  } catch (_) { /* se fetch falhar, usa placeholder */ }

  // 2. Carrega o JS (apenas uma vez via <script>)
  await new Promise((resolve) => {
    if (document.querySelector(`script[src="${jsFile}"]`)) { resolve(); return; }
    const s = document.createElement('script');
    s.src = jsFile;
    s.onload = resolve;
    s.onerror = resolve; // não bloqueia em caso de erro
    document.body.appendChild(s);
  });

  _loadedModules.add(moduleId);
  onReady?.();
}

// ─────────────────────────────────────────────────────────────────────────────
// PLACEHOLDER para páginas ainda não implementadas
// ─────────────────────────────────────────────────────────────────────────────
function _createPlaceholderPage(route) {
  const appContent = document.querySelector('.content') || document.body;
  const div = document.createElement('div');
  div.id = route.pageId;
  div.className = 'page';
  div.innerHTML = `
    <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;
                min-height:60vh;gap:16px;color:var(--text3)">
      <div style="font-size:3rem">🚧</div>
      <p style="font-size:1rem;font-weight:600;color:var(--text2)">${route.title}</p>
      <p style="font-size:0.82rem">Esta seção está em desenvolvimento.</p>
    </div>`;
  appContent.appendChild(div);
  return div;
}

// ─────────────────────────────────────────────────────────────────────────────
// ATALHOS — mantém compatibilidade com chamadas existentes no HTML
// ─────────────────────────────────────────────────────────────────────────────
const loadDashboard   = () => navigate('dashboard');
const loadProposals   = () => navigate('propostas');
const loadProjects    = () => navigate('projetos');
const loadAgenda      = () => navigate('agenda');
const loadEntries     = () => navigate('entradas');
const loadExpenses    = () => navigate('saidas');
const loadCategories  = () => navigate('categorias');
const loadReports     = () => navigate('relatorios');
const loadAgentChat   = () => navigate('chat');
const loadSettings    = () => navigate('configuracoes');

// Sobrescreve funções legadas do HTML original
function showDashboard()  { navigate('dashboard');  }
function showPropostas()  { navigate('propostas');  }
function showChat()       { navigate('chat');        }

// ─────────────────────────────────────────────────────────────────────────────
// INICIALIZAÇÃO
// ─────────────────────────────────────────────────────────────────────────────
function _routerInit() {
  // Rota pelo hash da URL, ou dashboard por padrão
  const hash = location.hash.replace('#', '') || 'dashboard';
  navigate(ROUTES[hash] ? hash : 'dashboard');
}

// Botão voltar/avançar do browser
window.addEventListener('popstate', (e) => {
  if (e.state?.route) navigate(e.state.route);
});

// Aguarda DOM estar pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', _routerInit);
} else {
  _routerInit();
}
