// pagamento.js — Lógica da página de pagamento

const params = new URLSearchParams(window.location.search);
const cpf = params.get('cpf') || '';
const valor = parseFloat(params.get('valor')) || 0;
const taxa = parseFloat(params.get('taxa')) || 0;
const nome = params.get('nome') || '';
const numero = params.get('numero') || '';

function formatarMoeda(v) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// Preenche valores
document.getElementById('taxa-value').textContent = formatarMoeda(taxa);
document.getElementById('valor-solicitado').textContent = formatarMoeda(valor);
document.getElementById('num-solicitacao').textContent = numero;

// Copiar PIX
window.copiarPIX = function () {
  navigator.clipboard.writeText('10c918cf-f245-44c3-8a48-0dfbd77a111d').then(() => {
    const msg = document.getElementById('copy-msg');
    msg.style.display = 'block';
    setTimeout(() => msg.style.display = 'none', 3000);
  });
};

// Preview comprovante
window.previewComp = function (input) {
  if (input.files && input.files[0]) {
    const preview = document.getElementById('preview-comp');
    document.getElementById('preview-comp-name').textContent = input.files[0].name;
    preview.classList.add('show');
    document.getElementById('upload-comp-area').style.borderColor = 'var(--green-main)';
  }
};

// Enviar comprovante
window.enviarComprovante = async function () {
  const file = document.getElementById('upload-comprovante').files[0];
  const errEl = document.getElementById('err-comp');
  const statusEl = document.getElementById('upload-status');
  const errDiv = document.getElementById('upload-err');
  const okDiv = document.getElementById('upload-ok');
  const btn = document.getElementById('btn-enviar');

  errEl.classList.remove('show');
  errDiv.style.display = 'none';
  okDiv.style.display = 'none';

  if (!file) {
    errEl.classList.add('show');
    return;
  }

  btn.disabled = true;
  statusEl.style.display = 'flex';

  try {
    if (!window._firebaseReady) throw new Error('Firebase não inicializado. Configure o Firebase.');

    const { ref, uploadBytes } = window._storageModules;
    const { collection, query, where, getDocs, updateDoc, doc } = window._firestoreModules;

    const ext = file.name.split('.').pop();
    const storageRef = ref(window._storage, `comprovantes/${cpf}/pix_comprovante.${ext}`);
    await uploadBytes(storageRef, file);

    // Update status
    const q = query(
      collection(window._db, 'solicitacoes'),
      where('cpf', '==', cpf),
      where('numeroSolicitacao', '==', numero)
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      await updateDoc(doc(window._db, 'solicitacoes', snap.docs[0].id), {
        status: 'em_analise',
        comprovantePath: `comprovantes/${cpf}/pix_comprovante.${ext}`,
      });
    }

    statusEl.style.display = 'none';
    okDiv.style.display = 'flex';
    btn.textContent = '✅ Comprovante Enviado';

  } catch (e) {
    console.error(e);
    statusEl.style.display = 'none';
    errDiv.style.display = 'flex';
    document.getElementById('upload-err-msg').textContent = 'Erro: ' + (e.message || 'Tente novamente.');
    btn.disabled = false;
  }
};

// Baixar PDF
window.baixarPDF = async function () {
  const btn = document.getElementById('btn-pdf');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Gerando PDF...';

  try {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const W = 210, margin = 20;
    let y = 0;

    // Header background
    doc.setFillColor(13, 46, 13);
    doc.rect(0, 0, W, 55, 'F');

    // Logo attempt
    try {
      const logoImg = new Image();
      await new Promise((res, rej) => {
        logoImg.onload = res; logoImg.onerror = rej;
        logoImg.src = 'assets/logo.png';
      });
      const c = document.createElement('canvas');
      c.width = logoImg.width; c.height = logoImg.height;
      c.getContext('2d').drawImage(logoImg, 0, 0);
      doc.addImage(c.toDataURL('image/png'), 'PNG', margin, 12, 72, 28);
    } catch {
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(240, 192, 64);
      doc.text('Microcredito On', margin, 30);
    }

    doc.setFontSize(9);
    doc.setTextColor(180, 180, 180);
    doc.setFont('helvetica', 'normal');
    doc.text('CNPJ: 54.861.284/0001-30', W - margin, 28, { align: 'right' });

    doc.setFontSize(10);
    doc.setTextColor(212, 160, 23);
    doc.setFont('helvetica', 'bold');
    doc.text('COMPROVANTE DE SOLICITAÇÃO DE MICROCRÉDITO', W / 2, 45, { align: 'center' });

    y = 68;

    // Num solicitacao
    doc.setFillColor(245, 247, 245);
    doc.roundedRect(margin, y - 6, W - margin * 2, 22, 3, 3, 'F');
    doc.setFontSize(10);
    doc.setTextColor(120, 120, 120);
    doc.setFont('helvetica', 'normal');
    doc.text('Nº da Solicitação', margin + 8, y + 2);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 77, 30);
    doc.text(numero || '-', W - margin - 8, y + 2, { align: 'right' });
    y += 28;

    const drawSection = (title, items) => {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(13, 46, 13);
      doc.text(title.toUpperCase(), margin, y);
      doc.setDrawColor(58, 158, 58);
      doc.setLineWidth(0.5);
      doc.line(margin, y + 2, W - margin, y + 2);
      y += 10;
      items.forEach(([key, val]) => {
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(120, 120, 120);
        doc.text(key, margin, y);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(40, 40, 40);
        doc.text(String(val || '-'), W - margin, y, { align: 'right' });
        doc.setDrawColor(230, 230, 230);
        doc.setLineWidth(0.2);
        doc.line(margin, y + 2, W - margin, y + 2);
        y += 11;
      });
      y += 6;
    };

    drawSection('Dados do Cliente', [
      ['Nome Completo', nome || params.get('nome') || '-'],
      ['CPF', cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')],
    ]);

    drawSection('Dados da Solicitação', [
      ['Valor Solicitado', formatarMoeda(valor)],
      ['Taxa Administrativa (10%)', formatarMoeda(taxa)],
      ['Data', new Date().toLocaleDateString('pt-BR')],
      ['Status', 'EM ANÁLISE'],
    ]);

    drawSection('Dados da Empresa', [
      ['Empresa', 'Microcredito On'],
      ['CNPJ', '54.861.284/0001-30'],
    ]);

    // Footer
    doc.setFillColor(13, 46, 13);
    doc.rect(0, 280, W, 17, 'F');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(180, 180, 180);
    doc.text('Microcredito On | CNPJ 54.861.284/0001-30 | Documento gerado eletronicamente', W / 2, 290, { align: 'center' });

    doc.save(`comprovante_${numero}.pdf`);
  } catch (e) {
    console.error(e);
    alert('Erro ao gerar PDF: ' + e.message);
  } finally {
    btn.disabled = false;
    btn.innerHTML = '📄 Baixar Comprovante em PDF';
  }
};
