/** FX inmersivos — Calma FORGE (runtime con ciclo de vida) */

import { haptic, forgeSparkAt } from './fx.js?v=130'

const CATEGORY_RGB = {
  breath: [110, 231, 183],
  body: [147, 197, 253],
  focus: [212, 160, 18],
  stress: [249, 168, 212],
  sleep: [167, 139, 250],
  restore: [52, 211, 153],
}

let lastMedStep = -1

/** Un solo loop activo — evita RAF huérfanos al cambiar de vista */
const runtime = {
  raf: null,
  generation: 0,
  cleanups: [],
}

function reducedMotion() {
  return document.documentElement.classList.contains('reduce-motion')
    || window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function stopCalmaLoop() {
  runtime.generation++
  if (runtime.raf) cancelAnimationFrame(runtime.raf)
  runtime.raf = null
}

/** Detiene animación + listeners al salir de Calma o cambiar de vista */
export function stopCalmaFx() {
  stopCalmaLoop()
  for (const fn of runtime.cleanups) fn()
  runtime.cleanups = []
}

function trackCleanup(fn) {
  runtime.cleanups.push(fn)
}

function trackResize(target, fn) {
  const handler = () => fn()
  target.addEventListener('resize', handler, { passive: true })
  trackCleanup(() => target.removeEventListener('resize', handler))
}

function startScene(tick) {
  stopCalmaLoop()
  const gen = runtime.generation
  const frame = () => {
    if (gen !== runtime.generation) return
    const keepGoing = tick()
    if (keepGoing && gen === runtime.generation) {
      runtime.raf = requestAnimationFrame(frame)
    } else {
      runtime.raf = null
    }
  }
  runtime.raf = requestAnimationFrame(frame)
}

function catRgb(vp) {
  const key = vp.querySelector('[data-calma-cat]')?.dataset.calmaCat || 'breath'
  return CATEGORY_RGB[key] || CATEGORY_RGB.breath
}

function fitCanvas(canvas, width, height) {
  const w = Math.max(1, Math.floor(width))
  const h = Math.max(1, Math.floor(height))
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w
    canvas.height = h
  }
  return { width: w, height: h }
}

function runHubParticles(vp, hero) {
  const canvas = hero?.querySelector('.calma-fx-canvas') || vp.querySelector('.calma-fx-canvas--live')
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const host = hero || vp
  const count = 48
  let particles = []

  const layout = () => {
    const { width, height } = fitCanvas(canvas, host.offsetWidth || vp.clientWidth, host.offsetHeight || vp.clientHeight)
    if (!particles.length) {
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.45,
        vy: (Math.random() - 0.5) * 0.45,
        r: Math.random() * 2 + 0.5,
      }))
    }
  }
  layout()
  trackResize(window, layout)

  startScene(() => {
    const [r, g, b] = catRgb(vp)
    const w = canvas.width
    const h = canvas.height
    ctx.clearRect(0, 0, w, h)

    for (const p of particles) {
      p.x += p.vx
      p.y += p.vy
      if (p.x < 0 || p.x > w) p.vx *= -1
      if (p.y < 0 || p.y > h) p.vy *= -1
    }

    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x
        const dy = particles[i].y - particles[j].y
        const d = Math.hypot(dx, dy)
        if (d < 130) {
          ctx.strokeStyle = `rgba(${r},${g},${b},${0.1 * (1 - d / 130)})`
          ctx.lineWidth = 1
          ctx.beginPath()
          ctx.moveTo(particles[i].x, particles[i].y)
          ctx.lineTo(particles[j].x, particles[j].y)
          ctx.stroke()
        }
      }
    }

    for (const p of particles) {
      const glow = 0.2 + Math.sin(Date.now() * 0.002 + p.x * 0.01) * 0.18
      ctx.beginPath()
      ctx.fillStyle = `rgba(${r},${g},${b},${glow})`
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
      ctx.fill()
    }

    const scrollPast = vp.scrollTop > (hero?.offsetHeight || 400) * 0.85
    return !scrollPast || !hero
  })
}

