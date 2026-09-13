#!/usr/bin/env python3
"""Servidor local: archivos estáticos + proxy Fish Audio (el navegador no puede llamar a api.fish.audio directo por CORS)."""

import http.server
import os
import re
import sys
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FISH_API = 'https://api.fish.audio'


def load_fish_key():
    local = ROOT / 'js' / 'fish-config.local.js'
    if local.exists():
        text = local.read_text(encoding='utf-8')
        match = re.search(r"FISH_API_KEY\s*=\s*['\"]([^'\"]+)['\"]", text)
        if match and match.group(1).strip():
            return match.group(1).strip()
    return os.environ.get('FISH_API_KEY', '').strip()


class MejoraHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def log_message(self, fmt, *args):
        if str(args[0]).startswith('GET /api/fish') or str(args[0]).startswith('POST /api/fish'):
            super().log_message(fmt, *args)

    def do_OPTIONS(self):
        if self.path.startswith('/api/fish/'):
            self.send_response(204)
            self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type, model')
            self.end_headers()
            return
        self.send_error(404)

    def do_POST(self):
        if self.path == '/api/fish/tts' or self.path.startswith('/api/fish/tts?'):
            self._proxy_fish_tts()
            return
        self.send_error(404)

    def do_GET(self):
        if self.path.startswith('/api/fish/model'):
            self._proxy_fish_models()
            return
        super().do_GET()

    def _fish_headers(self):
        key = load_fish_key()
        if not key:
            return None
        return {'Authorization': f'Bearer {key}'}

    def _proxy_fish_tts(self):
        headers = self._fish_headers()
        if not headers:
            self._json_error(500, 'Sin FISH_API_KEY — ponla en js/fish-config.local.js')
            return

        length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(length)
        model = self.headers.get('model', 's2.1-pro-free')
        headers['Content-Type'] = self.headers.get('Content-Type', 'application/json')
        headers['model'] = model

        req = urllib.request.Request(f'{FISH_API}/v1/tts', data=body, method='POST', headers=headers)
        try:
            with urllib.request.urlopen(req, timeout=120) as resp:
                data = resp.read()
                self.send_response(resp.status)
                self.send_header('Content-Type', resp.headers.get('Content-Type', 'audio/mpeg'))
                self.send_header('Content-Length', str(len(data)))
                self.end_headers()
                self.wfile.write(data)
        except urllib.error.HTTPError as err:
            payload = err.read()
            self.send_response(err.code)
            self.send_header('Content-Type', err.headers.get('Content-Type', 'application/json'))
            self.end_headers()
            self.wfile.write(payload)
        except Exception as err:
            self._json_error(502, str(err))

    def _proxy_fish_models(self):
        headers = self._fish_headers()
        if not headers:
            self._json_error(500, 'Sin FISH_API_KEY')
            return

        query = self.path.split('?', 1)[1] if '?' in self.path else ''
        url = f'{FISH_API}/model' + (f'?{query}' if query else '')
        req = urllib.request.Request(url, headers=headers)
        try:
            with urllib.request.urlopen(req, timeout=60) as resp:
                data = resp.read()
                self.send_response(resp.status)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Content-Length', str(len(data)))
                self.end_headers()
                self.wfile.write(data)
        except urllib.error.HTTPError as err:
            payload = err.read()
            self.send_response(err.code)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(payload)
        except Exception as err:
            self._json_error(502, str(err))

    def _json_error(self, code, message):
        payload = json_bytes({'status': code, 'message': message})
        self.send_response(code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)


def json_bytes(obj):
    import json
    return json.dumps(obj).encode('utf-8')


def main():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 5173
    server = http.server.ThreadingHTTPServer(('127.0.0.1', port), MejoraHandler)
    print(f'Mejora → http://127.0.0.1:{port}/?v=147  (Fish proxy /api/fish/*)')
    if load_fish_key():
        print('Fish API key: OK (fish-config.local.js)')
    else:
        print('Fish API key: no detectada')
    server.serve_forever()


if __name__ == '__main__':
    main()
