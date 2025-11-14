# 🚀 Início Rápido - Integração Firebase

## ⚡ Resumo em 5 Passos

### 1️⃣ Criar Projeto Firebase (5 min)
1. Acesse [console.firebase.google.com](https://console.firebase.google.com)
2. Clique em "Adicionar projeto"
3. Nome: "Turismo Connect"
4. Clique em "Registrar app" (ícone `</>`)
5. **Copie o objeto de configuração**

### 2️⃣ Configurar Serviços (3 min)
1. **Authentication**: Menu lateral → Authentication → Começar → Email/Password → Ativar
2. **Firestore**: Menu lateral → Firestore Database → Criar banco → Modo teste → Ativar

### 3️⃣ Configurar Regras (2 min)
1. Firestore → Regras
2. Cole o conteúdo de `firestore-rules.txt`
3. Clique em "Publicar"

### 4️⃣ Configurar Código (2 min)
1. Abra `firebase-config.js`
2. Cole suas credenciais do Firebase
3. No `index.html`, adicione ANTES do `app.js`:
   ```html
   <!-- Firebase SDK -->
   <script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js"></script>
   <script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-auth-compat.js"></script>
   <script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore-compat.js"></script>
   <script src="firebase-config.js"></script>
   ```
4. Substitua `app.js` por `app-firebase.js` (ou renomeie)

### 5️⃣ Testar (1 min)
1. Abra o projeto no navegador
2. Use os botões de demo para fazer login
3. Cadastre um ponto/evento
4. Verifique no Firestore Console se apareceu

---

## 📁 Arquivos Importantes

- `GUIA_FIREBASE.md` - Guia completo detalhado
- `firebase-config.js` - Configuração (preencher com suas credenciais)
- `app-firebase.js` - Código com integração Firebase
- `firestore-rules.txt` - Regras de segurança
- `CHECKLIST_FIREBASE.md` - Checklist completo

---

## 🎯 Próximo Passo

Leia o **`GUIA_FIREBASE.md`** para instruções detalhadas de cada etapa.

---

**Tempo total estimado: ~15 minutos** ⏱️

