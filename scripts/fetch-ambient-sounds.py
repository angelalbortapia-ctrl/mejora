#!/usr/bin/env python3
"""Descarga grabaciones CC0 y genera loops MP3 seamless para Calma (Web Audio)."""
from __future__ import annotations

import shutil
import subprocess
import sys
import tempfile
import zipfile
from pathlib import Path
from urllib.request import urlretrieve

try:
    import imageio_ffmpeg
except ImportError:
    print('Instala dependencia: pip3 install imageio-ffmpeg')
    sys.exit(1)

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'public' / 'audio'
FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()

LOOP_SEC = 120

# Grabaciones CC0 — segmentos estacionarios, sin fade-out (loop seamless en Web Audio)
SOURCES = {
    'rain': {
        'url': 'https://cdn.freesound.org/previews/416/416227_5438412-hq.ogg',
        'credit': 'rasunter255 — Freesound #416227 (CC0)',
        'start': 30,
        'duration': LOOP_SEC,
        'note': 'Lluvia suave en bosque',
    },
    'ocean': {
        'url': 'https://bigsoundbank.com/UPLOAD/mp3/1046.mp3',
        'credit': 'Joseph SARDIN — La Sonothèque #1046 (CC0)',
        'start': 15,
        'duration': LOOP_SEC,
        'note': 'Olas constantes',
    },
    'forest': {
        'url': 'https://bigsoundbank.com/UPLOAD/mp3/2749.mp3',
        'credit': 'La Sonothèque — Forest #4 (CC0)',
        'start': 45,
        'duration': LOOP_SEC,
        'note': 'Bosque denso',
    },
    'fire': {
        'url': 'https://opengameart.org/sites/default/files/fire.wav',
        'credit': 'PagDev — OpenGameArt Fireplace loop (CC0)',
        'start': 0,
        'duration': LOOP_SEC,
        'stream_loop': 5,
        'note': 'Fogata loop extendido',
    },
    'stream': {
        'url': 'https://bigsoundbank.com/UPLOAD/mp3/2715.mp3',
        'credit': 'Pierre SIBANARCO — Forest and Stream #3 (CC0)',
        'start': 25,
        'duration': LOOP_SEC,
        'note': 'Arroyo con bosque',
    },
    'wind': {
        'url': 'https://bigsoundbank.com/UPLOAD/mp3/0904.mp3',
        'credit': 'La Sonothèque — Wind in the Trees (CC0)',
        'start': 60,
        'duration': LOOP_SEC,
        'note': 'Viento en árboles',
    },
    'night': {
        'url': 'https://bigsoundbank.com/UPLOAD/mp3/1880.mp3',
        'credit': 'Joseph SARDIN — Campaign at Night #4 (CC0)',
        'start': 90,
        'duration': LOOP_SEC,
        'note': 'Grillos y prado nocturno',
    },
    'cascada': {
        'url': 'https://bigsoundbank.com/UPLOAD/mp3/0871.mp3',
        'credit': 'Joseph SARDIN — Small dam (CC0)',
        'start': 8,
        'duration': LOOP_SEC,
        'note': 'Cascada estéreo',
    },
    'amanecer': {
        'url': 'https://bigsoundbank.com/UPLOAD/mp3/0999.mp3',
        'credit': 'La Sonothèque — Wake Birds #3 (CC0)',
        'start': 55,
        'duration': LOOP_SEC,
        'note': 'Amanecer con aves',
    },
    'cafe': {
        'url': 'https://cdn.freesound.org/previews/233/233283_4056007-hq.mp3',
        'credit': 'JarredGibb — Freesound #233283 (CC0)',
        'start': 20,
        'duration': LOOP_SEC,
        'note': 'Cafetería suave',
    },
    'lago': {
        'url': 'https://cdn.freesound.org/previews/528/528067_3713344-hq.mp3',
        'credit': 'laughatlantic — Freesound #528067 (CC0)',
        'start': 5,
        'duration': LOOP_SEC,
        'stream_loop': 3,
        'note': 'Lago Pukaki',
    },
    'tormenta': {
        'url': 'https://bigsoundbank.com/UPLOAD/mp3/2719.mp3',
        'credit': 'Joseph SARDIN — Rain and Thunder #4 (CC0)',
        'start': 340,
        'duration': LOOP_SEC,
        'volume': 0.75,
        'note': 'Lluvia con truenos lejanos',
    },
    'jardin': {
        'url': 'https://bigsoundbank.com/UPLOAD/mp3/0905.mp3',
        'credit': 'La Sonothèque — Forest on the Edge (CC0)',
        'start': 80,
        'duration': LOOP_SEC,
        'note': 'Jardín con aves',
    },
    'bamboo': {
        'url': 'https://bigsoundbank.com/UPLOAD/mp3/2715.mp3',
        'credit': 'Pierre SIBANARCO — Forest and Stream #3 (CC0)',
        'start': 42,
        'duration': LOOP_SEC,
        'volume': 0.9,
        'af_extra': 'highpass=f=130,lowpass=f=7800',
        'note': 'Arroyo suave en bosque',
    },
    'zen': {
        'url': 'https://bigsoundbank.com/UPLOAD/mp3/2717.mp3',
        'credit': 'Joseph SARDIN — Forest and Stream #5 (CC0)',
        'start': 0,
        'duration': LOOP_SEC,
        'stream_loop': 4,
        'note': 'Arroyo zen en bosque',
    },
    'shrine': {
        'url': 'https://bigsoundbank.com/UPLOAD/mp3/0913.mp3',
        'credit': 'Olivier du Japon — Fountain of a Japanese Temple (CC0)',
        'start': 0,
        'duration': LOOP_SEC,
        'stream_loop': 2,
        'volume': 0.88,
        'af_extra': 'highpass=f=85,lowpass=f=4200',
        'note': 'Fuente de templo, agua purificadora',
    },
}

