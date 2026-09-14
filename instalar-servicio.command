#!/bin/bash
# Una sola vez: Mejora arranca sola al encender el Mac (como Finanzas).
cd "$(dirname "$0")" || exit 1
DIR="$(pwd)"
PLIST="$HOME/Library/LaunchAgents/com.mejora.local.plist"
LOG="$DIR/mejora-server.log"
PYTHON="${PYTHON:-/usr/bin/python3}"

cat > "$PLIST" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>com.mejora.local</string>
  <key>ProgramArguments</key>
  <array>
    <string>${PYTHON}</string>
    <string>${DIR}/scripts/mejora-dev-server.py</string>
    <string>5173</string>
  </array>
  <key>WorkingDirectory</key>
  <string>${DIR}</string>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
  <key>StandardOutPath</key>
  <string>${LOG}</string>
  <key>StandardErrorPath</key>
  <string>${LOG}</string>
</dict>
</plist>
EOF

launchctl unload "$PLIST" 2>/dev/null
launchctl load "$PLIST"
sleep 2

if curl -s --connect-timeout 3 http://127.0.0.1:5173/health >/dev/null 2>&1; then
  echo "✓ Mejora instalado — corre en segundo plano en http://127.0.0.1:5173"
  echo "  Usa abrir.command o ABRE-MEJORA.command para abrir el navegador."
else
  echo "Servicio instalado. Si no responde, revisa: $LOG"
fi
echo ""
read -p "Presiona Enter para cerrar…"
