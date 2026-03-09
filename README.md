# Microcredito On — Sistema Web de Microcrédito

Aplicação web completa para solicitação de microcrédito online, pronta para GitHub Pages.

## 🚀 Como Configurar

### 1. Criar projeto no Firebase

1. Acesse [console.firebase.google.com](https://console.firebase.google.com)
2. Crie um novo projeto
3. Ative os seguintes serviços:
   - **Authentication** → E-mail/Senha
   - **Firestore Database** → Modo de produção
   - **Storage**

### 2. Configurar as credenciais Firebase

Substitua `YOUR_API_KEY`, `YOUR_PROJECT_ID`, etc. em **todos os arquivos HTML**:

- `index.html` — não precisa
- `cadastro.html`
- `pagamento.html`
- `status.html`
- `admin/admin.html`
- `admin/dashboard.html`

As credenciais ficam neste trecho:
```javascript
const firebaseConfig = {
  apiKey: "SUA_API_KEY",
  authDomain: "SEU_PROJETO.firebaseapp.com",
  projectId: "SEU_PROJECT_ID",
  storageBucket: "SEU_PROJETO.appspot.com",
  messagingSenderId: "SEU_SENDER_ID",
  appId: "SEU_APP_ID"
};
```

### 3. Regras do Firestore

No console Firebase, em **Firestore → Regras**, cole:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /solicitacoes/{doc} {
      allow read, write: if true; // Ajuste para produção
    }
  }
}
```

### 4. Regras do Storage

Em **Storage → Regras**:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if true; // Ajuste para produção
    }
  }
}
```

### 5. Criar usuário admin

Em **Authentication → Users**, clique em "Adicionar usuário" e cadastre o e-mail e senha do administrador.

### 6. Deploy no GitHub Pages

1. Crie um repositório no GitHub
2. Faça upload de todos os arquivos
3. Em **Settings → Pages**, selecione a branch `main` e pasta `/root`
4. Acesse a URL gerada pelo GitHub Pages

---

## 📁 Estrutura de Arquivos

```
microcredito-app/
├── index.html          → Página inicial
├── cadastro.html       → Formulário de solicitação
├── pagamento.html      → Pagamento da taxa PIX
├── status.html         → Consulta de status
├── admin/
│   ├── admin.html      → Login administrativo
│   └── dashboard.html  → Painel de gestão
├── js/
│   ├── cadastro.js     → Lógica de cadastro
│   ├── pagamento.js    → Lógica de pagamento
│   ├── admin.js        → Lógica do painel
│   └── app.js          → Utilitários gerais
├── css/
│   └── styles.css      → Estilos globais
├── utils/
│   ├── validarCPF.js   → Validação de CPF
│   ├── calcularTaxa.js → Cálculo de taxa
│   └── gerarPDF.js     → Geração de PDF
└── assets/
    ├── logo.png        → Logo da empresa
    └── qrcode.png      → QR Code PIX
```

---

## 💰 Informações da Empresa

- **Nome:** Microcredito On
- **CNPJ:** 54.861.284/0001-30
- **Chave PIX:** 10c918cf-f245-44c3-8a48-0dfbd77a111d

---

## 📋 Fluxo do Sistema

1. Cliente acessa `index.html` e clica em "Solicitar Empréstimo"
2. Preenche dados pessoais em `cadastro.html`
3. Faz upload dos documentos (RG/CNH + selfie)
4. Sistema verifica se CPF já tem solicitação ativa
5. Redireciona para `pagamento.html` com valor da taxa (10%)
6. Cliente faz pagamento PIX e envia comprovante
7. Status muda para "em_analise"
8. Admin acessa `/admin/admin.html`, faz login
9. No dashboard visualiza e aprova/reprova solicitações
10. Cliente consulta status em `status.html` pelo CPF
