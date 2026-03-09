// Utilitário de geração de PDF - usa jsPDF via CDN

export async function gerarPDFComprovante(dados) {
  // jsPDF é carregado via CDN no HTML
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const W = 210, margin = 20;
  let y = 0;

  // Fundo do cabeçalho
  doc.setFillColor(13, 46, 13);
  doc.rect(0, 0, W, 55, 'F');

  // Logo (tenta carregar)
  try {
    const logoDataUrl = await imageToDataUrl('../assets/logo.png');
    doc.addImage(logoDataUrl, 'PNG', margin, 12, 70, 28);
  } catch (e) {
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(240, 192, 64);
    doc.text('Microcredito On', margin, 30);
  }

  // CNPJ no cabeçalho
  doc.setFontSize(9);
  doc.setTextColor(200, 200, 200);
  doc.setFont('helvetica', 'normal');
  doc.text('CNPJ: 54.861.284/0001-30', W - margin, 28, { align: 'right' });

  // Título do documento
  doc.setFontSize(11);
  doc.setTextColor(212, 160, 23);
  doc.setFont('helvetica', 'bold');
  doc.text('COMPROVANTE DE SOLICITAÇÃO DE MICROCRÉDITO', W / 2, 45, { align: 'center' });

  y = 68;

  // Número da solicitação
  doc.setFillColor(245, 247, 245);
  doc.roundedRect(margin, y - 6, W - margin * 2, 22, 3, 3, 'F');
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.setFont('helvetica', 'normal');
  doc.text('Nº da Solicitação', margin + 8, y + 2);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 77, 30);
  doc.text(dados.numeroSolicitacao || '-', W - margin - 8, y + 2, { align: 'right' });
  y += 28;

  // Seção dados do cliente
  const drawSection = (title, items) => {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(13, 46, 13);
    doc.text(title.toUpperCase(), margin, y);
    doc.setDrawColor(58, 158, 58);
    doc.setLineWidth(0.5);
    doc.line(margin, y + 2, W - margin, y + 2);
    y += 10;

    items.forEach(([key, value]) => {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(120, 120, 120);
      doc.text(key, margin, y);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(40, 40, 40);
      doc.text(String(value || '-'), W - margin, y, { align: 'right' });
      doc.setDrawColor(230, 230, 230);
      doc.setLineWidth(0.2);
      doc.line(margin, y + 2, W - margin, y + 2);
      y += 11;
    });
    y += 6;
  };

  drawSection('Dados do Cliente', [
    ['Nome Completo', dados.nome],
    ['CPF', dados.cpf],
    ['Telefone', dados.telefone],
    ['E-mail', dados.email],
  ]);

  drawSection('Dados da Solicitação', [
    ['Valor Solicitado', dados.valorFormatado],
    ['Taxa Administrativa (10%)', dados.taxaFormatada],
    ['Data da Solicitação', dados.data],
    ['Status', dados.status?.toUpperCase() || 'PENDENTE'],
  ]);

  // Rodapé
  doc.setFillColor(13, 46, 13);
  doc.rect(0, 280, W, 17, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(180, 180, 180);
  doc.text('Microcredito On | CNPJ 54.861.284/0001-30 | Documento gerado eletronicamente', W / 2, 290, { align: 'center' });

  // Marca d'água COMPROVANTE
  doc.setFontSize(52);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(200, 200, 200);
  doc.setGState(new doc.GState({ opacity: 0.08 }));
  doc.text('COMPROVANTE', W / 2, 160, { align: 'center', angle: 35 });

  doc.save(`comprovante_${dados.numeroSolicitacao || 'microcredito'}.pdf`);
}

async function imageToDataUrl(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      canvas.getContext('2d').drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = reject;
    img.src = src;
  });
}
