#!/bin/bash
# Servidor en esta ventana (para ver errores si "no corre").
cd "$(dirname "$0")" || exit 1
PORT="${PORT:-5173}"
lsof -tiTCP:"$PORT" -sTCP:LISTEN 2>/dev/null | xargs kill 2>/dev/null || true
sleep 0.5
echo "Mejora en http://127.0.0.1:${PORT}/"
echo "Deja esta ventana abierta. Ctrl+C para detener."
echo ""
exec python3 scripts/mejora-dev-server.py "$PORT"
