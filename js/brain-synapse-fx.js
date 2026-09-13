/** Red neuronal cinemática — teatro + ambiente en todas las vistas de Gimnasia */

const REGION_LAYOUT = [
  { id: 'pfc', x: 0.5, y: 0.14 },
  { id: 'parietal', x: 0.76, y: 0.26 },
  { id: 'hippocampus', x: 0.24, y: 0.38 },
  { id: 'insula', x: 0.5, y: 0.44 },
  { id: 'amygdala', x: 0.22, y: 0.58 },
  { id: 'basal', x: 0.58, y: 0.62 },
  { id: 'cerebellum', x: 0.5, y: 0.8 },
  { id: 'brainstem', x: 0.5, y: 0.93 },
]

const PALETTE = { hub: ['#22d3ee', '#a78bfa', '#fbbf24', '#34d399'], bg: '#050a0f' }
const MODE_CFG = {
  theater: { minH: 360, alpha: 1, pointer: true, bursts: true, speed: 1, grid: true, silhouette: true },
  ambient: { minH: 240, alpha: 0.42, pointer: false, bursts: false, speed: 0.65, grid: false, silhouette: false },
}

const runtimes = new Map()

function prefersReducedMotion() {
  return document.documentElement.classList.contains('reduce-motion')
    || window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches
}

function bezierPoint(ax, ay, cx, cy, bx, by, t) {
  const u = 1 - t
  return {
    x: u * u * ax + 2 * u * t * cx + t * t * bx,
    y: u * u * ay + 2 * u * t * cy + t * t * by,
  }
}

function buildNetwork(regionData = []) {
  const activity = new Map(regionData.map(r => [r.id, Math.min(1, (r.count || 0) / 4)]))
  const hubs = REGION_LAYOUT.map((slot, i) => {
    const meta = regionData.find(r => r.id === slot.id) || {}
    const act = activity.get(slot.id) || 0
    return {
      id: slot.id,
      x: slot.x,
      y: slot.y,
      r: 5 + act * 4,
      activity: act,
      pulse: Math.random() * Math.PI * 2,
      color: PALETTE.hub[i % PALETTE.hub.length],
    }
  })

  const nodes = []
  const edges = []

  hubs.forEach((hub, hi) => {
    nodes.push({ ...hub, kind: 'hub', hubIdx: hi, speed: 0.7 })
    const satellites = 3 + Math.round(hub.activity * 5)
    for (let s = 0; s < satellites; s++) {
      const ang = (s / satellites) * Math.PI * 2 + hub.pulse
      const dist = 0.04 + Math.random() * 0.05
      nodes.push({
        kind: 'sat', hubIdx: hi,
        x: hub.x + Math.cos(ang) * dist,
        y: hub.y + Math.sin(ang) * dist,
        r: 1.2 + Math.random() * 1.4,
        pulse: Math.random() * Math.PI * 2,
        speed: 0.6 + Math.random() * 1.1,
        activity: hub.activity * (0.5 + Math.random() * 0.5),
        color: hub.color,
      })
    }
  })

  const hubLinks = [
    [0, 1], [0, 2], [0, 3], [1, 3], [2, 3], [2, 4], [3, 4], [3, 5],
    [4, 5], [5, 6], [6, 7], [3, 6], [2, 6],
  ]
  hubLinks.forEach(([a, b]) => {
    const ha = hubs[a]
    const hb = hubs[b]
    const mx = (ha.x + hb.x) / 2
    const my = (ha.y + hb.y) / 2
    const bend = (Math.random() - 0.5) * 0.08
    edges.push({
      aIdx: nodes.findIndex(n => n.kind === 'hub' && n.hubIdx === a),
      bIdx: nodes.findIndex(n => n.kind === 'hub' && n.hubIdx === b),
      cx: mx + bend, cy: my - 0.04 + bend,
      activity: Math.max(ha.activity, hb.activity),
      phase: Math.random() * Math.PI * 2,
      impulse: Math.random(),
      speed: 0.12 + Math.random() * 0.1,
    })
  })

  nodes.forEach((n, i) => {
    if (n.kind !== 'sat') return
    const hubNode = nodes.find(x => x.kind === 'hub' && x.hubIdx === n.hubIdx)
    if (!hubNode) return
    edges.push({
      aIdx: i, bIdx: nodes.indexOf(hubNode),
      cx: (n.x + hubNode.x) / 2, cy: (n.y + hubNode.y) / 2,
      activity: n.activity, phase: Math.random() * Math.PI * 2,
      impulse: Math.random(), speed: 0.18 + Math.random() * 0.12, thin: true,
    })
  })

  return { nodes, edges, hubs }
}

function spawnBurst(particles, x, y, color, n = 6) {
  for (let i = 0; i < n; i++) {
    const ang = (Math.PI * 2 * i) / n + Math.random() * 0.4
    const spd = 0.0008 + Math.random() * 0.0018
    particles.push({ x, y, vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd, life: 1, color })
  }
}

