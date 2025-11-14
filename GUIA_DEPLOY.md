# 🚀 Guia Completo: Deploy para GitHub e Firebase Hosting

Este guia vai te ajudar a publicar seu projeto no GitHub e fazer o deploy no Firebase Hosting.

---

## 📋 PRÉ-REQUISITOS

1. **Conta no GitHub** (se não tiver, crie em: https://github.com)
2. **Conta no Firebase** (já deve ter, mas verifique: https://console.firebase.google.com)
3. **Git instalado** no seu computador
4. **Node.js instalado** (para usar Firebase CLI)

---

## PARTE 1: CONFIGURAR GIT E GITHUB

### Passo 1.1: Verificar se Git está instalado

Abra o terminal (PowerShell ou CMD) e execute:

```bash
git --version
```

Se não estiver instalado, baixe em: https://git-scm.com/download/win

### Passo 1.2: Configurar Git (se ainda não configurou)

```bash
git config --global user.name "Seu Nome"
git config --global user.email "seu.email@exemplo.com"
```

### Passo 1.3: Criar repositório no GitHub

1. Acesse https://github.com e faça login
2. Clique no botão **"+"** no canto superior direito
3. Selecione **"New repository"**
4. Preencha:
   - **Repository name**: `turismo-connect` (ou o nome que preferir)
   - **Description**: "Aplicativo de turismo com mapa interativo"
   - **Visibility**: Escolha **Public** ou **Private**
   - **NÃO marque** "Add a README file" (já temos arquivos)
5. Clique em **"Create repository"**

### Passo 1.4: Inicializar Git no projeto

No terminal, navegue até a pasta do projeto:

```bash
cd "C:\Users\Maik Rodrigues\Documents\TC"
```

Inicialize o Git:

```bash
git init
```

### Passo 1.5: Criar arquivo .gitignore

Crie um arquivo chamado `.gitignore` na raiz do projeto com o seguinte conteúdo:

```
# Firebase
.firebase/
firebase-debug.log
firestore-debug.log
ui-debug.log

# Node
node_modules/
npm-debug.log
yarn-error.log

# Sistema Operacional
.DS_Store
Thumbs.db
desktop.ini

# IDEs
.vscode/
.idea/
*.swp
*.swo
*~

# Arquivos temporários
*.tmp
*.log
.cache/

# Arquivos de configuração sensíveis (se houver)
# firebase-config.js  # Descomente se não quiser versionar as credenciais
```

### Passo 1.6: Adicionar arquivos ao Git

```bash
git add .
```

### Passo 1.7: Fazer primeiro commit

```bash
git commit -m "Primeiro commit: Aplicativo de turismo completo"
```

### Passo 1.8: Conectar ao repositório remoto

**IMPORTANTE**: Substitua `SEU_USUARIO` pelo seu nome de usuário do GitHub e `NOME_DO_REPOSITORIO` pelo nome que você escolheu:

```bash
git remote add origin https://github.com/SEU_USUARIO/NOME_DO_REPOSITORIO.git
```

Exemplo:
```bash
git remote add origin https://github.com/maikrodrigues/turismo-connect.git
```

### Passo 1.9: Enviar para o GitHub

```bash
git branch -M main
git push -u origin main
```

Você será solicitado a fazer login no GitHub. Siga as instruções na tela.

---

## PARTE 2: CONFIGURAR FIREBASE HOSTING

### Passo 2.1: Instalar Firebase CLI

Abra o terminal e execute:

```bash
npm install -g firebase-tools
```

Se der erro de permissão, execute como administrador ou use:

```bash
npm install -g firebase-tools --force
```

### Passo 2.2: Fazer login no Firebase

```bash
firebase login
```

Isso abrirá o navegador para você fazer login. Autorize o acesso.

### Passo 2.3: Verificar se está logado

```bash
firebase projects:list
```

Deve mostrar seus projetos do Firebase.

### Passo 2.4: Inicializar Firebase Hosting

No terminal, certifique-se de estar na pasta do projeto:

```bash
cd "C:\Users\Maik Rodrigues\Documents\TC"
```

Execute:

```bash
firebase init hosting
```

**IMPORTANTE**: Siga as perguntas:

1. **"Which Firebase features do you want to set up for this directory?"**
   - Use as setas para selecionar **Hosting**
   - Pressione **Espaço** para marcar
   - Pressione **Enter** para confirmar

2. **"Please select an option:"**
   - Escolha **"Use an existing project"** (se já tiver um projeto Firebase)
   - OU **"Create a new project"** (se quiser criar um novo)

3. **"Select a default Firebase project:"**
   - Escolha o projeto que você já está usando (o mesmo do firebase-config.js)

4. **"What do you want to use as your public directory?"**
   - Digite: **`.`** (ponto) e pressione Enter
   - Isso significa que a raiz do projeto será o diretório público

5. **"Configure as a single-page app (rewrite all urls to /index.html)?"**
   - Digite: **Y** (Yes) e pressione Enter
   - Isso é importante para SPAs

6. **"Set up automatic builds and deploys with GitHub?"**
   - Digite: **N** (No) por enquanto
   - Podemos configurar depois se quiser

7. **"File public/index.html already exists. Overwrite?"**
   - Digite: **N** (No)
   - Não queremos sobrescrever nosso index.html

### Passo 2.5: Verificar arquivos criados

O Firebase deve ter criado dois arquivos:

1. **`firebase.json`** - Configuração do Firebase Hosting
2. **`.firebaserc`** - Informações do projeto

Verifique se eles foram criados corretamente.

### Passo 2.6: Ajustar firebase.json (se necessário)

Abra o arquivo `firebase.json` e verifique se está assim:

```json
{
  "hosting": {
    "public": ".",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

Se estiver diferente, ajuste para ficar igual ao acima.

### Passo 2.7: Fazer deploy

```bash
firebase deploy --only hosting
```

**IMPORTANTE**: Na primeira vez, você pode ser solicitado a autorizar o Firebase CLI. Siga as instruções.

### Passo 2.8: Acessar seu site

Após o deploy, o Firebase mostrará uma URL como:

```
✔  Deploy complete!

Hosting URL: https://SEU-PROJETO.web.app
```

Acesse essa URL no navegador para ver seu site funcionando!

---

## PARTE 3: ATUALIZAÇÕES FUTURAS

### Para atualizar no GitHub:

```bash
git add .
git commit -m "Descrição das alterações"
git push
```

### Para atualizar no Firebase Hosting:

```bash
firebase deploy --only hosting
```

---

## 🔧 TROUBLESHOOTING (Solução de Problemas)

### Erro: "firebase: command not found"
- **Solução**: Reinstale o Firebase CLI: `npm install -g firebase-tools`

### Erro: "Permission denied"
- **Solução**: Execute o terminal como Administrador

### Erro: "Project not found"
- **Solução**: Verifique se você está usando o projeto correto: `firebase use --add`

### Erro: "Deploy failed"
- **Solução**: Verifique se o arquivo `firebase.json` está correto
- Verifique se todos os arquivos necessários estão na pasta

### Site não carrega corretamente
- **Solução**: Verifique se o `firebase.json` tem o rewrite para `/index.html`
- Verifique se o `firebase-config.js` está configurado corretamente

---

## 📝 NOTAS IMPORTANTES

1. **Nunca commite credenciais sensíveis** no GitHub
2. O arquivo `firebase-config.js` contém suas credenciais do Firebase
3. Se quiser manter as credenciais privadas, adicione `firebase-config.js` ao `.gitignore`
4. Para produção, considere usar variáveis de ambiente

---

## ✅ CHECKLIST FINAL

- [ ] Git instalado e configurado
- [ ] Repositório criado no GitHub
- [ ] Código enviado para o GitHub
- [ ] Firebase CLI instalado
- [ ] Login no Firebase feito
- [ ] Firebase Hosting inicializado
- [ ] Deploy realizado com sucesso
- [ ] Site acessível pela URL do Firebase

---

**Pronto! Seu projeto está no ar! 🎉**

Se tiver alguma dúvida ou problema, me avise!

