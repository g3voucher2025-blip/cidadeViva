# ✅ Checklist de Integração Firebase

Use este checklist para garantir que todos os passos foram concluídos:

## 📋 Configuração Inicial

- [ ] Criado projeto no Firebase Console
- [ ] Registrado app web no Firebase
- [ ] Copiado objeto de configuração (`firebaseConfig`)
- [ ] Preenchido `firebase-config.js` com as credenciais

## 🔐 Autenticação

- [ ] Habilitado Authentication no Firebase Console
- [ ] Habilitado método Email/Password
- [ ] Criados usuários de teste (opcional):
  - [ ] admin@turismo.com
  - [ ] empresa@turismo.com
  - [ ] turista@turismo.com

## 💾 Firestore Database

- [ ] Criado banco de dados Firestore
- [ ] Escolhida localização do banco
- [ ] Configuradas regras de segurança (copiadas de `firestore-rules.txt`)
- [ ] Publicadas as regras

## 📝 Código

- [ ] Adicionados scripts do Firebase no `index.html`
- [ ] Adicionado `firebase-config.js` no HTML
- [ ] Substituído `app.js` por `app-firebase.js` (ou renomeado)
- [ ] Verificado que `auth` e `db` estão disponíveis globalmente

## 🧪 Testes

- [ ] Testado login com usuário existente
- [ ] Testado criação de nova conta
- [ ] Testado cadastro de ponto turístico (como admin)
- [ ] Testado cadastro de evento (como empresa)
- [ ] Testado avaliação (como turista)
- [ ] Verificado dados no Firestore Console
- [ ] Testado logout

## 🔄 Funcionalidades em Tempo Real (Opcional)

- [ ] Verificado se atualizações aparecem automaticamente
- [ ] Testado em múltiplas abas/janelas

## 🚀 Deploy (Opcional)

- [ ] Instalado Firebase CLI
- [ ] Feito login no Firebase CLI
- [ ] Inicializado Firebase Hosting
- [ ] Feito deploy do projeto

## ⚠️ Problemas Comuns

Se algo não funcionar, verifique:

- [ ] Console do navegador (F12) para erros
- [ ] Firebase Console > Authentication > Users (usuários criados?)
- [ ] Firebase Console > Firestore > Dados (dados salvos?)
- [ ] Firebase Console > Firestore > Regras (regras publicadas?)
- [ ] Credenciais corretas no `firebase-config.js`
- [ ] Scripts do Firebase carregando corretamente

---

**Status:** ⬜ Não iniciado | 🟡 Em progresso | ✅ Concluído

