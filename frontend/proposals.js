/**
 * InfraReport — Módulo de Propostas
 *
 * Responsabilidades:
 *  - Buscar propostas da API (GET /api/proposals)
 *  - Renderizar tabela com filtros
 *  - Ações: visualizar, baixar .docx, aprovar, rejeitar
 *  - Atualizar KPIs do topo
 *
 * Chamado pelo router via onEnter() da rota 'propostas'.
 */

const API_BASE = 'http://localhost:8000';

// ─────────────────────────────────────────────────────────────────────────────
// ESTADO LOCAL
// ─────────────────────────────────────────────────────────────────────────────
let _proposals   = [];   // cache completo vindo da API
let _activeFilter = 'todas';

// ─────────────────────────────────────────────────────────────────────────────
// ENTRY POINT — chamado pelo router
// ─────────────────────────────────────────────────────────────────────────────
async function loadProposals() {
  _renderSkeleton();
  try {
    const data = await _fetchProposals();
    _proposals = data;
    _renderKPIs();
    _renderTable(_activeFilter);
  } catch (err) {
    _renderError(err.message);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// API
// ─────────────────────────────────────────────────────────────────────────────
async function _fetchProposals() {
  const res = await fetch(`${API_BASE}/api/proposals`, {
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error(`Erro ${res.status}: ${res.statusText}`);
  return res.json();
}

async function _patchProposal(id, body) {
  const res = await fetch(`${API_BASE}/api/proposals/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Erro ao atualizar: ${res.statusText}`);
  return res.json();
}

// ─────────────────────────────────────────────────────────────────────────────
// FILTROS
// ─────────────────────────────────────────────────────────────────────────────
function filterProps(btn, filtro) {
  document.querySelectorAll('.prop-filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  _activeFilter = filtro;
  _renderTable(filtro);
}

// ─────────────────────────────────────────────────────────────────────────────
// AÇÕES
// ─────────────────────────────────────────────────────────────────────────────
function viewProp(id) {
  const p = _proposals.find(x => x.id === id);
  if (!p) return;
  _openModal(p);
}

function downloadProp(id) {
  const p = _proposals.find(x => x.id === id);
  if (!p) return;

  if (p.docx_url) {
    // URL direta (Supabase Storage ou path do servidor)
    const a = document.createElement('a');
    a.href = p.docx_url.startsWith('http') ? p.docx_url : `${API_BASE}/${p.docx_url}`;
    a.download = `proposta_${p.client_name.replace(/\s+/g,'_')}.docx`;
    a.click();
  } else {
    _showToast('⚠️ Arquivo .docx não disponível para esta proposta.', 'warn');
  }
}

async function approveProp(id) {
  const btn = document.querySelector(`[data-action-id="${id}"][data-action="approve"]`);
  if (btn) { btn.disabled = true; btn.textContent = '...'; }

  try {
    await _patchProposal(id, { status: 'aprovada' });
    const p = _proposals.find(x => x.id === id);
    if (p) p.status = 'aprovada';
    _renderKPIs();
    _renderTable(_activeFilter);
    _showToast('✅ Proposta marcada como aprovada!', 'success');
  } catch (err) {
    _showToast('❌ ' + err.message, 'danger');
    if (btn) { btn.disabled = false; btn.textContent = '✓ Aprovar'; }
  }
}

async function rejectProp(id) {
  if (!confirm('Marcar proposta como rejeitada?')) return;
  const btn = document.querySelector(`[data-action-id="${id}"][data-action="reject"]`);
  if (btn) { btn.disabled = true; btn.textContent = '...'; }

  try {
    await _patchProposal(id, { status: 'rejeitada' });
    const p = _proposals.find(x => x.id === id);
    if (p) p.status = 'rejeitada';
    _renderKPIs();
    _renderTable(_activeFilter);
    _showToast('Proposta marcada como rejeitada.', 'warn');
  } catch (err) {
    _showToast('❌ ' + err.message, 'danger');
    if (btn) { btn.disabled = false; btn.textContent = '✕ Rejeitar'; }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// RENDER — KPIs
// ─────────────────────────────────────────────────────────────────────────────
function _renderKPIs() {
  const total    = _proposals.length;
  const aprovadas = _proposals.filter(p => p.status === 'aprovada').length;
  const pendentes = _proposals.filter(p => p.status === 'pendente' || p.status === 'draft').length;
  const valor    = _proposals.reduce((s, p) => s + (p.value || 0), 0);

  _setText('pkTotal', total);
  _setText('pkAprov', aprovadas);
  _setText('pkPend',  pendentes);
  _setText('pkValor', _fmtBRL(valor));
}

// ─────────────────────────────────────────────────────────────────────────────
// RENDER — TABELA
// ─────────────────────────────────────────────────────────────────────────────
function _renderTable(filtro) {
  const container = document.getElementById('propTableContainer');
  if (!container) return;

  const filtered = filtro === 'todas'
    ? _proposals
    : _proposals.filter(p => p.status === filtro);

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="prop-empty">
        <div style="font-size:2.5rem">📭</div>
        <p>Nenhuma proposta ${filtro !== 'todas' ? '"' + filtro + '"' : ''} encontrada.</p>
      </div>`;
    return;
  }

  container.innerHTML = `
    <div class="prop-table-wrap">
      <table class="prop-table">
        <thead>
          <tr>
            <th>Cliente</th>
            <th>Serviço</th>
            <th>Valor</th>
            <th>Status</th>
            <th>Data</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          ${filtered.map(_rowHTML).join('')}
        </tbody>
      </table>
    </div>`;
}

function _rowHTML(p) {
  const seg   = (p.segment || '').toUpperCase();
  const icon  = { AC:'❄️', CFTV:'📷', TI:'🖥️', ELETRICA:'⚡', HIDRAULICA:'🔧' }[seg] || '📄';
  const date  = p.created_at ? new Date(p.created_at).toLocaleDateString('pt-BR') : '—';
  const valor = p.value ? _fmtBRL(p.value) : '—';
  const status = p.status || 'draft';

  const actions = `
    <button class="prop-action-btn"
      onclick="viewProp('${p.id}')" title="Visualizar">
      👁 Ver
    </button>
    <button class="prop-action-btn"
      onclick="downloadProp('${p.id}')" title="Baixar .docx">
      ⬇ .docx
    </button>
    ${(status === 'pendente' || status === 'draft' || status === 'sent') ? `
    <button class="prop-action-btn approve"
      data-action="approve" data-action-id="${p.id}"
      onclick="approveProp('${p.id}')">
      ✓ Aprovar
    </button>` : ''}
    ${(status !== 'rejeitada' && status !== 'aprovada') ? `
    <button class="prop-action-btn reject"
      data-action="reject" data-action-id="${p.id}"
      onclick="rejectProp('${p.id}')">
      ✕ Rejeitar
    </button>` : ''}`;

  return `
    <tr class="prop-row" data-status="${status}">
      <td>
        <div class="prop-client-cell">
          <span class="prop-seg-icon">${icon}</span>
          <div>
            <div class="prop-client-name">${p.client_name}</div>
            <div class="prop-client-email">${p.client_email || ''}</div>
          </div>
        </div>
      </td>
      <td class="prop-service-cell">${p.service || '—'}</td>
      <td class="prop-value-cell">${valor}</td>
      <td><span class="prop-status ${status}">${_labelStatus(status)}</span></td>
      <td class="prop-date-cell">${date}</td>
      <td><div class="prop-actions-cell">${actions}</div></td>
    </tr>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// MODAL — visualizar proposta
// ─────────────────────────────────────────────────────────────────────────────
function _openModal(p) {
  let modal = document.getElementById('propModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'propModal';
    modal.className = 'prop-modal-overlay';
    modal.onclick = (e) => { if (e.target === modal) modal.classList.remove('open'); };
    document.body.appendChild(modal);
  }

  const equipments = Array.isArray(p.equipments)
    ? p.equipments.map(eq =>
        `<tr><td>${eq.description}</td><td>${eq.quantity}</td><td>${_fmtBRL(eq.unit_price)}</td><td>${_fmtBRL(eq.quantity * eq.unit_price)}</td></tr>`
      ).join('')
    : '<tr><td colspan="4">—</td></tr>';

  modal.innerHTML = `
    <div class="prop-modal">
      <div class="prop-modal-header">
        <div>
          <div class="prop-modal-title">📄 Proposta Comercial</div>
          <div class="prop-modal-sub">${p.service || ''}</div>
        </div>
        <button class="prop-modal-close" onclick="document.getElementById('propModal').classList.remove('open')">✕</button>
      </div>
      <div class="prop-modal-body">
        <div class="prop-modal-section">
          <div class="prop-modal-label">Cliente</div>
          <div class="prop-modal-value">${p.client_name}</div>
        </div>
        <div class="prop-modal-section">
          <div class="prop-modal-label">E-mail</div>
          <div class="prop-modal-value">${p.client_email || '—'}</div>
        </div>
        <div class="prop-modal-section">
          <div class="prop-modal-label">Status</div>
          <div><span class="prop-status ${p.status}">${_labelStatus(p.status)}</span></div>
        </div>
        <div class="prop-modal-section full">
          <div class="prop-modal-label">Itens</div>
          <table class="prop-modal-table">
            <thead><tr><th>Descrição</th><th>Qtd</th><th>Unit.</th><th>Subtotal</th></tr></thead>
            <tbody>${equipments}</tbody>
          </table>
        </div>
        <div class="prop-modal-section">
          <div class="prop-modal-label">Total</div>
          <div class="prop-modal-total">${_fmtBRL(p.value || 0)}</div>
        </div>
      </div>
      <div class="prop-modal-footer">
        <button class="prop-action-btn" onclick="downloadProp('${p.id}')">⬇ Baixar .docx</button>
        ${(p.status === 'pendente' || p.status === 'draft') ? `<button class="prop-action-btn approve" onclick="approveProp('${p.id}');document.getElementById('propModal').classList.remove('open')">✓ Aprovar e Enviar</button>` : ''}
      </div>
    </div>`;

  modal.classList.add('open');
}

// ─────────────────────────────────────────────────────────────────────────────
// ESTADOS DE LOADING / ERRO
// ─────────────────────────────────────────────────────────────────────────────
function _renderSkeleton() {
  const container = document.getElementById('propTableContainer');
  if (!container) return;
  container.innerHTML = `
    <div class="prop-loading">
      <div class="prop-spinner"></div>
      <p>Carregando propostas...</p>
    </div>`;
}

function _renderError(msg) {
  const container = document.getElementById('propTableContainer');
  if (!container) return;
  container.innerHTML = `
    <div class="prop-empty">
      <div style="font-size:2rem">⚠️</div>
      <p>Erro ao carregar propostas.</p>
      <small style="color:var(--text3)">${msg}</small>
      <button class="prop-action-btn" style="margin-top:12px" onclick="loadProposals()">Tentar novamente</button>
    </div>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// TOAST
// ─────────────────────────────────────────────────────────────────────────────
function _showToast(msg, type = 'success') {
  let wrap = document.getElementById('toastWrap');
  if (!wrap) {
    wrap = document.createElement('div');
    wrap.id = 'toastWrap';
    wrap.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:9999;display:flex;flex-direction:column;gap:8px';
    document.body.appendChild(wrap);
  }
  const t = document.createElement('div');
  const colors = { success:'var(--success)', danger:'var(--danger)', warn:'var(--warn)' };
  t.style.cssText = `background:#fff;border:1px solid var(--border);border-left:4px solid ${colors[type]||colors.success};
    border-radius:8px;padding:12px 16px;font-size:0.82rem;box-shadow:var(--shadow-lg);
    max-width:320px;animation:fadeIn .2s ease`;
  t.textContent = msg;
  wrap.appendChild(t);
  setTimeout(() => t.remove(), 3500);
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
function _fmtBRL(v) {
  return `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
}

function _labelStatus(s) {
  return { draft:'Rascunho', sent:'Enviada', enviada:'Enviada',
           aprovada:'Aprovada', pendente:'Pendente', rejeitada:'Rejeitada' }[s]
    || (s ? s.charAt(0).toUpperCase() + s.slice(1) : '—');
}

function _setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}
