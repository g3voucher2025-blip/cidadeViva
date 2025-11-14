# 🔥 Guia Completo de Integração com Firebase

Este guia vai te ajudar a integrar o Firebase no seu projeto Turismo Connect, substituindo o sistema mock atual por uma solução real de autenticação e banco de dados.

## 📋 Índice

1. [Criar Projeto no Firebase](#1-criar-projeto-no-firebase)
2. [Configurar Firebase Authentication](#2-configurar-firebase-authentication)
3. [Configurar Firestore Database](#3-configurar-firestore-database)
4. [Instalar e Configurar SDK](#4-instalar-e-configurar-sdk)
5. [Modificar o Código](#5-modificar-o-código)
6. [Testar a Integração](#6-testar-a-integração)

---

## 1. Criar Projeto no Firebase

### Passo 1.1: Acessar Firebase Console

1. Acesse [https://console.firebase.google.com/](https://console.firebase.google.com/)
2. Faça login com sua conta Google
3. Clique em **"Adicionar projeto"** ou **"Create a project"**

### Passo 1.2: Configurar o Projeto

1. **Nome do projeto**: Digite "Turismo Connect" (ou outro nome de sua preferência)
2. **Google Analytics**: Você pode desabilitar por enquanto (não é obrigatório)
3. Clique em **"Criar projeto"**
4. Aguarde alguns segundos enquanto o Firebase cria o projeto

### Passo 1.3: Registrar App Web

1. No painel do projeto, clique no ícone **`</>`** (Web)
2. **Nome do app**: "Turismo Connect Web"
3. **Marque a opção**: "Também configurar o Firebase Hosting" (opcional, mas recomendado)
4. Clique em **"Registrar app"**
5. **IMPORTANTE**: Copie o objeto de configuração que aparece. Ele se parece com:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "turismo-connect-xxxxx.firebaseapp.com",
  projectId: "turismo-connect-xxxxx",
  storageBucket: "turismo-connect-xxxxx.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890",
};
```

6. Guarde essas informações! Você vai precisar delas no código.

---

## 2. Configurar Firebase Authentication

### Passo 2.1: Habilitar Authentication

1. No menu lateral do Firebase Console, clique em **"Authentication"** (Autenticação)
2. Clique em **"Começar"** ou **"Get started"**
3. Vá para a aba **"Sign-in method"** (Métodos de login)

### Passo 2.2: Habilitar Email/Senha

1. Clique em **"Email/Password"**
2. **Ative** a primeira opção: "Email/Password"
3. **Desative** a segunda opção: "Email link (passwordless sign-in)" (não vamos usar)
4. Clique em **"Salvar"**

### Passo 2.3: Criar Usuários de Teste (Opcional)

1. Na aba **"Users"**, clique em **"Add user"**
2. Crie 3 usuários de teste:
   - **Admin**: `admin@turismo.com` / senha: `admin123`
   - **Empresa**: `empresa@turismo.com` / senha: `empresa123`
   - **Turista**: `turista@turismo.com` / senha: `turista123`

> **Nota**: No código, vamos precisar adicionar um campo `role` customizado para cada usuário. Isso será feito via Firestore.

---

## 3. Configurar Firestore Database

### Passo 3.1: Criar Banco de Dados

1. No menu lateral, clique em **"Firestore Database"**
2. Clique em **"Criar banco de dados"**
3. Escolha o modo: **"Começar no modo de teste"** (para desenvolvimento)
4. **Localização**: Escolha a mais próxima (ex: `southamerica-east1` para Brasil)
5. Clique em **"Ativar"**

> ⚠️ **Importante**: O modo de teste permite leitura/escrita por 30 dias. Depois, você precisará configurar regras de segurança.

### Passo 3.2: Configurar Regras de Segurança (Básico)

1. Vá para a aba **"Regras"** no Firestore
2. Substitua as regras por estas (para desenvolvimento):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Usuários podem ler/escrever seus próprios dados
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Pontos turísticos: todos podem ler, apenas admins podem escrever
    match /points/{pointId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    // Eventos: todos podem ler, empresas podem escrever
    match /events/{eventId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'empresa';
    }

    // Avaliações: todos podem ler, turistas podem escrever
    match /reviews/{reviewId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'turista';
    }
  }
}
```

3. Clique em **"Publicar"**

> ⚠️ **Atenção**: Essas regras são básicas. Para produção, você precisará de regras mais robustas.

### Passo 3.3: Criar Estrutura de Dados

1. Vá para a aba **"Dados"**
2. As coleções serão criadas automaticamente quando o código rodar, mas você pode criá-las manualmente se preferir:
   - `users` - Armazena dados dos usuários (incluindo role)
   - `points` - Pontos turísticos
   - `events` - Eventos
   - `reviews` - Avaliações

#### 📋 Estrutura Detalhada das Coleções

##### Coleção: `users`

Armazena informações dos usuários do sistema.

| Campo       | Tipo        | Obrigatório | Descrição                                                   |
| ----------- | ----------- | ----------- | ----------------------------------------------------------- |
| `email`     | `string`    | ✅ Sim      | Email do usuário (usado para login)                         |
| `role`      | `string`    | ✅ Sim      | Tipo de usuário: `'admin'`, `'empresa'` ou `'turista'`      |
| `createdAt` | `timestamp` | ✅ Sim      | Data e hora de criação do registro (gerado automaticamente) |

**Exemplo de documento:**

```json
{
  "email": "admin@turismo.com",
  "role": "admin",
  "createdAt": "2024-01-15T10:30:00Z"
}
```

##### Coleção: `points`

Armazena pontos turísticos cadastrados por administradores.

| Campo         | Tipo            | Obrigatório | Descrição                                                                         |
| ------------- | --------------- | ----------- | --------------------------------------------------------------------------------- |
| `name`        | `string`        | ✅ Sim      | Nome do ponto turístico                                                           |
| `description` | `string`        | ✅ Sim      | Descrição detalhada do ponto                                                      |
| `lat`         | `number`        | ✅ Sim      | Latitude (coordenada geográfica)                                                  |
| `lng`         | `number`        | ✅ Sim      | Longitude (coordenada geográfica)                                                 |
| `category`    | `string`        | ✅ Sim      | Categoria: `'monumento'`, `'praia'`, `'museu'`, `'parque'`, `'igreja'`, `'outro'` |
| `cep`         | `string`        | ❌ Opcional | CEP do local (formato: "00000-000")                                               |
| `address`     | `string`        | ❌ Opcional | Endereço completo do local                                                        |
| `images`      | `array<string>` | ❌ Opcional | Array de URLs das imagens (hospedadas no imgBB)                                   |
| `image`       | `string`        | ❌ Opcional | URL da primeira imagem (para compatibilidade)                                     |
| `createdBy`   | `string`        | ✅ Sim      | Email do usuário que criou o ponto                                                |
| `createdAt`   | `timestamp`     | ✅ Sim      | Data e hora de criação (gerado automaticamente)                                   |

**Exemplo de documento:**

```json
{
  "name": "Lagoa Maior",
  "description": "É considerada o 'cartão-postal' da cidade...",
  "lat": -20.7836,
  "lng": -51.7156,
  "category": "parque",
  "cep": "79600-000",
  "address": "Rua Principal, Centro, Três Lagoas - MS",
  "images": [
    "https://i.ibb.co/abc123/lagoa-maior.jpg",
    "https://i.ibb.co/def456/lagoa-maior-2.jpg"
  ],
  "image": "https://i.ibb.co/abc123/lagoa-maior.jpg",
  "createdBy": "admin@turismo.com",
  "createdAt": "2024-01-15T10:30:00Z"
}
```

##### Coleção: `events`

Armazena eventos cadastrados por empresas ou administradores.

| Campo         | Tipo            | Obrigatório | Descrição                                       |
| ------------- | --------------- | ----------- | ----------------------------------------------- |
| `name`        | `string`        | ✅ Sim      | Nome do evento                                  |
| `description` | `string`        | ✅ Sim      | Descrição detalhada do evento                   |
| `date`        | `string`        | ✅ Sim      | Data do evento (formato: "YYYY-MM-DD")          |
| `time`        | `string`        | ✅ Sim      | Horário do evento (formato: "HH:mm")            |
| `lat`         | `number`        | ✅ Sim      | Latitude (coordenada geográfica)                |
| `lng`         | `number`        | ✅ Sim      | Longitude (coordenada geográfica)               |
| `cep`         | `string`        | ❌ Opcional | CEP do local do evento (formato: "00000-000")   |
| `address`     | `string`        | ❌ Opcional | Endereço completo do local do evento            |
| `images`      | `array<string>` | ❌ Opcional | Array de URLs das imagens (hospedadas no imgBB) |
| `image`       | `string`        | ❌ Opcional | URL da primeira imagem (para compatibilidade)   |
| `createdBy`   | `string`        | ✅ Sim      | Email do usuário que criou o evento             |
| `createdAt`   | `timestamp`     | ✅ Sim      | Data e hora de criação (gerado automaticamente) |

**Exemplo de documento:**

```json
{
  "name": "Festival de Música",
  "description": "Festival de música ao vivo com artistas locais",
  "date": "2024-02-15",
  "time": "18:00",
  "lat": -20.7836,
  "lng": -51.7156,
  "cep": "79600-000",
  "address": "Praça Central, Centro, Três Lagoas - MS",
  "images": ["https://i.ibb.co/xyz789/festival.jpg"],
  "image": "https://i.ibb.co/xyz789/festival.jpg",
  "createdBy": "empresa@turismo.com",
  "createdAt": "2024-01-15T10:30:00Z"
}
```

##### Coleção: `reviews`

Armazena avaliações deixadas por turistas sobre pontos turísticos ou eventos.

| Campo       | Tipo        | Obrigatório | Descrição                                         |
| ----------- | ----------- | ----------- | ------------------------------------------------- |
| `itemId`    | `string`    | ✅ Sim      | ID do ponto turístico ou evento avaliado          |
| `itemType`  | `string`    | ✅ Sim      | Tipo do item: `'ponto'` ou `'evento'`             |
| `rating`    | `number`    | ✅ Sim      | Nota de 1 a 5 (inteiro)                           |
| `comment`   | `string`    | ✅ Sim      | Comentário/avaliação textual                      |
| `userEmail` | `string`    | ✅ Sim      | Email do turista que fez a avaliação              |
| `createdAt` | `timestamp` | ✅ Sim      | Data e hora da avaliação (gerado automaticamente) |

**Exemplo de documento:**

```json
{
  "itemId": "abc123def456",
  "itemType": "ponto",
  "rating": 5,
  "comment": "Lugar incrível! Recomendo a todos.",
  "userEmail": "turista@turismo.com",
  "createdAt": "2024-01-15T10:30:00Z"
}
```

> 💡 **Nota**: Os documentos são criados automaticamente quando você usa o aplicativo. Você não precisa criar manualmente, mas é útil conhecer a estrutura para entender os dados.

---

## 4. Instalar e Configurar SDK

### Passo 4.1: Adicionar Scripts Firebase no HTML

1. Abra o arquivo `index.html`
2. Adicione os scripts do Firebase ANTES do `app.js`:

```html
<!-- Firebase SDK -->
<script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js"></script>
<script src="https://https://www.gstatic.com/firebasejs/10.7.1/firebase-auth-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore-compat.js"></script>
```

### Passo 4.2: Criar Arquivo de Configuração

1. Crie um novo arquivo: `firebase-config.js`
2. Cole sua configuração do Firebase:

```javascript
const firebaseConfig = {
  apiKey: "SUA_API_KEY_AQUI",
  authDomain: "SEU_AUTH_DOMAIN_AQUI",
  projectId: "SEU_PROJECT_ID_AQUI",
  storageBucket: "SEU_STORAGE_BUCKET_AQUI",
  messagingSenderId: "SEU_MESSAGING_SENDER_ID_AQUI",
  appId: "SEU_APP_ID_AQUI",
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);

// Inicializar serviços
const auth = firebase.auth();
const db = firebase.firestore();
```

3. Adicione este script no `index.html` ANTES do `app.js`:

```html
<script src="firebase-config.js"></script>
```

---

## 5. Modificar o Código

### Passo 5.1: Atualizar Sistema de Autenticação

No arquivo `app.js`, substitua as funções de autenticação:

**ANTES (mock):**

```javascript
function initLogin() {
  // código mock
}
```

**DEPOIS (Firebase):**

```javascript
function initLogin() {
  const loginForm = document.getElementById("login-form");
  loginForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const role = document.getElementById("role").value;

    try {
      // Criar ou fazer login
      let userCredential;
      try {
        // Tentar fazer login
        userCredential = await auth.signInWithEmailAndPassword(email, password);
      } catch (error) {
        // Se não existir, criar conta
        if (error.code === "auth/user-not-found") {
          userCredential = await auth.createUserWithEmailAndPassword(
            email,
            password
          );
          // Salvar role no Firestore
          await db.collection("users").doc(userCredential.user.uid).set({
            email: email,
            role: role,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          });
        } else {
          throw error;
        }
      }

      // Verificar se o role está correto
      const userDoc = await db
        .collection("users")
        .doc(userCredential.user.uid)
        .get();
      if (userDoc.exists() && userDoc.data().role !== role) {
        await auth.signOut();
        alert("Role não corresponde. Use a conta correta.");
        return;
      }

      currentUser = {
        email: email,
        role: role,
        id: userCredential.user.uid,
      };

      showApp();
    } catch (error) {
      console.error("Erro de autenticação:", error);
      alert("Erro ao fazer login: " + error.message);
    }
  });
}
```

### Passo 5.2: Atualizar Sistema de Dados

Substitua as funções `saveData()` e `loadData()`:

**Salvar dados:**

```javascript
async function savePoint(point) {
  try {
    await db.collection("points").doc(point.id).set(point);
  } catch (error) {
    console.error("Erro ao salvar ponto:", error);
    throw error;
  }
}

async function saveEvent(event) {
  try {
    await db.collection("events").doc(event.id).set(event);
  } catch (error) {
    console.error("Erro ao salvar evento:", error);
    throw error;
  }
}

async function saveReview(review) {
  try {
    await db.collection("reviews").doc(review.id).set(review);
  } catch (error) {
    console.error("Erro ao salvar avaliação:", error);
    throw error;
  }
}
```

**Carregar dados:**

```javascript
async function loadData() {
  try {
    // Carregar pontos
    const pointsSnapshot = await db.collection("points").get();
    points = pointsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    // Carregar eventos
    const eventsSnapshot = await db.collection("events").get();
    events = eventsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    // Carregar avaliações
    const reviewsSnapshot = await db.collection("reviews").get();
    reviews = reviewsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Se não houver dados, adicionar exemplos
    if (points.length === 0 && events.length === 0) {
      await addSampleData();
    }

    updateMapMarkers();
    updateItemsList();
  } catch (error) {
    console.error("Erro ao carregar dados:", error);
    alert("Erro ao carregar dados do servidor");
  }
}
```

### Passo 5.3: Atualizar Listener de Autenticação

Adicione um listener para detectar mudanças de autenticação:

```javascript
// No início do app.js, após inicialização
auth.onAuthStateChanged(async (user) => {
  if (user) {
    // Usuário logado
    const userDoc = await db.collection("users").doc(user.uid).get();
    if (userDoc.exists()) {
      const userData = userDoc.data();
      currentUser = {
        email: user.email,
        role: userData.role,
        id: user.uid,
      };
      showApp();
    }
  } else {
    // Usuário deslogado
    currentUser = null;
    document.getElementById("login-container").style.display = "flex";
    document.getElementById("app-container").style.display = "none";
  }
});
```

---

## 6. Testar a Integração

### Passo 6.1: Testar Login

1. Abra o projeto no navegador
2. Use os botões de demo para preencher as credenciais
3. Faça login
4. Verifique no Firebase Console → Authentication se o usuário foi criado

### Passo 6.2: Testar Cadastro de Ponto

1. Faça login como Admin
2. Cadastre um novo ponto turístico
3. Verifique no Firestore → `points` se o documento foi criado

### Passo 6.3: Testar Sincronização

1. Abra o app em duas abas diferentes
2. Cadastre um ponto em uma aba
3. Verifique se aparece na outra aba (pode precisar recarregar)

---

## 🔧 Próximos Passos (Opcional)

### Real-time Updates

Para atualizar automaticamente quando houver mudanças:

```javascript
// Escutar mudanças em tempo real
db.collection("points").onSnapshot((snapshot) => {
  points = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  updateMapMarkers();
  updateItemsList();
});
```

### Firebase Storage (para imagens)

1. Habilite Firebase Storage no console
2. Configure regras de segurança
3. Use `firebase.storage()` para upload de imagens

### Deploy no Firebase Hosting

1. Instale Firebase CLI: `npm install -g firebase-tools`
2. Faça login: `firebase login`
3. Inicialize: `firebase init hosting`
4. Deploy: `firebase deploy`

---

## ⚠️ Troubleshooting

### Erro: "Firebase: Error (auth/network-request-failed)"

- Verifique sua conexão com internet
- Verifique se as regras do Firestore permitem acesso

### Erro: "Missing or insufficient permissions"

- Verifique as regras de segurança do Firestore
- Certifique-se de que o usuário está autenticado

### Dados não aparecem

- Verifique o console do navegador (F12) para erros
- Verifique se os dados foram salvos no Firestore Console

---

## 📚 Recursos Adicionais

- [Documentação Firebase](https://firebase.google.com/docs)
- [Firebase Authentication](https://firebase.google.com/docs/auth)
- [Cloud Firestore](https://firebase.google.com/docs/firestore)
- [Firebase Hosting](https://firebase.google.com/docs/hosting)

---

**Pronto!** Agora seu projeto está integrado com Firebase. 🎉
