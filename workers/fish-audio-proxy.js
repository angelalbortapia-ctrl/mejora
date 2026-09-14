/**
 * Cloudflare Worker — proxy seguro para Fish Audio TTS.
 * Variables de entorno: FISH_API_KEY (secret)
 *
 * Despliegue: wrangler deploy workers/fish-audio-proxy.js
 * Cliente: settings.fishProxyUrl = 'https://tu-worker.workers.dev/api/fish'
 */

const FISH_TTS = 'https://api.fish.audio/v1/tts'
const FISH_MODEL = 'https://api.fish.audio/model'

function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, model',
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    const origin = request.headers.get('Origin') || '*'
    const cors = corsHeaders(origin)

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors })
    }

    const key = env.FISH_API_KEY
    if (!key) {
      return new Response(JSON.stringify({ message: 'FISH_API_KEY no configurada' }), {
        status: 500,
        headers: { ...cors, 'Content-Type': 'application/json' },
      })
    }

    if (url.pathname.endsWith('/tts') && request.method === 'POST') {
      const body = await request.text()
      const res = await fetch(FISH_TTS, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${key}`,
          model: request.headers.get('model') || 's2.1-pro-free',
        },
        body,
      })
      return new Response(res.body, {
        status: res.status,
        headers: {
          ...cors,
          'Content-Type': res.headers.get('Content-Type') || 'audio/mpeg',
        },
      })
    }

    if (url.pathname.endsWith('/model')) {
      const target = `${FISH_MODEL}${url.search}`
      const res = await fetch(target, {
        headers: { Authorization: `Bearer ${key}` },
      })
      const text = await res.text()
      return new Response(text, {
        status: res.status,
        headers: { ...cors, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ message: 'Ruta no encontrada' }), {
      status: 404,
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  },
}
