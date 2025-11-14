// ============================================
// CONFIGURAÇÃO DO FIREBASE
// ============================================
// IMPORTANTE: Substitua os valores abaixo pelos dados do seu projeto Firebase
// Você encontra essas informações no Firebase Console > Configurações do projeto

const firebaseConfig = {
  apiKey: "AIzaSyCyQ9-P0HU9uDuAIjVcqbVIR5gGJHLbhVk",
  authDomain: "turisconnect-7ae28.firebaseapp.com",
  projectId: "turisconnect-7ae28",
  storageBucket: "turisconnect-7ae28.firebasestorage.app",
  messagingSenderId: "568443728062",
  appId: "1:568443728062:web:8c1a6b5af0377eea66aeef",
  measurementId: "G-0CRZZ4XX1L",
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);

// Inicializar serviços
const auth = firebase.auth();
const db = firebase.firestore();

// Configurar persistência offline (opcional)
db.enablePersistence().catch((err) => {
  if (err.code == "failed-precondition") {
    console.warn("Persistência offline falhou: múltiplas abas abertas");
  } else if (err.code == "unimplemented") {
    console.warn("Persistência offline não suportada neste navegador");
  }
});

// ============================================
// CONFIGURAÇÃO DO IMGBB
// ============================================
// IMPORTANTE: Obtenha sua API Key em https://api.imgbb.com/
// Substitua 'SUA_IMGBB_API_KEY' pela sua chave

const IMGBB_API_KEY = "6aed5710818f84c35c61293a03cf543c";
