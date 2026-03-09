// cadastro.js — Lógica de cadastro e solicitação

// ============ UTILS ============
function validarCPF(cpf) {
  cpf = cpf.replace(/[^\d]/g, '');
  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;
  let s = 0;
  for (let i = 0; i < 9; i++) s += parseInt(cpf[i]) * (10 - i);
  let r = (s * 10) % 11;
  if (r === 10 || r === 11) r = 0;
  if (r !== parseInt(cpf[9])) return false;
  s = 0;
  for (let i = 0; i < 10; i++) s += parseInt(cpf[i]) * (11 - i);
  r = (s * 10) % 11;
  if (r === 10 || r === 11) r = 0;
  return r === parseInt(cpf[10]);
}

function gerarNumeroSolicitacao() {
  const ts = Date.now().toString(36).toUpperCase();
  const rnd = Math.random().toString(36).substr(2, 4).toUpperCase();
  return `MC${ts}${rnd}`;
}

function formatarMoeda(v) {
  const n = parseFloat(String(v).replace(/[^\d.]/g, '')) || 0;
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function parseMoeda(v) {
  return parseFloat(String(v).replace(/\./g, '').replace(',', '.').replace(/[^\d.]/g, '')) || 0;
}

// ============ MASKS ============
document.getElementById('cpf').addEventListener('input', function () {
  this.value = this.value.replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
    .slice(0, 14);
});

document.getElementById('telefone').addEventListener('input', function () {
  this.value = this.value.replace(/\D/g, '')
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d{4})$/, '$1-$2')
    .slice(0, 15);
});

function maskMoeda(el) {
  el.addEventListener('input', function () {
    let v = this.value.replace(/\D/g, '');
    if (!v) { this.value = ''; return; }
    v = (parseInt(v, 10) / 100).toFixed(2);
    this.value = 'R$ ' + v.replace('.', ',').replace(/(\d)(?=(\d{3})+,)/g, '$1.');
  });
}
maskMoeda(document.getElementById('renda'));
maskMoeda(document.getElementById('valor'));

document.getElementById('valor').addEventListener('input', function () {
  const val = parseMoeda(this.value);
  const taxa = val * 0.10;
  const preview = document.getElementById('taxa-preview');
  if (val > 0) {
    preview.style.display = 'flex';
    document.getElementById('taxa-preview-value').textContent = formatarMoeda(taxa);
  } else {
    preview.style.display = 'none';
  }
});

// ============ FILE PREVIEW ============
window.previewFile = function (input, previewId, areaId) {
  const preview = document.getElementById(previewId);
  const nameEl = document.getElementById(previewId + '-name');
  if (input.files && input.files[0]) {
    preview.classList.add('show');
    nameEl.textContent = input.files[0].name;
    document.getElementById(areaId).style.borderColor = 'var(--green-main)';
  }
};

// ============ SHOW/HIDE ERROR ============
function showError(id, show) {
  const el = document.getElementById(id);
  if (el) el.classList.toggle('show', show);
}
function setInputError(inputId, errId, hasError) {
  const inp = document.getElementById(inputId);
  if (inp) inp.classList.toggle('error', hasError);
  showError(errId, hasError);
}

// ============ STEP NAVIGATION ============
let currentStep = 1;

function updateStepUI(step) {
  for (let i = 1; i <= 4; i++) {
    const el = document.getElementById(`step-indicator-${i}`);
    if (!el) continue;
    el.classList.remove('active', 'done');
    if (i < step) el.classList.add('done');
    else if (i === step) el.classList.add('active');
  }
  for (let i = 1; i <= 3; i++) {
    const line = document.getElementById(`line-${i}`);
    if (line) line.classList.toggle('done', i < step);
  }
}

