# 🖼️ Guia de Integração com imgBB

Este guia mostra como integrar o imgBB para upload de imagens, já que você não tem acesso ao Firebase Storage pago.

## 📋 O que é imgBB?

imgBB é um serviço gratuito de hospedagem de imagens que oferece uma API para upload. É perfeito para projetos que precisam de upload de imagens sem custos.

**Limites gratuitos:**
- 32 MB por imagem
- Sem limite de uploads (com uso razoável)
- Imagens permanecem online indefinidamente

## 🚀 Passo 1: Obter API Key do imgBB

### 1.1 Criar Conta
1. Acesse [https://imgbb.com/](https://imgbb.com/)
2. Clique em **"Sign Up"** ou **"Registrar"**
3. Crie uma conta (pode usar email ou Google)

### 1.2 Obter API Key
1. Após fazer login, acesse: [https://api.imgbb.com/](https://api.imgbb.com/)
2. Role até a seção **"API Key"**
3. Clique em **"Get API Key"** ou **"Obter Chave API"**
4. Copie a chave API que será gerada

**Exemplo de API Key:** `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`

> ⚠️ **Importante**: Mantenha sua API Key segura! Não compartilhe publicamente.

## 🔧 Passo 2: Configurar no Código

### 2.1 Adicionar API Key

Abra o arquivo `firebase-config.js` e adicione:

```javascript
// Configuração do imgBB
const IMGBB_API_KEY = 'SUA_API_KEY_AQUI';
```

### 2.2 Função de Upload

A função de upload já está incluída no `app-firebase.js`, mas aqui está como funciona:

```javascript
async function uploadImageToImgBB(file) {
    const formData = new FormData();
    formData.append('key', IMGBB_API_KEY);
    formData.append('image', file);
    
    try {
        const response = await fetch('https://api.imgbb.com/1/upload', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            return data.data.url; // URL da imagem
        } else {
            throw new Error(data.error?.message || 'Erro ao fazer upload');
        }
    } catch (error) {
        console.error('Erro no upload:', error);
        throw error;
    }
}
```

## 📝 Passo 3: Atualizar Formulários

Os formulários já foram atualizados para suportar upload de imagens. O usuário pode:

1. **Selecionar múltiplas imagens** usando o input de arquivo
2. **Ver preview** das imagens antes de enviar
3. **Remover imagens** da lista antes de enviar

## 🎯 Como Funciona

### Fluxo de Upload:

1. **Usuário seleciona imagens** no formulário
2. **Preview é exibido** imediatamente
3. **Ao enviar o formulário:**
   - Cada imagem é enviada para imgBB
   - URLs são retornadas
   - URLs são salvas no Firestore junto com os dados do ponto/evento

### Estrutura de Dados no Firestore:

```javascript
{
  name: "Lagoa Maior",
  description: "...",
  lat: -20.7836,
  lng: -51.7156,
  images: [
    "https://i.ibb.co/abc123/imagem1.jpg",
    "https://i.ibb.co/def456/imagem2.jpg"
  ],
  // ... outros campos
}
```

## ⚙️ Configuração Avançada (Opcional)

### Limitar Tamanho de Arquivo

No código, você pode adicionar validação:

```javascript
function validateImage(file) {
    const maxSize = 32 * 1024 * 1024; // 32 MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    
    if (file.size > maxSize) {
        throw new Error('Imagem muito grande (máximo 32MB)');
    }
    
    if (!allowedTypes.includes(file.type)) {
        throw new Error('Tipo de arquivo não permitido');
    }
    
    return true;
}
```

### Mostrar Progresso de Upload

Você pode adicionar uma barra de progresso:

```javascript
async function uploadWithProgress(file, onProgress) {
    // Implementação com XMLHttpRequest para mostrar progresso
    // (exemplo mais complexo, mas possível)
}
```

## 🐛 Troubleshooting

### Erro: "Invalid API key"
- Verifique se copiou a API key corretamente
- Certifique-se de que não há espaços extras
- Tente gerar uma nova API key

### Erro: "File too large"
- imgBB aceita até 32MB por imagem
- Reduza o tamanho da imagem antes de enviar
- Use compressão de imagens

### Erro: "Network request failed"
- Verifique sua conexão com internet
- Verifique se a API do imgBB está funcionando
- Tente novamente após alguns segundos

### Imagens não aparecem
- Verifique se as URLs foram salvas corretamente no Firestore
- Abra a URL da imagem diretamente no navegador
- Verifique o console do navegador para erros

## 📚 Recursos Adicionais

- [Documentação imgBB API](https://api.imgbb.com/)
- [Exemplos de uso](https://api.imgbb.com/#examples)

## 🔒 Segurança

**IMPORTANTE**: A API Key do imgBB é exposta no código JavaScript do cliente. Isso é aceitável para projetos de demonstração, mas para produção:

1. **Use um backend** para fazer o upload (ocultar a API key)
2. **Implemente rate limiting** no seu backend
3. **Valide arquivos** no servidor antes de enviar ao imgBB

Para este projeto de demonstração, está OK usar diretamente no cliente.

---

**Pronto!** Agora você pode fazer upload de imagens sem precisar do Firebase Storage. 🎉

