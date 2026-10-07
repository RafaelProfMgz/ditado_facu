# Ditado — Especificação

> Documento-fonte do projeto. O código é gerado a partir dele, por etapas (seção 9).
> Mudou o produto? Mude este arquivo primeiro, no mesmo commit.

## 1. Visão

O Ditado é uma aplicação web de transcrição de áudio. O visitante conhece o produto
numa landing page, cria uma conta e, na área interna, envia um arquivo de áudio e
recebe o texto transcrito. As transcrições ficam salvas num histórico pessoal.
Um usuário administrador gerencia as contas.

### 1.1 Papéis

| Papel | Pode |
|---|---|
| Visitante | Ver a landing page, criar conta, entrar |
| Usuário (`user`) | Enviar áudio, ver, copiar e excluir **as próprias** transcrições, ver o próprio perfil |
| Administrador (`admin`) | Tudo do usuário + listar contas, ativar/desativar, promover/rebaixar e excluir contas |

### 1.2 Fora de escopo (nesta aula)

Gravação de áudio pelo navegador, recuperação de senha, e-mail de confirmação,
edição do texto transcrito, armazenamento do arquivo de áudio, deploy (Aula 08),
migrações (usa-se `synchronize: true`).

## 2. Arquitetura

Três camadas e um serviço externo, todas no ambiente de desenvolvimento:

| Camada | Programa | Porta |
|---|---|---|
| Frontend | React + Vite (executado no navegador) | 5173 |
| Backend | NestJS | 3001 (3000 é usada por outro projeto nesta máquina) |
| Banco | PostgreSQL 17 em contêiner | 127.0.0.1:5433 (5432 já é usada por outro projeto nesta máquina) |
| Externo | Groq (Whisper) | HTTPS |

Regras de arquitetura:

- O frontend chama **apenas** o caminho relativo `/api`. O proxy do Vite repassa para
  `http://localhost:3001`. É proibido endereço absoluto (`http://localhost:3001`) no frontend.
- O frontend não tem segredo nem arquivo `.env`. Toda credencial fica em `backend/.env`.
- Só o backend chama a Groq.
- O banco é publicado apenas em `127.0.0.1` (nunca `0.0.0.0`).

## 3. Pilha

**Frontend:** React, Vite, TypeScript, react-router-dom, axios, TanStack Query,
Zustand (com `persist` em `localStorage`), react-hook-form + zod,
Tailwind CSS v4 (`@tailwindcss/vite`), lucide-react.

**Backend:** NestJS, @nestjs/config, TypeORM + @nestjs/typeorm + pg,
@nestjs/jwt + @nestjs/passport + passport-jwt, bcryptjs,
class-validator + class-transformer, multer (via @nestjs/platform-express).
Chamada à Groq com `fetch` nativo do Node (sem SDK).

**Banco:** PostgreSQL 17 (`postgres:17-alpine`) via `docker-compose.yml`.

Requisito: Node ≥ 22.12.

## 4. Modelo de dados

### 4.1 `users`

| Coluna | Tipo | Regras |
|---|---|---|
| `id` | uuid | PK, gerado |
| `name` | varchar(100) | obrigatório |
| `email` | varchar(255) | obrigatório, **único**, gravado em minúsculas |
| `passwordHash` | varchar | hash bcrypt (custo 10); **nunca sai em resposta** (`select: false`) |
| `role` | enum `user` \| `admin` | padrão `user` |
| `active` | boolean | padrão `true`; conta inativa não faz login |
| `createdAt` | timestamptz | gerado |
| `updatedAt` | timestamptz | gerado |

### 4.2 `transcriptions`

| Coluna | Tipo | Regras |
|---|---|---|
| `id` | uuid | PK, gerado |
| `userId` | uuid | FK → `users.id`, `ON DELETE CASCADE`, indexado |
| `originalFilename` | varchar(255) | nome do arquivo enviado |
| `mimeType` | varchar(100) | |
| `sizeBytes` | integer | |
| `durationSeconds` | float, nulo | vem da resposta da Groq (`verbose_json`) |
| `language` | varchar(10) | padrão `pt` |
| `model` | varchar(100) | valor de `GROQ_MODEL` usado |
| `text` | text | texto transcrito |
| `createdAt` | timestamptz | gerado |

