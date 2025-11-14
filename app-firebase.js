// ============================================
// APP.JS COM INTEGRAÇÃO FIREBASE
// ============================================
// Este arquivo substitui o app.js original
// Renomeie este arquivo para app.js após configurar o Firebase

// Estado da aplicação
let currentUser = null;
let map = null;
let markers = [];
let points = [];
let events = [];
let reviews = [];
let establishments = [];

// Coordenadas padrão (Três Lagoas - MS)
const DEFAULT_CENTER = [-20.7836, -51.7156]; // Três Lagoas - MS

// ========== CACHE E OTIMIZAÇÕES ==========
// Cache de ratings para evitar recálculos
const ratingsCache = new Map();
const CACHE_TTL = 60000; // 1 minuto

// Cache de ícones do Leaflet (criar uma vez e reutilizar)
let mapIcons = null;

function getMapIcons() {
  if (!mapIcons) {
    mapIcons = {
      default: L.icon({
        iconUrl:
          "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
      }),
      event: L.icon({
        iconUrl:
          "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
      }),
      verified: L.icon({
        iconUrl:
          "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
      }),
      unverified: L.icon({
        iconUrl:
          "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-orange.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
      }),
    };
  }
  return mapIcons;
}

// Função reutilizável para centralizar mapa em um item
function centerMapOnItem(item, itemType) {
  if (!map || !item.lat || !item.lng) return;

  // Usar requestAnimationFrame para melhor performance
  requestAnimationFrame(() => {
    if (!map) return;

    map.invalidateSize();

    // Usar panTo com animação suave
    map.panTo([item.lat, item.lng], { animate: true, duration: 0.5 });

    // Após animação, ajustar zoom e abrir popup
    setTimeout(() => {
      if (!map) return;

      map.setView([item.lat, item.lng], 15, { animate: true });

      // Encontrar marcador usando Map para melhor performance
      let foundMarker = null;
      const targetLat = item.lat;
      const targetLng = item.lng;
      const tolerance = 0.0001;

      // Buscar marcador de forma mais eficiente
      for (let i = 0; i < markers.length; i++) {
        const marker = markers[i];
        const latlng = marker.getLatLng();
        if (
          Math.abs(latlng.lat - targetLat) < tolerance &&
          Math.abs(latlng.lng - targetLng) < tolerance
        ) {
          foundMarker = marker;
          break;
        }
      }

      if (foundMarker) {
        // Criar popup se não existir
        if (!foundMarker.getPopup()) {
          let popupContent;
          if (itemType === "point") {
            popupContent = createPointPopup(item);
          } else if (itemType === "event") {
            popupContent = createEventPopup(item);
          } else if (itemType === "establishment") {
            popupContent = createEstablishmentPopup(item);
          }
          if (popupContent) {
            foundMarker.bindPopup(popupContent, { maxWidth: 300 });
          }
        }
        foundMarker.openPopup();
      }
    }, 100);
  });
}

// ========== LOADING INDICATORS ==========
function showLoading(message = "Carregando...") {
  const loadingEl = document.getElementById("global-loading");
  const loadingText = document.getElementById("loading-text");
  if (loadingEl && loadingText) {
    loadingText.textContent = message;
    loadingEl.style.display = "flex";
  }
}

function hideLoading() {
  const loadingEl = document.getElementById("global-loading");
  if (loadingEl) {
    loadingEl.style.display = "none";
  }
}

function showMapLoading() {
  const mapLoading = document.getElementById("map-loading");
  if (mapLoading) {
    mapLoading.style.display = "flex";
  }
}

function hideMapLoading() {
  const mapLoading = document.getElementById("map-loading");
  if (mapLoading) {
    mapLoading.style.display = "none";
  }
}

// ========== SISTEMA DE NOTIFICAÇÕES ==========
function showNotification(message, type = "info", title = null) {
  const container = document.getElementById("notifications-container");
  if (!container) return;

  // Verificar se já existe uma notificação idêntica para evitar duplicatas
  const existingNotifications = container.querySelectorAll(".notification");
  for (let existing of existingNotifications) {
    const existingMessage = existing
      .querySelector(".notification-message")
      ?.textContent?.trim();
    const existingTitle = existing
      .querySelector(".notification-title")
      ?.textContent?.trim();
    const messageMatch = existingMessage === message.trim();
    const titleMatch = title ? existingTitle === title : !existingTitle;

    if (messageMatch && titleMatch) {
      // Já existe uma notificação idêntica, não criar duplicata
      return;
    }
  }

  const notification = document.createElement("div");
  notification.className = `notification ${type}`;

  const icons = {
    success: "✅",
    error: "❌",
    info: "ℹ️",
    warning: "⚠️",
  };

  const titles = {
    success: "Sucesso",
    error: "Erro",
    info: "Informação",
    warning: "Aviso",
  };

  notification.innerHTML = `
        <div class="notification-icon">${icons[type] || icons.info}</div>
        <div class="notification-content">
            ${title ? `<div class="notification-title">${title}</div>` : ""}
            <div class="notification-message">${message}</div>
        </div>
        <button class="notification-close" onclick="this.parentElement.remove()">×</button>
    `;

  container.appendChild(notification);

  // Remover automaticamente após 5 segundos
  setTimeout(() => {
    if (notification.parentElement) {
      notification.classList.add("slide-out");
      setTimeout(() => {
        if (notification.parentElement) {
          notification.remove();
        }
      }, 300);
    }
  }, 5000);
}

// Funções auxiliares para tipos específicos
function showSuccess(message, title = null) {
  showNotification(message, "success", title);
}

function showError(message, title = null) {
  showNotification(message, "error", title);
}

function showInfo(message, title = null) {
  showNotification(message, "info", title);
}

function showWarning(message, title = null) {
  showNotification(message, "warning", title);
}

// Função de confirmação customizada (substitui confirm/alert)
function showConfirm(message, title = "Confirmar", onConfirm, onCancel = null) {
  const container = document.getElementById("notifications-container");
  if (!container) {
    // Fallback para confirm nativo se container não existir
    if (confirm(message)) {
      onConfirm();
    } else if (onCancel) {
      onCancel();
    }
    return;
  }

  // Criar overlay de confirmação
  const overlay = document.createElement("div");
  overlay.className = "confirm-overlay";
  overlay.innerHTML = `
    <div class="confirm-modal">
      <div class="confirm-header">
        <h3>${title}</h3>
        <button class="confirm-close" onclick="this.closest('.confirm-overlay').remove()">×</button>
      </div>
      <div class="confirm-body">
        <p>${message}</p>
      </div>
      <div class="confirm-actions">
        <button class="btn btn-secondary confirm-cancel">Cancelar</button>
        <button class="btn btn-primary confirm-ok">Confirmar</button>
      </div>
    </div>
  `;

  container.appendChild(overlay);

  // Event listeners
  const cancelBtn = overlay.querySelector(".confirm-cancel");
  const okBtn = overlay.querySelector(".confirm-ok");
  const closeBtn = overlay.querySelector(".confirm-close");

  const close = () => {
    overlay.classList.add("fade-out");
    setTimeout(() => {
      if (overlay.parentElement) {
        overlay.remove();
      }
    }, 300);
  };

  cancelBtn.onclick = () => {
    close();
    if (onCancel) onCancel();
  };

  okBtn.onclick = () => {
    close();
    onConfirm();
  };

  closeBtn.onclick = () => {
    close();
    if (onCancel) onCancel();
  };

  // Fechar ao clicar no overlay
  overlay.onclick = (e) => {
    if (e.target === overlay) {
      close();
      if (onCancel) onCancel();
    }
  };
}

// Inicialização
document.addEventListener("DOMContentLoaded", function () {
  initLogin();
  initRegister();
  initForms();
  initSurvey();
  initImageLightbox();
  setupAuthListener();
  // Inicializar visibilidade do filtro de categoria
  setTimeout(() => {
    handleFilterChange();
  }, 100);
  // Não inicializar mapa aqui - será inicializado quando mostrar o app
});

// ========== AUTENTICAÇÃO COM FIREBASE ==========
function setupAuthListener() {
  // Listener para mudanças de autenticação
  auth.onAuthStateChanged(async (user) => {
    if (user) {
      // Usuário logado - buscar dados do usuário no Firestore
      try {
        const userDoc = await db.collection("users").doc(user.uid).get();
        let userData = userDoc.data();

        // Se o documento não existe, aguardar um pouco e tentar novamente
        // (pode ser uma condição de corrida onde o documento ainda está sendo criado)
        if (!userData || !userData.role) {
          console.warn("Documento do usuário não encontrado, aguardando...");
          // Aguardar um pouco e tentar novamente
          await new Promise((resolve) => setTimeout(resolve, 500));
          const retryDoc = await db.collection("users").doc(user.uid).get();
          userData = retryDoc.data();

          // Se ainda não existir, criar com role padrão
          if (!userData || !userData.role) {
            console.warn("Criando documento do usuário com role padrão...");
            await db.collection("users").doc(user.uid).set(
              {
                email: user.email,
                role: "turista", // role padrão - será atualizado no próximo login
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
              },
              { merge: true }
            );

            // Buscar novamente
            const newUserDoc = await db.collection("users").doc(user.uid).get();
            userData = newUserDoc.data();
          }
        }

        if (userData && userData.role) {
          currentUser = {
            email: user.email,
            role: userData.role,
            id: user.uid,
          };
          showApp();
        } else {
          // Se ainda não tiver dados, fazer logout
          await auth.signOut();
          showError(
            "Erro ao carregar dados do usuário. Por favor, faça login novamente.",
            "Erro de Autenticação"
          );
        }
      } catch (error) {
        console.error("Erro ao buscar dados do usuário:", error);
        await auth.signOut();
        showError(
          "Erro ao conectar com o servidor. Verifique sua conexão e tente novamente.",
          "Erro de Conexão"
        );
      }
    } else {
      // Usuário deslogado - mostrar como visitante
      currentUser = null;
      showAppAsVisitor();
    }
  });
}

function initLogin() {
  const loginForm = document.getElementById("login-form");
  loginForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const role = document.getElementById("role").value;

    if (!email || !password || !role) {
      showWarning("Por favor, preencha todos os campos", "Campos Obrigatórios");
      return;
    }

    try {
      // Tentar fazer login primeiro
      let userCredential;
      let isNewUser = false;

      try {
        userCredential = await auth.signInWithEmailAndPassword(email, password);
      } catch (error) {
        // Se usuário não existe, criar conta
        if (error.code === "auth/user-not-found") {
          // Criar nova conta
          userCredential = await auth.createUserWithEmailAndPassword(
            email,
            password
          );
          isNewUser = true;
        } else if (error.code === "auth/wrong-password") {
          // Senha incorreta - não criar nova conta
          throw new Error("Senha incorreta");
        } else {
          throw error;
        }
      }

      // Verificar se o documento do usuário existe no Firestore
      const userDoc = await db
        .collection("users")
        .doc(userCredential.user.uid)
        .get();
      const userData = userDoc.data();

      // Se é um novo usuário OU o documento não existe, criar/atualizar com o role selecionado
      if (isNewUser || !userData || !userData.role) {
        await db.collection("users").doc(userCredential.user.uid).set(
          {
            email: email,
            role: role,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        ); // merge: true para não sobrescrever createdAt se já existir
      } else if (userData.role !== role) {
        // Se o role não corresponde, fazer logout
        await auth.signOut();
        showError(
          "Role não corresponde. Use a conta correta para este tipo de usuário. Esta conta é: " +
            userData.role,
          "Acesso Negado"
        );
        return;
      }

      // Aguardar um pouco para garantir que o documento foi salvo
      await new Promise((resolve) => setTimeout(resolve, 100));

      // O listener onAuthStateChanged vai atualizar o currentUser automaticamente
    } catch (error) {
      console.error("Erro de autenticação:", error);
      let errorMessage = "Erro ao fazer login: ";

      switch (error.code) {
        case "auth/invalid-email":
          errorMessage += "Email inválido";
          break;
        case "auth/user-disabled":
          errorMessage += "Usuário desabilitado";
          break;
        case "auth/wrong-password":
          errorMessage += "Senha incorreta";
          break;
        case "auth/weak-password":
          errorMessage += "Senha muito fraca (mínimo 6 caracteres)";
          break;
        case "auth/email-already-in-use":
          errorMessage += "Email já está em uso";
          break;
        default:
          errorMessage += error.message;
      }

      showError(errorMessage, "Erro no Login");
    }
  });
}

// Alternar entre login e cadastro
function showRegisterForm() {
  document.getElementById("login-container").style.display = "none";
  document.getElementById("register-container").style.display = "flex";
}

function showLoginForm() {
  // Se já estiver no app, mostrar modal de login
  if (document.getElementById("app-container").style.display === "flex") {
    document.getElementById("login-container").style.display = "flex";
    document.getElementById("app-container").style.display = "none";
  } else {
    document.getElementById("register-container").style.display = "none";
    document.getElementById("login-container").style.display = "flex";
  }
}

// Fechar tela de login e continuar como visitante
function closeLoginForm() {
  document.getElementById("login-container").style.display = "none";
  document.getElementById("register-container").style.display = "none";
  // Se o app ainda não estiver visível, mostrar como visitante
  if (document.getElementById("app-container").style.display !== "flex") {
    showAppAsVisitor();
  } else {
    document.getElementById("app-container").style.display = "flex";
  }
}

// Inicializar formulário de cadastro
function initRegister() {
  const registerForm = document.getElementById("register-form");
  registerForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const email = document.getElementById("register-email").value;
    const password = document.getElementById("register-password").value;
    const passwordConfirm = document.getElementById(
      "register-password-confirm"
    ).value;
    const role = document.getElementById("register-role").value;

    // Validações
    if (!email || !password || !passwordConfirm || !role) {
      showWarning("Por favor, preencha todos os campos", "Campos Obrigatórios");
      return;
    }

    if (password !== passwordConfirm) {
      showWarning("As senhas não coincidem", "Validação");
      return;
    }

    if (password.length < 6) {
      showWarning("A senha deve ter no mínimo 6 caracteres", "Validação");
      return;
    }

    // Não permitir criar admin
    if (role === "admin") {
      showError(
        "Administradores devem ser criados pelo Firebase Console",
        "Acesso Restrito"
      );
      return;
    }

    try {
      const submitBtn = e.target.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = "Criando conta...";

      // Criar usuário no Firebase Authentication
      const userCredential = await auth.createUserWithEmailAndPassword(
        email,
        password
      );

      // Criar documento no Firestore com o role
      await db.collection("users").doc(userCredential.user.uid).set({
        email: email,
        role: role,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      });

      // Aguardar um pouco para garantir que o documento foi salvo
      await new Promise((resolve) => setTimeout(resolve, 100));

      submitBtn.textContent = originalText;
      submitBtn.disabled = false;

      showSuccess(
        "Conta criada com sucesso! Você será redirecionado...",
        "Cadastro Realizado"
      );

      // O listener onAuthStateChanged vai atualizar o currentUser e mostrar o app
      // Não precisamos fazer nada mais aqui
    } catch (error) {
      console.error("Erro ao criar conta:", error);
      const submitBtn = e.target.querySelector('button[type="submit"]');
      submitBtn.disabled = false;
      submitBtn.textContent = "Criar Conta";

      let errorMessage = "Erro ao criar conta: ";

      switch (error.code) {
        case "auth/invalid-email":
          errorMessage += "Email inválido";
          break;
        case "auth/weak-password":
          errorMessage += "Senha muito fraca (mínimo 6 caracteres)";
          break;
        case "auth/email-already-in-use":
          errorMessage += "Este email já está em uso. Tente fazer login.";
          break;
        case "auth/operation-not-allowed":
          errorMessage += "Operação não permitida";
          break;
        default:
          errorMessage += error.message;
      }

      showError(errorMessage, "Erro no Login");
    }
  });
}