CREDITS = """# Sonidos ambiente — Calma

Grabaciones reales bajo licencia **CC0** (dominio público). Loops de **120 s** sin fade-out al final para reproducción gapless (Web Audio API).

| Preset | Fuente | Licencia |
|--------|--------|----------|
| Lluvia | rasunter255 — [gentle rainfall](https://freesound.org/people/rasunter255/sounds/416227/) | CC0 |
| Olas | Joseph SARDIN — [Small Waves](https://bigsoundbank.com/small-waves-facing-the-ocean-s1046.html) | CC0 |
| Bosque | La Sonothèque — [Forest #4](https://bigsoundbank.com/forest-4-s2749.html) | CC0 |
| Fogata | PagDev — [Fireplace loop](https://opengameart.org/content/fireplace-sound-loop) | CC0 |
| Arroyo | Pierre SIBANARCO — [Forest and Stream #3](https://bigsoundbank.com/forest-and-stream-3-s2715.html) | CC0 |
| Viento | La Sonothèque — [Wind in the Trees](https://bigsoundbank.com/wind-in-the-trees-s0904.html) | CC0 |
| Noche | Joseph SARDIN — [Campaign at Night #4](https://bigsoundbank.com/campaign-at-night-4-s1880.html) | CC0 |
| Cascada | Joseph SARDIN — [Small dam](https://bigsoundbank.com/small-dam-s0871.html) | CC0 |
| Amanecer | La Sonothèque — [Wake Birds #3](https://bigsoundbank.com/wake-birds-3-s0999.html) | CC0 |
| Café | JarredGibb — [Coffee Shop](https://freesound.org/people/JarredGibb/sounds/233283/) | CC0 |
| Lago | laughatlantic — [Lake Pukaki](https://freesound.org/people/laughatlantic/sounds/528067/) | CC0 |
| Tormenta | Joseph SARDIN — [Rain and Thunder #4](https://bigsoundbank.com/rain-and-thunder-4-s2719.html) | CC0 |
| Jardín | La Sonothèque — [Forest on the Edge](https://bigsoundbank.com/forest-on-the-edge-s0905.html) | CC0 |
| Cuencos | Generado — armónicos de cuenco tibetano sostenido | CC0 |
| Bambú | Pierre SIBANARCO — [Forest and Stream #3](https://bigsoundbank.com/forest-and-stream-3-s2715.html) | CC0 |
| Jardín zen | Joseph SARDIN — [Forest and Stream #5](https://bigsoundbank.com/forest-and-stream-5-s2717.html) | CC0 |
| Santuario | Olivier du Japon — [Fountain of a Japanese Temple](https://bigsoundbank.com/fountain-of-a-japanese-temple-s0913.html) | CC0 |
| Om profundo | Generado — brown noise + tono 136 Hz | CC0 |

Procesado con `scripts/fetch-ambient-sounds.py` — EQ suave, loudnorm, **sin fade-out** (loop seamless).
"""


def run(cmd: list[str]) -> None:
    subprocess.run(cmd, check=True)


def download(url: str, dest: Path) -> None:
    print(f'  ↓ {url}')
    urlretrieve(url, dest)


def extract_source(name: str, spec: dict, work: Path) -> Path:
    url = spec['url']
    if 'zip_member' in spec:
        zip_path = work / f'{name}.zip'
        download(url, zip_path)
        raw = work / f'{name}_raw'
        with zipfile.ZipFile(zip_path) as zf:
            raw.write_bytes(zf.read(spec['zip_member']))
        return raw

    ext = Path(url.split('?')[0]).suffix or '.bin'
    raw = work / f'{name}{ext}'
    download(url, raw)
    return raw


