// ========== SCRIPT PARA POPULAR O BANCO DE DADOS ==========
// Execute este script no console do navegador após fazer login como admin
// ou importe no HTML e execute após o Firebase estar carregado

async function populateDatabase() {
  console.log("🚀 Iniciando população do banco de dados...");

  try {
    // 1. Criar usuários fictícios (pode falhar se usuários já existirem)
    try {
      await createFakeUsers();
    } catch (error) {
      console.log("⚠️ Erro ao criar usuários (continuando...):", error.message);
    }

    // 2. Adicionar pontos turísticos
    await createTouristPoints();

    // 3. Adicionar estabelecimentos comerciais
    await createEstablishments();

    // 4. Criar eventos fictícios
    await createFakeEvents();

    // 5. Adicionar avaliações fictícias
    await createFakeReviews();

    console.log("✅ População do banco de dados concluída com sucesso!");
    alert("Banco de dados populado com sucesso!");
  } catch (error) {
    console.error("❌ Erro ao popular banco de dados:", error);
    alert("Erro ao popular banco de dados: " + error.message);
  }
}

// ========== CRIAR USUÁRIOS FICTÍCIOS ==========
async function createFakeUsers() {
  console.log("👥 Criando usuários fictícios...");

  const users = [
    {
      email: "empresa1@treslagoas.com",
      password: "123456",
      role: "empresa",
      name: "Restaurante Natelha Cupim",
    },
    {
      email: "empresa2@treslagoas.com",
      password: "123456",
      role: "empresa",
      name: "Hotel OT",
    },
    {
      email: "empresa3@treslagoas.com",
      password: "123456",
      role: "empresa",
      name: "Shopping Três Lagoas",
    },
    {
      email: "turista1@email.com",
      password: "123456",
      role: "turista",
      name: "Maria Silva",
    },
    {
      email: "turista2@email.com",
      password: "123456",
      role: "turista",
      name: "João Santos",
    },
    {
      email: "turista3@email.com",
      password: "123456",
      role: "turista",
      name: "Ana Costa",
    },
    {
      email: "turista4@email.com",
      password: "123456",
      role: "turista",
      name: "Pedro Oliveira",
    },
    {
      email: "turista5@email.com",
      password: "123456",
      role: "turista",
      name: "Carla Mendes",
    },
  ];

  const currentUser = firebase.auth().currentUser;
  if (!currentUser) {
    throw new Error(
      "Você precisa estar logado como admin para executar este script!"
    );
  }

  const adminEmail = currentUser.email;
  const adminPassword = prompt(
    "⚠️ ATENÇÃO: Para criar usuários, você precisará fazer login novamente como admin depois.\n\nDigite a senha do admin para continuar (ou clique Cancelar para pular criação de usuários):"
  );

  if (!adminPassword) {
    console.log(
      "⚠️ Criação de usuários cancelada. Continuando com outros dados..."
    );
    return;
  }

  console.log(
    "⚠️ NOTA: Criar usuários fará logout do admin atual. Você precisará fazer login novamente."
  );

  for (const userData of users) {
    try {
      // Verificar se usuário já existe no Firestore
      const usersSnapshot = await firebase
        .firestore()
        .collection("users")
        .where("email", "==", userData.email)
        .limit(1)
        .get();

      if (!usersSnapshot.empty) {
        console.log(`✅ Usuário ${userData.email} já existe no banco`);
        continue;
      }

      // Tentar criar usuário
      let userCredential;
      try {
        userCredential = await firebase
          .auth()
          .createUserWithEmailAndPassword(userData.email, userData.password);
      } catch (error) {
        if (error.code === "auth/email-already-in-use") {
          console.log(
            `⚠️ Usuário ${userData.email} já existe no Auth. Pulando...`
          );
          continue;
        } else {
          throw error;
        }
      }

      // Criar documento no Firestore
      if (userCredential && userCredential.user) {
        await firebase
          .firestore()
          .collection("users")
          .doc(userCredential.user.uid)
          .set(
            {
              email: userData.email,
              role: userData.role,
              name: userData.name,
              createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            },
            { merge: true }
          );

        console.log(`✅ Usuário criado: ${userData.email}`);
      }
    } catch (error) {
      console.log(`⚠️ Erro ao criar usuário ${userData.email}:`, error.message);
    }
  }

  // Fazer login novamente como admin
  console.log("🔄 Fazendo login novamente como admin...");
  try {
    await firebase.auth().signInWithEmailAndPassword(adminEmail, adminPassword);
    console.log("✅ Login como admin restaurado com sucesso!");
  } catch (error) {
    console.error(
      "❌ Erro ao fazer login novamente como admin:",
      error.message
    );
    alert(
      "⚠️ IMPORTANTE: Você foi deslogado. Por favor, faça login novamente como admin manualmente."
    );
  }
}

