# 🎤 Guia Rápido de Apresentação

## ⏱️ Roteiro de 5-10 minutos

### 1. Introdução (1 min)

- "Este é o Turismo Connect, uma plataforma que conecta administradores, empresas e turistas"
- "Tudo foi feito com HTML, CSS e JavaScript puro, sem frameworks complexos"

### 2. Demonstração do Login (1 min)

- Mostre a tela de login elegante
- Use os botões de demo para mostrar as 3 roles
- Explique: "Cada tipo de usuário tem permissões diferentes"

### 3. Painel Admin (2 min)

- Faça login como Admin
- Mostre o botão "Cadastrar Ponto Turístico"
- **Cadastre um novo ponto:**
  - Nome: "Catedral da Sé"
  - Descrição: "Igreja histórica no centro"
  - Use coordenadas do mapa (clique no mapa para ver no console)
  - Mostre o ponto aparecendo no mapa

### 4. Painel Empresa (2 min)

- Faça logout e login como Empresa
- Mostre o botão "Cadastrar Evento"
- **Cadastre um evento:**
  - Nome: "Festival de Inverno"
  - Data: próxima semana
  - Mostre o evento aparecendo no mapa (marcador vermelho)

### 5. Painel Turista (3 min)

- Faça logout e login como Turista
- Mostre o mapa com todos os marcadores
- **Demonstre os filtros:**
  - Desmarque "Pontos Turísticos" → só eventos aparecem
  - Desmarque "Eventos" → só pontos aparecem
- **Clique em um marcador:**
  - Mostre o popup com informações
  - Clique em "Avaliar"
  - Deixe uma avaliação (nota 5 e comentário positivo)
  - Mostre a avaliação aparecendo no popup
- **Use a lista lateral:**
  - Clique em um item → mapa navega até ele

### 6. Destaques Técnicos (1 min)

- "Tudo funciona offline com localStorage"
- "Interface responsiva - funciona em mobile"
- "Mapa interativo com Leaflet"
- "Pronto para integrar com backend real (Firebase/Supabase)"

## 🎯 Pontos de Venda para Enfatizar

✅ **Simplicidade**: Apenas HTML, CSS e JS - fácil de manter
✅ **Funcional**: Todas as features principais implementadas
✅ **Visual**: Interface moderna e profissional
✅ **Escalável**: Arquitetura pronta para backend real
✅ **Rápido**: Desenvolvido em poucas horas, mas funcional

## 💡 Dicas de Apresentação

1. **Tenha dados de exemplo prontos:**

   - O sistema já vem com 2 pontos e 1 evento de exemplo
   - Você pode adicionar mais antes da apresentação

2. **Prepare coordenadas:**

   - Se for apresentar em uma cidade específica, tenha coordenadas prontas
   - Exemplo São Paulo: -23.5505, -46.6333

3. **Teste antes:**

   - Abra o projeto e teste todos os fluxos
   - Certifique-se que o mapa carrega (precisa de internet)

4. **Mostre o código (opcional):**
   - Se a audiência for técnica, mostre que é código limpo
   - Destaque a organização (HTML, CSS, JS separados)

## 🚀 Fluxo Completo de Demonstração

```
Login Admin → Cadastrar Ponto → Ver no Mapa
    ↓
Logout → Login Empresa → Cadastrar Evento → Ver no Mapa
    ↓
Logout → Login Turista → Ver Tudo → Filtrar → Avaliar → Ver Avaliação
```

## 📊 Métricas para Mencionar

- ⚡ **Tempo de desenvolvimento**: 6 horas
- 📁 **Arquivos**: 3 arquivos principais (HTML, CSS, JS)
- 🎨 **Linhas de código**: ~600 linhas
- 🗺️ **Bibliotecas externas**: Apenas Leaflet (mapa)
- 💾 **Armazenamento**: localStorage (pode migrar para cloud)

## 🎬 Fechamento

"Este é um MVP funcional que demonstra o conceito completo. Para produção, precisaríamos integrar com um backend real, mas a interface e a experiência do usuário estão 100% prontas."

---

**Boa apresentação! 🎉**