def process_seamless_loop(
    src: Path,
    dest: Path,
    duration: float,
    start: float = 0,
    stream_loop: int = 0,
    volume: float = 1.0,
    af_extra: str = '',
) -> None:
    """Loop-friendly: micro fade-in, sin fade-out al final."""
    vol = f'volume={volume},' if volume < 0.99 else ''
    eq = af_extra or 'highpass=f=75,lowpass=f=12500'
    af = (
        f'{vol}{eq},'
        'afade=t=in:st=0:d=0.25,'
        'loudnorm=I=-18:TP=-1.5:LRA=7:print_format=none'
    )
    cmd = [FFMPEG, '-y', '-hide_banner', '-loglevel', 'error']
    if stream_loop > 0:
        cmd += ['-stream_loop', str(stream_loop)]
    cmd += [
        '-ss', str(start),
        '-i', str(src),
        '-t', str(duration),
        '-af', af,
        '-ac', '2', '-ar', '44100',
        '-codec:a', 'libmp3lame', '-b:a', '192k',
        str(dest),
    ]
    run(cmd)


def generate_bowl_pad(dest: Path, duration: float = LOOP_SEC) -> None:
    """Cuenco tibetano sostenido — armónicos suaves, sin golpes."""
    run([
        FFMPEG, '-y', '-hide_banner', '-loglevel', 'error',
        '-f', 'lavfi', '-i', f'sine=frequency=220:duration={duration}:sample_rate=44100',
        '-f', 'lavfi', '-i', f'sine=frequency=221.4:duration={duration}:sample_rate=44100',
        '-f', 'lavfi', '-i', f'sine=frequency=329.6:duration={duration}:sample_rate=44100',
        '-f', 'lavfi', '-i', f'sine=frequency=440:duration={duration}:sample_rate=44100',
        '-f', 'lavfi', '-i', f'sine=frequency=554.4:duration={duration}:sample_rate=44100',
        '-filter_complex',
        '[0:a]volume=0.07[a0];'
        '[1:a]volume=0.045[a1];'
        '[2:a]volume=0.038[a2];'
        '[3:a]volume=0.028[a3];'
        '[4:a]volume=0.02[a4];'
        '[a0][a1][a2][a3][a4]amix=inputs=5:duration=first,'
        'highpass=f=160,lowpass=f=1050,'
        'afade=t=in:st=0:d=0.25,'
        'loudnorm=I=-21:TP=-2.2:LRA=8:print_format=none[a]',
        '-map', '[a]',
        '-ac', '2', '-ar', '44100',
        '-codec:a', 'libmp3lame', '-b:a', '192k',
        str(dest),
    ])


def generate_om_pad(dest: Path, duration: float = LOOP_SEC) -> None:
    """Pad meditativo sintético — brown noise + tono Om bajo."""
    run([
        FFMPEG, '-y', '-hide_banner', '-loglevel', 'error',
        '-f', 'lavfi', '-i', f'anoisesrc=duration={duration}:color=brown:sample_rate=44100:amplitude=0.12',
        '-f', 'lavfi', '-i', f'sine=frequency=136.1:duration={duration}:sample_rate=44100',
        '-filter_complex',
        '[0:a][1:a]amix=inputs=2:duration=first:weights=1 0.35,'
        'highpass=f=40,lowpass=f=420,'
        'afade=t=in:st=0:d=0.25,'
        'loudnorm=I=-20:TP=-2:LRA=8:print_format=none[a]',
        '-map', '[a]',
        '-ac', '2', '-ar', '44100',
        '-codec:a', 'libmp3lame', '-b:a', '192k',
        str(dest),
    ])


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    work = Path(tempfile.mkdtemp(prefix='mejora-ambient-'))
    print(f'ffmpeg: {FFMPEG}')
    print(f'Generando loops seamless ({LOOP_SEC}s) en {OUT}…')

    try:
        for name, spec in SOURCES.items():
            print(f'\n[{name}] {spec.get("note", "")}')
            raw = extract_source(name, spec, work)
            out = OUT / f'{name}.mp3'
            process_seamless_loop(
                raw, out,
                duration=spec['duration'],
                start=spec.get('start', 0),
                stream_loop=spec.get('stream_loop', 0),
                volume=spec.get('volume', 1.0),
                af_extra=spec.get('af_extra', ''),
            )
            kb = out.stat().st_size // 1024
            print(f'  ✓ {out.name} ({kb} KB)')

        print('\n[chimes] Cuenco sostenido sintético')
        chimes_out = OUT / 'chimes.mp3'
        generate_bowl_pad(chimes_out, LOOP_SEC)
        print(f'  ✓ {chimes_out.name} ({chimes_out.stat().st_size // 1024} KB)')

        print('\n[om] Pad meditativo sintético')
        om_out = OUT / 'om.mp3'
        generate_om_pad(om_out, LOOP_SEC)
        print(f'  ✓ {om_out.name} ({om_out.stat().st_size // 1024} KB)')

        credits_path = OUT / 'CREDITS.md'
        credits_path.write_text(CREDITS, encoding='utf-8')
        print(f'\n✓ {credits_path}')
    finally:
        shutil.rmtree(work, ignore_errors=True)

    print('\nListo.')


if __name__ == '__main__':
    main()