// ========== CRIAR PONTOS TURÍSTICOS ==========
async function createTouristPoints() {
  console.log("📍 Criando pontos turísticos...");

  const points = [
    {
      name: "Lagoa Maior",
      description:
        'É considerada o "cartão-postal" da cidade, com pista de caminhada, áreas de lazer, piquenique e arborização. Um dos principais pontos de encontro da população.',
      category: "parque",
      lat: -20.7836,
      lng: -51.7156,
      address: "Av. Filinto Müller, Centro, Três Lagoas - MS",
      cep: "79600-000",
      images: [],
    },
    {
      name: "Balneário Municipal Miguel Jorge Tabox",
      description:
        "Balneário às margens do rio Sucuriú, com quiosques, áreas de banho, espaço para lazer em família. Ideal para banhos e piqueniques.",
      category: "praia",
      lat: -20.748,
      lng: -51.692,
      address: "Margem do Rio Sucuriú, Três Lagoas - MS",
      cep: "79600-000",
      images: [],
    },
    {
      name: "Ponte Ferroviária Francisco de Sá",
      description:
        "Símbolo histórico da cidade, atração arquitetônica importante. A ponte é um marco da história ferroviária da região.",
      category: "monumento",
      lat: -20.775,
      lng: -51.728,
      address: "Sobre o Rio Paraná, Três Lagoas - MS",
      cep: "79600-000",
      images: [],
    },
    {
      name: "Igreja Sagrado Coração de Jesus",
      description:
        "Ponto histórico-religioso importante da cidade. Arquitetura tradicional com grande valor histórico e cultural.",
      category: "igreja",
      lat: -20.789,
      lng: -51.708,
      address: "Rua Paranaíba, Centro, Três Lagoas - MS",
      cep: "79600-000",
      images: [],
    },
    {
      name: "Parque das Capivaras",
      description:
        "Espaço natural e de lazer, também conhecido como Cascalheira. Local ideal para observação da fauna local e atividades ao ar livre.",
      category: "parque",
      lat: -20.755,
      lng: -51.738,
      address: "Av. Antônio Trajano, Três Lagoas - MS",
      cep: "79600-000",
      images: [],
    },
    {
      name: "Casa do Artesão",
      description:
        "Ponto turístico para artesanato local, ideal para comprar souvenires e conhecer a cultura regional. Exposição e venda de produtos artesanais.",
      category: "museu",
      lat: -20.791,
      lng: -51.713,
      address: "Rua Eloy Chaves, Centro, Três Lagoas - MS",
      cep: "79600-000",
      images: [],
    },
  ];

  for (const point of points) {
    try {
      await firebase
        .firestore()
        .collection("points")
        .add({
          ...point,
          createdBy: "admin@turismo.com",
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        });
      console.log(`✅ Ponto criado: ${point.name}`);
    } catch (error) {
      console.log(`⚠️ Erro ao criar ponto ${point.name}:`, error.message);
    }
  }
}

