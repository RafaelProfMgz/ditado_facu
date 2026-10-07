# AGENTS.md — Ditado

Contexto para o agente. Leia também `docs/ESPECIFICACAO.md`: ela é a fonte da verdade
sobre o produto. Em caso de conflito, a especificação vence; se ela estiver ambígua,
**pergunte** em vez de decidir sozinho.

## Projeto
Monorepo com `backend/` (NestJS + TypeORM + PostgreSQL) e `frontend/` (React + Vite + TS).
Banco em contêiner via `docker-compose.yml` na raiz. Node >= 22.12.

## Forma de trabalhar
- Trabalhe **uma etapa por vez** (especificação, seção 9). Não adiante etapas.
- No modo Plan, liste os arquivos que vai criar/alterar e os comandos de aceite que vai rodar.
- Ao terminar, rode os comandos de aceite da etapa e mostre a saída real. Não diga
  "todos os testes passaram" sem a saída.
- Não faça commit; quem commita é a pessoa, depois de verificar.
- Mudança de contrato da API altera backend, `frontend/src/types/` e a especificação juntos.

## Comandos
```bash
docker compose up -d                       # banco
cd backend  && npm run start:dev           # API em :3001
cd frontend && npm run dev                 # interface em :5173
./start.sh / ./stop.sh                     # tudo de uma vez (após etapa 8)
cd backend  && npm run build && npm run lint
cd frontend && npm run build && npm run lint
```

## Convenções
- TypeScript estrito nos dois lados. Sem `any` sem justificativa em comentário.
- Backend é NestJS 12 em ESM (`"type": "module"`): imports relativos terminam em `.js`.
  Relações TypeORM entre entidades usam o tipo `Relation<T>` para evitar import circular.
  Lint com `oxlint`, testes com `vitest`.
- Código em inglês (nomes de arquivos, classes, variáveis); textos da interface em português.
- Backend: um módulo por domínio. **Controller** só recebe/valida/devolve; **Service** tem regra
  e acesso ao banco; **Entity** descreve a tabela; **DTO** descreve o que entra.
- Respostas são montadas explicitamente (função `toUserResponse`, etc.), nunca a entidade crua.
- Frontend: toda chamada HTTP passa por `src/services/api.ts`; dados da API via TanStack Query;
  sessão no Zustand (`src/store/authStore.ts`); formulários com react-hook-form + zod.
- Estilo com classes do Tailwind v4; ícones do lucide-react. Sem outras bibliotecas de UI.

## Nunca
- Nunca coloque segredo no código, em `.env.example`, em log ou em mensagem de erro ao cliente.
- Nunca leia, imprima ou edite `backend/.env` (peça à pessoa se precisar de um valor).
- Nunca devolva `passwordHash` em resposta. Nunca aceite `role` no cadastro.
- Nunca busque transcrição só por `id`: sempre `{ id, userId }` do token.
- Nunca importe `Repository` num controller.
- Nunca use endereço absoluto (`http://localhost:3001`) no frontend; use `/api`.
- Nunca crie `.env` no frontend nem chame a Groq a partir do frontend.
- Nunca publique a porta do banco sem `127.0.0.1:`.
- Nunca adicione dependência fora da pilha da especificação sem perguntar.
- Nunca rode `docker compose down -v` (apaga os dados) sem pedir.
