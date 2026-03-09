// app.js — Utilitários gerais da aplicação Microcredito On

// Formatar moeda BRL
export function formatarMoeda(v) {
  return parseFloat(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// Formatar CPF
export function formatarCPF(cpf) {
  return String(cpf || '').replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

// Formatar data Firebase Timestamp
export function formatarData(ts) {
  if (!ts) return '-';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

// Status labels
export const statusLabels = {
  pendente: '⏳ Pendente',
  taxa_pendente: '💳 Taxa Pendente',
  em_analise: '🔍 Em Análise',
  aprovado: '✅ Aprovado',
  reprovado: '❌ Reprovado',
};

// Show alert
export function showAlert(type, message, container) {
  const el = document.getElementById(container);
  if (!el) return;
  el.className = `alert alert-${type}`;
  el.style.display = 'flex';
  el.innerHTML = `<span>${message}</span>`;
}
