// Estado da aplicação
let currentUser = null;
let map = null;
let markers = [];
let points = [];
let events = [];
let reviews = [];

// Coordenadas padrão (Três Lagoas - MS)
const DEFAULT_CENTER = [-20.7836, -51.7156]; // Três Lagoas - MS

// Inicialização
document.addEventListener("DOMContentLoaded", function () {
  loadData();
  initLogin();
  initForms();
  checkAuth();
});

// ========== AUTENTICAÇÃO ==========

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

function checkAuth() {
  const savedUser = localStorage.getItem("currentUser");
  if (savedUser) {
    currentUser = JSON.parse(savedUser);
    showApp();
  }
}

function logout() {
  currentUser = null;
  localStorage.removeItem("currentUser");
  document.getElementById("login-container").style.display = "flex";
  document.getElementById("app-container").style.display = "none";
  document.getElementById("login-form").reset();
}

function showApp() {
  document.getElementById("login-container").style.display = "none";
  document.getElementById("app-container").style.display = "flex";

  updateUI();
  initMap();
  updateMapMarkers();
  updateItemsList();
}

function updateUI() {
  if (!currentUser) return;

  // Atualizar badge de role
  const roleBadge = document.getElementById("user-role-badge");
  roleBadge.textContent = currentUser.role;
  roleBadge.className = "user-role " + currentUser.role;

  // Atualizar email
  document.getElementById("user-email").textContent = currentUser.email;

  // Mostrar painel correto
  document.getElementById("admin-panel").style.display =
    currentUser.role === "admin" ? "block" : "none";
  document.getElementById("empresa-panel").style.display =
    currentUser.role === "empresa" ? "block" : "none";
  document.getElementById("turista-panel").style.display =
    currentUser.role === "turista" ? "block" : "none";
}

// ========== MAPA ==========
function initMap() {
  if (map) {
    map.remove();
  }

  map = L.map("map").setView(DEFAULT_CENTER, 13);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap contributors",
    maxZoom: 19,
  }).addTo(map);

  // Adicionar listener para cliques no mapa (ajudar a pegar coordenadas)
  map.on("click", function (e) {
    if (
      currentUser &&
      (currentUser.role === "admin" || currentUser.role === "empresa")
    ) {
      const lat = e.latlng.lat.toFixed(6);
      const lng = e.latlng.lng.toFixed(6);
      console.log(`Coordenadas: ${lat}, ${lng}`);
    }
  });
}