Relação: um usuário tem N transcrições. O arquivo de áudio **não** é gravado (nem em disco
nem no banco): fica em memória durante a requisição e é descartado.

## 5. Contrato da API

Prefixo global `/api`. Corpo JSON em todas as rotas, exceto o envio de áudio
(`multipart/form-data`). Rotas marcadas 🔒 exigem `Authorization: Bearer <token>`;
🛡️ exigem `role = admin`.

### 5.1 Tipos de resposta

```ts
// UserResponse — NUNCA contém passwordHash
{ id: string; name: string; email: string; role: 'user' | 'admin'; active: boolean; createdAt: string }

// AuthResponse
{ user: UserResponse; accessToken: string }

// Transcription
{ id: string; originalFilename: string; mimeType: string; sizeBytes: number;
  durationSeconds: number | null; language: string; model: string; text: string; createdAt: string }

// TranscriptionSummary (listagem) — Transcription sem `text`, com `preview` (primeiros 120 caracteres)

// Paginated<T>
{ items: T[]; total: number; page: number; limit: number }

// Erro (formato padrão do NestJS)
{ statusCode: number; message: string | string[]; error: string }
```

### 5.2 Rotas

| Método | Rota | Auth | Corpo / parâmetros | Sucesso | Erros |
|---|---|---|---|---|---|
| GET | `/api/health` | — | — | 200 `{ status: "ok", db: "up" }` | 503 se o banco cair |
| POST | `/api/auth/register` | — | `{ name, email, password }` | 201 `AuthResponse` | 400, 409 |
| POST | `/api/auth/login` | — | `{ email, password }` | 200 `AuthResponse` | 400, 401 |
| GET | `/api/auth/me` | 🔒 | — | 200 `UserResponse` | 401 |
| POST | `/api/transcriptions` | 🔒 | multipart: `file` (obrigatório), `language` (opcional, padrão `pt`) | 201 `Transcription` | 400, 401, 413, 502 |
| GET | `/api/transcriptions` | 🔒 | `?page=1&limit=10` (limit máx. 50) | 200 `Paginated<TranscriptionSummary>` (mais recentes primeiro) | 401 |
| GET | `/api/transcriptions/:id` | 🔒 | `:id` uuid | 200 `Transcription` | 400, 401, 404 |
| DELETE | `/api/transcriptions/:id` | 🔒 | `:id` uuid | 204 | 400, 401, 404 |
| GET | `/api/users` | 🔒🛡️ | `?page&limit&search` | 200 `Paginated<UserResponse & { transcriptionCount: number }>` | 401, 403 |
| PATCH | `/api/users/:id` | 🔒🛡️ | `{ role?, active?, name? }` | 200 `UserResponse` | 400, 401, 403, 404 |
| DELETE | `/api/users/:id` | 🔒🛡️ | — | 204 | 400, 401, 403, 404 |

### 5.3 Regras de validação

- `name`: string, 2–100 caracteres, aparada.
- `email`: e-mail válido; normalizado para minúsculas.
- `password`: string, 8–72 caracteres.
- `ValidationPipe` global com `whitelist: true`, `forbidNonWhitelisted: true`, `transform: true`.
  Consequência: `{ ..., "role": "admin" }` no cadastro é **recusado com 400**.
- `:id` validado com `ParseUUIDPipe` → 400 se não for uuid.
- Áudio: campo `file`; tipos aceitos `mp3, m4a, wav, ogg, webm, flac, mp4, mpeg`
  (verificar extensão **e** mimetype `audio/*` ou `video/mp4`/`video/webm`), senão 400.
  Tamanho máx. `MAX_UPLOAD_MB` (padrão 25) → 413 acima disso.
- Falha ou timeout (60 s) na Groq → 502 com mensagem genérica; o detalhe vai só para o log.
  Nada é gravado quando a Groq falha.

### 5.4 Regras de autorização

- Cadastro sempre cria `role = user`.
- JWT contém `sub` (id) e `role`; expira em `JWT_EXPIRES_IN`.
- A estratégia JWT recarrega o usuário pelo `sub` e recusa (401) se ele não existir mais
  ou estiver inativo.
