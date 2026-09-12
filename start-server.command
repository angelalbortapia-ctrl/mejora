#!/bin/bash
cd "$(dirname "$0")" || exit 1
PORT=5173
URL="http://127.0.0.1:${PORT}/?v=81"
LOG="${TMPDIR:-/tmp}/mejora-server.log"
PYTHON="/usr/bin/python3"

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

if port_up; then
  open "$URL"
else
  osascript -e "display alert \"Mejora\" message \"No pude arrancar el servidor en el puerto ${PORT}. Revisa ${LOG}\""
fi
