#!/usr/bin/env python3
"""Icono macOS Mejora — fiel al favicon, estrella dentro del recuadro."""
import math
import sys
from pathlib import Path

try:
    from PIL import Image, ImageDraw, ImageFilter
except ImportError:
    print('Instala Pillow: python3 -m pip install pillow', file=sys.stderr)
    sys.exit(1)

OUT = Path(sys.argv[1]) if len(sys.argv) > 1 else Path('MejoraIcon-1024.png')
SIZE = 1024
BG = (5, 6, 8)
RADIUS = int(SIZE * 0.22)  # rx=22 en viewBox 100


def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))


def sparkle_points(cx, cy, outer_r, inner_r):
    pts = []
    for i in range(8):
        ang = math.pi / 4 * i - math.pi / 2
        r = outer_r if i % 2 == 0 else inner_r
        pts.append((cx + r * math.cos(ang), cy + r * math.sin(ang)))
    return pts


# Capa base
img = Image.new('RGBA', (SIZE, SIZE), (0, 0, 0, 0))
base = Image.new('RGBA', (SIZE, SIZE), BG)
mask = Image.new('L', (SIZE, SIZE), 0)
mask_draw = ImageDraw.Draw(mask)
mask_draw.rounded_rectangle([0, 0, SIZE - 1, SIZE - 1], radius=RADIUS, fill=255)
img = Image.composite(base, img, mask)

draw = ImageDraw.Draw(img)

# Tinte gradiente suave (como favicon opacity 0.1)
tint = Image.new('RGBA', (SIZE, SIZE), (0, 0, 0, 0))
tint_draw = ImageDraw.Draw(tint)
for y in range(SIZE):
    t = y / (SIZE - 1)
    color = lerp((0, 245, 212), (0, 180, 216), t) + (26,)  # ~10% alpha
    tint_draw.line([(0, y), (SIZE, y)], fill=color)
tint_masked = Image.composite(tint, Image.new('RGBA', (SIZE, SIZE), (0, 0, 0, 0)), mask)
img = Image.alpha_composite(img, tint_masked)
draw = ImageDraw.Draw(img)

# Estrella ✦ vectorial — proporción del favicon (font-size 42 / 100)
cx, cy = SIZE // 2, int(SIZE * 0.56)
outer_r = SIZE * 0.19
inner_r = outer_r * 0.38
pts = sparkle_points(cx, cy, outer_r, inner_r)

# Glow
glow = Image.new('RGBA', (SIZE, SIZE), (0, 0, 0, 0))
glow_draw = ImageDraw.Draw(glow)
glow_draw.polygon(pts, fill=(0, 245, 212, 180))
glow = glow.filter(ImageFilter.GaussianBlur(radius=SIZE * 0.025))
img = Image.alpha_composite(img, glow)

# Estrella con gradiente simulado (dos tonos)
star = Image.new('RGBA', (SIZE, SIZE), (0, 0, 0, 0))
star_draw = ImageDraw.Draw(star)
star_draw.polygon(pts, fill=(0, 212, 255, 255))
# Brillo superior
pts_hi = sparkle_points(cx, cy - outer_r * 0.08, outer_r * 0.55, inner_r * 0.55)
star_draw.polygon(pts_hi, fill=(0, 245, 212, 220))
img = Image.alpha_composite(img, star)

img.save(OUT)
print(OUT)