function fillDemo(role) {
  const demos = {
    admin: { email: "admin@turismo.com", password: "admin123" },
    empresa: { email: "empresa@turismo.com", password: "empresa123" },
    turista: { email: "turista@turismo.com", password: "turista123" },
  };

  document.getElementById("email").value = demos[role].email;
  document.getElementById("password").value = demos[role].password;
  document.getElementById("role").value = role;
}

async function logout() {
  try {
    await auth.signOut();
    currentUser = null;
    document.getElementById("login-form").reset();
  } catch (error) {
    console.error("Erro ao fazer logout:", error);
    showError("Erro ao fazer logout", "Erro");
  }
}

function showApp() {
  // Ocultar todas as telas de autenticação
  document.getElementById("login-container").style.display = "none";
  document.getElementById("register-container").style.display = "none";

  // Mostrar aplicação
  document.getElementById("app-container").style.display = "flex";

  // Scroll para o topo
  window.scrollTo(0, 0);

  // Atualizar UI
  updateUI();

  // Inicializar mapa se necessário
  if (!map) {
    initMap();
  }

  // Carregar dados (forçar refresh após login/logout)
  loadData(true);

  // Se for turista, mostrar boas-vindas
  if (currentUser && currentUser.role === "turista") {
    // Cancelar timeouts anteriores se existirem
    if (welcomeTimeoutId) {
      clearTimeout(welcomeTimeoutId);
      welcomeTimeoutId = null;
    }
    if (surveyTimeoutId) {
      clearTimeout(surveyTimeoutId);
      surveyTimeoutId = null;
    }

    welcomeTimeoutId = setTimeout(() => {
      showWelcomeModal();
      welcomeTimeoutId = null;
    }, 500);

    surveyTimeoutId = setTimeout(() => {
      showSurveyModal();
      surveyTimeoutId = null;
    }, 5000);
  }
}

// Mostrar app como visitante (sem login)
function showAppAsVisitor() {
  // Ocultar telas de autenticação
  document.getElementById("login-container").style.display = "none";
  document.getElementById("register-container").style.display = "none";

  // Mostrar aplicação
  document.getElementById("app-container").style.display = "flex";

  // Scroll para o topo
  window.scrollTo(0, 0);

  // Atualizar UI para visitante
  updateUIAsVisitor();

  // Inicializar mapa se necessário
  if (!map) {
    initMap();
  }

  // Carregar dados (forçar refresh do servidor para evitar cache)
  loadData(true);

  // Cancelar timeouts anteriores se existirem
  if (welcomeTimeoutId) {
    clearTimeout(welcomeTimeoutId);
    welcomeTimeoutId = null;
  }
  if (surveyTimeoutId) {
    clearTimeout(surveyTimeoutId);
    surveyTimeoutId = null;
  }

  // Mostrar mensagem de boas-vindas
  welcomeTimeoutId = setTimeout(() => {
    showWelcomeModal();
    welcomeTimeoutId = null;
  }, 500);

  // Mostrar popup de pesquisa após um delay maior
  surveyTimeoutId = setTimeout(() => {
    showSurveyModal();
    surveyTimeoutId = null;
  }, 5000);
}

function updateUI() {
  if (!currentUser) {
    updateUIAsVisitor();
    return;
  }

  // Atualizar badge de role
  const roleBadge = document.getElementById("user-role-badge");
  roleBadge.textContent = currentUser.role;
  roleBadge.className = "user-role " + currentUser.role;

  // Atualizar email
  document.getElementById("user-email").textContent = currentUser.email;

  // Mostrar botão de logout
  const logoutBtn = document.querySelector(".btn-logout");
  if (logoutBtn) logoutBtn.style.display = "inline-block";

  // Mostrar painel correto
  document.getElementById("admin-panel").style.display =
    currentUser.role === "admin" ? "block" : "none";
  document.getElementById("empresa-panel").style.display =
    currentUser.role === "empresa" ? "block" : "none";
  document.getElementById("turista-panel").style.display =
    currentUser.role === "turista" ? "block" : "none";

  // Esconder botão de login
  const loginBtn = document.getElementById("visitor-login-btn");
  if (loginBtn) loginBtn.style.display = "none";
}

function updateUIAsVisitor() {
  // Atualizar badge para visitante
  const roleBadge = document.getElementById("user-role-badge");
  roleBadge.textContent = "Visitante";
  roleBadge.className = "user-role visitor";

  // Atualizar email
  document.getElementById("user-email").textContent = "Não logado";

  // Esconder botão de logout
  const logoutBtn = document.querySelector(".btn-logout");
  if (logoutBtn) logoutBtn.style.display = "none";

  // Mostrar botão de login
  const loginBtn = document.getElementById("visitor-login-btn");
  if (loginBtn) loginBtn.style.display = "inline-block";

  // Esconder todos os painéis
  document.getElementById("admin-panel").style.display = "none";
  document.getElementById("empresa-panel").style.display = "none";
  document.getElementById("turista-panel").style.display = "none";
}

// ========== MAPA ==========
function initMap() {
  // Mostrar loading do mapa
  showMapLoading();

  if (map) {
    map.remove();
    map = null;
  }

  // Aguardar um pouco para garantir que o elemento está visível
  setTimeout(() => {
    const mapElement = document.getElementById("map");
    if (!mapElement) {
      console.error("Elemento do mapa não encontrado");
      hideMapLoading();
      return;
    }

    map = L.map("map", {
      preferCanvas: true, // Usar canvas para melhor performance
      zoomControl: true,
      scrollWheelZoom: true,
    }).setView(DEFAULT_CENTER, 13);

    // Tile layer com otimizações
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
      maxZoom: 19,
      tileSize: 256,
      zoomOffset: 0,
      updateWhenZooming: false, // Melhor performance
      updateWhenIdle: true,
    }).addTo(map);

    // Quando o mapa estiver pronto, ocultar loading
    map.whenReady(() => {
      hideMapLoading();
    });

    // Invalidar tamanho após um pequeno delay
    setTimeout(() => {
      if (map) {
        map.invalidateSize();
      }
    }, 100);

    // Adicionar listener para cliques no mapa (ajudar a pegar coordenadas)
    map.on("click", function (e) {
      if (
        currentUser &&
        (currentUser.role === "admin" || currentUser.role === "empresa")
      ) {
        const lat = e.latlng.lat.toFixed(6);
        const lng = e.latlng.lng.toFixed(6);
        console.log(`Coordenadas: ${lat}, ${lng}`);

        // Preencher coordenadas nos formulários abertos
        const pointLatInput = document.getElementById("point-lat");
        const pointLngInput = document.getElementById("point-lng");
        const eventLatInput = document.getElementById("event-lat");
        const eventLngInput = document.getElementById("event-lng");
        const establishmentLatInput =
          document.getElementById("establishment-lat");
        const establishmentLngInput =
          document.getElementById("establishment-lng");

        if (
          pointLatInput &&
          pointLngInput &&
          document.getElementById("point-modal").style.display === "block"
        ) {
          pointLatInput.value = lat;
          pointLngInput.value = lng;
          showMapClickFeedback(
            map,
            e.latlng,
            "Coordenadas copiadas para o formulário!"
          );
        } else if (
          eventLatInput &&
          eventLngInput &&
          document.getElementById("event-modal").style.display === "block"
        ) {
          eventLatInput.value = lat;
          eventLngInput.value = lng;
          showMapClickFeedback(
            map,
            e.latlng,
            "Coordenadas copiadas para o formulário!"
          );
        } else if (
          establishmentLatInput &&
          establishmentLngInput &&
          document.getElementById("establishment-modal").style.display ===
            "block"
        ) {
          establishmentLatInput.value = lat;
          establishmentLngInput.value = lng;
          showMapClickFeedback(
            map,
            e.latlng,
            "Coordenadas copiadas para o formulário!"
          );
        } else {
          showMapClickFeedback(map, e.latlng, `Coordenadas: ${lat}, ${lng}`);
        }
      }
    });
  }, 200);
}

// Variável para debounce das atualizações do mapa
let mapUpdateTimeout = null;

function updateMapMarkers() {
  // Verificar se o mapa existe
  if (!map) {
    console.log("Mapa não inicializado ainda");
    return;
  }

  // Debounce: aguardar 100ms antes de atualizar (evita múltiplas atualizações rápidas)
  if (mapUpdateTimeout) {
    clearTimeout(mapUpdateTimeout);
  }

  mapUpdateTimeout = setTimeout(() => {
    _updateMapMarkersImmediate();
  }, 100);
}

function _updateMapMarkersImmediate() {
  if (!map) {
    console.log("Mapa não disponível para atualizar marcadores");
    return;
  }

  // Limpar marcadores existentes de forma mais eficiente
  if (markers.length > 0) {
    // Remover cada marcador individualmente para garantir limpeza completa
    markers.forEach((marker) => {
      map.removeLayer(marker);
    });
    markers = [];
  }

  // Obter filtro de tipo selecionado
  const filterType =
    document.querySelector('input[name="filter-type"]:checked')?.value || "all";
  const searchTerm =
    document.getElementById("search-input")?.value.toLowerCase().trim() || "";
  const categoryFilter =
    document.getElementById("filter-category")?.value || "all";

  const showPontos = filterType === "all" || filterType === "pontos";
  const showEventos = filterType === "all" || filterType === "eventos";
  const showEstabelecimentos =
    filterType === "all" || filterType === "estabelecimentos";

  // Ordenar estabelecimentos (verificados primeiro) - apenas se necessário
  let sortedEstablishments = establishments;
  if (showEstabelecimentos && establishments.length > 0) {
    sortedEstablishments = [...establishments].sort((a, b) => {
      const aVerified = a.hasCadastur && a.cadasturNumber ? 1 : 0;
      const bVerified = b.hasCadastur && b.cadasturNumber ? 1 : 0;
      return bVerified - aVerified;
    });
  }

  // Usar ícones do cache (criados uma vez e reutilizados)
  const icons = getMapIcons();

  // Função auxiliar para verificar se o item corresponde à busca
  function matchesSearch(item, type) {
    if (!searchTerm) return true;

    const searchFields = [
      item.name || "",
      item.description || "",
      item.category || "",
      item.address || "",
    ];

    if (type === "event") {
      searchFields.push(item.time || "");
    }

    if (type === "establishment") {
      searchFields.push(item.phone || "", item.email || "", item.website || "");
    }

    return searchFields.some((field) =>
      field.toLowerCase().includes(searchTerm)
    );
  }

  // Adicionar pontos turísticos
  if (showPontos && points.length > 0) {
    points
      .filter((point) => matchesSearch(point, "point"))
      .forEach((point) => {
        if (point.lat && point.lng) {
          const marker = L.marker([point.lat, point.lng], {
            icon: icons.default,
          }).addTo(map);
          // Lazy loading do popup - só criar quando abrir
          marker.on("click", function () {
            if (!marker.getPopup()) {
              marker.bindPopup(createPointPopup(point), { maxWidth: 300 });
            }
          });
          markers.push(marker);
        }
      });
  }

  // Adicionar eventos (apenas não finalizados)
  if (showEventos && events.length > 0) {
    events
      .filter((event) => event.status !== "finalizado")
      .filter((event) => matchesSearch(event, "event"))
      .forEach((event) => {
        if (event.lat && event.lng) {
          const marker = L.marker([event.lat, event.lng], {
            icon: icons.event,
          }).addTo(map);
          marker.on("click", function () {
            if (!marker.getPopup()) {
              marker.bindPopup(createEventPopup(event), { maxWidth: 300 });
            }
          });
          markers.push(marker);
        }
      });
  }

  // Adicionar estabelecimentos
  if (showEstabelecimentos && sortedEstablishments.length > 0) {
    sortedEstablishments
      .filter((establishment) => {
        // Aplicar filtro de categoria se estiver selecionado
        if (
          categoryFilter !== "all" &&
          establishment.category !== categoryFilter
        ) {
          return false;
        }
        return matchesSearch(establishment, "establishment");
      })
      .forEach((establishment) => {
        if (establishment.lat && establishment.lng) {
          const isVerified =
            establishment.hasCadastur && establishment.cadasturNumber;
          const icon = isVerified ? icons.verified : icons.unverified;

          const marker = L.marker([establishment.lat, establishment.lng], {
            icon: icon,
          }).addTo(map);
          marker.on("click", function () {
            if (!marker.getPopup()) {
              marker.bindPopup(createEstablishmentPopup(establishment), {
                maxWidth: 300,
              });
            }
          });
          markers.push(marker);
        }
      });
  }

  // Invalidar tamanho do mapa após adicionar marcadores (usar requestAnimationFrame)
  requestAnimationFrame(() => {
    if (map) {
      map.invalidateSize();
    }
  });

  // Log para debug (pode remover depois)
  console.log(`Marcadores atualizados: ${markers.length} marcadores no mapa`);
  console.log(
    `Filtros aplicados - Tipo: ${filterType}, Busca: "${searchTerm}", Categoria: ${categoryFilter}`
  );
}

function createPointPopup(point) {
  const avgRating = getAverageRating("ponto", point.id);
  const ratingStars = "⭐".repeat(Math.round(avgRating));

  // Obter array de imagens (suporta formato antigo e novo)
  const images =
    point.images && point.images.length > 0
      ? point.images
      : point.image
      ? [point.image]
      : [];

  const carouselId = `carousel-${point.id}`;
  const imageHtml = createImageCarousel(images, point.name, carouselId);

  return `
        <div class="popup-content">
            <h3>📍 ${point.name}</h3>
            ${imageHtml}
            <p><strong>Categoria:</strong> ${point.category}</p>
            <p>${point.description}</p>
            ${
              avgRating > 0
                ? `<p class="rating">${ratingStars} (${avgRating.toFixed(
                    1
                  )})</p>`
                : "<p>Sem avaliações ainda</p>"
            }
            ${
              currentUser && currentUser.role === "turista"
                ? `<div class="popup-actions">
                    <button class="popup-btn popup-btn-review" onclick="openReviewModal('ponto', '${point.id}')">
                        Avaliar
                    </button>
                </div>`
                : !currentUser
                ? `<div class="popup-actions">
                    <button class="popup-btn popup-btn-review" onclick="showLoginForm()">
                        Faça login para avaliar
                    </button>
                </div>`
                : ""
            }
        </div>
    `;
}