// ========== CRIAR ESTABELECIMENTOS ==========
async function createEstablishments() {
  console.log("🏢 Criando estabelecimentos comerciais...");

  const establishments = [
    // Restaurantes
    {
      name: "Natelha Cupim",
      description:
        "Restaurante tradicional de carnes, especializado em cupim e outras carnes nobres. Ambiente acolhedor e familiar.",
      category: "restaurante",
      lat: -20.79,
      lng: -51.71,
      address: "Av. Jamil Jorge Salomão, Centro, Três Lagoas - MS",
      cep: "79600-000",
      phone: "(67) 3521-1234",
      email: "contato@natelhacupim.com.br",
      website: "natelhacupimrestaurante.com.br",
      hasCadastur: true,
      cadasturNumber: "CAD123456",
      createdBy: "empresa1@treslagoas.com",
      images: [],
    },
    {
      name: "Restaurante das Águas",
      description:
        "Restaurante do Hotel OT, com vista para a Lagoa Maior. Culinária regional e internacional com ambiente sofisticado.",
      category: "restaurante",
      lat: -20.7836,
      lng: -51.7156,
      address: "Hotel OT, Av. Filinto Müller, Três Lagoas - MS",
      cep: "79600-000",
      phone: "(67) 3521-5678",
      email: "restaurante@hotelot.com.br",
      website: "hotelot.com.br",
      hasCadastur: true,
      cadasturNumber: "CAD234567",
      createdBy: "empresa2@treslagoas.com",
      images: [],
    },
    {
      name: "Lagoa da Prata Pesqueiro",
      description:
        "Restaurante de pescados de água doce, muito ligado à natureza local. Especialidade em peixes frescos do rio.",
      category: "restaurante",
      lat: -20.748,
      lng: -51.692,
      address: "Margem do Rio Sucuriú, Três Lagoas - MS",
      cep: "79600-000",
      phone: "(67) 3521-2345",
      email: "contato@lagoaprata.com.br",
      website: "",
      hasCadastur: false,
      cadasturNumber: "",
      createdBy: "empresa1@treslagoas.com",
      images: [],
    },
    {
      name: "Varandão Felicità Pizzaria & Restaurante",
      description:
        "Pizza e culinária italiana autêntica. Ambiente descontraído, ideal para família e amigos.",
      category: "restaurante",
      lat: -20.792,
      lng: -51.708,
      address: "Rua Paranaíba, Centro, Três Lagoas - MS",
      cep: "79600-000",
      phone: "(67) 3521-3456",
      email: "contato@felicita.com.br",
      website: "",
      hasCadastur: true,
      cadasturNumber: "CAD345678",
      createdBy: "empresa1@treslagoas.com",
      images: [],
    },
    {
      name: "Brasa Grill",
      description:
        "Self-service / por quilo, churrasco. Ambiente familiar com grande variedade de pratos quentes e saladas.",
      category: "restaurante",
      lat: -20.789,
      lng: -51.708,
      address: "Rua Paranaíba, 95, Centro, Três Lagoas - MS",
      cep: "79600-000",
      phone: "(67) 3521-4567",
      email: "contato@brasagrill.com.br",
      website: "",
      hasCadastur: false,
      cadasturNumber: "",
      createdBy: "empresa1@treslagoas.com",
      images: [],
    },
    {
      name: "Restaurante e Petiscaria Peixe Frito",
      description:
        "Cardápio com peixes de água doce e petiscos. Ambiente descontraído, ideal para happy hour.",
      category: "restaurante",
      lat: -20.775,
      lng: -51.725,
      address: "Av. Filinto Müller, Três Lagoas - MS",
      cep: "79600-000",
      phone: "(67) 3521-5678",
      email: "",
      website: "",
      hasCadastur: false,
      cadasturNumber: "",
      createdBy: "empresa1@treslagoas.com",
      images: [],
    },
    {
      name: "Cedro do Líbano",
      description:
        "Culinária libanesa / mediterrânea autêntica. Pratos tradicionais do Oriente Médio em ambiente acolhedor.",
      category: "restaurante",
      lat: -20.793,
      lng: -51.712,
      address: "Rua Eloy Chaves, Centro, Três Lagoas - MS",
      cep: "79600-000",
      phone: "(67) 3521-6789",
      email: "contato@cedrodolibano.com.br",
      website: "",
      hasCadastur: true,
      cadasturNumber: "CAD456789",
      createdBy: "empresa1@treslagoas.com",
      images: [],
    },
    {
      name: "Taj Restaurante",
      description:
        "Cozinha indiana e brasileira (vinculado ao Taj Hotel). Ambiente sofisticado com pratos exóticos e tradicionais.",
      category: "restaurante",
      lat: -20.755,
      lng: -51.738,
      address: "Av. Antônio Trajano, 1313, Três Lagoas - MS",
      cep: "79600-000",
      phone: "(67) 3521-7890",
      email: "restaurante@tajhotel.com.br",
      website: "tajhotel.com.br",
      hasCadastur: true,
      cadasturNumber: "CAD567890",
      createdBy: "empresa1@treslagoas.com",
      images: [],
    },
    {
      name: "Restaurante Caipira Grill",
      description:
        'Churrasco "caipira" com ambiente rústico e acolhedor. Tradição e sabor em cada prato.',
      category: "restaurante",
      lat: -20.76,
      lng: -51.72,
      address: "Avenida Eloy Chaves, 751, Três Lagoas - MS",
      cep: "79600-000",
      phone: "(67) 3521-8901",
      email: "",
      website: "",
      hasCadastur: false,
      cadasturNumber: "",
      createdBy: "empresa1@treslagoas.com",
      images: [],
    },
    {
      name: "Genildo's Bar",
      description:
        "Ambiente para almoço em família, churrasco. Tradição local com comida caseira e ambiente descontraído.",
      category: "restaurante",
      lat: -20.782,
      lng: -51.718,
      address: "Av. Filinto Müller, Três Lagoas - MS",
      cep: "79600-000",
      phone: "(67) 3521-9012",
      email: "",
      website: "",
      hasCadastur: false,
      cadasturNumber: "",
      createdBy: "empresa1@treslagoas.com",
      images: [],
    },
    {
      name: "Burguero",
      description:
        "Hambúrguer artesanal com ingredientes selecionados. Ambiente moderno e descontraído.",
      category: "restaurante",
      lat: -20.794,
      lng: -51.714,
      address: "Av. Aldair Rosa de Oliveira, 341, Centro, Três Lagoas - MS",
      cep: "79600-000",
      phone: "(67) 3521-0123",
      email: "contato@burguero.com.br",
      website: "",
      hasCadastur: true,
      cadasturNumber: "CAD678901",
      createdBy: "empresa1@treslagoas.com",
      images: [],
    },
    // Hotéis
    {
      name: "Hotel OT",
      description:
        "Hotel com piscina, restaurante, localizado na Lagoa Maior. Vista privilegiada e estrutura completa para hospedagem.",
      category: "hotel",
      lat: -20.7836,
      lng: -51.7156,
      address: "Av. Filinto Müller, Três Lagoas - MS",
      cep: "79600-000",
      phone: "(67) 3521-1000",
      email: "reservas@hotelot.com.br",
      website: "hotelot.com.br",
      hasCadastur: true,
      cadasturNumber: "CAD789012",
      createdBy: "empresa2@treslagoas.com",
      images: [],
    },
    {
      name: "Taj Hotel",
      description:
        "Hotel bem avaliado, com spa e estrutura completa. Conforto e sofisticação em um só lugar.",
      category: "hotel",
      lat: -20.788,
      lng: -51.712,
      address: "Av. Antônio Trajano, 1313, Três Lagoas - MS",
      cep: "79600-000",
      phone: "(67) 3521-2000",
      email: "reservas@tajhotel.com.br",
      website: "tajhotel.com.br",
      hasCadastur: true,
      cadasturNumber: "CAD890123",
      createdBy: "empresa2@treslagoas.com",
      images: [],
    },
    {
      name: "Real Palace Hotel",
      description:
        "Hotel com piscina e bom custo-benefício. Conforto e economia para sua estadia.",
      category: "hotel",
      lat: -20.7875,
      lng: -51.7125,
      address: "Centro, Três Lagoas - MS",
      cep: "79600-000",
      phone: "(67) 3521-3000",
      email: "reservas@realpalacehotel.com",
      website: "realpalacehotel.com",
      hasCadastur: true,
      cadasturNumber: "CAD901234",
      createdBy: "empresa2@treslagoas.com",
      images: [],
    },
    {
      name: "Druds Hotel",
      description:
        "Uma das opções de hospedagem em Três Lagoas. Conforto e praticidade para viajantes.",
      category: "hotel",
      lat: -20.786,
      lng: -51.714,
      address: "Centro, Três Lagoas - MS",
      cep: "79600-000",
      phone: "(67) 3521-4000",
      email: "reservas@drudshotel.com.br",
      website: "",
      hasCadastur: false,
      cadasturNumber: "",
      createdBy: "empresa2@treslagoas.com",
      images: [],
    },
    {
      name: "Hotel Veredas",
      description:
        "Localizado em Três Lagoas, oferece conforto e hospitalidade para seus hóspedes.",
      category: "hotel",
      lat: -20.7855,
      lng: -51.7145,
      address: "Centro, Três Lagoas - MS",
      cep: "79600-000",
      phone: "(67) 3521-5000",
      email: "reservas@hotelveredas.com.br",
      website: "",
      hasCadastur: false,
      cadasturNumber: "",
      createdBy: "empresa2@treslagoas.com",
      images: [],
    },
    // Lojas
    {
      name: "Shopping Três Lagoas",
      description:
        "Principal centro de compras da cidade, com várias lojas, praça de alimentação e lazer. O shopping é uma atração para toda a família.",
      category: "loja",
      lat: -20.8,
      lng: -51.7,
      address:
        "Av. Jamil Jorge Salomão, 3807, Portal das Araras, Três Lagoas - MS",
      cep: "79644-900",
      phone: "(67) 3521-6000",
      email: "contato@shoppingtreslagoas.com.br",
      website: "shoppingtreslagoas.com.br",
      hasCadastur: true,
      cadasturNumber: "CAD012345",
      createdBy: "empresa3@treslagoas.com",
      images: [],
    },
    {
      name: "O Boticário",
      description:
        "Loja de cosméticos e perfumaria. Produtos de beleza e cuidados pessoais.",
      category: "loja",
      lat: -20.789,
      lng: -51.708,
      address: "R. Paranaíba, 607, Centro, Três Lagoas - MS",
      cep: "79600-000",
      phone: "(67) 3521-7000",
      email: "",
      website: "",
      hasCadastur: true,
      cadasturNumber: "CAD123450",
      createdBy: "empresa3@treslagoas.com",
      images: [],
    },
    // Atrações
    {
      name: "Shopping Três Lagoas (Atração)",
      description:
        "Além de comércio, o shopping é uma atração para lazer com cinema, praça de alimentação e eventos.",
      category: "atracao",
      lat: -20.8,
      lng: -51.7,
      address:
        "Av. Jamil Jorge Salomão, 3807, Portal das Araras, Três Lagoas - MS",
      cep: "79644-900",
      phone: "(67) 3521-6000",
      email: "contato@shoppingtreslagoas.com.br",
      website: "shoppingtreslagoas.com.br",
      hasCadastur: true,
      cadasturNumber: "CAD012345",
      createdBy: "empresa3@treslagoas.com",
      images: [],
    },
    {
      name: "Casa do Artesão (Comércio)",
      description:
        "Ponto turístico para artesanato local, ideal para comprar souvenires. Exposição e venda de produtos artesanais regionais.",
      category: "atracao",
      lat: -20.791,
      lng: -51.713,
      address: "Rua Eloy Chaves, Centro, Três Lagoas - MS",
      cep: "79600-000",
      phone: "(67) 3521-8000",
      email: "contato@casadoartesao.com.br",
      website: "",
      hasCadastur: false,
      cadasturNumber: "",
      createdBy: "empresa3@treslagoas.com",
      images: [],
    },
  ];

  for (const establishment of establishments) {
    try {
      await firebase
        .firestore()
        .collection("establishments")
        .add({
          ...establishment,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        });
      console.log(`✅ Estabelecimento criado: ${establishment.name}`);
    } catch (error) {
      console.log(
        `⚠️ Erro ao criar estabelecimento ${establishment.name}:`,
        error.message
      );
    }
  }
}

