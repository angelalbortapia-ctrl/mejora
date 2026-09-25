#!/bin/bash
cd "$(dirname "$0")" || exit 1
launchctl unload "$HOME/Library/LaunchAgents/com.mejora.local.plist" 2>/dev/null || true
lsof -tiTCP:5173 -sTCP:LISTEN 2>/dev/null | xargs kill 2>/dev/null || true
echo "Servidor Mejora detenido (puerto 5173)."
read -p "Presiona Enter para cerrar…"
