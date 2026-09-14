#!/bin/bash
# Construye Mejora.app y lo copia al Escritorio y ~/Applications
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
APP_NAME="Mejora"
BUNDLE_ID="com.angelalbor.mejora"
BUILD_DIR="${TMPDIR:-/tmp}/mejora-app-build"
APP="${BUILD_DIR}/${APP_NAME}.app"

rm -rf "$BUILD_DIR"
mkdir -p "$APP/Contents/MacOS" "$APP/Contents/Resources"

cat > "$APP/Contents/MacOS/Mejora" <<EOF
#!/bin/bash
exec "$ROOT/scripts/ensure-mejora-server.sh"
EOF
chmod +x "$APP/Contents/MacOS/Mejora"

cat > "$APP/Contents/Info.plist" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>CFBundleDevelopmentRegion</key>
	<string>es</string>
	<key>CFBundleDisplayName</key>
	<string>Mejora</string>
	<key>CFBundleExecutable</key>
	<string>Mejora</string>
	<key>CFBundleIconFile</key>
	<string>AppIcon</string>
	<key>CFBundleIdentifier</key>
	<string>${BUNDLE_ID}</string>
	<key>CFBundleInfoDictionaryVersion</key>
	<string>6.0</string>
	<key>CFBundleName</key>
	<string>Mejora</string>
	<key>CFBundlePackageType</key>
	<string>APPL</string>
	<key>CFBundleShortVersionString</key>
	<string>1.0</string>
	<key>CFBundleVersion</key>
	<string>1</string>
	<key>LSMinimumSystemVersion</key>
	<string>12.0</string>
	<key>NSHighResolutionCapable</key>
	<true/>
</dict>
</plist>
EOF

ICONSET="${BUILD_DIR}/Mejora.iconset"
mkdir -p "$ICONSET"
PNG="${BUILD_DIR}/icon-1024.png"
PIL_DIR="${BUILD_DIR}/pillow"
if ! python3 -c "import PIL" 2>/dev/null; then
  python3 -m pip install pillow -q -t "$PIL_DIR" >/dev/null 2>&1 || true
fi
if python3 -c "import PIL" 2>/dev/null; then
  python3 "$ROOT/scripts/generate-macos-icon.py" "$PNG"
elif [ -f "$PIL_DIR/PIL/__init__.py" ]; then
  PYTHONPATH="$PIL_DIR" python3 "$ROOT/scripts/generate-macos-icon.py" "$PNG"
else
  echo "No se pudo generar icono (falta Pillow). Usando favicon.svg con qlmanage." >&2
  qlmanage -t -s 1024 -o "$BUILD_DIR" "$ROOT/public/favicon.svg" >/dev/null 2>&1
  mv "$BUILD_DIR/favicon.svg.png" "$PNG"
fi

for size in 16 32 128 256 512; do
  sips -z "$size" "$size" "$PNG" --out "${ICONSET}/icon_${size}x${size}.png" >/dev/null
  d=$((size * 2))
  sips -z "$d" "$d" "$PNG" --out "${ICONSET}/icon_${size}x${size}@2x.png" >/dev/null
done

iconutil -c icns "$ICONSET" -o "$APP/Contents/Resources/AppIcon.icns"

DESKTOP="/Users/angelalbor/Desktop/${APP_NAME}.app"
APPS="/Users/angelalbor/Applications/${APP_NAME}.app"
rm -rf "$DESKTOP" "$APPS"
cp -R "$APP" "$DESKTOP"
mkdir -p "/Users/angelalbor/Applications"
cp -R "$APP" "$APPS"

echo "✓ ${DESKTOP}"
echo "✓ ${APPS}"