function runSessionBreath(vp) {
  const canvas = vp.querySelector('.calma-fx-canvas--live')
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  let ripples = []
  let t = 0

  const layout = () => fitCanvas(canvas, vp.clientWidth, vp.clientHeight)
  layout()
  trackResize(window, layout)

  startScene(() => {
    t++
    const [r, g, b] = catRgb(vp)
    const w = canvas.width
    const h = canvas.height
    ctx.clearRect(0, 0, w, h)

    const breath = 0.5 + Math.sin(t * 0.018) * 0.5
    const cx = w * 0.5
    const cy = h * 0.42
    const radius = 90 + breath * 160

    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius)
    grad.addColorStop(0, `rgba(${r},${g},${b},${0.1 + breath * 0.08})`)
    grad.addColorStop(0.55, `rgba(${r},${g},${b},${0.03})`)
    grad.addColorStop(1, 'transparent')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, w, h)

    if (t % 75 === 0) {
      ripples.push({
        x: cx + (Math.random() - 0.5) * 140,
        y: cy + (Math.random() - 0.5) * 90,
        r: 18,
        life: 1,
      })
    }

    for (const rip of ripples) {
      rip.life -= 0.007
      rip.r += 1.4
    }
    ripples = ripples.filter(rip => rip.life > 0)

    for (const rip of ripples) {
      ctx.beginPath()
      ctx.strokeStyle = `rgba(${r},${g},${b},${rip.life * 0.2})`
      ctx.lineWidth = 1.5
      ctx.arc(rip.x, rip.y, rip.r, 0, Math.PI * 2)
      ctx.stroke()
    }

    return true
  })
}

function runCompleteBurst(vp) {
  const canvas = vp.querySelector('.calma-fx-canvas--live')
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const { width, height } = fitCanvas(canvas, vp.clientWidth, vp.clientHeight)
  const [r, g, b] = catRgb(vp)
  const cx = width / 2
  const cy = height / 2
  const sparks = Array.from({ length: 36 }, (_, i) => ({
    angle: (i / 36) * Math.PI * 2 + Math.random() * 0.4,
    speed: 1.5 + Math.random() * 3,
    progress: 0,
    size: 1.5 + Math.random() * 2.5,
  }))
  let frame = 0

  startScene(() => {
    frame++
    ctx.fillStyle = 'rgba(8,8,9,0.12)'
    ctx.fillRect(0, 0, width, height)

    let active = false
    for (const s of sparks) {
      if (s.progress >= 1) continue
      active = true
      s.progress = Math.min(1, s.progress + 0.014)
      const fade = 1 - s.progress
      const dist = s.progress * 80 * s.speed
      const x = cx + Math.cos(s.angle) * dist
      const y = cy + Math.sin(s.angle) * dist
      ctx.beginPath()
      ctx.fillStyle = `rgba(${r},${g},${b},${fade * 0.85})`
      ctx.arc(x, y, s.size * fade, 0, Math.PI * 2)
      ctx.fill()
    }

    return active && frame < 180
  })
}

function revealCards(vp, selector) {
  const cards = [...vp.querySelectorAll(selector)]
  cards.forEach((el, i) => {
    el.classList.add('is-revealed', 'calma-fx-reveal')
    el.style.setProperty('--reveal-delay', `${i * 0.05}s`)
  })
  if (reducedMotion()) return

  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('is-revealed') })
  }, { root: vp, threshold: 0.06, rootMargin: '0px 0px -40px 0px' })
  cards.forEach(el => obs.observe(el))
  trackCleanup(() => obs.disconnect())
}