- **Dono:** toda consulta de transcrição filtra por `userId` do token
  (`where: { id, userId }`). Transcrição de outro usuário responde **404**
  (não 403 — não revelar que existe). Nem o admin lê transcrições alheias.
- Login com senha errada ou e-mail inexistente: mesma resposta 401
  `"Credenciais inválidas"` (não revelar quais e-mails existem). Conta inativa: 401.
- O admin **não** pode rebaixar, desativar nem excluir a si mesmo → 400.
- Admin inicial: na inicialização, se `ADMIN_EMAIL` e `ADMIN_PASSWORD` estiverem definidos
  e não houver usuário com esse e-mail, o backend o cria com `role = admin`.
  Se já existir, não altera nada.

## 6. Telas e rotas do frontend

| Rota | Acesso | Conteúdo |
|---|---|---|
| `/` | público | Landing page: nome, proposta de valor, como funciona (3 passos), botões "Criar conta" e "Entrar" |
| `/entrar` | público | Formulário de login (e-mail, senha). Logado → redireciona para `/app` |
| `/cadastrar` | público | Formulário de cadastro (nome, e-mail, senha, confirmar senha) |
| `/app` | logado | Envio de áudio: seleção de arquivo (e arrastar-e-soltar), idioma, botão "Transcrever", estado de carregando, resultado com botão copiar |
| `/app/historico` | logado | Lista paginada (data, arquivo, duração, prévia); clique abre o detalhe |
| `/app/historico/:id` | logado | Texto completo, metadados, botões copiar e excluir (com confirmação) |
| `/app/admin` | admin | Tabela de usuários com busca, total de transcrições, ativar/desativar, promover/rebaixar, excluir (com confirmação) |
| `*` | — | Página 404 |

Comportamento comum:

- Layout da área interna com cabeçalho: nome do usuário, links (Transcrever, Histórico,
  Admin só para admin) e botão Sair.
- `<ProtectedRoute>` impede `/app/*` sem sessão; `<AdminRoute>` impede `/app/admin`
  a não-admin (redireciona para `/app`).
- Validação dos formulários no cliente com zod espelhando a seção 5.3; erros do
  backend (`message`) exibidos ao usuário.
- Mensagens específicas: 409 → "E-mail já cadastrado"; 413 → "Arquivo maior que 25 MB";
  502 → "Serviço de transcrição indisponível, tente novamente".
- Após enviar ou excluir transcrição, invalidar a query do histórico.
- Interface em português, responsiva (funciona a 375 px de largura).

### 6.1 Organização do frontend

- `services/api.ts`: instância única do axios, `baseURL: '/api'`. Interceptador de
  requisição acrescenta o token do `authStore`; interceptador de resposta, ao receber 401,
  limpa a sessão e leva a `/entrar`.
- `store/authStore.ts`: Zustand com `persist` — guarda `user` e `accessToken`. Não fala com a API.
- TanStack Query para tudo que vem da API (transcrições, usuários).
- `types/`: tipos da seção 5.1, idênticos ao contrato.

## 7. Configuração

`backend/.env` (não versionado) — nomes em `backend/.env.example`:

| Variável | Exemplo | Uso |
|---|---|---|
| `PORT` | `3001` | porta do NestJS |
| `DATABASE_HOST` | `localhost` | |
| `DATABASE_PORT` | `5433` | |
| `DATABASE_USER` | `ditado` | |
| `DATABASE_PASSWORD` | `ditado` | |
| `DATABASE_NAME` | `ditado` | |
| `JWT_SECRET` | *(64+ caracteres aleatórios)* | assinatura do token |
| `JWT_EXPIRES_IN` | `1d` | validade do token |
| `GROQ_API_KEY` | `gsk_...` | chave pessoal |
| `GROQ_MODEL` | `whisper-large-v3-turbo` | |
| `MAX_UPLOAD_MB` | `25` | |
| `ADMIN_NAME` | `Administrador` | admin inicial |
| `ADMIN_EMAIL` | `admin@ditado.dev` | admin inicial |
| `ADMIN_PASSWORD` | *(definir localmente)* | admin inicial |

