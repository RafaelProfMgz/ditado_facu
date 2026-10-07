# Ditado

Aplicação web de transcrição de áudio (React + NestJS + PostgreSQL + Groq Whisper).
Especificação completa em [`docs/ESPECIFICACAO.md`](docs/ESPECIFICACAO.md).

## Requisitos
Node >= 22.12, npm, Docker com Compose, uma chave da Groq (`gsk_...`).

## Rodar do zero
```bash
git clone <repo> ditado && cd ditado
cp backend/.env.example backend/.env       # preencha JWT_SECRET, GROQ_API_KEY e ADMIN_PASSWORD
(cd backend && npm install)
(cd frontend && npm install)
./start.sh                                 # sobe banco, backend e frontend
# abra http://localhost:5173
./stop.sh                                  # encerra backend e frontend (--all derruba o banco)
```

Caminho Wd (PowerShell): `docker compose up -d` na raiz, depois `npm run start:dev` em
`backend/` e `npm run dev` em `frontend/`, em dois terminais.

Logs: `logs/backend.log` e `logs/frontend.log`.

## Grupo
- _preencher_

## Declaração de uso de IA
| Etapa | Ferramenta / modelo | Uso |
|---|---|---|
| Especificação e AGENTS.md | _preencher_ | _preencher_ |
| Etapas 1–8 (código) | _preencher_ | _preencher_ |
| Revisão | _preencher_ | _preencher_ |

Todo o código foi verificado pelo grupo com os comandos de aceite da especificação (seção 9).
# ditado_facu
