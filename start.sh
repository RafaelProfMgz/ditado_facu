#!/usr/bin/env bash
# Sobe o banco (Docker), o backend (NestJS :3333) e o frontend (Vite :5173).
# Saída de cada processo em logs/; PIDs em .pids/. Para encerrar: ./stop.sh
set -euo pipefail
cd "$(dirname "$0")"

BACKEND_PORT=$(grep -E '^PORT=' backend/.env 2>/dev/null | cut -d= -f2 || true)
BACKEND_PORT=${BACKEND_PORT:-3333}
FRONTEND_PORT=5173

if [[ ! -f backend/.env ]]; then
  echo "✗ backend/.env não existe. Rode: cp backend/.env.example backend/.env e preencha os valores." >&2
  exit 1
fi

for port in "$BACKEND_PORT" "$FRONTEND_PORT"; do
  if (exec 3<>"/dev/tcp/127.0.0.1/$port") 2>/dev/null; then
    echo "✗ A porta $port já está em uso. Rode ./stop.sh ou veja quem a ocupa: lsof -i :$port" >&2
    exit 1
  fi
done

for app in backend frontend; do
  if [[ ! -d $app/node_modules ]]; then
    echo "→ Instalando dependências de $app…"
    (cd "$app" && npm install --no-audit --no-fund)
  fi
done

mkdir -p logs .pids

echo "→ Subindo o PostgreSQL…"
docker compose up -d db >/dev/null
for _ in $(seq 1 30); do
  docker compose exec -T db pg_isready -U ditado >/dev/null 2>&1 && break
  sleep 1
done
docker compose exec -T db pg_isready -U ditado >/dev/null 2>&1 || { echo "✗ O banco não respondeu. Veja: docker compose logs db" >&2; exit 1; }

# setsid: cada app numa sessão própria, para o stop.sh encerrar o npm e os filhos dele juntos.
echo "→ Iniciando o backend (porta $BACKEND_PORT)…"
(cd backend; setsid npm run start:dev > ../logs/backend.log 2>&1 & echo $! > ../.pids/backend.pid)

echo "→ Iniciando o frontend (porta $FRONTEND_PORT)…"
(cd frontend; setsid npm run dev > ../logs/frontend.log 2>&1 & echo $! > ../.pids/frontend.pid)

echo -n "→ Aguardando a API"
for _ in $(seq 1 60); do
  if curl -fs "http://localhost:$FRONTEND_PORT/api/health" 2>/dev/null | grep -q '"db":"up"'; then
    echo
    echo "✓ Ditado no ar: http://localhost:$FRONTEND_PORT"
    echo "  Logs: logs/backend.log e logs/frontend.log · Encerrar: ./stop.sh"
    exit 0
  fi
  echo -n "."
  sleep 1
done
echo
echo "✗ A aplicação não respondeu em 60 s. Veja logs/backend.log e logs/frontend.log" >&2
exit 1
