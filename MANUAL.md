# 📚 MANUAL EDUPRO — Guia Completo

---

## 🗂️ ARQUIVOS DO PROJETO

```
edupro/
├── index.html   ← página principal (não editar)
├── style.css    ← visual (não editar)
├── app.js       ← lógica (não editar)
└── config.js    ← ✏️ ÚNICO ARQUIVO QUE VOCÊ EDITA
```

---

## ⚙️ PASSO 1 — Configurar o Firebase

### 1.1 Criar projeto no Firebase
1. Acesse https://console.firebase.google.com
2. Clique em **Criar projeto**
3. Dê um nome (ex: `edupro-minha-escola`)
4. Clique em **Continuar** até finalizar

### 1.2 Ativar Autenticação
1. No menu lateral, clique em **Authentication**
2. Clique em **Começar**
3. Em **Provedores de login**, clique em **E-mail/senha**
4. Ative a primeira opção e clique **Salvar**

### 1.3 Criar banco de dados (Firestore)
1. No menu lateral, clique em **Firestore Database**
2. Clique em **Criar banco de dados**
3. Escolha **Modo de teste** (para começar)
4. Selecione a região mais próxima (ex: `us-east1`) e clique **Ativar**

### 1.4 Pegar as credenciais
1. Clique na ⚙️ **Configurações do projeto** (ícone de engrenagem)
2. Role até **Seus apps** → clique em **</>** (Web)
3. Dê um apelido e clique **Registrar app**
4. Copie o objeto `firebaseConfig` que aparece
5. Cole no `config.js` substituindo os valores

---

## ✏️ PASSO 2 — Editar o config.js

Abra o arquivo `config.js` e preencha:

```javascript
const firebaseConfig = {
  apiKey: "SUA-API-KEY-AQUI",
  authDomain: "seu-projeto.firebaseapp.com",
  projectId: "seu-projeto",
  storageBucket: "seu-projeto.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123:web:abc123"
};

const ANTHROPIC_KEY ="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";
const CODIGO_CONVITE = "EDUPRO2025";   // ← Mude para um código seu
const ESCOLA_PADRAO  = "Nome da Escola";
```

**Onde pegar a chave Anthropic?**
- Acesse https://console.anthropic.com
- Menu **API Keys** → **Create Key**
- Copie e cole no `config.js`

---

## 🚀 PASSO 3 — Publicar no GitHub Pages

### 3.1 Criar repositório
1. Acesse https://github.com e faça login
2. Clique em **New repository** (botão verde)
3. Nome: `edupro` (tudo minúsculo, sem espaços)
4. Marque **Public**
5. Clique **Create repository**

### 3.2 Fazer upload dos arquivos
1. Na página do repositório, clique em **uploading an existing file**
2. Arraste os 4 arquivos: `index.html`, `style.css`, `app.js`, `config.js`
3. Clique **Commit changes**

### 3.3 Ativar o GitHub Pages
1. Vá em **Settings** (aba superior do repositório)
2. No menu lateral, clique em **Pages**
3. Em **Source**, selecione **Deploy from a branch**
4. Em **Branch**, selecione **main** e pasta **/ (root)**
5. Clique **Save**
6. Aguarde 2-3 minutos

### 3.4 Acessar o site
Seu site estará em:
```
https://SEU-USUARIO.github.io/edupro
```

---

## 👤 PASSO 4 — Primeiro Acesso

1. Abra o site no navegador
2. Clique na aba **Cadastrar**
3. Preencha nome, e-mail, senha
4. Escolha o perfil: **Professor** ou **Direção**
5. No campo **Código de convite**, digite: `EDUPRO2025`
   *(ou o código que você definiu no config.js)*
6. Clique em **Criar conta**
7. Você já estará logado!

---

## 🏫 PASSO 5 — Configurar Turmas e Alunos

### Criar uma turma
1. No menu lateral, clique em **Turmas & Alunos**
2. Clique em **+ Nova Turma**
3. Preencha: nome (ex: "5º Ano A"), série e turno
4. Clique **Criar Turma**

### Adicionar alunos
1. Clique na turma criada para expandi-la
2. Clique em **+ Novo Aluno**
3. Informe o nome (e matrícula se quiser)
4. Clique **Adicionar Aluno**
5. Repita para cada aluno

---

## ✅ COMO FAZER A CHAMADA

1. Menu lateral → **Chamada Digital**
2. Selecione a **turma** no dropdown
3. Confirme ou altere a **data**
4. Clique nos cards dos alunos para alternar entre:
   - ⬜ Pendente → ✅ Presente → ❌ Falta → 📋 Justificado
5. Após registrar todos, clique **💾 Salvar Chamada**

