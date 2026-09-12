/** FX inmersivos — Calma FORGE v2 */

import { haptic, forgeSparkAt } from './fx.js?v=120'

const CATEGORY_RGB = {
  breath: [110, 231, 183],
  body: [147, 197, 253],
  focus: [212, 160, 18],
  stress: [249, 168, 212],
  sleep: [167, 139, 250],
  restore: [52, 211, 153],
}

let lastMedStep = -1

function reducedMotion() {
  return document.documentElement.classList.contains('reduce-motion')
    || window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function teardown(vp) {
  if (!vp) return
  if (vp._calmaRaf) cancelAnimationFrame(vp._calmaRaf)
  vp._calmaRaf = null
  if (vp._calmaScroll) vp.removeEventListener('scroll', vp._calmaScroll)
  vp._calmaScroll = null
  if (vp._calmaRevealObs) vp._calmaRevealObs.disconnect()
  vp._calmaRevealObs = null
}

function catRgb(vp) {
  const key = vp.querySelector('[data-calma-cat]')?.dataset.calmaCat || 'breath'
  return CATEGORY_RGB[key] || CATEGORY_RGB.breath
}

function initHubParticles(vp, hero) {
  if (reducedMotion()) return
  const canvas = hero?.querySelector('.calma-fx-canvas') || vp.querySelector('.calma-fx-canvas--live')
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const host = hero || vp
  let particles = []
  const count = 48

  const resize = () => {
    canvas.width = host.offsetWidth || vp.clientWidth
    canvas.height = host.offsetHeight || vp.clientHeight
    if (!particles.length) {
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.45,
        vy: (Math.random() - 0.5) * 0.45,
        r: Math.random() * 2 + 0.5,
      }))
    }
  }
  resize()

  const draw = () => {
    const [r, g, b] = catRgb(vp)
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    for (const p of particles) {
      p.x += p.vx
      p.y += p.vy
      if (p.x < 0 || p.x > canvas.width) p.vx *= -1
      if (p.y < 0 || p.y > canvas.height) p.vy *= -1
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
    if (!scrollPast || !hero) vp._calmaRaf = requestAnimationFrame(draw)
  }
  vp._calmaRaf = requestAnimationFrame(draw)
  window.addEventListener('resize', resize, { passive: true })
}

function initSessionBreathCanvas(vp) {
  if (reducedMotion()) return
  const canvas = vp.querySelector('.calma-fx-canvas--live')
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  let ripples = []
  let t = 0

  const resize = () => {
    canvas.width = vp.clientWidth
    canvas.height = vp.clientHeight
  }
  resize()

  const draw = () => {
    t++
    const [r, g, b] = catRgb(vp)
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    const breath = 0.5 + Math.sin(t * 0.018) * 0.5
    const cx = canvas.width * 0.5
    const cy = canvas.height * 0.42
    const radius = 90 + breath * 160

    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius)
    grad.addColorStop(0, `rgba(${r},${g},${b},${0.1 + breath * 0.08})`)
    grad.addColorStop(0.55, `rgba(${r},${g},${b},${0.03})`)
    grad.addColorStop(1, 'transparent')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    if (t % 75 === 0) {
      ripples.push({
        x: cx + (Math.random() - 0.5) * 140,
        y: cy + (Math.random() - 0.5) * 90,
        r: 18,
        life: 1,
      })
    }
    ripples = ripples.filter(rip => rip.life > 0)
    for (const rip of ripples) {
      rip.life -= 0.007
      rip.r += 1.4
      ctx.beginPath()
      ctx.strokeStyle = `rgba(${r},${g},${b},${rip.life * 0.2})`
      ctx.lineWidth = 1.5
      ctx.arc(rip.x, rip.y, rip.r, 0, Math.PI * 2)
      ctx.stroke()
    }

    vp._calmaRaf = requestAnimationFrame(draw)
  }
  draw()
  window.addEventListener('resize', resize, { passive: true })
}

function initCompleteBurst(vp) {
  if (reducedMotion()) return
  const canvas = vp.querySelector('.calma-fx-canvas--live')
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  canvas.width = vp.clientWidth
  canvas.height = vp.clientHeight
  const [r, g, b] = catRgb(vp)
  const cx = canvas.width / 2
  const cy = canvas.height / 2
  const sparks = Array.from({ length: 36 }, (_, i) => ({
    angle: (i / 36) * Math.PI * 2 + Math.random() * 0.4,
    speed: 1.5 + Math.random() * 3,
    life: 1,
    size: 1.5 + Math.random() * 2.5,
  }))
  let frame = 0

  const draw = () => {
    frame++
    ctx.fillStyle = 'rgba(8,8,9,0.12)'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    let alive = false
    for (const s of sparks) {
      if (s.life <= 0) continue
      alive = true
      s.life -= 0.014
      const dist = (1 - s.life) * 80 * s.speed
      const x = cx + Math.cos(s.angle) * dist
      const y = cy + Math.sin(s.angle) * dist
      ctx.beginPath()
      ctx.fillStyle = `rgba(${r},${g},${b},${s.life * 0.85})`
      ctx.arc(x, y, s.size * s.life, 0, Math.PI * 2)
      ctx.fill()
    }
    if (alive && frame < 180) vp._calmaRaf = requestAnimationFrame(draw)
  }
  vp._calmaRaf = requestAnimationFrame(draw)
}

function revealCards(vp, selector) {
  const cards = [...vp.querySelectorAll(selector)]
  cards.forEach((el, i) => {
    el.classList.add('is-revealed', 'calma-fx-reveal')
    el.style.setProperty('--reveal-delay', `${i * 0.05}s`)
  })
  if (!reducedMotion()) {
    vp._calmaRevealObs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('is-revealed') })
    }, { root: vp, threshold: 0.06, rootMargin: '0px 0px -40px 0px' })
    cards.forEach(el => vp._calmaRevealObs.observe(el))
  }
}

export function initCalmaHubFX() {
  const vp = document.querySelector('.calma-viewport:not(.calma-viewport--session):not(.calma-viewport--complete)')
  const hero = document.querySelector('.calma-hero')
  if (!vp) return

  teardown(vp)
  requestAnimationFrame(() => vp.classList.add('is-mounted', 'calma-fx-active'))

  const heroGlow = hero?.querySelector('.calma-hero-glow')
  const heroMesh = hero?.querySelector('.calma-hero-mesh')
  initHubParticles(vp, hero)

  const update = () => {
    const parallax = Math.min(vp.scrollTop / (hero?.offsetHeight || 400), 1)
    if (heroGlow) heroGlow.style.transform = `translateY(${vp.scrollTop * 0.28}px) scale(${1 + parallax * 0.08})`
    if (heroMesh) heroMesh.style.transform = `translateY(${vp.scrollTop * 0.12}px)`
    vp.dataset.scroll = vp.scrollTop > 60 ? '1' : '0'
  }
  vp._calmaScroll = update
  vp.addEventListener('scroll', update, { passive: true })
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
  teardown(vp)
  lastMedStep = -1
  vp.classList.add('calma-fx-active', 'is-mounted')
  initSessionBreathCanvas(vp)

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
  teardown(vp)
  vp.classList.add('calma-fx-active', 'is-mounted')
  initHubParticles(vp, null)
  revealCards(vp, '.med-program-active, .calma-program-day, .calma-glass-panel')
}

export function initCalmaCompleteFX() {
  const vp = document.querySelector('.calma-viewport--complete')
  if (!vp) return
  teardown(vp)
  vp.classList.add('calma-fx-active', 'is-mounted')
  initCompleteBurst(vp)
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