function createImageCarousel(images, altText, carouselId, isCompact = false) {
  if (!images || images.length === 0) {
    return "";
  }

  if (images.length === 1) {
    const compactClass = isCompact ? "carousel-image-compact" : "";
    const imageUrl = images[0].replace(/'/g, "\\'");
    return `<img src="${
      images[0]
    }" alt="${altText}" class="carousel-image ${compactClass} clickable-image" onclick="openImageLightbox(${JSON.stringify(
      images
    )}, 0)" onerror="this.style.display='none'">`;
  }

  // Criar carrossel com múltiplas imagens
  const compactClass = isCompact ? "carousel-compact" : "";
  // Escapar aspas nas URLs das imagens para o JavaScript
  const imagesEscaped = images.map((img) => img.replace(/'/g, "\\'"));
  const carouselHtml = images
    .map(
      (img, index) => `
        <div class="carousel-slide ${index === 0 ? "active" : ""}">
            <img src="${img}" alt="${altText}" class="carousel-image ${
        isCompact ? "carousel-image-compact" : ""
      } clickable-image" onclick="openImageLightbox(${JSON.stringify(
        images
      )}, ${index})" onerror="this.style.display='none'">
        </div>
    `
    )
    .join("");

  const dotsHtml = images
    .map(
      (_, index) => `
        <span class="carousel-dot ${
          index === 0 ? "active" : ""
        }" onclick="showCarouselSlide('${carouselId}', ${index})"></span>
    `
    )
    .join("");

  return `
        <div class="carousel-container ${compactClass}" id="${carouselId}">
            <div class="carousel-wrapper">
                ${carouselHtml}
            </div>
            ${
              images.length > 1
                ? `
                <button class="carousel-btn carousel-prev" onclick="changeCarouselSlide('${carouselId}', -1)">❮</button>
                <button class="carousel-btn carousel-next" onclick="changeCarouselSlide('${carouselId}', 1)">❯</button>
                <div class="carousel-dots">${dotsHtml}</div>
            `
                : ""
            }
        </div>
    `;
}

// Funções para controlar o carrossel
function changeCarouselSlide(carouselId, direction) {
  const carousel = document.getElementById(carouselId);
  if (!carousel) return;

  const slides = carousel.querySelectorAll(".carousel-slide");
  const dots = carousel.querySelectorAll(".carousel-dot");
  if (slides.length === 0) return;

  let currentIndex = Array.from(slides).findIndex((slide) =>
    slide.classList.contains("active")
  );
  if (currentIndex === -1) currentIndex = 0;

  // Remover active de todos
  slides.forEach((slide) => slide.classList.remove("active"));
  dots.forEach((dot) => dot.classList.remove("active"));

  // Calcular novo índice
  let newIndex = currentIndex + direction;
  if (newIndex < 0) newIndex = slides.length - 1;
  if (newIndex >= slides.length) newIndex = 0;

  // Adicionar active ao novo slide
  slides[newIndex].classList.add("active");
  if (dots[newIndex]) dots[newIndex].classList.add("active");
}

function showCarouselSlide(carouselId, index) {
  const carousel = document.getElementById(carouselId);
  if (!carousel) return;

  const slides = carousel.querySelectorAll(".carousel-slide");
  const dots = carousel.querySelectorAll(".carousel-dot");

  if (index < 0 || index >= slides.length) return;

  // Remover active de todos
  slides.forEach((slide) => slide.classList.remove("active"));
  dots.forEach((dot) => dot.classList.remove("active"));

  // Adicionar active ao slide selecionado
  slides[index].classList.add("active");
  if (dots[index]) dots[index].classList.add("active");
}

function createEstablishmentPopup(establishment) {
  const avgRating = getAverageRating("estabelecimento", establishment.id);
  const ratingStars = "⭐".repeat(Math.round(avgRating));
  const isVerified = establishment.hasCadastur && establishment.cadasturNumber;

  // Obter array de imagens
  const images =
    establishment.images && establishment.images.length > 0
      ? establishment.images
      : establishment.image
      ? [establishment.image]
      : [];

  const popupCarouselId = `popup-carousel-establishment-${establishment.id}`;
  const imageHtml =
    images.length > 0
      ? createImageCarousel(images, establishment.name, popupCarouselId, false)
      : "";

  return `
        <div class="popup-content">
            ${imageHtml}
            <h3>
                🏢 ${establishment.name}
                ${
                  isVerified
                    ? '<span class="verified-badge" title="Verificado pelo Cadastur">Verificado</span>'
                    : ""
                }
            </h3>
            <p>${establishment.description}</p>
            <div class="popup-meta">
                <span class="category">${establishment.category}</span>
                ${
                  avgRating > 0
                    ? `<span class="rating">${ratingStars} ${avgRating.toFixed(
                        1
                      )}</span>`
                    : ""
                }
            </div>
            ${
              establishment.phone
                ? `<p><strong>📞:</strong> ${establishment.phone}</p>`
                : ""
            }
            ${
              establishment.email
                ? `<p><strong>✉️:</strong> ${establishment.email}</p>`
                : ""
            }
            ${
              establishment.website
                ? `<p><strong>🌐:</strong> <a href="${establishment.website}" target="_blank">${establishment.website}</a></p>`
                : ""
            }
            ${
              isVerified &&
              establishment.cadasturNumber &&
              currentUser &&
              currentUser.role === "admin"
                ? `<p><strong>📋 Cadastur:</strong> ${establishment.cadasturNumber}</p>`
                : ""
            }
            ${
              currentUser && currentUser.role === "turista"
                ? `<div class="popup-actions">
                    <button class="popup-btn popup-btn-review" onclick="openReviewModal('estabelecimento', '${establishment.id}')">
                        Avaliar
                    </button>
                </div>`
                : !currentUser
                ? `<div class="popup-actions">
                    <button class="popup-btn popup-btn-review" onclick="showLoginForm()">
                        Faça login para avaliar
                    </button>
                </div>`
                : ""
            }
        </div>
    `;
}

function createEventPopup(event) {
  const avgRating = getAverageRating("evento", event.id);
  const ratingStars = "⭐".repeat(Math.round(avgRating));
  const eventDate = new Date(event.date + "T" + event.time);
  const isFinalized = event.status === "finalizado";

  // Obter array de imagens (suporta formato antigo e novo)
  const images =
    event.images && event.images.length > 0
      ? event.images
      : event.image
      ? [event.image]
      : [];

  const carouselId = `carousel-event-${event.id}`;
  const imageHtml = createImageCarousel(images, event.name, carouselId);

  // Verificar se pode editar/excluir (admin e empresa podem gerenciar seus próprios eventos)
  const canManage =
    currentUser &&
    (currentUser.role === "admin" ||
      (currentUser.role === "empresa" &&
        event.createdBy === currentUser.email));

  return `
        <div class="popup-content">
            <h3>🎉 ${event.name}${
    isFinalized
      ? ' <span style="font-size: 0.7em; color: #7f8c8d;">(Finalizado)</span>'
      : ""
  }</h3>
            ${imageHtml}
            <p><strong>Data:</strong> ${eventDate.toLocaleDateString(
              "pt-BR"
            )}</p>
            <p><strong>Horário:</strong> ${event.time}</p>
            <p>${event.description}</p>
            ${
              avgRating > 0
                ? `<p class="rating">${ratingStars} (${avgRating.toFixed(
                    1
                  )})</p>`
                : "<p>Sem avaliações ainda</p>"
            }
            ${
              currentUser && currentUser.role === "turista"
                ? `<div class="popup-actions">
                    <button class="popup-btn popup-btn-review" onclick="openReviewModal('evento', '${event.id}')">
                        Avaliar
                    </button>
                </div>`
                : !currentUser
                ? `<div class="popup-actions">
                    <button class="popup-btn popup-btn-review" onclick="showLoginForm()">
                        Faça login para avaliar
                    </button>
                </div>`
                : ""
            }
            ${
              canManage
                ? `<div class="popup-actions" style="margin-top: 10px; border-top: 1px solid #e0e0e0; padding-top: 10px;">
                    <button class="popup-btn popup-btn-edit" onclick="editEvent('${
                      event.id
                    }')" title="Editar Evento">
                        ✏️ Editar
                    </button>
                    ${
                      !isFinalized
                        ? `<button class="popup-btn popup-btn-finish" onclick="finalizeEvent('${event.id}')" title="Finalizar Evento">
                            ✓ Finalizar
                        </button>`
                        : ""
                    }
                    <button class="popup-btn popup-btn-delete" onclick="deleteEvent('${
                      event.id
                    }')" title="Excluir Evento" style="background: #e74c3c;">
                        🗑️ Excluir
                    </button>
                </div>`
                : ""
            }
        </div>
    `;
}

// ========== UPLOAD DE IMAGENS (IMGBB) ==========
// Armazenar arquivos selecionados
let selectedImages = {
  point: [],
  event: [],
};

// Armazenar imagens existentes (para edição)
let pointExistingImages = {
  point: [],
};
let eventExistingImages = {
  event: [],
};
let establishmentExistingImages = {
  establishment: [],
};

// Função para fazer upload de uma imagem para imgBB
async function uploadImageToImgBB(file) {
  if (!IMGBB_API_KEY || IMGBB_API_KEY === "SUA_IMGBB_API_KEY") {
    throw new Error(
      "API Key do imgBB não configurada. Configure em firebase-config.js"
    );
  }

  // Validar tamanho (32MB máximo)
  const maxSize = 32 * 1024 * 1024; // 32 MB
  if (file.size > maxSize) {
    throw new Error("Imagem muito grande. Máximo 32MB por imagem.");
  }

  // Validar tipo
  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
  ];
  if (!allowedTypes.includes(file.type)) {
    throw new Error(
      "Tipo de arquivo não permitido. Use JPG, PNG, GIF ou WEBP."
    );
  }

  const formData = new FormData();
  formData.append("key", IMGBB_API_KEY);
  formData.append("image", file);

  try {
    const response = await fetch("https://api.imgbb.com/1/upload", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (data.success) {
      return data.data.url; // URL da imagem hospedada
    } else {
      throw new Error(data.error?.message || "Erro ao fazer upload da imagem");
    }
  } catch (error) {
    console.error("Erro no upload:", error);
    throw error;
  }
}

// Função para fazer upload de múltiplas imagens
async function uploadMultipleImages(files) {
  const uploadedUrls = [];
  const errors = [];

  for (let i = 0; i < files.length; i++) {
    try {
      const url = await uploadImageToImgBB(files[i]);
      uploadedUrls.push(url);
    } catch (error) {
      errors.push(`Imagem ${i + 1}: ${error.message}`);
    }
  }

  if (errors.length > 0 && uploadedUrls.length === 0) {
    throw new Error("Erro ao fazer upload das imagens:\n" + errors.join("\n"));
  }

  if (errors.length > 0) {
    console.warn("Algumas imagens falharam:", errors);
  }

  return uploadedUrls;
}

// Função para preview de imagens
function handleImagePreview(inputId, previewId) {
  const input = document.getElementById(inputId);
  const preview = document.getElementById(previewId);
  const files = Array.from(input.files);

  // Determinar tipo (point, event ou establishment)
  let type = "point";
  if (inputId.includes("event")) type = "event";
  else if (inputId.includes("establishment")) type = "establishment";

  // Limpar preview anterior
  preview.innerHTML = "";
  selectedImages[type] = [];

  if (files.length === 0) {
    return;
  }

  // Adicionar cada arquivo ao preview
  files.forEach((file, index) => {
    // Validar tamanho
    const maxSize = 32 * 1024 * 1024; // 32 MB
    if (file.size > maxSize) {
      const errorDiv = document.createElement("div");
      errorDiv.className = "image-upload-error";
      errorDiv.textContent = `${file.name}: Arquivo muito grande (máx 32MB)`;
      preview.appendChild(errorDiv);
      return;
    }

    // Validar tipo
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    if (!allowedTypes.includes(file.type)) {
      const errorDiv = document.createElement("div");
      errorDiv.className = "image-upload-error";
      errorDiv.textContent = `${file.name}: Tipo não permitido`;
      preview.appendChild(errorDiv);
      return;
    }

    // Criar preview
    const reader = new FileReader();
    reader.onload = function (e) {
      const previewItem = document.createElement("div");
      previewItem.className = "image-preview-item";
      previewItem.innerHTML = `
                <img src="${e.target.result}" alt="Preview">
                <button type="button" class="remove-image" onclick="removeImagePreview('${inputId}', '${previewId}', ${index})" title="Remover">×</button>
            `;
      preview.appendChild(previewItem);
    };
    reader.readAsDataURL(file);

    // Armazenar arquivo
    selectedImages[type].push(file);
  });
}

// Função para remover imagem do preview
function removeImagePreview(inputId, previewId, index) {
  const type = inputId.includes("point") ? "point" : "event";

  // Remover do array
  selectedImages[type].splice(index, 1);

  // Recriar preview
  const input = document.getElementById(inputId);
  const files = Array.from(input.files);
  files.splice(index, 1);

  // Criar novo FileList (não é possível diretamente, então resetamos o input)
  const dt = new DataTransfer();
  files.forEach((file) => dt.items.add(file));
  input.files = dt.files;

  // Atualizar preview
  handleImagePreview(inputId, previewId);
}

// ========== FORMULÁRIOS ==========
function initForms() {
  // Formulário de ponto turístico
  document
    .getElementById("point-form")
    .addEventListener("submit", async function (e) {
      e.preventDefault();

      if (currentUser.role !== "admin") {
        showWarning(
          "Apenas administradores podem cadastrar pontos turísticos",
          "Permissão Negada"
        );
        return;
      }

      try {
        // Mostrar loading
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = "Enviando imagens...";

        // Fazer upload das imagens
        let imageUrls = [];
        const files = selectedImages.point;
        if (files && files.length > 0) {
          submitBtn.textContent = `📤 Enviando ${files.length} imagem(ns)...`;
          try {
            imageUrls = await uploadMultipleImages(files);
          } catch (uploadError) {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
            showError(
              "Erro ao fazer upload das imagens: " + uploadError.message,
              "Erro no Upload"
            );
            return;
          }
        }

        submitBtn.textContent = "💾 Salvando...";

        // Validar coordenadas
        const lat = parseFloat(document.getElementById("point-lat").value);
        const lng = parseFloat(document.getElementById("point-lng").value);

        if (
          isNaN(lat) ||
          isNaN(lng) ||
          document.getElementById("point-lat").value.trim() === "" ||
          document.getElementById("point-lng").value.trim() === ""
        ) {
          submitBtn.disabled = false;
          submitBtn.textContent = originalText;
          showWarning(
            'Por favor, preencha o endereço e clique em "Buscar Coordenadas", ou insira as coordenadas manualmente.',
            "Coordenadas Necessárias"
          );
          return;
        }

        const pointId = document.getElementById("point-id").value;
        const existingImages = pointExistingImages.point || [];

        // Combinar imagens existentes (não removidas) com novas
        const allImages = [...existingImages, ...imageUrls];

        const point = {
          name: document.getElementById("point-name").value,
          description: document.getElementById("point-description").value,
          lat: lat,
          lng: lng,
          category: document.getElementById("point-category").value,
          cep: document.getElementById("point-cep").value.trim() || null,
          address:
            document.getElementById("point-address").value.trim() || null,
          images: allImages,
          image: allImages.length > 0 ? allImages[0] : null,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        };

        if (pointId) {
          // Atualizar existente
          await db.collection("points").doc(pointId).update(point);

          // Atualizar no array local
          const index = points.findIndex((p) => p.id === pointId);
          if (index !== -1) {
            points[index] = { ...points[index], ...point, id: pointId };
          }

          // Atualizar mapa e lista imediatamente após atualização
          updateMapMarkers();
          updateItemsList();

          submitBtn.textContent = "Atualizado!";
          setTimeout(() => {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
            closeModal("point-modal");
            showSuccess(
              "Ponto turístico atualizado com sucesso!",
              "Atualização"
            );
          }, 500);
        } else {
          // Criar novo
          point.createdBy = currentUser.email;
          point.createdAt = firebase.firestore.FieldValue.serverTimestamp();

          const docRef = await db.collection("points").add(point);
          point.id = docRef.id;

          // Adicionar ao array local
          points.push(point);

          // Atualizar mapa e lista imediatamente após criação
          updateMapMarkers();
          updateItemsList();

          submitBtn.disabled = false;
          submitBtn.textContent = originalText;
          closeModal("point-modal");
          showSuccess("Ponto turístico cadastrado com sucesso!", "Cadastro");
        }

        // Limpar formulário e preview
        document.getElementById("point-form").reset();
        document.getElementById("point-images-preview").innerHTML = "";
        document.getElementById("point-existing-images").innerHTML = "";
        selectedImages.point = [];
        pointExistingImages.point = [];
      } catch (error) {
        console.error("Erro ao salvar ponto:", error);
        const submitBtn = e.target.querySelector('button[type="submit"]');
        submitBtn.disabled = false;
        submitBtn.textContent = "Cadastrar";
        showError(
          "Erro ao cadastrar ponto turístico: " + error.message,
          "Erro"
        );
      }
    });

  // Formulário de evento
  document
    .getElementById("event-form")
    .addEventListener("submit", async function (e) {
      e.preventDefault();

      if (currentUser.role !== "empresa" && currentUser.role !== "admin") {
        showWarning(
          "Apenas empresas e administradores podem cadastrar eventos",
          "Permissão Negada"
        );
        return;
      }

      try {
        // Mostrar loading
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = "Enviando imagens...";

        // Fazer upload das imagens
        let imageUrls = [];
        const files = selectedImages.event;
        if (files && files.length > 0) {
          try {
            imageUrls = await uploadMultipleImages(files);
          } catch (uploadError) {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
            showError(
              "Erro ao fazer upload das imagens: " + uploadError.message,
              "Erro no Upload"
            );
            return;
          }
        }

        submitBtn.textContent = "Salvando...";

        // Validar coordenadas
        const lat = parseFloat(document.getElementById("event-lat").value);
        const lng = parseFloat(document.getElementById("event-lng").value);

        if (
          isNaN(lat) ||
          isNaN(lng) ||
          document.getElementById("event-lat").value.trim() === "" ||
          document.getElementById("event-lng").value.trim() === ""
        ) {
          submitBtn.disabled = false;
          submitBtn.textContent = originalText;
          showWarning(
            'Por favor, preencha o endereço e clique em "Buscar Coordenadas", ou insira as coordenadas manualmente.',
            "Coordenadas Necessárias"
          );
          return;
        }

        const eventId = document.getElementById("event-id").value;
        const existingImages = eventExistingImages.event || [];

        // Combinar imagens existentes (não removidas) com novas
        const allImages = [...existingImages, ...imageUrls];

        const event = {
          name: document.getElementById("event-name").value,
          description: document.getElementById("event-description").value,
          date: document.getElementById("event-date").value,
          time: document.getElementById("event-time").value,
          lat: lat,
          lng: lng,
          cep: document.getElementById("event-cep").value.trim() || null,
          address:
            document.getElementById("event-address").value.trim() || null,
          images: allImages,
          image: allImages.length > 0 ? allImages[0] : null,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        };

        if (eventId) {
          // Atualizar existente
          await db.collection("events").doc(eventId).update(event);

          // Atualizar no array local
          const index = events.findIndex((e) => e.id === eventId);
          if (index !== -1) {
            events[index] = { ...events[index], ...event, id: eventId };
          }

          // Atualizar mapa e lista imediatamente após atualização
          updateMapMarkers();
          updateItemsList();

          submitBtn.textContent = "Atualizado!";
          setTimeout(() => {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
            closeModal("event-modal");
            showSuccess("Evento atualizado com sucesso!", "Atualização");
          }, 500);
        } else {
          // Criar novo
          event.createdBy = currentUser.email;
          event.createdAt = firebase.firestore.FieldValue.serverTimestamp();

          const docRef = await db.collection("events").add(event);
          event.id = docRef.id;

          // Adicionar ao array local
          events.push(event);

          // Atualizar mapa e lista imediatamente após criação
          updateMapMarkers();
          updateItemsList();

          submitBtn.disabled = false;
          submitBtn.textContent = originalText;
          closeModal("event-modal");
          showSuccess("Evento cadastrado com sucesso!", "Cadastro");
        }

        // Limpar formulário e preview
        document.getElementById("event-form").reset();
        document.getElementById("event-images-preview").innerHTML = "";
        document.getElementById("event-existing-images").innerHTML = "";
        selectedImages.event = [];
        eventExistingImages.event = [];
      } catch (error) {
        console.error("Erro ao salvar evento:", error);
        const submitBtn = e.target.querySelector('button[type="submit"]');
        submitBtn.disabled = false;
        submitBtn.textContent = "Cadastrar";
        showError("Erro ao cadastrar evento: " + error.message, "Erro");
      }
    });

  // Formulário de estabelecimento
  document
    .getElementById("establishment-form")
    .addEventListener("submit", async function (e) {
      e.preventDefault();

      if (currentUser.role !== "empresa" && currentUser.role !== "admin") {
        showWarning(
          "Apenas empresas e administradores podem cadastrar estabelecimentos",
          "Permissão Negada"
        );
        return;
      }

      try {
        // Mostrar loading
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = "⏳ Processando...";

        // Fazer upload das imagens
        let imageUrls = [];
        const files = selectedImages.establishment;
        if (files && files.length > 0) {
          submitBtn.textContent = `📤 Enviando ${files.length} imagem(ns)...`;
          try {
            imageUrls = await uploadMultipleImages(files);
          } catch (uploadError) {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
            showError(
              "Erro ao fazer upload das imagens: " + uploadError.message,
              "Erro no Upload"
            );
            return;
          }
        }

        submitBtn.textContent = "💾 Salvando...";

        // Validar coordenadas
        const lat = parseFloat(
          document.getElementById("establishment-lat").value
        );
        const lng = parseFloat(
          document.getElementById("establishment-lng").value
        );

        if (
          isNaN(lat) ||
          isNaN(lng) ||
          document.getElementById("establishment-lat").value.trim() === "" ||
          document.getElementById("establishment-lng").value.trim() === ""
        ) {
          submitBtn.disabled = false;
          submitBtn.textContent = originalText;
          showWarning(
            'Por favor, preencha o endereço e clique em "Buscar Coordenadas", ou insira as coordenadas manualmente.',
            "Coordenadas Necessárias"
          );
          return;
        }

        const establishmentId =
          document.getElementById("establishment-id").value;
        const existingImages = establishmentExistingImages.establishment || [];
        const allImages = [...existingImages, ...imageUrls];

        const hasCadastur = document.getElementById("has-cadastur-yes").checked;
        const cadasturNumber = hasCadastur
          ? document
              .getElementById("establishment-cadastur-number")
              .value.trim()
          : null;

        const establishment = {
          name: document.getElementById("establishment-name").value,
          description: document.getElementById("establishment-description")
            .value,
          lat: lat,
          lng: lng,
          category: document.getElementById("establishment-category").value,
          phone:
            document.getElementById("establishment-phone").value.trim() || null,
          email:
            document.getElementById("establishment-email").value.trim() || null,
          website:
            document.getElementById("establishment-website").value.trim() ||
            null,
          cep:
            document.getElementById("establishment-cep").value.trim() || null,
          address:
            document.getElementById("establishment-address").value.trim() ||
            null,
          images: allImages,
          image: allImages.length > 0 ? allImages[0] : null,
          hasCadastur: hasCadastur,
          cadasturNumber: cadasturNumber,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        };

        if (establishmentId) {
          // Atualizar existente
          await db
            .collection("establishments")
            .doc(establishmentId)
            .update(establishment);

          // Atualizar no array local
          const index = establishments.findIndex(
            (e) => e.id === establishmentId
          );
          if (index !== -1) {
            establishments[index] = {
              ...establishments[index],
              ...establishment,
              id: establishmentId,
            };
          }

          // Atualizar mapa e lista imediatamente após atualização
          updateMapMarkers();
          updateItemsList();

          submitBtn.textContent = "Atualizado!";
          setTimeout(() => {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
            closeModal("establishment-modal");
            showSuccess(
              "Estabelecimento atualizado com sucesso!",
              "Atualização"
            );
          }, 500);
        } else {
          // Criar novo
          establishment.createdBy = currentUser.email;
          establishment.createdAt =
            firebase.firestore.FieldValue.serverTimestamp();

          // Se não tem Cadastur, mostrar convite
          if (!hasCadastur || !cadasturNumber) {
            closeModal("establishment-modal");
            pendingEstablishmentData = establishment;
            document.getElementById("cadastur-invite-modal").style.display =
              "block";
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
            return; // Não salvar ainda, aguardar decisão do usuário
          }

          // Tem Cadastur, salvar diretamente
          const docRef = await db
            .collection("establishments")
            .add(establishment);
          establishment.id = docRef.id;
          establishments.push(establishment);

          // Atualizar mapa e lista imediatamente após criação
          updateMapMarkers();
          updateItemsList();

          submitBtn.disabled = false;
          submitBtn.textContent = originalText;
          closeModal("establishment-modal");
          showSuccess("Estabelecimento cadastrado com sucesso!", "Cadastro");
        }

        // Limpar formulário
        document.getElementById("establishment-form").reset();
        document.getElementById("establishment-images-preview").innerHTML = "";
        document.getElementById("establishment-existing-images").innerHTML = "";
        selectedImages.establishment = [];
        establishmentExistingImages.establishment = [];
        pendingEstablishmentData = null;
      } catch (error) {
        console.error("Erro ao salvar estabelecimento:", error);
        const submitBtn = e.target.querySelector('button[type="submit"]');
        submitBtn.disabled = false;
        submitBtn.textContent = "Cadastrar";
        showError(
          "Erro ao cadastrar estabelecimento: " + error.message,
          "Erro"
        );
      }
    });

  // Formulário de avaliação
  document
    .getElementById("review-form")
    .addEventListener("submit", async function (e) {
      e.preventDefault();

      if (currentUser.role !== "turista") {
        showWarning(
          "Apenas turistas podem deixar avaliações",
          "Permissão Negada"
        );
        return;
      }

      try {
        const review = {
          itemId: document.getElementById("review-item-id").value,
          itemType: document.getElementById("review-item-type").value,
          rating: parseInt(document.getElementById("review-rating").value),
          comment: document.getElementById("review-comment").value,
          userEmail: currentUser.email,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        };

        // Salvar no Firestore
        const docRef = await db.collection("reviews").add(review);
        review.id = docRef.id;

        // Adicionar ao array local
        reviews.push(review);
        // Avaliações não mudam posição no mapa, só atualizar a lista
        updateItemsList();
        closeModal("review-modal");
        document.getElementById("review-form").reset();
        showSuccess("Avaliação enviada com sucesso!", "Avaliação");
      } catch (error) {
        console.error("Erro ao salvar avaliação:", error);
        showError("Erro ao enviar avaliação: " + error.message, "Erro");
      }
    });
}

function showAddPointForm() {
  // Limpar formulário
  document.getElementById("point-form").reset();
  document.getElementById("point-id").value = "";
  document.getElementById("point-images-preview").innerHTML = "";
  document.getElementById("point-existing-images").innerHTML = "";
  selectedImages.point = [];
  pointExistingImages.point = [];

  // Atualizar título e botão
  document.getElementById("point-modal-title").textContent =
    "Cadastrar Ponto Turístico";
  document.getElementById("point-submit-btn").textContent = "Cadastrar";

  // Limpar campos de localização
  document.getElementById("point-cep").value = "";
  document.getElementById("point-address").value = "";
  const center = map.getCenter();
  document.getElementById("point-lat").value = center.lat.toFixed(6);
  document.getElementById("point-lng").value = center.lng.toFixed(6);

  document.getElementById("point-modal").style.display = "block";
}

function showAddEventForm() {
  // Limpar formulário
  document.getElementById("event-form").reset();
  document.getElementById("event-id").value = "";
  document.getElementById("event-images-preview").innerHTML = "";
  document.getElementById("event-existing-images").innerHTML = "";
  selectedImages.event = [];
  eventExistingImages.event = [];

  // Atualizar título e botão
  document.getElementById("event-modal-title").textContent = "Cadastrar Evento";
  document.getElementById("event-submit-btn").textContent = "Cadastrar";

  // Limpar campos de localização
  document.getElementById("event-cep").value = "";
  document.getElementById("event-address").value = "";
  const center = map.getCenter();
  document.getElementById("event-lat").value = center.lat.toFixed(6);
  document.getElementById("event-lng").value = center.lng.toFixed(6);
  document.getElementById("event-date").value = new Date()
    .toISOString()
    .split("T")[0];

  document.getElementById("event-modal").style.display = "block";
}

function showAddEstablishmentForm() {
  // Limpar formulário
  document.getElementById("establishment-form").reset();
  document.getElementById("establishment-id").value = "";
  document.getElementById("establishment-images-preview").innerHTML = "";
  document.getElementById("establishment-existing-images").innerHTML = "";
  selectedImages.establishment = [];
  establishmentExistingImages.establishment = [];

  // Resetar campos Cadastur
  document.getElementById("has-cadastur-no").checked = true;
  document.getElementById("has-cadastur-yes").checked = false;
  document.getElementById("cadastur-fields").style.display = "none";
  document.getElementById("establishment-cadastur-number").value = "";

  // Atualizar título e botão
  document.getElementById("establishment-modal-title").textContent =
    "Cadastrar Estabelecimento Comercial";
  document.getElementById("establishment-submit-btn").textContent = "Cadastrar";

  // Limpar campos de localização
  document.getElementById("establishment-cep").value = "";
  document.getElementById("establishment-address").value = "";
  const center = map.getCenter();
  document.getElementById("establishment-lat").value = center.lat.toFixed(6);
  document.getElementById("establishment-lng").value = center.lng.toFixed(6);

  document.getElementById("establishment-modal").style.display = "block";
}

// Toggle campos Cadastur
function toggleCadasturFields(show) {
  const cadasturFields = document.getElementById("cadastur-fields");
  if (show) {
    cadasturFields.style.display = "block";
    document.getElementById("establishment-cadastur-number").required = true;
  } else {
    cadasturFields.style.display = "none";
    document.getElementById("establishment-cadastur-number").required = false;
    document.getElementById("establishment-cadastur-number").value = "";
  }
}

// Variável para controlar se deve mostrar convite Cadastur
let pendingEstablishmentData = null;

// Prosseguir com Cadastur
function proceedWithCadastur() {
  closeModal("cadastur-invite-modal");
  // Marcar como sim e mostrar campos
  document.getElementById("has-cadastur-yes").checked = true;
  document.getElementById("has-cadastur-no").checked = false;
  toggleCadasturFields(true);
  // Reabrir modal de estabelecimento
  document.getElementById("establishment-modal").style.display = "block";
}

// Prosseguir sem Cadastur
function proceedWithoutCadastur() {
  closeModal("cadastur-invite-modal");
  // Salvar estabelecimento sem Cadastur
  if (pendingEstablishmentData) {
    saveEstablishment(pendingEstablishmentData);
  }
  pendingEstablishmentData = null;
}

// Salvar estabelecimento (chamado após convite)
async function saveEstablishment(establishmentData) {
  try {
    const docRef = await db.collection("establishments").add(establishmentData);
    establishmentData.id = docRef.id;
    establishments.push(establishmentData);
    updateMapMarkers();
    updateItemsList();
    showSuccess("Estabelecimento cadastrado com sucesso!", "Cadastro");
  } catch (error) {
    console.error("Erro ao salvar estabelecimento:", error);
    showError("Erro ao cadastrar estabelecimento: " + error.message, "Erro");
  }
}

// ========== GEOCODIFICAÇÃO (CEP E ENDEREÇO) ==========

// Formatar CEP com máscara
function formatCEP(input) {
  let value = input.value.replace(/\D/g, "");
  if (value.length > 5) {
    value = value.substring(0, 5) + "-" + value.substring(5, 8);
  }
  input.value = value;
}

// Buscar endereço pelo CEP usando ViaCEP
async function searchCEP(cepInputId, addressInputId) {
  const cepInput = document.getElementById(cepInputId);
  const addressInput = document.getElementById(addressInputId);

  if (!cepInput || !addressInput) {
    console.error("Elementos do formulário não encontrados");
    return;
  }

  const cep = cepInput.value.replace(/\D/g, "");

  if (cep.length !== 8) {
    return;
  }

  try {
    // Mostrar loading
    const loadingText = cepInput.parentElement.querySelector(".cep-loading");
    if (!loadingText) {
      const loading = document.createElement("small");
      loading.className = "cep-loading";
      loading.style.color = "#4a90e2";
      loading.textContent = "Buscando endereço...";
      cepInput.parentElement.appendChild(loading);
    }

    const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
    const data = await response.json();

    // Remover loading
    const loadingText2 = cepInput.parentElement.querySelector(".cep-loading");
    if (loadingText2) loadingText2.remove();

    if (data.erro) {
      console.warn("CEP não encontrado");
      const errorText = document.createElement("small");
      errorText.style.color = "#e74c3c";
      errorText.textContent = "CEP não encontrado";
      cepInput.parentElement.appendChild(errorText);
      setTimeout(() => errorText.remove(), 3000);
      return;
    }

    // Montar endereço completo (formato melhor para geocodificação)
    const addressParts = [];
    if (data.logradouro) addressParts.push(data.logradouro);
    if (data.bairro) addressParts.push(data.bairro);
    if (data.localidade) addressParts.push(data.localidade);
    if (data.uf) addressParts.push(data.uf);

    const fullAddress = addressParts.join(", ");
    addressInput.value = fullAddress;

    // Mostrar sucesso
    const successText = document.createElement("small");
    successText.style.color = "#50c878";
    successText.textContent = "✓ Endereço encontrado";
    cepInput.parentElement.appendChild(successText);
    setTimeout(() => successText.remove(), 2000);

    // Tentar geocodificar automaticamente após um delay
    if (fullAddress) {
      setTimeout(() => {
        geocodeAddress(
          addressInputId,
          cepInputId,
          cepInputId.includes("point") ? "point-lat" : "event-lat",
          cepInputId.includes("point") ? "point-lng" : "event-lng"
        );
      }, 800); // Aumentado para 800ms para dar tempo do endereço ser preenchido
    }
  } catch (error) {
    console.error("Erro ao buscar CEP:", error);
    const errorText = document.createElement("small");
    errorText.style.color = "#e74c3c";
    errorText.textContent = "Erro ao buscar CEP";
    cepInput.parentElement.appendChild(errorText);
    setTimeout(() => errorText.remove(), 3000);
  }
}

// Geocodificar endereço para coordenadas usando Nominatim (OpenStreetMap)
async function geocodeAddress(
  addressInputId,
  cepInputId,
  latInputId,
  lngInputId
) {
  const addressInput = document.getElementById(addressInputId);
  const cepInput = document.getElementById(cepInputId);
  const latInput = document.getElementById(latInputId);
  const lngInput = document.getElementById(lngInputId);

  if (!addressInput || !latInput || !lngInput) {
    console.error("Elementos do formulário não encontrados");
    return;
  }

  // Montar endereço completo
  let address = addressInput.value.trim();
  const cep = cepInput ? cepInput.value.trim() : "";

  if (!address && !cep) {
    showWarning(
      "Por favor, preencha o CEP ou o endereço completo",
      "Campo Obrigatório"
    );
    return;
  }

  // Se só tiver CEP, usar apenas o CEP
  if (!address && cep) {
    address = `CEP ${cep}, Brasil`;
  } else {
    // Melhorar formatação do endereço para Nominatim
    // Remover "CEP" do endereço se estiver incluído
    address = address.replace(/CEP\s*\d{5}-?\d{3}/gi, "").trim();

    // Adicionar Brasil se não tiver
    if (
      !address.toLowerCase().includes("brasil") &&
      !address.toLowerCase().includes("brazil")
    ) {
      address = `${address}, Brasil`;
    }
  }

  // Remover mensagens anteriores
  const locationGroup =
    addressInput.closest(".location-input-group") || addressInput.parentElement;
  const existingMsgs = locationGroup.querySelectorAll(
    ".geocoding-loading, .geocoding-success, .geocoding-error"
  );
  existingMsgs.forEach((msg) => msg.remove());

  // Mostrar loading
  const loadingMsg = document.createElement("div");
  loadingMsg.className = "geocoding-loading";
  loadingMsg.textContent = "🔍 Buscando coordenadas...";
  locationGroup.appendChild(loadingMsg);

  try {
    // Tentar primeiro com Nominatim
    let data = null;
    let error = null;

    try {
      const encodedAddress = encodeURIComponent(address);
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1&addressdetails=1&countrycodes=br`;

      console.log("Buscando coordenadas para:", address);

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "User-Agent": "TurismoConnect/1.0 (https://turismoconnect.com.br)",
          Accept: "application/json",
          "Accept-Language": "pt-BR,pt;q=0.9",
        },
      });

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status} ${response.statusText}`);
      }

      data = await response.json();
    } catch (nominatimError) {
      console.warn(
        "Erro no Nominatim, tentando alternativa...",
        nominatimError
      );
      error = nominatimError;

      // Tentar alternativa: usar apenas cidade e estado se disponível
      const cityMatch = address.match(/([^,]+),\s*([A-Z]{2})/);
      if (cityMatch) {
        const city = cityMatch[1].trim();
        const state = cityMatch[2];
        const simpleAddress = `${city}, ${state}, Brasil`;

        try {
          const encodedAddress = encodeURIComponent(simpleAddress);
          const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1&countrycodes=br`;

          const response = await fetch(url, {
            method: "GET",
            headers: {
              "User-Agent":
                "TurismoConnect/1.0 (https://turismoconnect.com.br)",
              Accept: "application/json",
            },
          });

          if (response.ok) {
            data = await response.json();
            console.log("Coordenadas encontradas usando cidade/estado");
          }
        } catch (altError) {
          console.error("Erro na busca alternativa:", altError);
        }
      }
    }

    if (!data) {
      throw error || new Error("Não foi possível buscar coordenadas");
    }

    // Remover loading
    loadingMsg.remove();

    if (data && Array.isArray(data) && data.length > 0) {
      const result = data[0];
      const lat = parseFloat(result.lat);
      const lng = parseFloat(result.lon);

      if (isNaN(lat) || isNaN(lng)) {
        throw new Error("Coordenadas inválidas retornadas");
      }

      // Preencher coordenadas
      latInput.value = lat.toFixed(6);
      lngInput.value = lng.toFixed(6);

      console.log("Coordenadas encontradas:", lat, lng);

      // Mostrar sucesso
      const successMsg = document.createElement("div");
      successMsg.className = "geocoding-success";
      successMsg.textContent = `✅ Coordenadas encontradas! (${lat.toFixed(
        4
      )}, ${lng.toFixed(4)})`;
      locationGroup.appendChild(successMsg);

      // Remover mensagem após 3 segundos
      setTimeout(() => successMsg.remove(), 3000);

      // Centralizar mapa na localização encontrada
      if (map) {
        map.setView([lat, lng], 15);
        // Adicionar marcador temporário para visualização
        const tempMarker = L.marker([lat, lng], {
          icon: L.icon({
            iconUrl:
              "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png",
            iconSize: [25, 41],
            iconAnchor: [12, 41],
          }),
        }).addTo(map);
        tempMarker.bindPopup("📍 Localização encontrada").openPopup();

        // Remover marcador após 5 segundos
        setTimeout(() => {
          map.removeLayer(tempMarker);
        }, 5000);
      }
    } else {
      throw new Error(
        "Endereço não encontrado. Tente ser mais específico ou insira as coordenadas manualmente."
      );
    }
  } catch (error) {
    console.error("Erro na geocodificação:", error);

    // Remover loading
    loadingMsg.remove();

    // Mostrar erro com mais detalhes
    const errorMsg = document.createElement("div");
    errorMsg.className = "geocoding-error";
    errorMsg.innerHTML = `❌ ${
      error.message || "Erro ao buscar coordenadas"
    }<br><small>Você pode inserir as coordenadas manualmente ou clicar no mapa</small>`;
    locationGroup.appendChild(errorMsg);

    // Remover mensagem após 8 segundos
    setTimeout(() => errorMsg.remove(), 8000);
  }
}

// Mostrar feedback visual ao clicar no mapa
function showMapClickFeedback(map, latlng, message) {
  // Criar marcador temporário
  const marker = L.marker(latlng, {
    icon: L.icon({
      iconUrl:
        "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",
      iconSize: [25, 41],
      iconAnchor: [12, 41],
    }),
  }).addTo(map);

  marker.bindPopup(message).openPopup();

  // Remover após 3 segundos
  setTimeout(() => {
    map.removeLayer(marker);
  }, 3000);
}

function openReviewModal(itemType, itemId) {
  // Verificar se o usuário é turista antes de abrir o modal
  if (!currentUser || currentUser.role !== "turista") {
    showWarning("Apenas turistas podem deixar avaliações", "Permissão Negada");
    return;
  }

  document.getElementById("review-item-id").value = itemId;
  document.getElementById("review-item-type").value = itemType;
  document.getElementById("review-modal").style.display = "block";
}

function closeModal(modalId) {
  document.getElementById(modalId).style.display = "none";
}

// Fechar modal ao clicar fora
window.onclick = function (event) {
  const modals = document.querySelectorAll(".modal");
  modals.forEach((modal) => {
    if (event.target === modal) {
      modal.style.display = "none";
    }
  });
};

// ========== DADOS COM FIRESTORE ==========
async function loadData(forceRefresh = false) {
  showLoading();
  try {
    // Se forçar refresh, usar source: 'server' para evitar cache
    const getOptions = forceRefresh ? { source: "server" } : {};

    // Carregar pontos (permitir sem autenticação para visitantes)
    try {
      const pointsSnapshot = await db.collection("points").get(getOptions);
      points = pointsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.warn("Erro ao carregar pontos:", error);
      points = [];
    }

    // Carregar eventos
    try {
      const eventsSnapshot = await db.collection("events").get(getOptions);
      events = eventsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.warn("Erro ao carregar eventos:", error);
      events = [];
    }

    // Carregar avaliações
    try {
      const reviewsSnapshot = await db.collection("reviews").get(getOptions);
      reviews = reviewsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      // Limpar cache de ratings quando reviews são carregados (se a função existir)
      if (typeof clearRatingsCache === "function") {
        clearRatingsCache();
      }
    } catch (error) {
      console.warn("Erro ao carregar avaliações:", error);
      reviews = [];
    }

    // Carregar estabelecimentos
    try {
      const establishmentsSnapshot = await db
        .collection("establishments")
        .get(getOptions);
      establishments = establishmentsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.warn("Erro ao carregar estabelecimentos:", error);
      establishments = [];
    }

    // Se não houver dados e for admin, adicionar exemplos
    if (
      currentUser &&
      currentUser.role === "admin" &&
      points.length === 0 &&
      events.length === 0 &&
      establishments.length === 0
    ) {
      await addSampleData();
    }

    // Atualizar UI
    updateMapMarkers();
    updateItemsList();

    // Configurar listeners em tempo real para todos (incluindo visitantes)
    // Isso garante que mudanças sejam refletidas mesmo sem login
    setupRealtimeListeners();

    // Ocultar loading
    hideLoading();
  } catch (error) {
    console.error("Erro ao carregar dados:", error);
    hideLoading();
    // Não mostrar alert para visitantes, apenas log
    if (currentUser) {
      showError("Erro ao carregar dados do servidor", "Erro");
    }
  }
}

// Configurar listeners em tempo real (atualizações automáticas)
let realtimeListenersSetup = false;

// Armazenar referências dos listeners para poder removê-los
let pointsListener = null;
let eventsListener = null;
let reviewsListener = null;
let establishmentsListener = null;

function setupRealtimeListeners() {
  // Remover listeners antigos se existirem
  if (pointsListener) {
    pointsListener();
    pointsListener = null;
  }
  if (eventsListener) {
    eventsListener();
    eventsListener = null;
  }
  if (reviewsListener) {
    reviewsListener();
    reviewsListener = null;
  }
  if (establishmentsListener) {
    establishmentsListener();
    establishmentsListener = null;
  }

  // Resetar flag para permitir atualização na primeira carga
  const wasSetup = realtimeListenersSetup;
  realtimeListenersSetup = false;

  // Listener para pontos
  pointsListener = db.collection("points").onSnapshot(
    (snapshot) => {
      // Verificar se há mudanças (incluindo deleções)
      const docChanges = snapshot.docChanges();
      const hasRemovals = docChanges.some(
        (change) => change.type === "removed"
      );

      points = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Sempre atualizar se houver mudanças (incluindo remoções)
      // Na primeira carga (sem mudanças), também atualizar
      if (docChanges.length > 0 || hasRemovals || !wasSetup) {
        updateMapMarkers();
        updateItemsList();
      }
    },
    (error) => {
      console.error("Erro no listener de pontos:", error);
    }
  );

  // Listener para eventos
  eventsListener = db.collection("events").onSnapshot(
    (snapshot) => {
      const docChanges = snapshot.docChanges();
      const hasRemovals = docChanges.some(
        (change) => change.type === "removed"
      );

      events = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      if (docChanges.length > 0 || hasRemovals || !wasSetup) {
        updateMapMarkers();
        updateItemsList();
      }
    },
    (error) => {
      console.error("Erro no listener de eventos:", error);
    }
  );

  // Listener para avaliações - atualizar popups do mapa e lista em tempo real
  reviewsListener = db.collection("reviews").onSnapshot(
    (snapshot) => {
      const docChanges = snapshot.docChanges();
      // Ignorar a primeira carga (quando não há mudanças reais)
      const isInitialLoad =
        docChanges.length === 0 ||
        (docChanges.length === snapshot.docs.length && !wasSetup);

      reviews = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Limpar cache de ratings quando reviews mudarem
      clearRatingsCache();

      // Só atualizar se não for a carga inicial ou se houver mudanças reais
      if (!isInitialLoad) {
        // Atualizar popups abertos no mapa se houver mudanças
        if (map) {
          updateOpenPopups();
          // Atualizar todos os popups (mesmo fechados) para que quando abrirem tenham dados atualizados
          updateMapPopups();
        }

        // Atualizar a lista de itens
        updateItemsList();
      }
    },
    (error) => {
      console.error("Erro no listener de avaliações:", error);
    }
  );

  // Listener para estabelecimentos
  establishmentsListener = db.collection("establishments").onSnapshot(
    (snapshot) => {
      const docChanges = snapshot.docChanges();
      const hasRemovals = docChanges.some(
        (change) => change.type === "removed"
      );

      establishments = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      if (docChanges.length > 0 || hasRemovals || !wasSetup) {
        updateMapMarkers();
        updateItemsList();
      }
    },
    (error) => {
      console.error("Erro no listener de estabelecimentos:", error);
    }
  );

  realtimeListenersSetup = true;
}

async function addSampleData() {
  // Só adicionar se for admin e não houver dados
  if (currentUser && currentUser.role === "admin") {
    try {
      // Pontos turísticos de Três Lagoas - MS
      const samplePoints = [
        {
          name: "Lagoa Maior",
          description:
            'É considerada o "cartão-postal" da cidade, com pista de caminhada, áreas de lazer, piquenique e arborização.',
          lat: -20.7836,
          lng: -51.7156,
          category: "parque",
          images: ["images/lagoa-maior.jpg"],
          image: "images/lagoa-maior.jpg",
          createdBy: "admin@turismo.com",
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        },
        {
          name: "Balneário Municipal Miguel Jorge Tabox",
          description:
            "Balneário às margens do rio Sucuriú, com quiosques, áreas de banho, espaço para lazer em família.",
          lat: -20.75,
          lng: -51.7,
          category: "praia",
          images: ["images/balneario-miguel-jorge.jpg"],
          image: "images/balneario-miguel-jorge.jpg",
          createdBy: "admin@turismo.com",
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        },
      ];

      for (const point of samplePoints) {
        await db.collection("points").add(point);
      }

      // Evento de exemplo
      const sampleEvent = {
        name: "Festival de Música",
        description: "Festival de música ao vivo com artistas locais",
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        time: "18:00",
        lat: -20.7836,
        lng: -51.7156,
        createdBy: "empresa@turismo.com",
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      };

      await db.collection("events").add(sampleEvent);
    } catch (error) {
      console.error("Erro ao adicionar dados de exemplo:", error);
    }
  }
}

// Função otimizada com cache
function getAverageRating(itemType, itemId) {
  const cacheKey = `${itemType}-${itemId}`;
  const cached = ratingsCache.get(cacheKey);

  // Verificar se cache é válido (menos de 1 minuto)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.rating;
  }

  // Calcular rating
  const itemReviews = reviews.filter(
    (r) => r.itemType === itemType && r.itemId === itemId
  );

  let avg = 0;
  if (itemReviews.length > 0) {
    const sum = itemReviews.reduce((acc, r) => acc + (r.rating || 0), 0);
    avg = sum / itemReviews.length;
  }

  // Armazenar no cache
  ratingsCache.set(cacheKey, { rating: avg, timestamp: Date.now() });

  return avg;
}

// Limpar cache quando reviews mudarem
function clearRatingsCache() {
  ratingsCache.clear();
}

// Atualizar popups abertos no mapa quando avaliações mudarem
function updateOpenPopups() {
  if (!map) return;

  // Iterar sobre todos os marcadores
  markers.forEach((marker) => {
    // Verificar se o popup está aberto
    // No Leaflet, verificamos se o popup está visível no mapa
    const popup = marker.getPopup();
    if (popup) {
      // Verificar se o popup está aberto verificando se está no DOM
      const popupElement = popup.getElement();
      const isOpen = popupElement && popupElement.parentElement;

      if (isOpen) {
        const latlng = marker.getLatLng();

        // Encontrar o item correspondente ao marcador
        let item = null;
        let itemType = null;

        // Verificar pontos turísticos
        const point = points.find(
          (p) =>
            p.lat &&
            p.lng &&
            Math.abs(p.lat - latlng.lat) < 0.0001 &&
            Math.abs(p.lng - latlng.lng) < 0.0001
        );
        if (point) {
          item = point;
          itemType = "ponto";
        } else {
          // Verificar eventos
          const event = events.find(
            (e) =>
              e.lat &&
              e.lng &&
              Math.abs(e.lat - latlng.lat) < 0.0001 &&
              Math.abs(e.lng - latlng.lng) < 0.0001
          );
          if (event) {
            item = event;
            itemType = "evento";
          } else {
            // Verificar estabelecimentos
            const establishment = establishments.find(
              (e) =>
                e.lat &&
                e.lng &&
                Math.abs(e.lat - latlng.lat) < 0.0001 &&
                Math.abs(e.lng - latlng.lng) < 0.0001
            );
            if (establishment) {
              item = establishment;
              itemType = "estabelecimento";
            }
          }
        }

        // Se encontrou o item, atualizar o popup
        if (item && itemType) {
          let newContent;
          if (itemType === "ponto") {
            newContent = createPointPopup(item);
          } else if (itemType === "evento") {
            newContent = createEventPopup(item);
          } else if (itemType === "estabelecimento") {
            newContent = createEstablishmentPopup(item);
          }

          if (newContent) {
            marker.setPopupContent(newContent);
          }
        }
      }
    }
  });
}

// Atualizar popups de todos os marcadores (mesmo fechados) para que quando abrirem tenham dados atualizados
function updateMapPopups() {
  if (!map) return;

  markers.forEach((marker) => {
    const latlng = marker.getLatLng();

    // Encontrar o item correspondente ao marcador
    let item = null;
    let itemType = null;

    // Verificar pontos turísticos
    const point = points.find(
      (p) =>
        p.lat &&
        p.lng &&
        Math.abs(p.lat - latlng.lat) < 0.0001 &&
        Math.abs(p.lng - latlng.lng) < 0.0001
    );
    if (point) {
      item = point;
      itemType = "ponto";
    } else {
      // Verificar eventos
      const event = events.find(
        (e) =>
          e.lat &&
          e.lng &&
          Math.abs(e.lat - latlng.lat) < 0.0001 &&
          Math.abs(e.lng - latlng.lng) < 0.0001
      );
      if (event) {
        item = event;
        itemType = "evento";
      } else {
        // Verificar estabelecimentos
        const establishment = establishments.find(
          (e) =>
            e.lat &&
            e.lng &&
            Math.abs(e.lat - latlng.lat) < 0.0001 &&
            Math.abs(e.lng - latlng.lng) < 0.0001
        );
        if (establishment) {
          item = establishment;
          itemType = "estabelecimento";
        }
      }
    }

    // Se encontrou o item, atualizar o popup
    if (item && itemType) {
      let newContent;
      if (itemType === "ponto") {
        newContent = createPointPopup(item);
      } else if (itemType === "evento") {
        newContent = createEventPopup(item);
      } else if (itemType === "estabelecimento") {
        newContent = createEstablishmentPopup(item);
      }

      if (newContent) {
        // Se o popup já existe, atualizar o conteúdo
        // Se não existe, criar um novo (será usado quando o marcador for clicado)
        if (marker.getPopup()) {
          marker.setPopupContent(newContent);
        } else {
          // Criar popup para uso futuro
          marker.bindPopup(newContent, { maxWidth: 300 });
        }
      }
    }
  });
}

// ========== LISTA DE ITENS ==========
function updateItemsList() {
  const container = document.getElementById("items-container");
  container.innerHTML = "";

  // Obter filtros
  const filterType =
    document.querySelector('input[name="filter-type"]:checked')?.value || "all";
  const searchTerm =
    document.getElementById("search-input")?.value.toLowerCase().trim() || "";
  const categoryFilter =
    document.getElementById("filter-category")?.value || "all";

  const showPontos = filterType === "all" || filterType === "pontos";
  const showEventos = filterType === "all" || filterType === "eventos";
  const showEstabelecimentos =
    filterType === "all" || filterType === "estabelecimentos";

  // Função auxiliar para verificar se o item corresponde à busca
  function matchesSearch(item, type) {
    if (!searchTerm) return true;

    const searchFields = [
      item.name || "",
      item.description || "",
      item.category || "",
      item.address || "",
    ];

    if (type === "event") {
      searchFields.push(item.time || "");
    }

    if (type === "establishment") {
      searchFields.push(item.phone || "", item.email || "", item.website || "");
    }

    return searchFields.some((field) =>
      field.toLowerCase().includes(searchTerm)
    );
  }

  // Adicionar pontos
  if (showPontos) {
    points
      .filter((point) => matchesSearch(point, "point"))
      .forEach((point) => {
        const avgRating = getAverageRating("ponto", point.id);
        const card = document.createElement("div");
        card.className = "item-card";
        card.onclick = () => centerMapOnItem(point, "point");

        // Obter array de imagens (suporta formato antigo e novo)
        const images =
          point.images && point.images.length > 0
            ? point.images
            : point.image
            ? [point.image]
            : [];

        const listCarouselId = `list-carousel-${point.id}`;
        const imageHtml =
          images.length > 0
            ? createImageCarousel(images, point.name, listCarouselId, true)
            : "";

        // Verificar se pode editar (admin pode editar todos)
        const canEdit = currentUser && currentUser.role === "admin";

        card.innerHTML = `
            ${imageHtml}
            <h4>📍 ${point.name}</h4>
            <p>${point.description}</p>
            <div class="item-meta">
                <span>${point.category}</span>
                ${
                  avgRating > 0
                    ? `<span class="rating">⭐ ${avgRating.toFixed(1)}</span>`
                    : ""
                }
            </div>
            ${
              canEdit
                ? `
                <div class="item-actions">
                    <button class="btn-edit" onclick="event.stopPropagation(); editPoint('${point.id}')" title="Editar">
                        ✏️ Editar
                    </button>
                    <button class="btn-delete" onclick="event.stopPropagation(); deletePoint('${point.id}')" title="Excluir">
                        🗑️ Excluir
                    </button>
                </div>
            `
                : ""
            }
        `;
        container.appendChild(card);
      });
  }

  // Adicionar eventos (filtrar eventos finalizados)
  if (showEventos) {
    events
      .filter((event) => event.status !== "finalizado")
      .filter((event) => matchesSearch(event, "event"))
      .forEach((event) => {
        const avgRating = getAverageRating("evento", event.id);
        const eventDate = new Date(event.date + "T" + event.time);
        const isFinalized = event.status === "finalizado";
        const card = document.createElement("div");
        card.className = "item-card event" + (isFinalized ? " finalized" : "");
        card.onclick = () => centerMapOnItem(event, "event");

        // Obter array de imagens (suporta formato antigo e novo)
        const images =
          event.images && event.images.length > 0
            ? event.images
            : event.image
            ? [event.image]
            : [];

        const listCarouselId = `list-carousel-event-${event.id}`;
        const imageHtml =
          images.length > 0
            ? createImageCarousel(images, event.name, listCarouselId, true)
            : "";

        // Verificar se pode editar (admin e empresa podem editar seus próprios eventos)
        const canEdit =
          currentUser &&
          (currentUser.role === "admin" ||
            (currentUser.role === "empresa" &&
              event.createdBy === currentUser.email));

        card.innerHTML = `
            ${imageHtml}
            <h4>
                🎉 ${event.name}
                ${
                  isFinalized
                    ? '<span style="font-size: 0.7em; color: #7f8c8d; font-weight: normal; margin-left: 10px;">(Finalizado)</span>'
                    : ""
                }
            </h4>
            <p>${event.description}</p>
            <div class="item-meta">
                <span>${eventDate.toLocaleDateString("pt-BR")} às ${
          event.time
        }</span>
                ${
                  avgRating > 0
                    ? `<span class="rating">⭐ ${avgRating.toFixed(1)}</span>`
                    : ""
                }
            </div>
            ${
              canEdit
                ? `
                <div class="item-actions">
                    <button class="btn-edit" onclick="event.stopPropagation(); editEvent('${
                      event.id
                    }')" title="Editar">
                        ✏️ Editar
                    </button>
                    ${
                      event.status !== "finalizado"
                        ? `
                        <button class="btn-finish" onclick="event.stopPropagation(); finalizeEvent('${event.id}')" title="Finalizar Evento">
                            ✓ Finalizar
                        </button>
                    `
                        : `
                        <span style="color: #7f8c8d; font-size: 0.85em; font-style: italic;">Evento Finalizado</span>
                    `
                    }
                    <button class="btn-delete" onclick="event.stopPropagation(); deleteEvent('${
                      event.id
                    }')" title="Excluir Evento">
                        🗑️ Excluir
                    </button>
                </div>
            `
                : ""
            }
        `;
        container.appendChild(card);
      });
  }

  // Adicionar estabelecimentos (ordenados: verificados primeiro)
  if (showEstabelecimentos) {
    const sortedEstablishments = [...establishments].sort((a, b) => {
      const aVerified = a.hasCadastur && a.cadasturNumber ? 1 : 0;
      const bVerified = b.hasCadastur && b.cadasturNumber ? 1 : 0;
      return bVerified - aVerified; // Verificados primeiro
    });

    sortedEstablishments
      .filter((establishment) => {
        // Aplicar filtro de categoria se estiver selecionado
        if (
          categoryFilter !== "all" &&
          establishment.category !== categoryFilter
        ) {
          return false;
        }
        return matchesSearch(establishment, "establishment");
      })
      .forEach((establishment) => {
        const avgRating = getAverageRating("estabelecimento", establishment.id);
        const isVerified =
          establishment.hasCadastur && establishment.cadasturNumber;
        const card = document.createElement("div");
        card.className = "item-card establishment";
        card.onclick = () => centerMapOnItem(establishment, "establishment");

        // Obter array de imagens
        const images =
          establishment.images && establishment.images.length > 0
            ? establishment.images
            : establishment.image
            ? [establishment.image]
            : [];

        const listCarouselId = `list-carousel-establishment-${establishment.id}`;
        const imageHtml =
          images.length > 0
            ? createImageCarousel(
                images,
                establishment.name,
                listCarouselId,
                true
              )
            : "";

        // Verificar se pode editar (empresa e admin podem editar seus próprios estabelecimentos)
        const canEdit =
          currentUser &&
          (currentUser.role === "admin" ||
            (currentUser.role === "empresa" &&
              establishment.createdBy === currentUser.email));

        card.innerHTML = `
            ${imageHtml}
            <h4>
                🏢 ${establishment.name}
                ${
                  isVerified
                    ? '<span class="verified-badge" title="Verificado pelo Cadastur">Verificado</span>'
                    : ""
                }
            </h4>
            <p>${establishment.description}</p>
            <div class="item-meta">
                <span>${establishment.category}</span>
                ${
                  avgRating > 0
                    ? `<span class="rating">⭐ ${avgRating.toFixed(1)}</span>`
                    : ""
                }
            </div>
            ${
              canEdit
                ? `
                <div class="item-actions">
                    <button class="btn-edit" onclick="event.stopPropagation(); editEstablishment('${establishment.id}')" title="Editar">
                        ✏️ Editar
                    </button>
                    <button class="btn-delete" onclick="event.stopPropagation(); deleteEstablishment('${establishment.id}')" title="Excluir">
                        🗑️ Excluir
                    </button>
                </div>
            `
                : ""
            }
        `;
        container.appendChild(card);
      });
  }

  // Mostrar mensagem se não houver resultados
  if (container.children.length === 0) {
    const noResults = document.createElement("div");
    noResults.className = "no-results";
    noResults.innerHTML = `
            <p>🔍 Nenhum resultado encontrado</p>
            <p style="font-size: 0.9em; color: var(--dark-gray); margin-top: 8px;">
                ${
                  searchTerm
                    ? "Tente ajustar sua pesquisa ou filtros."
                    : "Não há itens para exibir."
                }
            </p>
        `;
    container.appendChild(noResults);
  }
}

// ========== FILTROS E PESQUISA ==========
function handleFilterChange() {
  // Mostrar/esconder filtro de categoria baseado no tipo selecionado
  const filterType =
    document.querySelector('input[name="filter-type"]:checked')?.value || "all";
  const categoryFilterSection = document.getElementById(
    "category-filter-section"
  );

  if (categoryFilterSection) {
    if (filterType === "estabelecimentos") {
      categoryFilterSection.style.display = "block";
    } else {
      categoryFilterSection.style.display = "none";
      // Resetar filtro de categoria quando não estiver em estabelecimentos
      const categorySelect = document.getElementById("filter-category");
      if (categorySelect) {
        categorySelect.value = "all";
      }
    }
  }

  // Forçar atualização imediata do mapa e lista
  if (map) {
    updateMapMarkers();
  } else {
    console.log("Mapa não inicializado, aguardando...");
  }
  updateItemsList();
}

function handleSearch() {
  // Debounce para evitar muitas atualizações durante a digitação
  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }

  searchTimeout = setTimeout(() => {
    // Forçar atualização do mapa e lista
    if (map) {
      updateMapMarkers();
    }
    updateItemsList();
  }, 300);
}

let searchTimeout = null;

// ========== EDIÇÃO E EXCLUSÃO ==========
// Editar ponto turístico
async function editPoint(pointId) {
  const point = points.find((p) => p.id === pointId);
  if (!point) {
    showError("Ponto turístico não encontrado", "Erro");
    return;
  }

  // Verificar permissão
  if (currentUser.role !== "admin") {
    showWarning(
      "Apenas administradores podem editar pontos turísticos",
      "Permissão Negada"
    );
    return;
  }

  // Preencher formulário
  document.getElementById("point-id").value = point.id;
  document.getElementById("point-name").value = point.name || "";
  document.getElementById("point-description").value = point.description || "";
  document.getElementById("point-category").value = point.category || "outro";
  document.getElementById("point-lat").value = point.lat || "";
  document.getElementById("point-lng").value = point.lng || "";
  document.getElementById("point-cep").value = point.cep || "";
  document.getElementById("point-address").value = point.address || "";

  // Atualizar título do modal
  document.getElementById("point-modal-title").textContent =
    "Editar Ponto Turístico";
  document.getElementById("point-submit-btn").textContent = "Atualizar";

  // Limpar previews
  document.getElementById("point-images-preview").innerHTML = "";
  selectedImages.point = [];

  // Mostrar imagens existentes
  const existingImages =
    point.images && point.images.length > 0
      ? point.images
      : point.image
      ? [point.image]
      : [];
  pointExistingImages.point = [...existingImages];
  showExistingImages("point-existing-images", existingImages, "point");

  // Abrir modal
  document.getElementById("point-modal").style.display = "block";
}

// Editar evento
async function editEvent(eventId) {
  const event = events.find((e) => e.id === eventId);
  if (!event) {
    showError("Evento não encontrado", "Erro");
    return;
  }

  // Verificar permissão
  const canEdit =
    currentUser.role === "admin" ||
    (currentUser.role === "empresa" && event.createdBy === currentUser.email);
  if (!canEdit) {
    showWarning(
      "Você não tem permissão para editar este evento",
      "Permissão Negada"
    );
    return;
  }

  // Preencher formulário
  document.getElementById("event-id").value = event.id;
  document.getElementById("event-name").value = event.name || "";
  document.getElementById("event-description").value = event.description || "";
  document.getElementById("event-date").value = event.date || "";
  document.getElementById("event-time").value = event.time || "";
  document.getElementById("event-lat").value = event.lat || "";
  document.getElementById("event-lng").value = event.lng || "";
  document.getElementById("event-cep").value = event.cep || "";
  document.getElementById("event-address").value = event.address || "";

  // Atualizar título do modal
  document.getElementById("event-modal-title").textContent = "Editar Evento";
  document.getElementById("event-submit-btn").textContent = "Atualizar";

  // Limpar previews
  document.getElementById("event-images-preview").innerHTML = "";
  selectedImages.event = [];

  // Mostrar imagens existentes
  const existingImages =
    event.images && event.images.length > 0
      ? event.images
      : event.image
      ? [event.image]
      : [];
  eventExistingImages.event = [...existingImages];
  showExistingImages("event-existing-images", existingImages, "event");

  // Abrir modal
  document.getElementById("event-modal").style.display = "block";
}

// Mostrar imagens existentes
function showExistingImages(containerId, images, type) {
  const container = document.getElementById(containerId);
  container.innerHTML = "";

  if (!images || images.length === 0) {
    return;
  }

  const title = document.createElement("h4");
  title.textContent = "Imagens Existentes (clique para remover)";
  container.appendChild(title);

  images.forEach((imageUrl, index) => {
    const imageItem = document.createElement("div");
    imageItem.className = "existing-image-item";
    imageItem.innerHTML = `
            <img src="${imageUrl}" alt="Imagem existente">
            <button type="button" class="remove-existing-image" onclick="removeExistingImage('${type}', ${index})" title="Remover">×</button>
        `;
    container.appendChild(imageItem);
  });
}

// Remover imagem existente
function removeExistingImage(type, index) {
  if (type === "point") {
    pointExistingImages.point.splice(index, 1);
    showExistingImages(
      "point-existing-images",
      pointExistingImages.point,
      "point"
    );
  } else if (type === "event") {
    eventExistingImages.event.splice(index, 1);
    showExistingImages(
      "event-existing-images",
      eventExistingImages.event,
      "event"
    );
  } else if (type === "establishment") {
    establishmentExistingImages.establishment.splice(index, 1);
    showExistingImages(
      "establishment-existing-images",
      establishmentExistingImages.establishment,
      "establishment"
    );
  }
}

// Excluir ponto turístico
async function deletePoint(pointId) {
  if (currentUser.role !== "admin") {
    showWarning(
      "Apenas administradores podem excluir pontos turísticos",
      "Permissão Negada"
    );
    return;
  }

  showConfirm(
    "Tem certeza que deseja excluir este ponto turístico? Esta ação não pode ser desfeita.",
    "Excluir Ponto Turístico",
    async () => {
      try {
        // Remover avaliações relacionadas primeiro
        const reviewRefs = await db
          .collection("reviews")
          .where("itemType", "==", "ponto")
          .where("itemId", "==", pointId)
          .get();

        const batch = db.batch();
        reviewRefs.docs.forEach((doc) => {
          batch.delete(doc.ref);
        });
        await batch.commit();

        // Deletar o ponto
        await db.collection("points").doc(pointId).delete();

        // Remover do array local imediatamente
        points = points.filter((p) => p.id !== pointId);
        reviews = reviews.filter(
          (r) => !(r.itemType === "ponto" && r.itemId === pointId)
        );

        // Atualizar mapa e lista imediatamente
        updateMapMarkers();
        updateItemsList();

        // O listener em tempo real também vai atualizar, mas já atualizamos manualmente
        showSuccess("Ponto turístico excluído com sucesso!", "Exclusão");
      } catch (error) {
        console.error("Erro ao excluir ponto:", error);
        showError("Erro ao excluir ponto turístico: " + error.message, "Erro");
      }
    }
  );
}

// Finalizar evento (ao invés de excluir)
async function finalizeEvent(eventId) {
  const event = events.find((e) => e.id === eventId);
  if (!event) {
    showError("Evento não encontrado", "Erro");
    return;
  }

  const canFinalize =
    currentUser &&
    (currentUser.role === "admin" ||
      (currentUser.role === "empresa" &&
        event.createdBy === currentUser.email));
  if (!canFinalize) {
    showWarning(
      "Você não tem permissão para finalizar este evento",
      "Permissão Negada"
    );
    return;
  }

  showConfirm(
    "Tem certeza que deseja finalizar este evento? O evento será marcado como finalizado e não aparecerá mais no mapa, mas permanecerá no histórico.",
    "Finalizar Evento",
    async () => {
      try {
        // Atualizar evento no Firestore
        await db.collection("events").doc(eventId).update({
          status: "finalizado",
          finalizedAt: firebase.firestore.FieldValue.serverTimestamp(),
          finalizedBy: currentUser.email,
        });

        // Atualizar no array local
        const eventIndex = events.findIndex((e) => e.id === eventId);
        if (eventIndex !== -1) {
          events[eventIndex].status = "finalizado";
          events[eventIndex].finalizedAt = new Date();
          events[eventIndex].finalizedBy = currentUser.email;
        }

        updateMapMarkers();
        updateItemsList();
        showSuccess(
          "Evento finalizado com sucesso! Ele permanecerá no histórico.",
          "Evento Finalizado"
        );
      } catch (error) {
        console.error("Erro ao finalizar evento:", error);
        showError("Erro ao finalizar evento: " + error.message, "Erro");
      }
    }
  );
}

// Excluir evento permanentemente
async function deleteEvent(eventId) {
  const event = events.find((e) => e.id === eventId);
  if (!event) {
    showError("Evento não encontrado", "Erro");
    return;
  }

  const canDelete =
    currentUser &&
    (currentUser.role === "admin" ||
      (currentUser.role === "empresa" &&
        event.createdBy === currentUser.email));
  if (!canDelete) {
    showWarning(
      "Você não tem permissão para excluir este evento",
      "Permissão Negada"
    );
    return;
  }

  showConfirm(
    "Tem certeza que deseja excluir este evento permanentemente? Esta ação não pode ser desfeita.",
    "Excluir Evento",
    async () => {
      try {
        // Excluir do Firestore
        await db.collection("events").doc(eventId).delete();

        // Remover do array local
        const eventIndex = events.findIndex((e) => e.id === eventId);
        if (eventIndex !== -1) {
          events.splice(eventIndex, 1);
        }

        // Remover avaliações relacionadas (opcional)
        const relatedReviews = reviews.filter(
          (r) => r.itemType === "evento" && r.itemId === eventId
        );
        for (const review of relatedReviews) {
          try {
            await db.collection("reviews").doc(review.id).delete();
          } catch (error) {
            console.warn("Erro ao excluir avaliação:", error);
          }
        }
        reviews = reviews.filter(
          (r) => !(r.itemType === "evento" && r.itemId === eventId)
        );

        updateMapMarkers();
        updateItemsList();
        showSuccess("Evento excluído com sucesso!", "Exclusão");
      } catch (error) {
        console.error("Erro ao excluir evento:", error);
        showError("Erro ao excluir evento: " + error.message, "Erro");
      }
    }
  );
}

// Editar estabelecimento
async function editEstablishment(establishmentId) {
  const establishment = establishments.find((e) => e.id === establishmentId);
  if (!establishment) {
    showError("Estabelecimento não encontrado", "Erro");
    return;
  }

  // Verificar permissão
  const canEdit =
    currentUser.role === "admin" ||
    (currentUser.role === "empresa" &&
      establishment.createdBy === currentUser.email);
  if (!canEdit) {
    showWarning(
      "Você não tem permissão para editar este estabelecimento",
      "Permissão Negada"
    );
    return;
  }

  // Preencher formulário
  document.getElementById("establishment-id").value = establishment.id;
  document.getElementById("establishment-name").value =
    establishment.name || "";
  document.getElementById("establishment-description").value =
    establishment.description || "";
  document.getElementById("establishment-category").value =
    establishment.category || "outro";
  document.getElementById("establishment-lat").value = establishment.lat || "";
  document.getElementById("establishment-lng").value = establishment.lng || "";
  document.getElementById("establishment-cep").value = establishment.cep || "";
  document.getElementById("establishment-address").value =
    establishment.address || "";
  document.getElementById("establishment-phone").value =
    establishment.phone || "";
  document.getElementById("establishment-email").value =
    establishment.email || "";
  document.getElementById("establishment-website").value =
    establishment.website || "";

  // Campos Cadastur
  if (establishment.hasCadastur && establishment.cadasturNumber) {
    document.getElementById("has-cadastur-yes").checked = true;
    document.getElementById("has-cadastur-no").checked = false;
    document.getElementById("establishment-cadastur-number").value =
      establishment.cadasturNumber || "";
    toggleCadasturFields(true);
  } else {
    document.getElementById("has-cadastur-no").checked = true;
    document.getElementById("has-cadastur-yes").checked = false;
    toggleCadasturFields(false);
  }

  // Atualizar título do modal
  document.getElementById("establishment-modal-title").textContent =
    "Editar Estabelecimento";
  document.getElementById("establishment-submit-btn").textContent = "Atualizar";

  // Limpar previews
  document.getElementById("establishment-images-preview").innerHTML = "";
  selectedImages.establishment = [];

  // Mostrar imagens existentes
  const existingImages =
    establishment.images && establishment.images.length > 0
      ? establishment.images
      : establishment.image
      ? [establishment.image]
      : [];
  establishmentExistingImages.establishment = [...existingImages];
  showExistingImages(
    "establishment-existing-images",
    existingImages,
    "establishment"
  );

  // Abrir modal
  document.getElementById("establishment-modal").style.display = "block";
}

// Excluir estabelecimento
async function deleteEstablishment(establishmentId) {
  const establishment = establishments.find((e) => e.id === establishmentId);
  if (!establishment) {
    showError("Estabelecimento não encontrado", "Erro");
    return;
  }

  const canDelete =
    currentUser &&
    (currentUser.role === "admin" ||
      (currentUser.role === "empresa" &&
        establishment.createdBy === currentUser.email));
  if (!canDelete) {
    showWarning(
      "Você não tem permissão para excluir este estabelecimento",
      "Permissão Negada"
    );
    return;
  }

  showConfirm(
    "Tem certeza que deseja excluir este estabelecimento permanentemente? Esta ação não pode ser desfeita.",
    "Excluir Estabelecimento",
    async () => {
      try {
        await db.collection("establishments").doc(establishmentId).delete();

        // Remover do array local
        establishments = establishments.filter((e) => e.id !== establishmentId);

        // Remover avaliações relacionadas
        reviews = reviews.filter(
          (r) =>
            !(r.itemType === "estabelecimento" && r.itemId === establishmentId)
        );
        const reviewRefs = await db
          .collection("reviews")
          .where("itemType", "==", "estabelecimento")
          .where("itemId", "==", establishmentId)
          .get();

        const batch = db.batch();
        reviewRefs.docs.forEach((doc) => {
          batch.delete(doc.ref);
        });
        await batch.commit();

        updateMapMarkers();
        updateItemsList();
        showSuccess("Estabelecimento excluído com sucesso!", "Exclusão");
      } catch (error) {
        console.error("Erro ao excluir estabelecimento:", error);
        showError("Erro ao excluir estabelecimento: " + error.message, "Erro");
      }
    }
  );
}

// ========== MENSAGEM DE BOAS-VINDAS ==========
let welcomeShown = false;
let welcomeTimeoutId = null;
let surveyTimeoutId = null;

// Mostrar modal de boas-vindas
function showWelcomeModal() {
  // Só mostrar para visitantes ou turistas, e apenas uma vez
  if (welcomeShown) return;

  const shouldShow = !currentUser || currentUser.role === "turista";
  if (!shouldShow) return;

  // Verificar se já viu (usando localStorage)
  const hasSeenWelcome = localStorage.getItem("welcome-seen");
  if (hasSeenWelcome) {
    welcomeShown = true;
    return;
  }

  // Verificar se o modal já está visível
  const welcomeModal = document.getElementById("welcome-modal");
  if (welcomeModal && welcomeModal.style.display === "block") {
    welcomeShown = true;
    return;
  }

  welcomeShown = true;
  if (welcomeModal) {
    welcomeModal.style.display = "block";
  }
}

// Fechar modal de boas-vindas
function closeWelcomeModal() {
  document.getElementById("welcome-modal").style.display = "none";
  welcomeShown = true;
  // Marcar como visto
  localStorage.setItem("welcome-seen", "true");
}

// ========== PESQUISA DE TURISMO ==========
let surveyShown = false;

// Mostrar modal de pesquisa
function showSurveyModal() {
  // Só mostrar para visitantes ou turistas, e apenas uma vez
  if (surveyShown) return;

  const shouldShow = !currentUser || currentUser.role === "turista";
  if (!shouldShow) return;

  // Verificar se já respondeu (usando localStorage)
  const hasResponded = localStorage.getItem("survey-responded");
  if (hasResponded) {
    surveyShown = true;
    return;
  }

  // Verificar se o modal já está visível
  const surveyModal = document.getElementById("survey-modal");
  if (surveyModal && surveyModal.style.display === "block") {
    surveyShown = true;
    return;
  }

  surveyShown = true;
  if (surveyModal) {
    surveyModal.style.display = "block";
  }
}

// Fechar modal de pesquisa
function closeSurveyModal() {
  document.getElementById("survey-modal").style.display = "none";
  surveyShown = true; // Marcar como mostrado
}

// Inicializar formulário de pesquisa
function initSurvey() {
  const surveyForm = document.getElementById("survey-form");
  if (!surveyForm) return;

  surveyForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const visitStatus =
      document.querySelector('input[name="visit-status"]:checked')?.value ||
      null;
    const reason =
      document.getElementById("survey-reason").value.trim() || null;
    const origin =
      document.getElementById("survey-origin").value.trim() || null;
    const companions =
      document.getElementById("survey-companions").value || null;
    const stay = document.getElementById("survey-stay").value || null;

    // Se não preencheu nada, apenas fechar
    if (!visitStatus && !reason && !origin && !companions && !stay) {
      closeSurveyModal();
      return;
    }

    try {
      const submitBtn = e.target.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = "Enviando...";

      const surveyData = {
        visitStatus: visitStatus,
        reason: reason,
        origin: origin,
        companions: companions,
        stay: stay,
        userEmail: currentUser ? currentUser.email : null,
        userRole: currentUser ? currentUser.role : "visitante",
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      };

      await db.collection("surveys").add(surveyData);

      // Marcar como respondido
      localStorage.setItem("survey-responded", "true");

      submitBtn.textContent = originalText;
      submitBtn.disabled = false;

      closeSurveyModal();
      showSuccess("Obrigado por responder nossa pesquisa! 🎉", "Pesquisa");
    } catch (error) {
      console.error("Erro ao salvar pesquisa:", error);
      const submitBtn = e.target.querySelector('button[type="submit"]');
      submitBtn.disabled = false;
      submitBtn.textContent = "Enviar Respostas";
      showError("Erro ao enviar pesquisa. Tente novamente.", "Erro");
    }
  });
}

// ========== DASHBOARD ADMIN ==========
async function showDashboard() {
  if (!currentUser || currentUser.role !== "admin") {
    showWarning(
      "Apenas administradores podem acessar o dashboard",
      "Permissão Negada"
    );
    return;
  }

  const dashboardContent = document.getElementById("dashboard-content");
  dashboardContent.innerHTML =
    '<div style="text-align: center; padding: 40px;"><p>Carregando estatísticas...</p></div>';

  document.getElementById("dashboard-modal").style.display = "block";

  try {
    // Carregar todas as estatísticas
    const [
      pointsData,
      eventsData,
      establishmentsData,
      reviewsData,
      usersData,
      surveysData,
    ] = await Promise.all([
      db.collection("points").get(),
      db.collection("events").get(),
      db.collection("establishments").get(),
      db.collection("reviews").get(),
      db.collection("users").get(),
      db.collection("surveys").get(),
    ]);

    const points = pointsData.docs.map((doc) => doc.data());
    const events = eventsData.docs.map((doc) => doc.data());
    const establishments = establishmentsData.docs.map((doc) => doc.data());
    const reviews = reviewsData.docs.map((doc) => doc.data());
    const users = usersData.docs.map((doc) => doc.data());
    const surveys = surveysData.docs.map((doc) => doc.data());

    // Estatísticas de estabelecimentos
    const establishmentsByCategory = {};
    const establishmentsByCadastur = { verified: 0, unverified: 0 };

    establishments.forEach((est) => {
      // Por categoria
      const cat = est.category || "outro";
      establishmentsByCategory[cat] = (establishmentsByCategory[cat] || 0) + 1;

      // Por Cadastur
      if (est.hasCadastur && est.cadasturNumber) {
        establishmentsByCadastur.verified++;
      } else {
        establishmentsByCadastur.unverified++;
      }
    });

    // Estatísticas de eventos
    const now = new Date();
    const pastEvents = events.filter((e) => {
      if (!e.date) return false;
      const eventDate = new Date(e.date + "T" + (e.time || "00:00"));
      return eventDate < now;
    });
    const upcomingEvents = events.length - pastEvents.length;

    // Estatísticas de usuários
    const usersByRole = { admin: 0, empresa: 0, turista: 0 };
    users.forEach((u) => {
      if (u.role && usersByRole.hasOwnProperty(u.role)) {
        usersByRole[u.role]++;
      }
    });

    // Estatísticas de pesquisas
    const surveysByStatus = {};
    surveys.forEach((s) => {
      const status = s.visitStatus || "nao-informado";
      surveysByStatus[status] = (surveysByStatus[status] || 0) + 1;
    });

    // Renderizar dashboard
    dashboardContent.innerHTML = `
            <div class="dashboard-grid">
                <div class="dashboard-card">
                    <h3>📍 Pontos Turísticos</h3>
                    <div class="stat-number">${points.length}</div>
                </div>
                
                <div class="dashboard-card">
                    <h3>🎉 Eventos</h3>
                    <div class="stat-number">${events.length}</div>
                    <div class="stat-detail">Passados: ${
                      pastEvents.length
                    } | Próximos: ${upcomingEvents}</div>
                </div>
                
                <div class="dashboard-card">
                    <h3>🏢 Estabelecimentos</h3>
                    <div class="stat-number">${establishments.length}</div>
                    <div class="stat-detail">Verificados: ${
                      establishmentsByCadastur.verified
                    } | Não verificados: ${
      establishmentsByCadastur.unverified
    }</div>
                </div>
                
                <div class="dashboard-card">
                    <h3>⭐ Avaliações</h3>
                    <div class="stat-number">${reviews.length}</div>
                </div>
                
                <div class="dashboard-card">
                    <h3>👥 Usuários</h3>
                    <div class="stat-number">${users.length}</div>
                    <div class="stat-detail">
                        Admin: ${usersByRole.admin} | Empresa: ${
      usersByRole.empresa
    } | Turista: ${usersByRole.turista}
                    </div>
                </div>
                
                <div class="dashboard-card">
                    <h3>📋 Pesquisas</h3>
                    <div class="stat-number">${surveys.length}</div>
                </div>
            </div>
            
            <div class="dashboard-section">
                <h3>🏢 Estabelecimentos por Categoria</h3>
                <div class="dashboard-chart">
                    ${Object.entries(establishmentsByCategory)
                      .map(
                        ([cat, count]) => `
                        <div class="chart-item">
                            <span class="chart-label">${cat}</span>
                            <div class="chart-bar">
                                <div class="chart-fill" style="width: ${
                                  establishments.length > 0
                                    ? (count / establishments.length) * 100
                                    : 0
                                }%"></div>
                            </div>
                            <span class="chart-value">${count}</span>
                        </div>
                    `
                      )
                      .join("")}
                </div>
            </div>
            
            <div class="dashboard-section">
                <h3>📊 Status das Pesquisas</h3>
                <div class="dashboard-chart">
                    ${Object.entries(surveysByStatus)
                      .map(
                        ([status, count]) => `
                        <div class="chart-item">
                            <span class="chart-label">${status.replace(
                              "-",
                              " "
                            )}</span>
                            <div class="chart-bar">
                                <div class="chart-fill" style="width: ${
                                  surveys.length > 0
                                    ? (count / surveys.length) * 100
                                    : 0
                                }%"></div>
                            </div>
                            <span class="chart-value">${count}</span>
                        </div>
                    `
                      )
                      .join("")}
                </div>
            </div>
            
            <div class="dashboard-section">
                <h3>📋 Respostas das Pesquisas</h3>
                <div style="max-height: 400px; overflow-y: auto;">
                    ${
                      surveys.length === 0
                        ? "<p>Nenhuma pesquisa respondida ainda.</p>"
                        : surveys
                            .slice(0, 50)
                            .map(
                              (survey, index) => `
                        <div class="survey-item">
                            <strong>#${index + 1}</strong>
                            <div style="margin-top: 10px;">
                                ${
                                  survey.visitStatus
                                    ? `<p><strong>Status:</strong> ${survey.visitStatus.replace(
                                        "-",
                                        " "
                                      )}</p>`
                                    : ""
                                }
                                ${
                                  survey.reason
                                    ? `<p><strong>Motivo:</strong> ${survey.reason}</p>`
                                    : ""
                                }
                                ${
                                  survey.origin
                                    ? `<p><strong>Origem:</strong> ${survey.origin}</p>`
                                    : ""
                                }
                                ${
                                  survey.companions
                                    ? `<p><strong>Acompanhantes:</strong> ${survey.companions}</p>`
                                    : ""
                                }
                                ${
                                  survey.stay
                                    ? `<p><strong>Estadia:</strong> ${survey.stay.replace(
                                        "-",
                                        " "
                                      )}</p>`
                                    : ""
                                }
                                <p style="color: #7f8c8d; font-size: 0.85em; margin-top: 5px;">
                                    ${survey.userEmail || "Visitante"} - ${
                                survey.createdAt
                                  ? new Date(
                                      survey.createdAt.toDate()
                                    ).toLocaleString("pt-BR")
                                  : "Data não disponível"
                              }
                                </p>
                            </div>
                        </div>
                    `
                            )
                            .join("")
                    }
                    ${
                      surveys.length > 50
                        ? `<p style="text-align: center; color: #7f8c8d; margin-top: 20px;">Mostrando 50 de ${surveys.length} pesquisas</p>`
                        : ""
                    }
                </div>
            </div>
        `;
  } catch (error) {
    console.error("Erro ao carregar dashboard:", error);
    dashboardContent.innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <p style="color: var(--danger-color);">Erro ao carregar estatísticas: ${error.message}</p>
            </div>
        `;
  }
}

// ========== LIGHTBOX DE IMAGENS ==========
let lightboxImages = [];
let lightboxCurrentIndex = 0;

function openImageLightbox(images, startIndex = 0) {
  if (!images || images.length === 0) return;

  lightboxImages = images;
  lightboxCurrentIndex = startIndex;

  const lightbox = document.getElementById("image-lightbox");
  const lightboxImage = document.getElementById("lightbox-image");
  const lightboxCounter = document.getElementById("lightbox-counter");

  if (lightbox && lightboxImage) {
    lightboxImage.src = lightboxImages[lightboxCurrentIndex];
    lightboxImage.alt = `Imagem ${lightboxCurrentIndex + 1} de ${
      lightboxImages.length
    }`;

    if (lightboxCounter) {
      if (lightboxImages.length > 1) {
        lightboxCounter.textContent = `${lightboxCurrentIndex + 1} / ${
          lightboxImages.length
        }`;
        lightboxCounter.style.display = "block";
      } else {
        lightboxCounter.style.display = "none";
      }
    }

    // Mostrar/esconder botões de navegação
    const prevBtn = document.querySelector(".lightbox-prev");
    const nextBtn = document.querySelector(".lightbox-next");
    if (prevBtn && nextBtn) {
      if (lightboxImages.length > 1) {
        prevBtn.style.display = "flex";
        nextBtn.style.display = "flex";
      } else {
        prevBtn.style.display = "none";
        nextBtn.style.display = "none";
      }
    }

    lightbox.style.display = "block";
    document.body.style.overflow = "hidden"; // Prevenir scroll do body
  }
}

function closeImageLightbox(event) {
  // Se o evento foi passado e o clique foi no overlay (não no conteúdo), fechar
  if (event && event.target.id === "image-lightbox") {
    document.getElementById("image-lightbox").style.display = "none";
    document.body.style.overflow = "auto";
  } else if (!event) {
    // Chamada direta (botão fechar)
    document.getElementById("image-lightbox").style.display = "none";
    document.body.style.overflow = "auto";
  }
}

function changeLightboxImage(direction) {
  if (lightboxImages.length <= 1) return;

  lightboxCurrentIndex += direction;

  if (lightboxCurrentIndex < 0) {
    lightboxCurrentIndex = lightboxImages.length - 1;
  } else if (lightboxCurrentIndex >= lightboxImages.length) {
    lightboxCurrentIndex = 0;
  }

  const lightboxImage = document.getElementById("lightbox-image");
  const lightboxCounter = document.getElementById("lightbox-counter");

  if (lightboxImage) {
    lightboxImage.src = lightboxImages[lightboxCurrentIndex];
    lightboxImage.alt = `Imagem ${lightboxCurrentIndex + 1} de ${
      lightboxImages.length
    }`;
  }

  if (lightboxCounter) {
    lightboxCounter.textContent = `${lightboxCurrentIndex + 1} / ${
      lightboxImages.length
    }`;
  }
}

function initImageLightbox() {
  // Adicionar event listener para teclas de navegação
  document.addEventListener("keydown", function (e) {
    const lightbox = document.getElementById("image-lightbox");
    if (lightbox && lightbox.style.display === "block") {
      if (e.key === "Escape") {
        closeImageLightbox();
      } else if (e.key === "ArrowLeft") {
        changeLightboxImage(-1);
      } else if (e.key === "ArrowRight") {
        changeLightboxImage(1);
      }
    }
  });

  // Verificar tamanho da tela e mostrar/esconder toggle do sidebar
  checkSidebarToggle();
  window.addEventListener("resize", checkSidebarToggle);
}

// Toggle sidebar em mobile
function toggleSidebar() {
  const sidebar = document.getElementById("sidebar");
  let overlay = document.getElementById("sidebar-overlay");

  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "sidebar-overlay";
    overlay.className = "sidebar-overlay";
    overlay.onclick = toggleSidebar; // Fechar ao clicar no overlay
    // Adicionar ao app-container para cobrir toda a tela
    const appContainer = document.getElementById("app-container");
    if (appContainer) {
      appContainer.appendChild(overlay);
    } else {
      // Fallback para body se app-container não existir
      document.body.appendChild(overlay);
    }
  }

  if (sidebar) {
    const isActive = sidebar.classList.contains("active");
    sidebar.classList.toggle("active");

    if (sidebar.classList.contains("active")) {
      overlay.classList.add("active");
    } else {
      overlay.classList.remove("active");
    }
  }
}

function checkSidebarToggle() {
  const toggle = document.getElementById("sidebar-toggle");
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("sidebar-overlay");

  if (window.innerWidth <= 768) {
    if (toggle) toggle.style.display = "flex";
    // Não manipular position inline - deixar o CSS gerenciar
    // O CSS já define position: fixed para mobile
  } else {
    if (toggle) toggle.style.display = "none";
    if (sidebar) {
      // Remover classe active e deixar CSS gerenciar position
      sidebar.classList.remove("active");
    }
    // Esconder overlay em desktop
    if (overlay) {
      overlay.classList.remove("active");
    }
  }
}
