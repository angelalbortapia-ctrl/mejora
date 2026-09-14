#!/bin/bash
# Igual que abrir.command — atajo con nombre visible.
cd "$(dirname "$0")" || exit 1
chmod +x abrir.command instalar-servicio.command scripts/*.sh 2>/dev/null || true
exec ./abrir.command