function teardown(canvasId) {
  const rt = runtimes.get(canvasId)
  if (!rt) return
  cancelAnimationFrame(rt.raf)
  rt.ro?.disconnect()
  rt.canvas?.removeEventListener('pointermove', rt.onPointer)
  rt.canvas?.removeEventListener('pointerleave', rt.onLeave)
  runtimes.delete(canvasId)
}

export function unmountSynapseField(canvasId) {
  if (canvasId) teardown(canvasId)
  else [...runtimes.keys()].forEach(teardown)
}

export function mountSynapseField(canvasId = 'brain-synapse-canvas', options = {}) {
  teardown(canvasId)
  const canvas = document.getElementById(canvasId)
  if (!canvas) return

  const mode = options.mode || 'theater'
  const cfg = MODE_CFG[mode] || MODE_CFG.theater
  const ctx = canvas.getContext('2d', { alpha: mode === 'ambient' })
  if (!ctx) return

  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  const { nodes, edges, hubs } = buildNetwork(options.regions || [])
  const particles = []
  const dust = Array.from({ length: mode === 'ambient' ? 18 : 28 }, () => ({
    x: Math.random(), y: Math.random(),
    r: 0.4 + Math.random() * 1.2,
    sp: 0.02 + Math.random() * 0.04,
    ph: Math.random() * Math.PI * 2,
  }))

  let pointer = { x: 0.5, y: 0.5, active: false }
  let w = 0
  let h = 0

  function resize() {
    const shell = document.getElementById('brain-gym-shell')
    const base = mode === 'ambient' && shell ? shell : canvas.parentElement
    const rect = base?.getBoundingClientRect()
    w = Math.max(280, rect?.width || canvas.clientWidth || 720)
    h = Math.max(cfg.minH, rect?.height || canvas.clientHeight || (mode === 'ambient' ? 480 : 420))
    canvas.width = Math.floor(w * dpr)
    canvas.height = Math.floor(h * dpr)
    canvas.style.width = `${w}px`
    canvas.style.height = `${h}px`
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  }

  resize()
  const ro = typeof ResizeObserver !== 'undefined'
    ? new ResizeObserver(() => resize())
    : null
  ro?.observe(mode === 'ambient' ? document.getElementById('brain-gym-shell') || canvas : canvas.parentElement || canvas)

  function onPointer(e) {
    const rect = canvas.getBoundingClientRect()
    pointer.x = (e.clientX - rect.left) / rect.width
    pointer.y = (e.clientY - rect.top) / rect.height
    pointer.active = true
  }
  function onLeave() { pointer.active = false }

  if (cfg.pointer) {
    canvas.addEventListener('pointermove', onPointer)
    canvas.addEventListener('pointerleave', onLeave)
  }

  function drawBackground(t) {
    if (mode === 'ambient') {
      ctx.clearRect(0, 0, w, h)
    } else {
      ctx.fillStyle = PALETTE.bg
      ctx.fillRect(0, 0, w, h)
    }

    const glow = ctx.createRadialGradient(w * 0.5, h * 0.42, 0, w * 0.5, h * 0.45, w * 0.58)
    glow.addColorStop(0, `rgba(6, 182, 212, ${0.14 * cfg.alpha})`)
    glow.addColorStop(0.45, `rgba(124, 58, 237, ${0.06 * cfg.alpha})`)
    glow.addColorStop(1, 'rgba(5, 10, 15, 0)')
    ctx.fillStyle = glow
    ctx.fillRect(0, 0, w, h)

    if (cfg.grid) {
      ctx.strokeStyle = `rgba(34, 211, 238, ${0.04 * cfg.alpha})`
      ctx.lineWidth = 1
      const step = 32
      for (let x = 0; x < w; x += step) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke()
      }
      for (let y = 0; y < h; y += step) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke()
      }
    }

    dust.forEach(a => {
      const ay = (a.y + Math.sin(t * a.sp * cfg.speed + a.ph) * 0.02) % 1
      ctx.beginPath()
      ctx.fillStyle = `rgba(34, 211, 238, ${(0.04 + a.r * 0.02) * cfg.alpha})`
      ctx.arc(a.x * w, ay * h, a.r, 0, Math.PI * 2)
      ctx.fill()
    })

    if (cfg.silhouette) {
      ctx.strokeStyle = `rgba(34, 211, 238, ${0.12 * cfg.alpha})`
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(w * 0.18, h * 0.08)
      ctx.bezierCurveTo(w * 0.08, h * 0.35, w * 0.12, h * 0.72, w * 0.28, h * 0.88)
      ctx.bezierCurveTo(w * 0.38, h * 0.96, w * 0.62, h * 0.96, w * 0.72, h * 0.88)
      ctx.bezierCurveTo(w * 0.88, h * 0.72, w * 0.92, h * 0.35, w * 0.82, h * 0.08)
      ctx.bezierCurveTo(w * 0.68, h * 0.02, w * 0.32, h * 0.02, w * 0.18, h * 0.08)
      ctx.closePath()
      ctx.stroke()
    }
  }

  function drawEdges(t) {
    edges.forEach(e => {
      const a = nodes[e.aIdx]
      const b = nodes[e.bIdx]
      if (!a || !b) return
      const pulse = 0.5 + 0.5 * Math.sin(t * 1.6 * cfg.speed + e.phase)
      const hot = e.activity > 0.15
      const alpha = (hot ? 0.18 + pulse * 0.35 * e.activity : 0.06 + pulse * 0.1) * cfg.alpha
      ctx.strokeStyle = hot ? `rgba(167, 139, 250, ${alpha})` : `rgba(34, 211, 238, ${alpha})`
      ctx.lineWidth = e.thin ? 0.6 : 1 + pulse * 0.8
      ctx.beginPath()
      ctx.moveTo(a.x * w, a.y * h)
      ctx.quadraticCurveTo(e.cx * w, e.cy * h, b.x * w, b.y * h)
      ctx.stroke()

      e.impulse = (e.impulse + e.speed * 0.016 * cfg.speed) % 1
      const imp = bezierPoint(a.x, a.y, e.cx, e.cy, b.x, b.y, e.impulse)
      const trail = bezierPoint(a.x, a.y, e.cx, e.cy, b.x, b.y, Math.max(0, e.impulse - 0.06))
      ctx.strokeStyle = `rgba(224, 247, 255, ${(0.15 + e.activity * 0.5) * cfg.alpha})`
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(trail.x * w, trail.y * h)
      ctx.lineTo(imp.x * w, imp.y * h)
      ctx.stroke()
      ctx.beginPath()
      ctx.fillStyle = `rgba(224, 247, 255, ${(0.5 + pulse * 0.4) * cfg.alpha})`
      ctx.shadowColor = hot ? '#a78bfa' : '#22d3ee'
      ctx.shadowBlur = (8 + pulse * 6) * cfg.alpha
      ctx.arc(imp.x * w, imp.y * h, hot ? 2.4 : 1.6, 0, Math.PI * 2)
      ctx.fill()
      ctx.shadowBlur = 0

      if (cfg.bursts && e.impulse > 0.97 && hot && Math.random() < 0.08) {
        spawnBurst(particles, b.x, b.y, b.color || '#22d3ee', 4)
      }
    })
  }

  function drawNodes(t) {
    nodes.forEach(n => {
      let nx = n.x
      let ny = n.y
      if (cfg.pointer && pointer.active && n.kind === 'sat') {
        const dx = pointer.x - nx
        const dy = pointer.y - ny
        if (Math.hypot(dx, dy) < 0.15) { nx -= dx * 0.012; ny -= dy * 0.012 }
      }
      const glow = 0.5 + 0.5 * Math.sin(t * (n.speed || 0.8) * cfg.speed + n.pulse)
      const act = n.activity || 0
      const radius = n.r * (n.kind === 'hub' ? 1 + glow * 0.15 : 1)
      if (n.kind === 'hub') {
        const ring = 12 + glow * 18 + act * 12
        ctx.beginPath()
        ctx.strokeStyle = `${n.color}${Math.floor((0.12 + act * 0.3) * cfg.alpha * 255).toString(16).padStart(2, '0')}`
        ctx.lineWidth = 1.5
        ctx.arc(nx * w, ny * h, ring, 0, Math.PI * 2)
        ctx.stroke()
      }
      ctx.beginPath()
      ctx.fillStyle = n.color || '#22d3ee'
      ctx.shadowColor = n.color || '#22d3ee'
      ctx.shadowBlur = (n.kind === 'hub' ? 14 : 5) * (0.4 + glow * 0.6) * cfg.alpha
      ctx.globalAlpha = ((n.kind === 'hub' ? 0.85 : 0.45) + act * 0.15) * cfg.alpha
      ctx.arc(nx * w, ny * h, radius, 0, Math.PI * 2)
      ctx.fill()
      ctx.shadowBlur = 0
      ctx.globalAlpha = 1
    })
  }

  function drawParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i]
      p.x += p.vx; p.y += p.vy; p.life -= 0.028
      if (p.life <= 0) { particles.splice(i, 1); continue }
      ctx.beginPath()
      ctx.fillStyle = p.color
      ctx.globalAlpha = p.life * 0.8 * cfg.alpha
      ctx.arc(p.x * w, p.y * h, 1.5 * p.life, 0, Math.PI * 2)
      ctx.fill()
      ctx.globalAlpha = 1
    }
  }

  const rt = { ro, canvas, onPointer, onLeave, raf: 0 }

  if (prefersReducedMotion()) {
    drawBackground(0); drawEdges(0); drawNodes(0)
    runtimes.set(canvasId, rt)
    return
  }

  let t0 = performance.now()
  let lastBurst = 0
  function frame(now) {
    const t = (now - t0) / 1000
    drawBackground(t); drawEdges(t); drawNodes(t); drawParticles()
    if (cfg.bursts && now - lastBurst > 900) {
      const hotHub = hubs.find(h => h.activity > 0.2) || hubs[Math.floor(Math.random() * hubs.length)]
      if (hotHub) spawnBurst(particles, hotHub.x, hotHub.y, hotHub.color, 8)
      lastBurst = now
    }
    rt.raf = requestAnimationFrame(frame)
  }
  rt.raf = requestAnimationFrame(frame)
  runtimes.set(canvasId, rt)
}
