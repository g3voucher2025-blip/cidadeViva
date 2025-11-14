# 📸 Instruções para Adicionar Imagens aos Pontos Turísticos

Este guia explica como adicionar imagens para os pontos turísticos de Três Lagoas - MS.

## ✨ Novidade: Múltiplas Imagens com Carrossel!

Agora você pode adicionar **múltiplas imagens** para cada ponto turístico! As imagens serão exibidas em um **carrossel interativo** com:
- Setas de navegação (❮ ❯)
- Indicadores de posição (pontos)
- Transições suaves entre imagens
- Funciona tanto nos popups do mapa quanto na lista lateral

## 📁 Estrutura de Pastas

As imagens devem ser salvas na pasta `images/` na raiz do projeto:

```
TC/
├── images/
│   ├── lagoa-maior.jpg
│   ├── balneario-miguel-jorge.jpg
│   ├── igreja-santo-antonio.jpg
│   ├── ponte-ferroviaria.jpg
│   └── cascalheira.jpg
├── app.js
├── index.html
└── styles.css
```

## 🖼️ Nomes das Imagens

Os pontos turísticos já estão configurados com os seguintes nomes de arquivo:

1. **Lagoa Maior** → `images/lagoa-maior.jpg`
2. **Balneário Municipal Miguel Jorge Tabox** → `images/balneario-miguel-jorge.jpg`
3. **Igreja de Santo Antônio** → `images/igreja-santo-antonio.jpg`
4. **Ponte Ferroviária Francisco de Sá** → `images/ponte-ferroviaria.jpg`
5. **Cascalheira** → `images/cascalheira.jpg`

## 📝 Como Adicionar as Imagens

### Opção 1: Adicionar Manualmente

1. Baixe ou tire fotos dos pontos turísticos
2. Renomeie os arquivos conforme os nomes listados acima
3. Salve os arquivos na pasta `images/` do projeto
4. Formatos suportados: `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`

### Opção 2: Usar URLs de Imagens Online

Se você tiver imagens hospedadas online, pode usar URLs completas:

1. Ao cadastrar um novo ponto turístico, no campo "URL da Imagem"
2. Cole a URL completa, por exemplo: `https://exemplo.com/imagem.jpg`
3. Ou use o caminho local: `images/nome-da-imagem.jpg`

## ✏️ Cadastrar Novos Pontos com Imagens

1. Faça login como **Administrador**
2. Clique em **"+ Cadastrar Ponto Turístico"**
3. Preencha todos os campos
4. No campo **"Imagens"**, você pode adicionar:
   - **Uma imagem**: `images/nome-do-arquivo.jpg`
   - **Múltiplas imagens** (uma por linha):
     ```
     images/imagem1.jpg
     images/imagem2.jpg
     images/imagem3.jpg
     ```
   - **Ou separadas por vírgula**: `images/img1.jpg, images/img2.jpg, images/img3.jpg`
   - **URLs completas também funcionam**: `https://exemplo.com/imagem.jpg`
5. Clique em **"Cadastrar"**

### 📝 Exemplo de Múltiplas Imagens

Para adicionar várias fotos de um mesmo ponto turístico:

```
images/lagoa-maior-vista1.jpg
images/lagoa-maior-vista2.jpg
images/lagoa-maior-vista3.jpg
images/lagoa-maior-piquenique.jpg
```

As imagens aparecerão em um carrossel que você pode navegar usando as setas ou clicando nos pontos indicadores.

## 🎨 Dicas para Melhor Visualização

- **Tamanho recomendado**: 800x600 pixels ou proporção similar
- **Formato**: JPG é recomendado para fotos (menor tamanho de arquivo)
- **Qualidade**: Use imagens de boa qualidade, mas otimize o tamanho do arquivo
- **Orientação**: Prefira imagens horizontais (paisagem) para melhor visualização

## 🔍 Verificar se as Imagens Estão Funcionando

1. Abra o projeto no navegador
2. Faça login como turista
3. Clique nos marcadores no mapa
4. As imagens devem aparecer nos popups dos pontos turísticos
5. As imagens também aparecem na lista lateral
6. **Se houver múltiplas imagens**, você verá:
   - Setas de navegação (❮ ❯) nas laterais
   - Pontos indicadores na parte inferior
   - Clique nas setas ou nos pontos para navegar entre as imagens

## ⚠️ Solução de Problemas

### Imagem não aparece

- Verifique se o arquivo existe na pasta `images/`
- Confirme se o nome do arquivo está correto (case-sensitive em alguns sistemas)
- Verifique se o caminho no código está correto
- Abra o console do navegador (F12) para ver erros de carregamento

### Imagem muito grande

- Use um editor de imagens para redimensionar
- Ferramentas online: TinyPNG, Squoosh, etc.
- Mantenha o arquivo abaixo de 500KB para melhor performance

### Usar imagens de outros locais

Se você quiser usar imagens de sites como Google Images ou outros:

1. **Direito de uso**: Certifique-se de ter permissão para usar a imagem
2. **Download**: Baixe a imagem e salve na pasta `images/`
3. **Ou use URL direta**: Cole a URL completa no campo de imagem

## 📚 Exemplos de Uso

### Uma única imagem:
```
images/lagoa-maior.jpg
```

### Múltiplas imagens (uma por linha):
```
images/lagoa-maior-vista1.jpg
images/lagoa-maior-vista2.jpg
images/lagoa-maior-vista3.jpg
```

### Múltiplas imagens (separadas por vírgula):
```
images/img1.jpg, images/img2.jpg, images/img3.jpg
```

### URLs completas:
```
https://exemplo.com/foto1.jpg
https://exemplo.com/foto2.jpg
```

### Misturando caminhos locais e URLs:
```
images/foto-local.jpg
https://exemplo.com/foto-online.jpg
images/outra-foto.jpg
```

## 🎠 Como Usar o Carrossel

Quando um ponto turístico tem múltiplas imagens:

1. **Navegação por setas**: Clique nas setas ❮ (anterior) ou ❯ (próxima) para trocar de imagem
2. **Navegação por pontos**: Clique nos pontos indicadores na parte inferior para ir diretamente para uma imagem específica
3. **Transição automática**: As imagens têm uma animação suave ao trocar
4. **Funciona em todos os lugares**: O carrossel aparece tanto nos popups do mapa quanto nos cards da lista lateral

---

**Nota**: As imagens são opcionais. Se você não adicionar uma imagem, o ponto turístico ainda funcionará normalmente, apenas sem exibir foto. Se adicionar apenas uma imagem, ela será exibida normalmente sem carrossel.