export function initCalmaHubFX() {
  const vp = document.querySelector('.calma-viewport:not(.calma-viewport--session):not(.calma-viewport--complete)')
  const hero = document.querySelector('.calma-hero')
  if (!vp) return

  stopCalmaFx()
  requestAnimationFrame(() => vp.classList.add('is-mounted', 'calma-fx-active'))

  const heroGlow = hero?.querySelector('.calma-hero-glow')
  const heroMesh = hero?.querySelector('.calma-hero-mesh')
  if (!reducedMotion()) runHubParticles(vp, hero)

  const update = () => {
    const parallax = Math.min(vp.scrollTop / (hero?.offsetHeight || 400), 1)
    if (heroGlow) heroGlow.style.transform = `translateY(${vp.scrollTop * 0.28}px) scale(${1 + parallax * 0.08})`
    if (heroMesh) heroMesh.style.transform = `translateY(${vp.scrollTop * 0.12}px)`
    vp.dataset.scroll = vp.scrollTop > 60 ? '1' : '0'
  }
  vp.addEventListener('scroll', update, { passive: true })
  trackCleanup(() => vp.removeEventListener('scroll', update))
  update()

  revealCards(vp, '.calma-protocol-card, .calma-program-catalog-card, .calma-glass-panel, .school-focus, .calma-featured-card, .school-panel')

  const featured = vp.querySelector('.calma-featured-card')
  if (featured && !reducedMotion()) {
    featured.classList.add('calma-featured-glow')
    setTimeout(() => forgeSparkAt(featured.querySelector('.calma-featured-cta, .school-focus-cta'), 12), 600)
  }
}

export function initCalmaSessionFX() {
  const vp = document.querySelector('.calma-viewport--session')
  if (!vp) return

  stopCalmaFx()
  lastMedStep = -1
  vp.classList.add('calma-fx-active', 'is-mounted')
  if (!reducedMotion()) runSessionBreath(vp)

  const ring = vp.querySelector('.calma-breathe-ring, .meditation-ring, .breathe-circle, .med-timer-ring')
  if (ring && !reducedMotion()) {
    ring.classList.add('calma-ring-alive')
    setTimeout(() => forgeSparkAt(ring, 10), 400)
  }

  const stepCard = vp.querySelector('.calma-step-card')
  if (stepCard) stepCard.classList.add('calma-step-enter')
}

export function initCalmaProgramFX() {
  const vp = document.querySelector('.calma-viewport')
  if (!vp) return

  stopCalmaFx()
  vp.classList.add('calma-fx-active', 'is-mounted')
  if (!reducedMotion()) runHubParticles(vp, null)
  revealCards(vp, '.med-program-active, .calma-program-day, .calma-glass-panel')
}

export function initCalmaCompleteFX() {
  const vp = document.querySelector('.calma-viewport--complete')
  if (!vp) return

  stopCalmaFx()
  vp.classList.add('calma-fx-active', 'is-mounted')
  if (!reducedMotion()) runCompleteBurst(vp)

  const card = vp.querySelector('.calma-complete-card')
  if (card) {
    card.classList.add('calma-complete-pop')
    if (!reducedMotion()) setTimeout(() => forgeSparkAt(card, 18), 200)
  }
}

export function pulseCalmaStep(stepIndex) {
  if (stepIndex === lastMedStep) return
  lastMedStep = stepIndex
  const card = document.querySelector('.calma-step-card')
  if (!card) return
  card.classList.remove('calma-step-enter')
  void card.offsetWidth
  card.classList.add('calma-step-enter')
  if (!reducedMotion()) forgeSparkAt(card, 6)
}

export function bindCalmaCardHaptics() {
  document.querySelectorAll(
    '.calma-protocol-card, .calma-program-card, .calma-program-catalog-card, .calma-quick-btn, .school-focus-cta, .calma-program-catalog-cta',
  ).forEach(btn => {
    btn.addEventListener('click', () => haptic(6), { passive: true })
  })
}

export function bindCalmaCardTilt() {
  if (reducedMotion()) return
  document.querySelectorAll('.calma-protocol-card, .calma-program-catalog-card, .calma-featured-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect()
      const x = (e.clientX - rect.left) / rect.width - 0.5
      const y = (e.clientY - rect.top) / rect.height - 0.5
      card.style.setProperty('--tilt-x', `${y * -5}deg`)
      card.style.setProperty('--tilt-y', `${x * 5}deg`)
    }, { passive: true })
    card.addEventListener('mouseleave', () => {
      card.style.setProperty('--tilt-x', '0deg')
      card.style.setProperty('--tilt-y', '0deg')
    }, { passive: true })
  })
}
