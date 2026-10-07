# Ditado

Aplicação web de transcrição de áudio: o usuário envia um arquivo e recebe o texto,
que fica salvo num histórico pessoal. Um administrador gerencia as contas.

React + Vite (frontend) · NestJS + TypeORM (backend) · PostgreSQL (banco) · Groq Whisper (transcrição).
Especificação completa em [`docs/ESPECIFICACAO.md`](docs/ESPECIFICACAO.md); regras para o agente em [`AGENTS.md`](AGENTS.md).

## Requisitos

- Node **22.12 ou superior** e npm
- Docker com Compose (o Docker precisa estar em execução)
- Uma chave da Groq (`gsk_...`), criada em <https://console.groq.com> → API Keys

## Rodar do zero

```bash
git clone <url-do-repositorio> ditado && cd ditado

cp backend/.env.example backend/.env
# edite backend/.env e preencha:
#   JWT_SECRET     → node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
#   GROQ_API_KEY   → sua chave gsk_...
#   ADMIN_PASSWORD → senha do admin inicial (mínimo 8 caracteres)

./start.sh        # instala dependências na 1ª vez, sobe banco, backend e frontend
```

Abra <http://localhost:5173>. Entre como admin com `ADMIN_EMAIL` / `ADMIN_PASSWORD` do `.env`
(padrão `admin@ditado.dev`) ou crie uma conta comum em "Criar conta".

```bash
./stop.sh         # encerra backend e frontend
./stop.sh --all   # também para o banco (os dados ficam no volume)
```

Logs de cada processo: `logs/backend.log` e `logs/frontend.log`.

### Caminho Wd (PowerShell)

Os scripts são Bash. No PowerShell, em três etapas:

```powershell
docker compose up -d                       # na raiz
cd backend;  npm install; npm run start:dev   # terminal 1
cd frontend; npm install; npm run dev         # terminal 2
```

## Portas

| Processo | Porta | Observação |
|---|---|---|
| Vite (frontend) | 5173 | única porta que o navegador usa; `/api` é repassado ao backend |
| NestJS (backend) | 3333 | `PORT` no `.env`. Não é a 3000 porque 3000 e 3001 já eram usadas por outros projetos na máquina de desenvolvimento |
| PostgreSQL | 127.0.0.1:5433 → 5432 | só acessível da própria máquina. Não é a 5432 pelo mesmo motivo |

Para usar outras portas: `PORT` em `backend/.env` + alvo do proxy em `frontend/vite.config.ts`;
banco: mapeamento em `docker-compose.yml` + `DATABASE_PORT` no `.env`.

## Comandos úteis

```bash
cd backend  && npm run build && npm run lint
cd frontend && npm run build && npm run lint
docker compose exec db psql -U ditado        # console do banco
curl -s localhost:5173/api/health            # {"status":"ok","db":"up"}
```

## Problemas comuns

| Sintoma | Causa / solução |
|---|---|
| `Variáveis obrigatórias ausentes em backend/.env` | preencha `JWT_SECRET` e `GROQ_API_KEY` |
| `A porta 3333 já está em uso` | `./stop.sh`; se persistir, `lsof -i :3333` |
| `port is already allocated` no Docker | outro contêiner usa a 5433; veja `docker ps` |
| "Serviço de transcrição indisponível" | chave da Groq inválida ou Groq fora do ar; detalhe em `logs/backend.log` |

## Grupo

- Angel Rafael Souza Da Silva
- Nicolas Veiga
- Janaína Lima Viana

## Declaração de uso de IA

| Etapa | Ferramenta / modelo | Uso |
|---|---|---|
| Especificação (`docs/ESPECIFICACAO.md`) e `AGENTS.md` | Claude Code — Claude Opus 5.5 | Redação a partir da descrição da Aula 07; revisada pelo grupo |
| Etapas 0–8 (backend, frontend, scripts) | Claude Code — Claude Opus 5.5 | Geração do código, etapa por etapa, seguindo a especificação |
| Verificação | Claude Code — Claude Opus 5.5 + grupo | Comandos de aceite com `curl` (etapas 1–4) e teste no navegador com Chrome automatizado (etapas 5–7); repetidos pelo grupo no próprio terminal |
| Revisão | Claude Code — Claude Opus 5.5 + grupo | Checklist da seção 10 da especificação (senha nunca na resposta, `role` recusado no cadastro, filtro por dono, controller sem `Repository`, guards de admin, nenhum segredo versionado) |

Transcrição de áudio feita pelo modelo `whisper-large-v3-turbo`, na API da Groq.
