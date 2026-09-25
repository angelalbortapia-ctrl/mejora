#!/bin/bash
cd "$(dirname "$0")" || exit 1
chmod +x scripts/ensure-mejora-server.sh instalar-servicio.command 2>/dev/null || true
exec ./scripts/ensure-mejora-server.sh
