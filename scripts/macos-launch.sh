#!/bin/bash
set -euo pipefail
PROJECT="/Users/angelalbor/Downloads/Mejora"
PORT="${PORT:-5173}"
URL="http://127.0.0.1:${PORT}/"
LOG="${TMPDIR:-/tmp}/mejora-server.log"
PYTHON="/usr/bin/python3"

cd "$PROJECT" || {
  osascript -e 'display notification "No encontré la carpeta del proyecto." with title "Mejora"'
  exit 1
}

port_up() {
  lsof -nP -iTCP:"$PORT" -sTCP:LISTEN >/dev/null 2>&1
}

if ! port_up; then
  nohup "$PYTHON" -m http.server "$PORT" >>"$LOG" 2>&1 &
  for _ in $(seq 1 50); do
    port_up && break
    sleep 0.2
  done
fi

if ! port_up; then
  osascript -e "display notification \"No pude arrancar el servidor en :${PORT}. Revisa ${LOG}\" with title \"Mejora\""
  open -a Console "$LOG" 2>/dev/null || true
  exit 1
fi

open "$URL"
exit 0