// ========== CRIAR EVENTOS FICTÍCIOS ==========
async function createFakeEvents() {
  console.log("🎉 Criando eventos fictícios...");

  // Obter pontos turísticos para criar eventos neles
  const pointsSnapshot = await firebase
    .firestore()
    .collection("points")
    .limit(5)
    .get();
  const points = pointsSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  if (points.length === 0) {
    console.log(
      "⚠️ Nenhum ponto turístico encontrado. Criando eventos em locais fixos."
    );
  }

  const events = [
    {
      name: "Festival de Música ao Vivo",
      description:
        "Festival de música ao vivo com artistas locais e regionais. Venha curtir uma noite de muita música e diversão!",
      date: getFutureDate(7), // 7 dias no futuro
      time: "18:00",
      lat: points[0]?.lat || -20.7836,
      lng: points[0]?.lng || -51.7156,
      createdBy: "empresa1@treslagoas.com",
      images: [],
    },
    {
      name: "Feira de Artesanato",
      description:
        "Feira de artesanato local com produtos regionais, comidas típicas e apresentações culturais.",
      date: getFutureDate(14), // 14 dias no futuro
      time: "09:00",
      lat: points[1]?.lat || -20.787,
      lng: points[1]?.lng || -51.712,
      createdBy: "empresa3@treslagoas.com",
      images: [],
    },
    {
      name: "Caminhada Ecológica",
      description:
        "Caminhada ecológica pelo Parque das Capivaras. Atividade ao ar livre para toda a família.",
      date: getFutureDate(10), // 10 dias no futuro
      time: "07:00",
      lat: points[4]?.lat || -20.76,
      lng: points[4]?.lng || -51.73,
      createdBy: "empresa1@treslagoas.com",
      images: [],
    },
    {
      name: "Festival Gastronômico",
      description:
        "Festival gastronômico com pratos típicos da região. Degustação e shows musicais.",
      date: getFutureDate(21), // 21 dias no futuro
      time: "17:00",
      lat: points[0]?.lat || -20.7836,
      lng: points[0]?.lng || -51.7156,
      createdBy: "empresa2@treslagoas.com",
      images: [],
    },
    {
      name: "Noite de Dança",
      description:
        "Noite de dança com música ao vivo. Venha dançar e se divertir!",
      date: getFutureDate(5), // 5 dias no futuro
      time: "20:00",
      lat: points[0]?.lat || -20.7836,
      lng: points[0]?.lng || -51.7156,
      createdBy: "empresa1@treslagoas.com",
      images: [],
    },
    {
      name: "Exposição de Arte Local",
      description:
        "Exposição de arte local com trabalhos de artistas da região. Entrada gratuita.",
      date: getFutureDate(12), // 12 dias no futuro
      time: "14:00",
      lat: points[5]?.lat || -20.787,
      lng: points[5]?.lng || -51.712,
      createdBy: "empresa3@treslagoas.com",
      images: [],
    },
    {
      name: "Passeio de Barco",
      description:
        "Passeio de barco pelo Rio Sucuriú. Conheça a natureza local de uma forma diferente.",
      date: getFutureDate(18), // 18 dias no futuro
      time: "08:00",
      lat: points[1]?.lat || -20.75,
      lng: points[1]?.lng || -51.7,
      createdBy: "empresa2@treslagoas.com",
      images: [],
    },
    {
      name: "Workshop de Culinária",
      description:
        "Workshop de culinária regional. Aprenda a fazer pratos típicos da região.",
      date: getFutureDate(15), // 15 dias no futuro
      time: "15:00",
      lat: points[0]?.lat || -20.7836,
      lng: points[0]?.lng || -51.7156,
      createdBy: "empresa1@treslagoas.com",
      images: [],
    },
  ];

  for (const event of events) {
    try {
      await firebase
        .firestore()
        .collection("events")
        .add({
          ...event,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        });
      console.log(`✅ Evento criado: ${event.name}`);
    } catch (error) {
      console.log(`⚠️ Erro ao criar evento ${event.name}:`, error.message);
    }
  }
}

