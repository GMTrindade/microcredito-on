// Utilitário de cálculo de taxa administrativa
export const TAXA_PERCENTUAL = 10; // 10%

export function calcularTaxa(valorSolicitado) {
  const valor = parseFloat(valorSolicitado) || 0;
  return valor * (TAXA_PERCENTUAL / 100);
}

export function gerarNumeroSolicitacao() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substr(2, 4).toUpperCase();
  return `MC${timestamp}${random}`;
}

export function formatarData(date) {
  if (!date) return '-';
  const d = date.toDate ? date.toDate() : new Date(date);
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}
