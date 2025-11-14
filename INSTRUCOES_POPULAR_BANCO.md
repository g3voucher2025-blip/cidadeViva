# 📋 Instruções para Popular o Banco de Dados

Este guia explica como usar o script `populate-database.js` para popular o banco de dados com dados fictícios.

## 🚀 Como Usar

### Opção 1: Botão no Painel Admin (Mais Fácil) ⭐

1. **Abra o projeto no navegador** e faça login como **admin**

2. **No painel admin**, clique no botão **"🗄️ Popular Banco de Dados"**

3. **Confirme a ação** quando solicitado

4. **Aguarde a conclusão** - O script irá criar automaticamente:
   - ✅ 8 usuários (3 empresas, 5 turistas)
   - ✅ 6 pontos turísticos
   - ✅ 20 estabelecimentos comerciais
   - ✅ 8 eventos fictícios
   - ✅ Avaliações fictícias para todos os itens

### Opção 2: Console do Navegador

1. **Abra o projeto no navegador** e faça login como **admin**

2. **Abra o Console do Desenvolvedor**:
   - Pressione `F12` ou `Ctrl+Shift+I` (Windows/Linux)
   - Ou `Cmd+Option+I` (Mac)
   - Vá para a aba "Console"

3. **Copie e cole o conteúdo do arquivo `populate-database.js`** no console

4. **Execute a função**:
   ```javascript
   populateDatabase();
   ```

5. **Aguarde a conclusão**

## 📊 Dados que Serão Criados

### 👥 Usuários

**Empresas:**
- `empresa1@treslagoas.com` / `123456` - Restaurante Natelha Cupim
- `empresa2@treslagoas.com` / `123456` - Hotel OT
- `empresa3@treslagoas.com` / `123456` - Shopping Três Lagoas

**Turistas:**
- `turista1@email.com` / `123456` - Maria Silva
- `turista2@email.com` / `123456` - João Santos
- `turista3@email.com` / `123456` - Ana Costa
- `turista4@email.com` / `123456` - Pedro Oliveira
- `turista5@email.com` / `123456` - Carla Mendes

### 📍 Pontos Turísticos

1. Lagoa Maior
2. Balneário Municipal Miguel Jorge Tabox
3. Ponte Ferroviária Francisco de Sá
4. Igreja Sagrado Coração de Jesus
5. Parque das Capivaras
6. Casa do Artesão

### 🏢 Estabelecimentos

**Restaurantes (11):**
- Natelha Cupim (com Cadastur)
- Restaurante das Águas (com Cadastur)
- Lagoa da Prata Pesqueiro
- Varandão Felicità (com Cadastur)
- Brasa Grill
- Restaurante e Petiscaria Peixe Frito
- Cedro do Líbano (com Cadastur)
- Taj Restaurante (com Cadastur)
- Restaurante Caipira Grill
- Genildo's Bar
- Burguero (com Cadastur)

**Hotéis (5):**
- Hotel OT (com Cadastur)
- Taj Hotel (com Cadastur)
- Real Palace Hotel (com Cadastur)
- Druds Hotel
- Hotel Veredas

**Lojas (2):**
- Shopping Três Lagoas (com Cadastur)
- O Boticário (com Cadastur)

**Atrações (2):**
- Shopping Três Lagoas (Atração)
- Casa do Artesão (Comércio)

### 🎉 Eventos Fictícios

8 eventos serão criados em pontos populares da cidade:
- Festival de Música ao Vivo
- Feira de Artesanato
- Caminhada Ecológica
- Festival Gastronômico
- Noite de Dança
- Exposição de Arte Local
- Passeio de Barco
- Workshop de Culinária

### ⭐ Avaliações

- Cada ponto turístico receberá 2-6 avaliações
- Cada evento receberá 1-4 avaliações
- Cada estabelecimento receberá 2-7 avaliações
- Todas as avaliações são de turistas fictícios
- Notas variam entre 3-5 estrelas

## ⚠️ Observações Importantes

1. **Execute apenas uma vez** - O script verifica se os usuários já existem, mas pode criar duplicatas de outros dados

2. **Faça login como admin** antes de executar

3. **Aguarde a conclusão** - O processo pode levar alguns minutos dependendo da conexão

4. **Verifique o console** - Mensagens de sucesso e erro serão exibidas

5. **Dados de teste** - Estes são dados fictícios para desenvolvimento e demonstração

## 🔄 Limpar Dados (Opcional)

Se precisar limpar os dados criados, você pode:

1. Usar o Firebase Console para deletar manualmente
2. Ou criar um script de limpeza (não incluído)

## 📝 Personalização

Você pode modificar o arquivo `populate-database.js` para:
- Adicionar mais usuários
- Adicionar mais pontos turísticos
- Adicionar mais estabelecimentos
- Criar mais eventos
- Ajustar as avaliações

Basta editar os arrays correspondentes no arquivo.