// ========== CRIAR AVALIAÇÕES FICTÍCIAS ==========
async function createFakeReviews() {
  console.log("⭐ Criando avaliações fictícias...");

  // Obter itens para avaliar
  const [pointsSnapshot, eventsSnapshot, establishmentsSnapshot] =
    await Promise.all([
      firebase.firestore().collection("points").limit(10).get(),
      firebase.firestore().collection("events").limit(5).get(),
      firebase.firestore().collection("establishments").limit(15).get(),
    ]);

  const points = pointsSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
  const events = eventsSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
  const establishments = establishmentsSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  // Obter UIDs dos turistas do Firestore
  const touristEmails = [
    "turista1@email.com",
    "turista2@email.com",
    "turista3@email.com",
    "turista4@email.com",
    "turista5@email.com",
  ];

  const touristUsers = [];
  for (const email of touristEmails) {
    const userSnapshot = await firebase
      .firestore()
      .collection("users")
      .where("email", "==", email)
      .limit(1)
      .get();
    if (!userSnapshot.empty) {
      touristUsers.push({
        email: email,
        uid: userSnapshot.docs[0].id,
        name: userSnapshot.docs[0].data().name || email.split("@")[0],
      });
    }
  }

  if (touristUsers.length === 0) {
    console.log(
      "⚠️ Nenhum turista encontrado. Criando avaliações com emails genéricos."
    );
  }

  const comments = [
    "Lugar incrível! Recomendo muito.",
    "Experiência maravilhosa, voltarei com certeza.",
    "Muito bom, mas poderia melhorar alguns detalhes.",
    "Superou minhas expectativas!",
    "Ambiente agradável e atendimento excelente.",
    "Vale muito a pena conhecer!",
    "Local bem cuidado e organizado.",
    "Adorei a experiência!",
    "Recomendo para toda a família.",
    "Um dos melhores lugares que já visitei!",
    "Atendimento impecável!",
    "Comida deliciosa e ambiente acolhedor.",
    "Estrutura completa e bem localizado.",
    "Perfeito para passar o dia!",
    "Experiência única e inesquecível!",
  ];

  // Avaliar pontos turísticos
  for (const point of points) {
    const numReviews = Math.floor(Math.random() * 5) + 2; // 2 a 6 avaliações
    for (let i = 0; i < numReviews; i++) {
      try {
        const tourist =
          touristUsers.length > 0
            ? touristUsers[Math.floor(Math.random() * touristUsers.length)]
            : {
                email:
                  touristEmails[
                    Math.floor(Math.random() * touristEmails.length)
                  ],
                name: "Turista",
              };
        const rating = Math.floor(Math.random() * 2) + 4; // 4 ou 5 estrelas
        const comment = comments[Math.floor(Math.random() * comments.length)];

        await firebase
          .firestore()
          .collection("reviews")
          .add({
            itemType: "ponto",
            itemId: point.id,
            userId: tourist.email,
            userName: tourist.name || tourist.email.split("@")[0],
            rating: rating,
            comment: comment,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          });
      } catch (error) {
        console.log(
          `⚠️ Erro ao criar avaliação para ponto ${point.name}:`,
          error.message
        );
      }
    }
  }

  // Avaliar eventos
  for (const event of events) {
    const numReviews = Math.floor(Math.random() * 4) + 1; // 1 a 4 avaliações
    for (let i = 0; i < numReviews; i++) {
      try {
        const tourist =
          touristUsers.length > 0
            ? touristUsers[Math.floor(Math.random() * touristUsers.length)]
            : {
                email:
                  touristEmails[
                    Math.floor(Math.random() * touristEmails.length)
                  ],
                name: "Turista",
              };
        const rating = Math.floor(Math.random() * 2) + 4; // 4 ou 5 estrelas
        const comment = comments[Math.floor(Math.random() * comments.length)];

        await firebase
          .firestore()
          .collection("reviews")
          .add({
            itemType: "evento",
            itemId: event.id,
            userId: tourist.email,
            userName: tourist.name || tourist.email.split("@")[0],
            rating: rating,
            comment: comment,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          });
      } catch (error) {
        console.log(
          `⚠️ Erro ao criar avaliação para evento ${event.name}:`,
          error.message
        );
      }
    }
  }

  // Avaliar estabelecimentos
  for (const establishment of establishments) {
    const numReviews = Math.floor(Math.random() * 6) + 2; // 2 a 7 avaliações
    for (let i = 0; i < numReviews; i++) {
      try {
        const tourist =
          touristUsers.length > 0
            ? touristUsers[Math.floor(Math.random() * touristUsers.length)]
            : {
                email:
                  touristEmails[
                    Math.floor(Math.random() * touristEmails.length)
                  ],
                name: "Turista",
              };
        const rating = Math.floor(Math.random() * 3) + 3; // 3, 4 ou 5 estrelas
        const comment = comments[Math.floor(Math.random() * comments.length)];

        await firebase
          .firestore()
          .collection("reviews")
          .add({
            itemType: "estabelecimento",
            itemId: establishment.id,
            userId: tourist.email,
            userName: tourist.name || tourist.email.split("@")[0],
            rating: rating,
            comment: comment,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          });
      } catch (error) {
        console.log(
          `⚠️ Erro ao criar avaliação para estabelecimento ${establishment.name}:`,
          error.message
        );
      }
    }
  }

  console.log("✅ Avaliações criadas com sucesso!");
}

// ========== FUNÇÃO AUXILIAR ==========
function getFutureDate(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split("T")[0]; // Formato YYYY-MM-DD
}

// ========== EXPORTAR FUNÇÃO ==========
// Para usar no console do navegador:
// populateDatabase();
