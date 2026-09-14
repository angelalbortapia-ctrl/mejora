#!/bin/bash
# Arranca Mejora en el Mac — doble clic en ABRE-MEJORA.command
set -euo pipefail
PROJECT="$(cd "$(dirname "$0")/.." && pwd)"
PORT="${PORT:-5173}"
VERSION_FILE="$PROJECT/js/version.js"
LOG="${TMPDIR:-/tmp}/mejora-server.log"
PYTHON="${PYTHON:-/usr/bin/python3}"
SERVER="$PROJECT/scripts/mejora-dev-server.py"

alert() {
  osascript -e "display alert \"Mejora\" message \"$1\"" 2>/dev/null || echo "$1"
}

say() {
  echo ""
  echo "▸ $1"
  echo ""
}

if [[ -f "$VERSION_FILE" ]]; then
  ASSET_V="$(grep -Eo 'ASSET_VERSION = [0-9]+' "$VERSION_FILE" | grep -Eo '[0-9]+' | head -1)"
fi
ASSET_V="${MEJORA_ASSET_V:-${ASSET_V:-194}}"
URL="http://127.0.0.1:${PORT}/?reset=1&v=${ASSET_V}#/"

port_up() {
  lsof -nP -iTCP:"$PORT" -sTCP:LISTEN >/dev/null 2>&1
}

kill_port() {
  lsof -tiTCP:"$PORT" -sTCP:LISTEN 2>/dev/null | xargs kill 2>/dev/null || true
}

start_server() {
  nohup "$PYTHON" "$SERVER" "$PORT" >>"$LOG" 2>&1 &
  for _ in $(seq 1 50); do
    port_up && return 0
    sleep 0.2
  done
  return 1
}

cd "$PROJECT" || { alert "No encuentro la carpeta del proyecto."; exit 1; }

# Quitar cuarentena de Chrome (Gatekeeper)
xattr -cr "$PROJECT" 2>/dev/null || true
chmod +x "$PROJECT/ABRE-MEJORA.command" "$PROJECT/start-server.command" "$PROJECT/scripts/"*.sh 2>/dev/null || true

clear
say "Mejora — arrancando…"
echo "Carpeta: $PROJECT"
echo "Versión: v${ASSET_V}"
echo ""

if [[ ! -f "$PROJECT/css/notion-light-force.css" ]]; then
  alert "Esta carpeta está DESACTUALIZADA (falta el tema claro). Pide a quien te pasó el proyecto que te envíe la carpeta nueva, o descárgala de GitHub: rama cursor/calma-fish-azure-v126"
  echo "Falta css/notion-light-force.css — necesitas actualizar la carpeta."
  read -r -p "Pulsa Enter para salir…"
  exit 1
fi

if [[ -d "$PROJECT/.git" ]] && command -v git >/dev/null 2>&1; then
  say "Actualizando archivos (git pull)…"
  git pull --ff-only origin cursor/calma-fish-azure-v126 2>>"$LOG" || \
    git pull --ff-only 2>>"$LOG" || \
    echo "(git pull no disponible — sigo con los archivos locales)"
fi

say "Cerrando servidores viejos en el puerto ${PORT}…"
kill_port
sleep 0.5

say "Iniciando servidor…"
if ! start_server; then
  alert "No pude arrancar el servidor. Abre Terminal, ve a la carpeta Mejora y ejecuta: python3 scripts/mejora-dev-server.py"
  read -r -p "Pulsa Enter para salir…"
  exit 1
fi

say "Abriendo el navegador…"
echo "$URL"
open "$URL" 2>/dev/null || xdg-open "$URL" 2>/dev/null || true

alert "Mejora abierta en el navegador. Si la pantalla sigue oscura, en Safari/Chrome pulsa Cmd+Shift+R. Link: ${URL}"

echo ""
echo "✓ Listo. Puedes cerrar esta ventana."
echo "  (El servidor sigue en segundo plano. Para pararlo: cierra Terminal o reinicia el Mac.)"
sleep 3
