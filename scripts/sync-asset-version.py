#!/usr/bin/env python3
"""Propaga ASSET_VERSION: import map, quita ?v= de imports, actualiza CSS/SW."""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
VERSION_FILE = ROOT / 'js' / 'version.js'
IMPORT_MAP = ROOT / 'js' / 'import-map.json'

src = VERSION_FILE.read_text()
match = re.search(r'export const ASSET_VERSION = (\d+)', src)
if not match:
    raise SystemExit('No ASSET_VERSION in js/version.js')
V = match.group(1)

IMPORT_RE = re.compile(
    r"""(?P<prefix>from\s+|import\s*\(\s*)['"](?P<spec>\.?\.?/[^'"]+?)['"]"""
)


def js_files():
    js_root = ROOT / 'js'
    for path in js_root.rglob('*.js'):
        if 'node_modules' in path.parts:
            continue
        yield path


def to_url(path: Path) -> str:
    rel = path.relative_to(ROOT / 'js').as_posix()
    return f'/js/{rel}'


def resolve_spec(importer: Path, spec: str) -> str:
    spec = re.sub(r'\?v=\d+', '', spec)
    if spec.startswith('/js/'):
        return spec
    base = importer.parent if importer.is_file() else importer
    if spec.startswith('./') or spec.startswith('../'):
        target = (base / spec).resolve()
    else:
        target = (ROOT / 'js' / spec).resolve()
    try:
        rel = target.relative_to(ROOT / 'js')
    except ValueError:
        return spec
    return f'/js/{rel.as_posix()}'


SKIP_IMPORT_MAP = re.compile(r'\.(example|local)\.js$')


def build_import_map():
    mapping = {}
    for path in js_files():
        url = to_url(path)
        if SKIP_IMPORT_MAP.search(url):
            continue
        mapping[url] = f'{url}?v={V}'
    return mapping


def normalize_js_imports():
    touched = 0
    for path in js_files():
        text = path.read_text()
        changed = False

        def repl(m):
            nonlocal changed
            spec = m.group('spec')
            url = resolve_spec(path, spec)
            if url != spec:
                changed = True
            return f"{m.group('prefix')}'{url}'"

        next_text = IMPORT_RE.sub(repl, text)
        next_text = re.sub(r'\?v=\d+', '', next_text)
        if next_text != text:
            path.write_text(next_text)
            touched += 1
    return touched


def patch_other_files():
    exts = {'.html', '.css', '.py'}
    touched = 0
    for path in ROOT.rglob('*'):
        if not path.is_file() or path.suffix not in exts:
            continue
        if 'node_modules' in path.parts or '.git' in path.parts:
            continue
        if path.name in ('sync-asset-version.py', 'import-map.json'):
            continue
        text = path.read_text()
        next_text = re.sub(r'\?v=\d+', f'?v={V}', text)
        next_text = re.sub(r"const CACHE = 'mejora-v\d+'", f"const CACHE = 'mejora-v{V}'", next_text)
        # Entry script sin ?v= (import map resuelve versión)
        if path.name == 'index.html':
            next_text = re.sub(
                r'<script type="module" src="js/app\.js\?v=\d+"></script>',
                '<script type="module" src="/js/app.js"></script>',
                next_text,
            )
            if 'import-map.json' not in next_text:
                next_text = next_text.replace(
                    '<script type="module" src="/js/app.js"></script>',
                    f'  <script type="importmap" src="/js/import-map.json?v={V}"></script>\n'
                    f'  <script type="module" src="/js/app.js"></script>',
                )
        if next_text != text:
            path.write_text(next_text)
            touched += 1
    return touched


def main():
    mapping = build_import_map()
    IMPORT_MAP.write_text(json.dumps({'imports': mapping}, indent=2) + '\n')
    js_n = normalize_js_imports()
    other_n = patch_other_files()
    print(f'ASSET_VERSION={V}')
    print(f'  import-map.json → {len(mapping)} módulos')
    print(f'  JS normalizados → {js_n} archivos')
    print(f'  otros archivos → {other_n}')


if __name__ == '__main__':
    main()
