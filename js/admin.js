// admin.js — Lógica do painel administrativo

let allSolicitacoes = [];
let currentDocId = null;

function formatarMoeda(v) {
  return parseFloat(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatarCPF(cpf) {
  return String(cpf || '').replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

function formatarData(ts) {
  if (!ts) return '-';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const statusMap = {
  pendente: { label: '⏳ Pendente', cls: 'status-pendente' },
  taxa_pendente: { label: '💳 Taxa Pendente', cls: 'status-taxa_pendente' },
  em_analise: { label: '🔍 Em Análise', cls: 'status-em_analise' },
  aprovado: { label: '✅ Aprovado', cls: 'status-aprovado' },
  reprovado: { label: '❌ Reprovado', cls: 'status-reprovado' },
};

window.carregarDados = async function () {
  const loadEl = document.getElementById('loading-state');
  const tableArea = document.getElementById('table-area');
  loadEl.style.display = 'block';
  tableArea.style.display = 'none';

  try {
    const { collection, getDocs, query, orderBy } = window._firestoreModules;
    const q = query(collection(window._db, 'solicitacoes'), orderBy('criadoEm', 'desc'));
    const snap = await getDocs(q);

    allSolicitacoes = [];
    snap.forEach(d => allSolicitacoes.push({ id: d.id, ...d.data() }));

    atualizarStats();
    renderTabela(allSolicitacoes);
    loadEl.style.display = 'none';
    tableArea.style.display = 'block';
  } catch (e) {
    loadEl.innerHTML = `<div class="empty-state"><div class="empty-state-icon">❌</div><p>Erro ao carregar: ${e.message}</p></div>`;
  }
};

function atualizarStats() {
  document.getElementById('stat-total').textContent = allSolicitacoes.length;
  document.getElementById('stat-analise').textContent = allSolicitacoes.filter(s => s.status === 'em_analise').length;
  document.getElementById('stat-aprovados').textContent = allSolicitacoes.filter(s => s.status === 'aprovado').length;
  document.getElementById('stat-reprovados').textContent = allSolicitacoes.filter(s => s.status === 'reprovado').length;
}

function renderTabela(data) {
  const tbody = document.getElementById('table-body');
  const empty = document.getElementById('empty-table');

  if (!data.length) {
    tbody.innerHTML = '';
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  tbody.innerHTML = data.map(s => {
    const st = statusMap[s.status] || { label: s.status, cls: '' };
    return `
      <tr>
        <td><code style="font-size:12px">${s.numeroSolicitacao || '-'}</code></td>
        <td><strong>${s.nome || '-'}</strong></td>
        <td>${formatarCPF(s.cpf)}</td>
        <td>${formatarMoeda(s.valor)}</td>
        <td style="color:var(--gold)">${formatarMoeda(s.taxa)}</td>
        <td><span class="status-badge ${st.cls}" style="font-size:11px; padding:4px 10px;">${st.label}</span></td>
        <td style="font-size:12px; color:var(--gray-500)">${formatarData(s.criadoEm)}</td>
        <td>
          <button class="btn btn-outline btn-sm" onclick="abrirModal('${s.id}')">
            Ver Detalhes
          </button>
        </td>
        <td>
          <div class="action-btns">
            ${s.status !== 'aprovado' && s.status !== 'reprovado' ? `
              <button class="btn btn-green btn-sm" onclick="aprovar('${s.id}', event)">✓ Aprovar</button>
              <button class="btn btn-danger btn-sm" onclick="reprovar('${s.id}', event)">✗ Reprovar</button>
            ` : `<span style="font-size:12px; color:var(--gray-400)">Finalizado</span>`}
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

window.filtrar = function () {
  const search = document.getElementById('filter-search').value.toLowerCase();
  const status = document.getElementById('filter-status').value;
  const filtered = allSolicitacoes.filter(s => {
    const matchSearch = !search ||
      (s.nome || '').toLowerCase().includes(search) ||
      (s.cpf || '').includes(search.replace(/\D/g, ''));
    const matchStatus = !status || s.status === status;
    return matchSearch && matchStatus;
  });
  renderTabela(filtered);
};

window.abrirModal = async function (docId) {
  currentDocId = docId;
  const s = allSolicitacoes.find(x => x.id === docId);
  if (!s) return;

  document.getElementById('modal-title').textContent = 'Solicitação ' + (s.numeroSolicitacao || docId);

  const info = document.getElementById('modal-info');
  info.innerHTML = [
    ['Nome', s.nome],
    ['CPF', formatarCPF(s.cpf)],
    ['Telefone', s.telefone],
    ['E-mail', s.email],
    ['Renda Mensal', formatarMoeda(s.renda)],
    ['Valor Solicitado', formatarMoeda(s.valor)],
    ['Taxa Administrativa', formatarMoeda(s.taxa)],
    ['Status', (statusMap[s.status] || {}).label || s.status],
    ['Data', formatarData(s.criadoEm)],
  ].map(([k, v]) => `
    <li class="info-item">
      <span class="info-key">${k}</span>
      <span class="info-value">${v || '-'}</span>
    </li>
  `).join('');

  // Docs
  const docsEl = document.getElementById('modal-docs');
  docsEl.innerHTML = '<p style="font-size:13px;font-weight:600;color:var(--gray-700);margin-bottom:10px;">Documentos Enviados:</p>';
  const docLinks = [];
  if (s.rgPath) docLinks.push(['🪪 RG / CNH', s.rgPath]);
  if (s.selfiePath) docLinks.push(['🤳 Selfie', s.selfiePath]);
  if (s.comprovantePath) docLinks.push(['💳 Comprovante PIX', s.comprovantePath]);

  if (docLinks.length) {
    for (const [label, path] of docLinks) {
      try {
        const { ref, getDownloadURL } = window._storageModules;
        const url = await getDownloadURL(ref(window._storage, path));
        const a = document.createElement('a');
        a.href = url;
        a.target = '_blank';
        a.className = 'doc-link';
        a.style.display = 'block';
        a.style.marginBottom = '6px';
        a.textContent = label + ' →';
        docsEl.appendChild(a);
      } catch {
        const p = document.createElement('p');
        p.className = 'text-muted';
        p.textContent = label + ' (indisponível)';
        p.style.marginBottom = '6px';
        docsEl.appendChild(p);
      }
    }
  } else {
    docsEl.innerHTML += '<p class="text-muted">Nenhum documento disponível.</p>';
  }

  // Actions
  const actionsEl = document.getElementById('modal-actions');
  const msgEl = document.getElementById('modal-status-msg');
  msgEl.style.display = 'none';

  if (s.status !== 'aprovado' && s.status !== 'reprovado') {
    actionsEl.innerHTML = `
      <button class="btn btn-green" onclick="aprovarModal()">✓ Aprovar Solicitação</button>
      <button class="btn btn-danger" onclick="reprovarModal()">✗ Reprovar Solicitação</button>
    `;
  } else {
    actionsEl.innerHTML = `<p style="color:var(--gray-400);font-size:13px;">Esta solicitação já foi finalizada.</p>`;
  }

  document.getElementById('modal-overlay').classList.add('open');
};

window.fecharModal = function () {
  document.getElementById('modal-overlay').classList.remove('open');
  currentDocId = null;
};

document.getElementById('modal-overlay').addEventListener('click', function (e) {
  if (e.target === this) fecharModal();
});

async function mudarStatus(docId, status) {
  const { updateDoc, doc } = window._firestoreModules;
  await updateDoc(doc(window._db, 'solicitacoes', docId), { status });
  const idx = allSolicitacoes.findIndex(x => x.id === docId);
  if (idx !== -1) allSolicitacoes[idx].status = status;
  atualizarStats();
  filtrar();
}

window.aprovar = async function (docId, e) {
  const btn = e.target;
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span>';
  try {
    await mudarStatus(docId, 'aprovado');
    btn.closest('td').innerHTML = '<span style="font-size:12px;color:var(--green-main);font-weight:600;">✅ Aprovado</span>';
  } catch (err) {
    btn.disabled = false;
    btn.innerHTML = '✓ Aprovar';
    alert('Erro: ' + err.message);
  }
};

window.reprovar = async function (docId, e) {
  const btn = e.target;
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span>';
  try {
    await mudarStatus(docId, 'reprovado');
    btn.closest('td').innerHTML = '<span style="font-size:12px;color:var(--red);font-weight:600;">❌ Reprovado</span>';
  } catch (err) {
    btn.disabled = false;
    btn.innerHTML = '✗ Reprovar';
    alert('Erro: ' + err.message);
  }
};

window.aprovarModal = async function () {
  if (!currentDocId) return;
  const btn = document.querySelector('#modal-actions .btn-green');
  const msgEl = document.getElementById('modal-status-msg');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Aprovando...';
  try {
    await mudarStatus(currentDocId, 'aprovado');
    msgEl.innerHTML = '<div class="alert alert-success"><span>✅</span><span>Solicitação aprovada com sucesso!</span></div>';
    msgEl.style.display = 'block';
    document.getElementById('modal-actions').innerHTML = '';
    setTimeout(fecharModal, 2000);
  } catch (e) {
    msgEl.innerHTML = `<div class="alert alert-error"><span>❌</span><span>${e.message}</span></div>`;
    msgEl.style.display = 'block';
    btn.disabled = false;
    btn.innerHTML = '✓ Aprovar';
  }
};

window.reprovarModal = async function () {
  if (!currentDocId) return;
  const btn = document.querySelector('#modal-actions .btn-danger');
  const msgEl = document.getElementById('modal-status-msg');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Reprovando...';
  try {
    await mudarStatus(currentDocId, 'reprovado');
    msgEl.innerHTML = '<div class="alert alert-error"><span>❌</span><span>Solicitação reprovada.</span></div>';
    msgEl.style.display = 'block';
    document.getElementById('modal-actions').innerHTML = '';
    setTimeout(fecharModal, 2000);
  } catch (e) {
    msgEl.innerHTML = `<div class="alert alert-error"><span>❌</span><span>${e.message}</span></div>`;
    msgEl.style.display = 'block';
    btn.disabled = false;
    btn.innerHTML = '✗ Reprovar';
  }
};