O backend **falha ao iniciar** com mensagem clara se `JWT_SECRET` ou `GROQ_API_KEY`
estiverem vazios (validação no `ConfigModule`).

## 8. Estrutura de pastas

```
ditado/
├── AGENTS.md
├── README.md
├── docker-compose.yml
├── start.sh · stop.sh
├── .gitignore
├── docs/ESPECIFICACAO.md
├── backend/
│   ├── .env.example
│   └── src/
│       ├── main.ts               ← prefixo /api, ValidationPipe global
│       ├── app.module.ts         ← ConfigModule, TypeOrmModule
│       ├── common/               ← enums (Role), decorators (CurrentUser, Roles), guards (RolesGuard)
│       ├── health/
│       ├── auth/                 ← dto/, guards/ (JwtAuthGuard), strategies/ (JwtStrategy)
│       ├── users/                ← dto/, entities/, controller, service, module, admin-seed
│       └── transcriptions/       ← dto/, entities/, controller, service, module, groq.service.ts
└── frontend/
    ├── vite.config.ts            ← proxy /api → http://localhost:3001
    └── src/
        ├── main.tsx · App.tsx
        ├── pages/
        ├── components/ui/ · components/layout/
        ├── services/api.ts
        ├── store/authStore.ts
        └── types/
```

`start.sh` sobe o banco (`docker compose up -d`), espera ele aceitar conexões, inicia
backend e frontend em segundo plano gravando `logs/backend.log` e `logs/frontend.log` e
PIDs em `.pids/`. `stop.sh` encerra os dois processos pelos PIDs (sem derrubar o banco,
a não ser com `stop.sh --all`).

## 9. Plano de etapas

Cada etapa: pedido (modo Plan) → plano revisado → execução (modo Build) →
**verificação no nosso terminal** → commit `etapa N: <nome>`.
Uma etapa só começa com a anterior verificada.

### Etapa 0 — Fundação do repositório
Cria `.gitignore`, `docker-compose.yml`, `backend/.env.example`, `README.md` (esqueleto).

Aceite:
```bash
docker compose up -d && docker compose ps            # PORTS: 127.0.0.1:5433->5432/tcp
docker compose exec db psql -U ditado -c "select version();"   # PostgreSQL 17...
git status --ignored | grep -E "\.env$"              # backend/.env aparece como ignorado
```

### Etapa 1 — Backend: esqueleto, configuração e saúde
Projeto NestJS em `backend/`, `ConfigModule` com validação, TypeORM conectado, prefixo `/api`,
`ValidationPipe` global, módulo `health`.

Aceite:
```bash
cd backend && npm run build                                  # sem erros
curl -s localhost:3001/api/health                            # {"status":"ok","db":"up"}
JWT_SECRET= npm run start                                    # falha com mensagem clara
```

### Etapa 2 — Backend: usuários e autenticação
Entidade `User`, cadastro, login, `/auth/me`, `JwtStrategy`, `JwtAuthGuard`, `@CurrentUser()`,
`@Roles()` + `RolesGuard`, seed do admin.

Aceite:
```bash
curl -s -XPOST localhost:3001/api/auth/register -H 'Content-Type: application/json' \
  -d '{"name":"Ana","email":"ana@teste.dev","password":"segredo123"}'   # 201, sem passwordHash
# repetir o mesmo                                                       → 409
curl -s -o /dev/null -w '%{http_code}\n' -XPOST localhost:3001/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"name":"Eva","email":"eva@teste.dev","password":"segredo123","role":"admin"}'  # 400
# login com senha errada → 401; login correto → 200 com accessToken
curl -s localhost:3001/api/auth/me -H "Authorization: Bearer $TOKEN"     # 200, sem passwordHash
curl -s -o /dev/null -w '%{http_code}\n' localhost:3001/api/auth/me     # 401
docker compose exec db psql -U ditado -c 'select email, role, left("passwordHash",4) from users;'
# hashes começam com $2a$/$2b$; admin@ditado.dev existe com role admin
```

### Etapa 3 — Backend: transcrições
Entidade `Transcription`, `GroqService`, CRUD do dono, limites de upload.