window.voltarStep = function (step) {
  for (let i = 1; i <= 3; i++) {
    document.getElementById(`form-step-${i}`).style.display = 'none';
  }
  document.getElementById(`form-step-${step}`).style.display = 'block';
  currentStep = step;
  updateStepUI(step);
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

// ============ STEP 1 VALIDATION ============
window.irStep2 = async function () {
  let valid = true;

  const nome = document.getElementById('nome').value.trim();
  const cpfRaw = document.getElementById('cpf').value;
  const tel = document.getElementById('telefone').value;
  const email = document.getElementById('email').value.trim();
  const renda = parseMoeda(document.getElementById('renda').value);
  const valor = parseMoeda(document.getElementById('valor').value);

  setInputError('nome', 'err-nome', !nome || nome.split(' ').length < 2);
  if (!nome || nome.split(' ').length < 2) valid = false;

  const cpfNumero = cpfRaw.replace(/\D/g, '');
  const cpfValido = validarCPF(cpfNumero);
  setInputError('cpf', 'err-cpf', !cpfValido);
  if (!cpfValido) valid = false;

  setInputError('telefone', 'err-tel', tel.replace(/\D/g, '').length < 10);
  if (tel.replace(/\D/g, '').length < 10) valid = false;

  const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  setInputError('email', 'err-email', !emailValido);
  if (!emailValido) valid = false;

  setInputError('renda', 'err-renda', renda <= 0);
  if (renda <= 0) valid = false;

  setInputError('valor', 'err-valor', valor < 100);
  if (valor < 100) valid = false;

  if (!valid) return;

  // Check existing
  const alertCpf = document.getElementById('alert-cpf');
  const btn = document.getElementById('btn-step1');
  alertCpf.style.display = 'none';
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Verificando CPF...';

  try {
    if (window._firebaseReady) {
      const { collection, query, where, getDocs } = window._firestoreModules;
      const q = query(
        collection(window._db, 'solicitacoes'),
        where('cpf', '==', cpfNumero),
        where('status', 'in', ['pendente', 'taxa_pendente', 'em_analise', 'aprovado'])
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        alertCpf.style.display = 'flex';
        document.getElementById('alert-cpf-msg').textContent =
          'Você já possui uma solicitação em andamento. Consulte o status pelo menu principal.';
        btn.disabled = false;
        btn.innerHTML = 'Continuar → Documentos';
        return;
      }
    }
  } catch (e) {
    console.warn('Firebase check failed:', e);
  }

  btn.disabled = false;
  btn.innerHTML = 'Continuar → Documentos';
  document.getElementById('form-step-1').style.display = 'none';
  document.getElementById('form-step-2').style.display = 'block';
  currentStep = 2;
  updateStepUI(2);
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

// ============ STEP 2 VALIDATION ============
window.irStep3 = function () {
  const rg = document.getElementById('upload-rg').files[0];
  const selfie = document.getElementById('upload-selfie').files[0];

  setInputError('upload-rg', 'err-rg', !rg);
  setInputError('upload-selfie', 'err-selfie', !selfie);

  if (!rg || !selfie) return;

  // Populate confirm
  const valor = parseMoeda(document.getElementById('valor').value);
  const taxa = valor * 0.10;
  document.getElementById('taxa-display').textContent = formatarMoeda(taxa);
  document.getElementById('valor-display').textContent = formatarMoeda(valor);
  document.getElementById('confirm-nome').textContent = document.getElementById('nome').value.trim();
  document.getElementById('confirm-cpf').textContent = document.getElementById('cpf').value;
  document.getElementById('confirm-valor').textContent = formatarMoeda(valor);
  document.getElementById('confirm-taxa').textContent = formatarMoeda(taxa);

  document.getElementById('form-step-2').style.display = 'none';
  document.getElementById('form-step-3').style.display = 'block';
  currentStep = 3;
  updateStepUI(3);
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

// ============ CREATE SOLICITACAO ============
window.criarSolicitacao = async function () {
  const btn = document.getElementById('btn-step3');
  const statusDiv = document.getElementById('sending-status');
  const errDiv = document.getElementById('err-create');
  const errMsg = document.getElementById('err-create-msg');

  btn.disabled = true;
  errDiv.style.display = 'none';
  statusDiv.style.display = 'flex';

  const nome = document.getElementById('nome').value.trim();
  const cpfRaw = document.getElementById('cpf').value.replace(/\D/g, '');
  const telefone = document.getElementById('telefone').value;
  const email = document.getElementById('email').value.trim();
  const renda = parseMoeda(document.getElementById('renda').value);
  const valor = parseMoeda(document.getElementById('valor').value);
  const taxa = valor * 0.10;
  const numeroSolicitacao = gerarNumeroSolicitacao();

  try {
    if (!window._firebaseReady) throw new Error('Firebase não inicializado');

    const { addDoc, collection, Timestamp } = window._firestoreModules;
    const { ref, uploadBytes } = window._storageModules;

    // Upload docs
    document.getElementById('sending-msg').textContent = 'Enviando documentos...';
    const rgFile = document.getElementById('upload-rg').files[0];
    const selfieFile = document.getElementById('upload-selfie').files[0];

    const rgRef = ref(window._storage, `documentos/${cpfRaw}/rg.${rgFile.name.split('.').pop()}`);
    const selfieRef = ref(window._storage, `documentos/${cpfRaw}/selfie.${selfieFile.name.split('.').pop()}`);
    await uploadBytes(rgRef, rgFile);
    await uploadBytes(selfieRef, selfieFile);

    // Create Firestore doc
    document.getElementById('sending-msg').textContent = 'Salvando solicitação...';
    await addDoc(collection(window._db, 'solicitacoes'), {
      numeroSolicitacao,
      nome,
      cpf: cpfRaw,
      telefone,
      email,
      renda,
      valor,
      taxa,
      status: 'taxa_pendente',
      criadoEm: Timestamp.now(),
      rgPath: `documentos/${cpfRaw}/rg.${rgFile.name.split('.').pop()}`,
      selfiePath: `documentos/${cpfRaw}/selfie.${selfieFile.name.split('.').pop()}`,
    });

    statusDiv.style.display = 'none';
    // Redirect to payment
    const params = new URLSearchParams({ cpf: cpfRaw, valor, taxa, nome, numero: numeroSolicitacao });
    window.location.href = `pagamento.html?${params.toString()}`;

  } catch (e) {
    console.error(e);
    statusDiv.style.display = 'none';
    errDiv.style.display = 'flex';
    errMsg.textContent = 'Erro: ' + (e.message || 'Tente novamente.');
    btn.disabled = false;
  }
};
