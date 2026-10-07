#!/usr/bin/env bash
# Encerra backend e frontend iniciados pelo start.sh. Com --all, também para o banco
# (os dados continuam no volume; nunca usamos "down -v" aqui).
cd "$(dirname "$0")"

for app in frontend backend; do
  pidfile=".pids/$app.pid"
  if [[ -f $pidfile ]]; then
    pid=$(cat "$pidfile")
    if kill -0 "$pid" 2>/dev/null; then
      kill -- "-$pid" 2>/dev/null || kill "$pid" 2>/dev/null
      for _ in $(seq 1 10); do kill -0 "$pid" 2>/dev/null || break; sleep 0.5; done
      kill -9 -- "-$pid" 2>/dev/null || true
      echo "✓ $app encerrado"
    else
      echo "· $app não estava rodando"
    fi
    rm -f "$pidfile"
  else
    echo "· $app não estava rodando"
  fi
done

if [[ ${1:-} == "--all" ]]; then
  docker compose stop db >/dev/null && echo "✓ banco parado (dados preservados)"
fi
