#!/bin/bash
# Launcher para Mejora.app y desarrollo — resuelve la ruta del proyecto.
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

if [[ -f "$SCRIPT_DIR/../scripts/ensure-mejora-server.sh" ]]; then
  PROJECT="$(cd "$SCRIPT_DIR/.." && pwd)"
elif [[ -f "$HOME/Downloads/Mejora/scripts/ensure-mejora-server.sh" ]]; then
  PROJECT="$HOME/Downloads/Mejora"
else
  osascript -e 'display alert "Mejora" message "No encontré el proyecto. Ejecuta start-server.command desde la carpeta Mejora."' 2>/dev/null || true
  exit 1
fi

exec "$PROJECT/scripts/ensure-mejora-server.sh"
