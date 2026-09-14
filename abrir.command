#!/bin/bash
# Como Finanzas: abre el navegador. Si el servidor no está, lo arranca en otra ventana.
cd "$(dirname "$0")" || exit 1

ASSET_V=194
if [[ -f js/version.js ]]; then
  ASSET_V="$(grep -Eo 'ASSET_VERSION = [0-9]+' js/version.js | grep -Eo '[0-9]+' | head -1)"
fi
URL="http://127.0.0.1:5173/?reset=1&v=${ASSET_V}#/"

if ! curl -s --connect-timeout 2 http://127.0.0.1:5173/health >/dev/null 2>&1; then
  echo "Servidor apagado — iniciando en otra ventana…"
  osascript -e "tell application \"Terminal\" to do script \"cd '$PWD' && python3 scripts/mejora-dev-server.py 5173\""
  sleep 3
fi

for _ in 1 2 3 4 5 6 7 8 9 10; do
  if curl -s --connect-timeout 2 http://127.0.0.1:5173/health >/dev/null 2>&1; then
    open "$URL"
    exit 0
  fi
  sleep 1
done

echo "No responde. Prueba instalar-servicio.command (una vez) o ABRE-MEJORA.command"
read -p "Presiona Enter para cerrar…"