Aceite:
```bash
curl -s -XPOST localhost:3001/api/transcriptions -H "Authorization: Bearer $TOKEN" \
  -F file=@teste.m4a -F language=pt                         # 201 com texto coerente
curl -s localhost:3001/api/transcriptions -H "Authorization: Bearer $TOKEN"   # lista paginada
curl -s -o /dev/null -w '%{http_code}\n' -XPOST localhost:3001/api/transcriptions \
  -H "Authorization: Bearer $TOKEN" -F file=@README.md        # 400
head -c 26M /dev/urandom > /tmp/grande.mp3; curl ... -F file=@/tmp/grande.mp3   # 413
# GROQ_API_KEY inválida no .env → 502 e nenhuma linha nova em transcriptions
```
**Teste de controle de acesso por dono** (obrigatório):
```bash
# Ana cria transcrição $ID. Bia se cadastra e obtém $TOKEN_BIA.
curl -s -o /dev/null -w '%{http_code}\n' localhost:3001/api/transcriptions/$ID \
  -H "Authorization: Bearer $TOKEN_BIA"                       # 404
curl -s -o /dev/null -w '%{http_code}\n' -XDELETE localhost:3001/api/transcriptions/$ID \
  -H "Authorization: Bearer $TOKEN_BIA"                       # 404, e a de Ana continua existindo
```

### Etapa 4 — Backend: administração
Rotas `/api/users` (admin).

Aceite: com token de usuário comum `GET /api/users` → 403; com token admin → 200 sem
`passwordHash`; admin desativa Bia → login de Bia dá 401 e o token antigo dela dá 401;
admin tenta se rebaixar → 400; exclusão de usuário remove as transcrições dele.

### Etapa 5 — Frontend: esqueleto, sessão e autenticação
Vite + React + TS + Tailwind v4, proxy, `api.ts`, `authStore`, rotas, landing, entrar, cadastrar,
layout interno, rotas protegidas.

Aceite: `npm run build` sem erros; `grep -rn "localhost:3001" frontend/src` não retorna nada;
cadastro e login pelo navegador levam a `/app`; recarregar mantém o login; `/app` sem sessão
vai para `/entrar`; na aba Rede, requisições vão para `localhost:5173/api/...` com `Authorization`.

### Etapa 6 — Frontend: transcrição e histórico
Telas `/app`, `/app/historico`, `/app/historico/:id`.

Aceite: enviar `teste.m4a` mostra o texto; aparece no histórico sem recarregar; excluir remove da
lista; arquivo `.txt` mostra mensagem de erro; token apagado/adulterado no `localStorage` →
próxima ação leva a `/entrar`.

### Etapa 7 — Frontend: administração
Tela `/app/admin`.

Aceite: link Admin só aparece para admin; usuário comum digitando `/app/admin` volta para `/app`;
ativar/desativar e promover refletem na tabela sem recarregar.

### Etapa 8 — Scripts e documentação
`start.sh`, `stop.sh`, README final.

Aceite: em clone limpo, seguindo apenas o README (`cp backend/.env.example backend/.env`,
preencher, `./start.sh`), a aplicação abre em `http://localhost:5173`; `./stop.sh` encerra
os processos (`lsof -i :3001` e `lsof -i :5173` vazios).

## 10. Checklist de revisão (a cada etapa de backend)

- [ ] Nenhuma resposta contém `passwordHash` (procurar `return user` / `return this.repo...` com entidade `User`).
- [ ] DTO de cadastro não tem `role`; `whitelist` + `forbidNonWhitelisted` ativos.
- [ ] Toda consulta de transcrição filtra por `userId` do token.
- [ ] Nenhum controller importa `Repository` do TypeORM.
- [ ] Rotas de admin têm `JwtAuthGuard` **e** `RolesGuard` + `@Roles('admin')`.
- [ ] Nenhum segredo no código ou em `.env.example`; `.env` ignorado.
- [ ] Mensagem de erro da Groq não vaza a chave nem o corpo bruto para o cliente.

## 11. Critérios de pronto (produto)

Todas as etapas verificadas e commitadas; o checklist da seção 10 sem pendências;
`unzip -l entrega.zip | grep -E "\.env$|node_modules"` vazio.
