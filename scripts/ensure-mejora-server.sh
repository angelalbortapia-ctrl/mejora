#!/bin/bash
# Arranca Mejora en el Mac — doble clic en ABRE-MEJORA.command
set -euo pipefail
PROJECT="$(cd "$(dirname "$0")/.." && pwd)"
PORT="${PORT:-5173}"
VERSION_FILE="$PROJECT/js/version.js"
LOG="${TMPDIR:-/tmp}/mejora-server.log"
PYTHON="${PYTHON:-$(command -v python3 2>/dev/null || echo /usr/bin/python3)}"
SERVER="$PROJECT/scripts/mejora-dev-server.py"

health_ok() {
  curl -s --connect-timeout 2 "http://127.0.0.1:${PORT}/health" >/dev/null 2>&1
}

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
  # Proceso separado del grupo de Terminal (sigue vivo al cerrar la ventana en muchos Mac)
  ( cd "$PROJECT" && nohup "$PYTHON" "$SERVER" "$PORT" >>"$LOG" 2>&1 & )
  sleep 0.3
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

if health_ok; then
  say "Servidor ya activo — abriendo navegador…"
  open "$URL" 2>/dev/null || true
  exit 0
fi

if [[ ! -x "$PYTHON" ]] && ! command -v python3 >/dev/null 2>&1; then
  alert "No encuentro Python 3. Instala Python desde python.org o Xcode Command Line Tools."
  read -r -p "Pulsa Enter para salir…"
  exit 1
fi

if [[ -d "$PROJECT/.git" ]] && command -v git >/dev/null 2>&1; then
  say "Actualizando archivos (git pull)…"
  git pull --ff-only origin cursor/calma-fish-azure-v126 2>>"$LOG" || \
    git pull --ff-only 2>>"$LOG" || \
    echo "(git pull no disponible — sigo con los archivos locales)"
fi

say "Iniciando servidor en segundo plano…"
if port_up && ! health_ok; then
  say "Puerto ${PORT} ocupado pero no responde — reiniciando…"
  kill_port
  sleep 0.5
fi

if ! port_up; then
  if ! start_server; then
    alert "No pude arrancar el servidor. Revisa ${LOG} o ejecuta iniciar.command para ver el error en pantalla."
    read -r -p "Pulsa Enter para salir…"
    exit 1
  fi
fi

for _ in $(seq 1 30); do
  health_ok && break
  sleep 0.3
done
if ! health_ok; then
  alert "El servidor no respondió. Abre iniciar.command para ver el error."
  read -r -p "Pulsa Enter para salir…"
  exit 1
fi

say "Abriendo el navegador…"
echo "$URL"
open "$URL" 2>/dev/null || xdg-open "$URL" 2>/dev/null || true

alert "Mejora está corriendo en segundo plano. Puedes cerrar Terminal. Para volver a abrir: doble clic en ABRE-MEJORA.command o usa ${URL}"

echo ""
echo "✓ Servidor en segundo plano (puerto ${PORT})."
echo "  Puedes CERRAR esta ventana de Terminal — Mejora sigue en el navegador."
echo "  Para apagar el servidor: reinicia el Mac o ejecuta:"
echo "  lsof -ti:5173 | xargs kill  (o detener.command)"
echo ""
echo "  Para que siga al cerrar Terminal: instalar-servicio.command (una vez)"
sleep 2
exit 0
