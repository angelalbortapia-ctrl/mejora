#!/bin/bash
# Arranca el servidor correcto (estáticos + proxy Fish Audio). Mata http.server viejo en :5173.
set -euo pipefail
PROJECT="$(cd "$(dirname "$0")/.." && pwd)"
PORT="${PORT:-5173}"
VERSION_FILE="$PROJECT/js/version.js"
if [[ -f "$VERSION_FILE" ]]; then
  ASSET_V="$(grep -Eo 'ASSET_VERSION = [0-9]+' "$VERSION_FILE" | grep -Eo '[0-9]+' | head -1)"
fi
ASSET_V="${MEJORA_ASSET_V:-${ASSET_V:-180}}"
URL="http://127.0.0.1:${PORT}/?v=${ASSET_V}"
LOG="${TMPDIR:-/tmp}/mejora-server.log"
PYTHON="${PYTHON:-/usr/bin/python3}"
SERVER="$PROJECT/scripts/mejora-dev-server.py"

port_up() {
  lsof -nP -iTCP:"$PORT" -sTCP:LISTEN >/dev/null 2>&1
}

fish_proxy_ok() {
  local code
  code=$(curl -s -o /dev/null -w "%{http_code}" -X OPTIONS "http://127.0.0.1:${PORT}/api/fish/tts" 2>/dev/null || echo 000)
  [[ "$code" == "204" || "$code" == "200" ]]
}

cd "$PROJECT" || exit 1

if port_up && ! fish_proxy_ok; then
  echo "[$(date)] Puerto $PORT sin proxy Fish — reiniciando con mejora-dev-server.py" >>"$LOG"
  lsof -tiTCP:"$PORT" -sTCP:LISTEN 2>/dev/null | xargs kill 2>/dev/null || true
  sleep 0.5
fi

if ! port_up; then
  nohup "$PYTHON" "$SERVER" "$PORT" >>"$LOG" 2>&1 &
  for _ in $(seq 1 50); do
    port_up && break
    sleep 0.2
  done
fi

if ! port_up; then
  osascript -e "display alert \"Mejora\" message \"No pude arrancar el servidor en el puerto ${PORT}. Revisa ${LOG}\"" 2>/dev/null || true
  exit 1
fi

if ! fish_proxy_ok; then
  echo "[$(date)] AVISO: proxy Fish no responde en :${PORT}" >>"$LOG"
fi

open "$URL" 2>/dev/null || true
