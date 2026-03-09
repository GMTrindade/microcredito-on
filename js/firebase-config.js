// =====================================================
// FIREBASE CONFIGURATION - Microcredito On
// =====================================================

// Firebase SDKs via CDN (necessário para GitHub Pages)

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-analytics.js";

// =====================================================
// CONFIGURAÇÃO DO SEU PROJETO FIREBASE
// =====================================================

const firebaseConfig = {
  apiKey: "AIzaSyA3AJBWQyS_AYZB-61ES1DPwMPIgfCJ6pc",
  authDomain: "microcredito-on.firebaseapp.com",
  projectId: "microcredito-on",
  storageBucket: ""microcredito-on.appspot.com"",
  messagingSenderId: "1072247220735",
  appId: "1:1072247220735:web:179e565b371aa97fdf1fca",
  measurementId: "G-6TM84Z1EYF"
};

// =====================================================
// INICIALIZAÇÃO
// =====================================================
