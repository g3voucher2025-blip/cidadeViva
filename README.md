# 🗺️ Turismo Connect

Aplicativo web para gerenciamento de pontos turísticos e eventos, com sistema de avaliações e visualização em mapa interativo.

## 🎯 Funcionalidades

- **Sistema de Login com 3 Roles:**

  - 👑 **Admin**: Pode cadastrar pontos turísticos
  - 🏢 **Empresa**: Pode cadastrar eventos
  - 🧳 **Turista**: Pode visualizar e avaliar pontos e eventos

- **Mapa Interativo**: Visualização de todos os pontos e eventos em um mapa usando Leaflet
- **Avaliações**: Sistema de avaliações com notas de 1 a 5 estrelas
- **Filtros**: Turistas podem filtrar entre pontos turísticos e eventos
- **Interface Moderna**: Design responsivo e visualmente atraente

## 🚀 Como Usar

### 1. Abrir o Projeto

Simplesmente abra o arquivo `index.html` no seu navegador. Não é necessário servidor, mas para melhor experiência, recomenda-se usar um servidor local.

### 2. Opção A: Abrir Diretamente

- Clique duas vezes no arquivo `index.html`
- Ou arraste o arquivo para o navegador

### 2. Opção B: Servidor Local (Recomendado)

**Com Python:**

```bash
python -m http.server 8000
```

Depois acesse: `http://localhost:8000`

**Com Node.js (http-server):**

```bash
npx http-server -p 8000
```

**Com VS Code:**

- Instale a extensão "Live Server"
- Clique com botão direito no `index.html` e selecione "Open with Live Server"

## 👤 Contas de Demonstração

O sistema possui botões rápidos para preencher as credenciais:

- **Admin**: `admin@turismo.com` / `admin123`
- **Empresa**: `empresa@turismo.com` / `empresa123`
- **Turista**: `turista@turismo.com` / `turista123`

Ou use os botões de demonstração na tela de login para preencher automaticamente.

## 📋 Guia de Uso por Role

### 👑 Administrador

1. Faça login como Admin
2. Clique em **"+ Cadastrar Ponto Turístico"**
3. Preencha os dados:
   - Nome do ponto
   - Descrição
   - Latitude e Longitude (clique no mapa para ver coordenadas no console)
   - Categoria
4. O ponto aparecerá no mapa imediatamente

### 🏢 Empresa

1. Faça login como Empresa
2. Clique em **"+ Cadastrar Evento"**
3. Preencha os dados:
   - Nome do evento
   - Descrição
   - Data e horário
   - Latitude e Longitude
4. O evento aparecerá no mapa com marcador vermelho

### 🧳 Turista

1. Faça login como Turista
2. Visualize o mapa com todos os pontos e eventos
3. Use os filtros para mostrar/ocultar pontos ou eventos
4. Clique em um marcador no mapa para ver detalhes
5. Clique em **"Avaliar"** para deixar uma avaliação (nota 1-5 e comentário)
6. Clique em itens na lista lateral para navegar até eles no mapa

## 🗺️ Como Obter Coordenadas

1. Abra o mapa
2. Clique em qualquer lugar do mapa
3. Abra o Console do navegador (F12 → Console)
4. As coordenadas aparecerão no formato: `Coordenadas: -23.550500, -46.633300`
5. Copie e cole nos formulários

**Dica:** Você também pode usar o Google Maps:

- Clique com botão direito no local desejado
- A primeira coordenada é a latitude, a segunda é a longitude

## 💾 Armazenamento de Dados

Os dados são salvos no **localStorage** do navegador. Isso significa:

- ✅ Funciona offline
- ✅ Dados persistem entre sessões
- ⚠️ Dados são específicos do navegador (não compartilhados entre dispositivos)
- ⚠️ Dados podem ser limpos se o usuário limpar o cache

**Para produção**, você precisará integrar com um backend (Firebase, Supabase, etc.)

## 🎨 Estrutura do Projeto

```
TC/
├── index.html      # Estrutura HTML principal
├── styles.css      # Estilos e design
├── app.js          # Lógica JavaScript
└── README.md       # Este arquivo
```

## 🔧 Tecnologias Utilizadas

- **HTML5**: Estrutura
- **CSS3**: Estilização moderna com gradientes e animações
- **JavaScript (Vanilla)**: Lógica da aplicação
- **Leaflet**: Biblioteca de mapas interativos
- **OpenStreetMap**: Tiles do mapa

## 📱 Responsividade

O aplicativo é totalmente responsivo e funciona em:

- 💻 Desktop
- 📱 Tablet
- 📱 Mobile

## 🚧 Limitações Atuais (Mock)

- Autenticação é apenas visual (não há validação real de senha)
- Dados salvos apenas localmente (localStorage)
- Não há validação de permissões no backend
- Não há upload de imagens

## 🔄 Próximos Passos para Produção

1. **Backend Real:**

   - Integrar Firebase ou Supabase
   - Autenticação real com validação
   - Banco de dados em nuvem

2. **Melhorias:**

   - Upload de imagens para pontos/eventos
   - Busca e filtros avançados
   - Notificações
   - Compartilhamento social
   - Histórico de avaliações

3. **Segurança:**
   - Validação de roles no backend
   - Sanitização de inputs
   - Rate limiting

## 🐛 Solução de Problemas

**Mapa não aparece:**

- Verifique sua conexão com internet (Leaflet precisa carregar tiles)
- Abra o Console (F12) para ver erros

**Dados não salvam:**

- Verifique se o localStorage está habilitado no navegador
- Tente em modo anônimo/privado

**Formulário não envia:**

- Verifique se todos os campos obrigatórios estão preenchidos
- Abra o Console para ver erros

## 📞 Suporte

Este é um projeto de demonstração. Para dúvidas ou melhorias, consulte a documentação das tecnologias utilizadas.

---

**Desenvolvido para apresentação e demonstração de conceito** 🚀