> 💡 Se você abrir a chamada de uma data que já foi salva, ela carrega automaticamente!

---

## 📈 VER FREQUÊNCIA

1. Menu lateral → **Frequência**
2. Selecione a turma
3. Veja a tabela com barra de progresso e status:
   - ✅ **Regular**: 75% ou mais
   - ⚠️ **Alerta**: entre 60% e 74%
   - 🚨 **Crítico**: abaixo de 60%

---

## 📝 GERAR PLANO DE AULA COM IA

1. Menu lateral → **Planos de Aula**
2. Preencha: disciplina, turma, duração, tema
3. Adicione observações se quiser (opcional)
4. Clique **✨ Gerar com IA**
5. Aguarde alguns segundos
6. Edite o plano gerado se necessário
7. Clique **💾 Salvar**

---

## 🗒️ ANOTAÇÕES DE ALUNOS

1. Menu lateral → **Anotações**
2. Selecione turma e aluno
3. Escreva sua observação
4. Clique **✨ Sugestão IA** para receber estratégias pedagógicas
5. Clique **💾 Salvar Anotação**

---

## 🤖 CHAT COM ASSISTENTE IA

1. Menu lateral → **Assistente IA**
2. Digite sua pergunta pedagógica
3. Pressione **Enter** ou clique em ➤
4. O assistente responde em segundos

**Exemplos de perguntas:**
- "Como explicar frações para alunos do 4º ano?"
- "Estratégias para alunos com dificuldade de leitura"
- "Como fazer uma avaliação formativa eficaz?"
- "Atividades lúdicas para ensinar matemática"

---

## 📤 EXPORTAR PARA EXCEL

1. Menu lateral → **Exportar Excel**
2. Escolha o que exportar:
   - **Frequência Geral** — todos os alunos com percentuais
   - **Anotações** — todas as anotações registradas
   - **Planos de Aula** — lista de planos salvos
3. Clique **Baixar Excel**
4. O arquivo `.xlsx` é baixado automaticamente

---

## 🔒 REGRAS DO FIRESTORE (Produção)

Quando terminar os testes, atualize as regras do Firestore para maior segurança:

1. No Firebase Console → **Firestore Database** → **Regras**
2. Substitua pelo seguinte:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /usuarios/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /turmas/{doc} {
      allow read, write: if request.auth != null;
    }
    match /alunos/{doc} {
      allow read, write: if request.auth != null;
    }
    match /chamadas/{doc} {
      allow read, write: if request.auth != null;
    }
    match /planos/{doc} {
      allow read, write: if request.auth != null;
    }
    match /anotacoes/{doc} {
      allow read, write: if request.auth != null;
    }
  }
}
```

3. Clique **Publicar**

---

## ❓ PROBLEMAS COMUNS

### "Erro de rede" ou tela branca
- Verifique se todos os 4 arquivos estão no repositório
- Aguarde 3-5 minutos após ativar o GitHub Pages
- Tente forçar recarregamento: **Ctrl+Shift+R**

### "Código de convite inválido"
- Verifique o valor de `CODIGO_CONVITE` no `config.js`
- O padrão é `EDUPRO2025`

### IA não responde / erro na IA
- Verifique se a chave Anthropic está correta no `config.js`
- A chave começa com `sk-ant-api03-...`
- Verifique saldo na conta Anthropic: https://console.anthropic.com

### "Firebase: Error" no login
- Verifique se copiou o `firebaseConfig` completo
- Confirme que a Autenticação por e-mail/senha está ativada

### Chamada não carrega alunos
- Certifique-se de ter cadastrado alunos na turma (menu Turmas & Alunos)

---

## 🔄 ATUALIZAR OS ARQUIVOS

Para atualizar após editar algum arquivo:
1. Vá ao repositório no GitHub
2. Clique no arquivo que quer atualizar
3. Clique no ícone de **lápis** (editar)
4. Faça as alterações e clique **Commit changes**
5. O site atualiza em ~1 minuto

---

## 📱 USAR NO CELULAR

O EduPro é responsivo! No celular:
- Toque no ☰ (hambúrguer) para abrir o menu
- A chamada digital funciona com toque nos cards
- Todos os recursos estão disponíveis

---

## 🏗️ MIGRAR PARA HOSTINGER

Quando quiser migrar do GitHub Pages para a Hostinger:
1. Faça login no painel da Hostinger
2. Vá em **Gerenciador de Arquivos** ou use FTP
3. Acesse a pasta `public_html`
4. Faça upload dos 4 arquivos
5. Seu site estará em `seudominio.com.br`

---

*EduPro — Desenvolvido para educadores brasileiros 🇧🇷*
