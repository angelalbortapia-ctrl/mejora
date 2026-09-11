#!/usr/bin/env python3
"""Configura Supabase para Mejora: crea proyecto (API), aplica schema y escribe config local."""

import json
import os
import sys
import time
import urllib.error
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SCHEMA_PATH = os.path.join(ROOT, 'supabase', 'schema.sql')
CONFIG_PATH = os.path.join(ROOT, 'js', 'supabase-config.local.js')
API = 'https://api.supabase.com/v1'


def prompt(label, secret=False):
    try:
        import getpass
        fn = getpass.getpass if secret else input
    except ImportError:
        fn = input
    val = fn(f'{label}: ').strip()
    if not val:
        print('Requerido.', file=sys.stderr)
        sys.exit(1)
    return val


def api(method, path, token, body=None):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(
        f'{API}{path}',
        data=data,
        method=method,
        headers={
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json',
        },
    )
    with urllib.request.urlopen(req, timeout=120) as res:
        return json.loads(res.read().decode())


def wait_project_ready(token, ref):
    for _ in range(60):
        proj = api('GET', f'/projects/{ref}', token)
        status = proj.get('status')
        if status == 'ACTIVE_HEALTHY':
            return proj
        if status in ('INACTIVE', 'REMOVED'):
            raise RuntimeError(f'Proyecto falló: {status}')
        print(f'  … estado: {status or "provisioning"}')
        time.sleep(10)
    raise RuntimeError('Timeout esperando proyecto Supabase')


def run_sql(token, ref, sql):
    req = urllib.request.Request(
        f'{API}/projects/{ref}/database/query',
        data=json.dumps({'query': sql}).encode(),
        method='POST',
        headers={
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json',
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=120) as res:
            return json.loads(res.read().decode())
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        raise RuntimeError(f'SQL falló ({e.code}): {body[:500]}')


def write_config(url, anon_key):
    content = f"""export const SUPABASE_URL = '{url}'
export const SUPABASE_ANON_KEY = '{anon_key}'
"""
    with open(CONFIG_PATH, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f'✓ Config escrito en {CONFIG_PATH}')


def main():
    print('Mejora · Setup Supabase\n')
    token = os.environ.get('SUPABASE_ACCESS_TOKEN') or prompt('Access token (supabase.com/dashboard/account/tokens)')

    orgs = api('GET', '/organizations', token)
    if not orgs:
        print('No hay organizaciones en tu cuenta.', file=sys.stderr)
        sys.exit(1)

    org = orgs[0]
    print(f'Organización: {org.get("name")} ({org["id"]})')

    name = os.environ.get('MEJORA_PROJECT_NAME', 'mejora')
    db_pass = os.environ.get('SUPABASE_DB_PASSWORD') or prompt('Contraseña de base de datos (guárdala)', secret=True)

    print('Creando proyecto…')
    project = api('POST', '/projects', token, {
        'organization_id': org['id'],
        'name': name,
        'db_pass': db_pass,
        'region': 'us-east-1',
    })
    ref = project['id']
    print(f'Proyecto: {ref} — esperando que esté listo…')
    project = wait_project_ready(token, ref)

    keys = api('GET', f'/projects/{ref}/api-keys', token)
    anon = next((k['api_key'] for k in keys if k.get('name') == 'anon'), None)
    service = next((k['api_key'] for k in keys if k.get('name') == 'service_role'), None)
    if not anon:
        raise RuntimeError('No se encontró anon key')

    url = f'https://{ref}.supabase.co'
    with open(SCHEMA_PATH, encoding='utf-8') as f:
        schema = f.read()

    print('Aplicando schema…')
    try:
        run_sql(token, ref, schema)
        print('✓ Schema aplicado')
    except Exception as e:
        print(f'⚠ Pega supabase/schema.sql en SQL Editor: {e}')

    write_config(url, anon)
    print(f'\nListo.\n  URL: {url}')
    print('  Prueba: python3 -m http.server 5173 → Ajustes → Cuenta')
    print('\nPara GitHub Pages, añade secrets SUPABASE_URL y SUPABASE_ANON_KEY en el repo.')


if __name__ == '__main__':
    main()
