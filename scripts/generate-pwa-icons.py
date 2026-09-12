#!/usr/bin/env python3
"""Genera iconos PNG FORGE para PWA desde SVG simple."""
import struct
import zlib
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'public')

# Color FORGE: fondo #0a0c10, acento #d4a012
BG = (10, 12, 16, 255)
ACCENT = (212, 160, 18, 255)


def png_chunk(tag, data):
    return struct.pack('>I', len(data)) + tag + data + struct.pack('>I', zlib.crc32(tag + data) & 0xffffffff)


def write_png(path, size):
    raw = bytearray()
    cx, cy, r = size // 2, size // 2, int(size * 0.32)
    for y in range(size):
        raw.append(0)
        for x in range(size):
            dx, dy = x - cx, y - cy
            dist = (dx * dx + dy * dy) ** 0.5
            if dist <= r:
                raw.extend(ACCENT)
            elif x < size * 0.22 or y < size * 0.12 or x > size * 0.88 or y > size * 0.88:
                raw.extend((26, 32, 40, 255))
            else:
                raw.extend(BG)
    comp = zlib.compress(bytes(raw), 9)
    ihdr = struct.pack('>IIBBBBB', size, size, 8, 6, 0, 0, 0)
    data = b'\x89PNG\r\n\x1a\n' + png_chunk(b'IHDR', ihdr) + png_chunk(b'IDAT', comp) + png_chunk(b'IEND', b'')
    with open(path, 'wb') as f:
        f.write(data)


if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    write_png(os.path.join(OUT, 'icon-192.png'), 192)
    write_png(os.path.join(OUT, 'icon-512.png'), 512)
    write_png(os.path.join(OUT, 'apple-touch-icon.png'), 180)
    print('Icons written to public/')