function updateMapMarkers() {
  // Limpar marcadores existentes
  markers.forEach((marker) => map.removeLayer(marker));
  markers = [];

  const showPontos =
    document.getElementById("filter-pontos")?.checked !== false;
  const showEventos =
    document.getElementById("filter-eventos")?.checked !== false;

  // Adicionar pontos turísticos
  if (showPontos) {
    points.forEach((point) => {
      const marker = L.marker([point.lat, point.lng])
        .addTo(map)
        .bindPopup(createPointPopup(point));
      markers.push(marker);
    });
  }

  // Adicionar eventos
  if (showEventos) {
    events.forEach((event) => {
      const marker = L.marker([event.lat, event.lng], {
        icon: L.icon({
          iconUrl:
            "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
          iconSize: [25, 41],
          iconAnchor: [12, 41],
        }),
      })
        .addTo(map)
        .bindPopup(createEventPopup(event));
      markers.push(marker);
    });
  }
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
    return `<img src="${images[0]}" alt="${altText}" class="carousel-image ${compactClass}" onerror="this.style.display='none'">`;
  }

  // Criar carrossel com múltiplas imagens
  const compactClass = isCompact ? "carousel-compact" : "";
  const carouselHtml = images
    .map(
      (img, index) => `
        <div class="carousel-slide ${index === 0 ? "active" : ""}">
            <img src="${img}" alt="${altText}" class="carousel-image ${
        isCompact ? "carousel-image-compact" : ""
      }" onerror="this.style.display='none'">
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

function createEventPopup(event) {
  const avgRating = getAverageRating("evento", event.id);
  const ratingStars = "⭐".repeat(Math.round(avgRating));
  const eventDate = new Date(event.date + "T" + event.time);

  return `
        <div class="popup-content">
            <h3>🎉 ${event.name}</h3>
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
                : ""
            }
        </div>
    `;
}

// ========== FORMULÁRIOS ==========
function initForms() {
  // Formulário de ponto turístico
  document
    .getElementById("point-form")
    .addEventListener("submit", function (e) {
      e.preventDefault();
      // Processar múltiplas imagens
      const imagesInput = document.getElementById("point-images").value.trim();
      let images = [];
      if (imagesInput) {
        // Separar por vírgula ou quebra de linha
        images = imagesInput
          .split(/[,\n]/)
          .map((img) => img.trim())
          .filter((img) => img.length > 0);
      }

      const point = {
        id: Date.now().toString(),
        name: document.getElementById("point-name").value,
        description: document.getElementById("point-description").value,
        lat: parseFloat(document.getElementById("point-lat").value),
        lng: parseFloat(document.getElementById("point-lng").value),
        category: document.getElementById("point-category").value,
        images: images.length > 0 ? images : [],
        // Manter compatibilidade com dados antigos
        image: images.length > 0 ? images[0] : null,
        createdBy: currentUser.email,
        createdAt: new Date().toISOString(),
      };

      points.push(point);
      saveData();
      updateMapMarkers();
      updateItemsList();
      closeModal("point-modal");
      document.getElementById("point-form").reset();
      alert("Ponto turístico cadastrado com sucesso!");
    });

  // Formulário de evento
  document
    .getElementById("event-form")
    .addEventListener("submit", function (e) {
      e.preventDefault();
      const event = {
        id: Date.now().toString(),
        name: document.getElementById("event-name").value,
        description: document.getElementById("event-description").value,
        date: document.getElementById("event-date").value,
        time: document.getElementById("event-time").value,
        lat: parseFloat(document.getElementById("event-lat").value),
        lng: parseFloat(document.getElementById("event-lng").value),
        createdBy: currentUser.email,
        createdAt: new Date().toISOString(),
      };

      events.push(event);
      saveData();
      updateMapMarkers();
      updateItemsList();
      closeModal("event-modal");
      document.getElementById("event-form").reset();
      alert("Evento cadastrado com sucesso!");
    });

  // Formulário de avaliação
  document
    .getElementById("review-form")
    .addEventListener("submit", function (e) {
      e.preventDefault();
      const review = {
        id: Date.now().toString(),
        itemId: document.getElementById("review-item-id").value,
        itemType: document.getElementById("review-item-type").value,
        rating: parseInt(document.getElementById("review-rating").value),
        comment: document.getElementById("review-comment").value,
        userEmail: currentUser.email,
        createdAt: new Date().toISOString(),
      };

      reviews.push(review);
      saveData();
      updateMapMarkers();
      updateItemsList();
      closeModal("review-modal");
      document.getElementById("review-form").reset();
      alert("Avaliação enviada com sucesso!");
    });
}

function showAddPointForm() {
  // Preencher coordenadas do centro do mapa se não houver
  const center = map.getCenter();
  document.getElementById("point-lat").value = center.lat.toFixed(6);
  document.getElementById("point-lng").value = center.lng.toFixed(6);
  document.getElementById("point-modal").style.display = "block";
}

function showAddEventForm() {
  const center = map.getCenter();
  document.getElementById("event-lat").value = center.lat.toFixed(6);
  document.getElementById("event-lng").value = center.lng.toFixed(6);
  // Data padrão: hoje
  document.getElementById("event-date").value = new Date()
    .toISOString()
    .split("T")[0];
  document.getElementById("event-modal").style.display = "block";
}

function openReviewModal(itemType, itemId) {
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

// Salvar dados:
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

// Carregar dados:
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

function addSampleData() {
  // Pontos turísticos de Três Lagoas - MS
  points.push({
    id: "1",
    name: "Lagoa Maior",
    description:
      'É considerada o "cartão-postal" da cidade, com pista de caminhada, áreas de lazer, piquenique e arborização.',
    lat: -20.7836,
    lng: -51.7156,
    category: "parque",
    images: ["images/lagoa-maior.jpg"],
    image: "images/lagoa-maior.jpg",
    createdBy: "admin@turismo.com",
    createdAt: new Date().toISOString(),
  });

  points.push({
    id: "2",
    name: "Balneário Municipal Miguel Jorge Tabox",
    description:
      "Balneário às margens do rio Sucuriú, com quiosques, áreas de banho, espaço para lazer em família.",
    lat: -20.75,
    lng: -51.7,
    category: "praia",
    images: ["images/balneario-miguel-jorge.jpg"],
    image: "images/balneario-miguel-jorge.jpg",
    createdBy: "admin@turismo.com",
    createdAt: new Date().toISOString(),
  });

  points.push({
    id: "3",
    name: "Igreja de Santo Antônio",
    description:
      "Construída em 1914 por um dos fundadores da cidade, um dos marcos históricos da cidade.",
    lat: -20.784,
    lng: -51.714,
    category: "igreja",
    images: ["images/igreja-santo-antonio.jpg"],
    image: "images/igreja-santo-antonio.jpg",
    createdBy: "admin@turismo.com",
    createdAt: new Date().toISOString(),
  });

  points.push({
    id: "4",
    name: "Ponte Ferroviária Francisco de Sá",
    description:
      "Uma ponte ferroviária histórica, inaugurada em 1925, sobre o rio Paraná, entre Jupiá (MS) e Junqueira (SP).",
    lat: -20.8,
    lng: -51.65,
    category: "monumento",
    images: ["images/ponte-ferroviaria.jpg"],
    image: "images/ponte-ferroviaria.jpg",
    createdBy: "admin@turismo.com",
    createdAt: new Date().toISOString(),
  });

  points.push({
    id: "5",
    name: "Cascalheira",
    description:
      'Área que antes serviu à extração de cascalho, tornou-se lagoas e local de lazer ("Parque das Capivaras") em Três Lagoas.',
    lat: -20.77,
    lng: -51.72,
    category: "parque",
    images: ["images/cascalheira.jpg"],
    image: "images/cascalheira.jpg",
    createdBy: "admin@turismo.com",
    createdAt: new Date().toISOString(),
  });

  // Eventos de exemplo
  events.push({
    id: "1",
    name: "Festival de Música",
    description: "Festival de música ao vivo com artistas locais",
    date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    time: "18:00",
    lat: -20.7836,
    lng: -51.7156,
    createdBy: "empresa@turismo.com",
    createdAt: new Date().toISOString(),
  });

  saveData();
}

function getAverageRating(itemType, itemId) {
  const itemReviews = reviews.filter(
    (r) => r.itemType === itemType && r.itemId === itemId
  );

  if (itemReviews.length === 0) return 0;

  const sum = itemReviews.reduce((acc, r) => acc + r.rating, 0);
  return sum / itemReviews.length;
}

// ========== LISTA DE ITENS ==========
function updateItemsList() {
  const container = document.getElementById("items-container");
  container.innerHTML = "";

  // Adicionar pontos
  points.forEach((point) => {
    const avgRating = getAverageRating("ponto", point.id);
    const card = document.createElement("div");
    card.className = "item-card";
    card.onclick = () => {
      map.setView([point.lat, point.lng], 15);
      map.eachLayer((layer) => {
        if (layer instanceof L.Marker) {
          if (
            layer.getLatLng().lat === point.lat &&
            layer.getLatLng().lng === point.lng
          ) {
            layer.openPopup();
          }
        }
      });
    };

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
        `;
    container.appendChild(card);
  });

  // Adicionar eventos
  events.forEach((event) => {
    const avgRating = getAverageRating("evento", event.id);
    const eventDate = new Date(event.date + "T" + event.time);
    const card = document.createElement("div");
    card.className = "item-card event";
    card.onclick = () => {
      map.setView([event.lat, event.lng], 15);
      map.eachLayer((layer) => {
        if (layer instanceof L.Marker) {
          if (
            layer.getLatLng().lat === event.lat &&
            layer.getLatLng().lng === event.lng
          ) {
            layer.openPopup();
          }
        }
      });
    };

    card.innerHTML = `
            <h4>🎉 ${event.name}</h4>
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
        `;
    container.appendChild(card);
  });
}
