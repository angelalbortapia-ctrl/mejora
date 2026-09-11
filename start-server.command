#!/bin/bash
cd "$(dirname "$0")" || exit 1
PORT=5173
URL="http://127.0.0.1:${PORT}/?v=55"

if ! lsof -nP -iTCP:"$PORT" -sTCP:LISTEN >/dev/null 2>&1; then
  /usr/bin/python3 -m http.server "$PORT" >/dev/null 2>&1 &
  for _ in $(seq 1 30); do
    lsof -nP -iTCP:"$PORT" -sTCP:LISTEN >/dev/null 2>&1 && break
    sleep 0.1
  done
fi

if lsof -nP -iTCP:"$PORT" -sTCP:LISTEN >/dev/null 2>&1; then
  open "$URL"
else
  osascript -e "display alert \"Mejora\" message \"No pude arrancar el servidor en el puerto ${PORT}.\""
fi
