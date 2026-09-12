/** Biblioteca Escuela — papers clave resumidos + APIs académicas */

import { esc } from './core.js'
import { getLesson } from './brain-academy.js?v=81'
import { renderZoneHead } from './school-shell.js?v=81'
export { fetchPaperLiveMeta, searchPubMed } from './library-apis.js?v=81'

export const PAPER_TOPICS = {
  memory: { label: 'Memoria', icon: '🧩' },
  plasticity: { label: 'Plasticidad', icon: '⚡' },
  emotion: { label: 'Emoción', icon: '🫧' },
  attention: { label: 'Atención', icon: '🎯' },
  systems: { label: 'Sistemas', icon: '🔬' },
  sleep: { label: 'Sueño', icon: '💤' },
  clinical: { label: 'Clínica', icon: '🏛️' },
}

export const PAPERS = [
  {
    id: 'baddeley-wm-1974',
    authors: 'Baddeley & Hitch',
    year: 1974,
    title: 'Working memory model',
    topic: 'memory',
    doi: '10.1080/09658211.2010.519921',
    says: 'La memoria de trabajo no es un bloque único: incluye un ejecutivo central, bucle fonológico y sketchpad visoespacial. La capacidad es limitada (~4 ítems en adultos, según revisiones posteriores).',
    matters: 'Explica por qué anotar en papel libera mente, por qué multitarea falla y por qué el entrenamiento N-back tiene sentido teórico.',
    limits: 'El modelo ha evolucionado (componente episódico, integración con PFC). No predice transferencia lejana al IQ con precisión.',
    relatedLessons: ['wm-ram', 'nback-transfer'],
  },
  {
    id: 'kandel-ltp-2000',
    authors: 'Kandel',
    year: 2000,
    title: 'Mecanismos moleculares de memoria (Nobel 2000)',
    topic: 'plasticity',
    doi: '10.1038/35078041',
    says: 'La memoria a corto plazo implica modulación sináptica existente; la de largo plazo requiere síntesis de proteínas y cambios estructurales. LTP en hipocampo es el paradigma molecular del aprendizaje.',
    matters: 'Base de “neurons that fire together, wire together”. Cada repetición de un hábito o lección tiene correlato molecular.',
    limits: 'Estudios iniciales en Aplysia y roedores; extrapolar a memoria episódica humana requiere cautela.',
    relatedLessons: ['hebb-plasticity', 'hippocampus-consolidation'],
  },
  {
    id: 'loftus-misinfo-1978',
    authors: 'Loftus',
    year: 1978,
    title: 'Misinformation effect',
    topic: 'memory',
    doi: '10.1037/0033-295X.85.3.207',
    says: 'Preguntas sugestivas y detalles falsos pueden implantarse en el recuerdo. La memoria es reconstrucción, no reproducción fiel.',
    matters: 'Fundamento de memorias falsas, testimonios contaminados y por qué releer con cuidado importa en aprendizaje.',
    limits: 'Debate sobre si el efecto es alteración vs. respuesta a encuesta. No implica que toda memoria sea falsa.',
    relatedLessons: ['false-memories', 'reconsolidation'],
  },
  {
    id: 'ramachandran-phantom-1995',
    authors: 'Ramachandran & Rogers-Ramachandran',
    year: 1995,
    title: 'Phantom limbs and plasticity',
    topic: 'clinical',
    doi: '10.1038/375489a0',
    says: 'El miembro fantasma refleja reorganización cortical. La caja de espejos puede “engañar” al cerebro y aliviar dolor fantasma mediante feedback visual.',
    matters: 'Demuestra plasticidad adulta dramática y que la percepción corporal es construcción cerebral negociable.',
    limits: 'No funciona en todos los pacientes; tamaños muestrales pequeños en estudios iniciales.',
    relatedLessons: ['phantom-limb', 'hebb-plasticity'],
  },
  {
    id: 'schultz-dopamine-1997',
    authors: 'Schultz',
    year: 1997,
    title: 'Dopamine prediction error',
    topic: 'systems',
    doi: '10.1126/science.275.5306.1593',
    says: 'Las neuronas dopaminérgicas codifican error de predicción de recompensa: disparan cuando el resultado supera lo esperado, no solo con placer.',
    matters: 'Reformula adicción, redes sociales y hábitos: el cerebro aprende expectativas, no solo consumo.',
    limits: 'Dopamina también modula movimiento, saliencia y aprendizaje sin recompensa. Modelo simplificado.',
    relatedLessons: ['dopamine-habits', 'basal-ganglia-habits'],
  },
  {
    id: 'okeefe-place-1971',
    authors: "O'Keefe & Dostrovsky",
    year: 1971,
    title: 'Place cells in hippocampus',
    topic: 'memory',
    doi: '10.1016/0006-8993(71)90630-3',
    says: 'Neuronas del hipocampo disparan en ubicaciones específicas del entorno. Forman mapas cognitivos del espacio.',
    matters: 'Nobel 2014. Explica memoria espacial, taxistas de Londres y por qué el contexto ancla recuerdos.',
    limits: 'Place cells son una pieza del puzzle; grid cells (Moser) completan el sistema de navegación.',
    relatedLessons: ['hippocampus-consolidation', 'london-taxi'],
  },
  {
    id: 'hebb-1949',
    authors: 'Hebb',
    year: 1949,
    title: 'The Organization of Behavior',
    topic: 'plasticity',
    says: '“Cells that fire together, wire together.” La coactivación repetida fortalece conexiones sinápticas — base del aprendizaje asociativo.',
    matters: 'El axioma de toda neurociencia del aprendizaje. Cada repetición de hábito o estudio tiene fundamento en este principio.',
    limits: 'Libro teórico predatando neuroimagen. No especifica mecanismos moleculares (eso llegó con Kandel).',
    relatedLessons: ['hebb-plasticity', 'myelin-speed'],
  },
  {
    id: 'milner-hm-1957',
    authors: 'Scoville & Milner',
    year: 1957,
    title: 'Patient H.M. and medial temporal lobe',
    topic: 'clinical',
    doi: '10.1016/0028-3932(57)90021-3',
    says: 'La lesión bilateral del hipocampo impide formar nuevos recuerdos episódicos, pero conserva memoria procedimental y remota.',
    matters: 'Separó memoria declarativa vs. no declarativa. El caso más citado en neurociencia cognitiva.',
    limits: 'Lesión no fue solo hipocampo; debate sobre qué estructuras exactas (entorrinal, perirrinal).',
    relatedLessons: ['patient-hm', 'hippocampus-consolidation'],
  },
  {
    id: 'sperry-split-1968',
    authors: 'Sperry',
    year: 1968,
    title: 'Split-brain studies',
    topic: 'clinical',
    says: 'Al cortar el cuerpo calloso, los hemisferios procesan información de forma independiente. Pueden generar preferencias contradictorias.',
    matters: 'Nobel 1981. Demuestra especialización hemisférica y que la “unidad” de la mente depende de integración callosa.',
    limits: 'Pacientes adultos con epilepsia; plasticidad compensatoria limita generalización.',
    relatedLessons: ['split-brain', 'mirror-neurons'],
  },
  {
    id: 'damasio-somatic-1994',
    authors: 'Damasio',
    year: 1994,
    title: 'Somatic marker hypothesis',
    topic: 'emotion',
    says: 'Las emociones corporales (marcadores somáticos) guían decisiones rápidas en la ínsula y corteza ventromedial antes del análisis lógico completo.',
    matters: 'Une emoción y razón: pacientes con lesión PFC ventromedial toman decisiones irracionales a pesar de IQ intacto.',
    limits: 'Modelo difícil de falsar directamente; críticas sobre causalidad ínsula-decisión.',
    relatedLessons: ['prefrontal-decisions', 'interoception'],
  },
  {
    id: 'ledoux-fear-1996',
    authors: 'LeDoux',
    year: 1996,
    title: 'Emotional brain / fear circuit',
    topic: 'emotion',
    says: 'Ruta rápida tálamo→amígdala permite respuesta de miedo en ~12 ms; ruta lenta vía corteza permite evaluación consciente posterior.',
    matters: 'Explica ansiedad, trauma y por qué nombrar emociones activa PFC sobre amígdala.',
    limits: 'Circuito simplificado; miedo humano involucra más regiones (hipocampo contextual, PFC).',
    relatedLessons: ['amygdala-threat', 'trauma-hippocampus'],
  },
  {
    id: 'sala-gobet-cogtrain-2019',
    authors: 'Sala & Gobet',
    year: 2019,
    title: 'Meta-análisis entrenamiento cognitivo',
    topic: 'attention',
    doi: '10.1037/bul0000180',
    says: 'El entrenamiento cognitivo mejora la habilidad entrenada con efectos modestos en dominios cercanos. Transferencia lejana a IQ es pequeña y debatida.',
    matters: 'Calibración honesta del laboratorio Mejora: útil para WM y control, no “sube tu IQ 20 puntos”.',
    limits: 'Heterogeneidad entre estudios; calidad variable de intervenciones comerciales.',
    relatedLessons: ['nback-transfer', 'attention-networks'],
  },
  {
    id: 'walker-sleep-2009',
    authors: 'Walker',
    year: 2009,
    title: 'Sleep and memory consolidation',
    topic: 'sleep',
    says: 'El sueño N3 consolida memoria declarativa vía replay hipocampo-corteza. REM integra memoria emocional. Privación de sueño degrada atención como intoxicación leve.',
    matters: 'Justifica priorizar sueño sobre “una hora más de estudio” y explica glymphatic cleanup.',
    limits: 'Mucha evidencia en humanos es correlacional; mecanismos causales mejor en animales.',
    relatedLessons: ['sleep-consolidation', 'glymphatic-sleep'],
  },
  {
    id: 'nedergaard-glymphatic-2012',
    authors: 'Iliff et al. / Nedergaard',
    year: 2012,
    title: 'Glymphatic system',
    topic: 'sleep',
    doi: '10.1126/scitranslmed.3003748',
    says: 'Durante el sueño profundo, el cerebro elimina metabolitos (incl. β-amiloide) vía sistema glinfático — canales perivasculares impulsados por ondas lentas.',
    matters: 'Conecta sueño con salud cerebral a largo plazo y riesgo neurodegenerativo.',
    limits: 'Descubierto en roedores; evidencia directa en humanos aún en desarrollo (fMRI, DTI).',
    relatedLessons: ['glymphatic-sleep', 'sleep-consolidation'],
  },
  {
    id: 'merzenich-plasticity-1984',
    authors: 'Merzenich et al.',
    year: 1984,
    title: 'Cortical remapping',
    topic: 'plasticity',
    says: 'La corteza sensorial reorganiza mapas tras lesión o entrenamiento intenso. La representación cortical no es fija en adultos.',
    matters: 'Base de rehabilitación neurológica y entrenamiento perceptual.',
    limits: 'Plasticidad tiene límites (periodos críticos, edad, lesión severa).',
    relatedLessons: ['critical-periods', 'phantom-limb'],
  },
  {
    id: 'cowan-wm-capacity-2001',
    authors: 'Cowan',
    year: 2001,
    title: 'WM capacity ~4 chunks',
    topic: 'memory',
    doi: '10.1016/S1364-6613(00)01887-8',
    says: 'Revisión de Miller (7±2): la capacidad efectiva de memoria de trabajo es ~4 elementos, no 7, cuando se controla estrategia de agrupación.',
    matters: 'Ajusta expectativas realistas sobre cuánto puedes mantener en mente sin externalizar.',
    limits: 'La capacidad varía con chunking, expertise y tipo de material.',
    relatedLessons: ['wm-ram', 'nback-transfer'],
  },
  {
    id: 'hubel-wiesel-1962',
    authors: 'Hubel & Wiesel',
    year: 1962,
    title: 'Receptive fields in visual cortex',
    topic: 'systems',
    doi: '10.1152/jn.1962.25.6.994',
    says: 'Neuronas en corteza visual responden a orientaciones y patrones específicos. La privación sensorial temprana altera el desarrollo cortical irreversiblemente.',
    matters: 'Nobel 1981. Fundamento de periodos críticos y organización jerárquica perceptual.',
    limits: 'Gatos anestesiados; plasticidad adulta visual existe pero es más limitada.',
    relatedLessons: ['critical-periods', 'blindsight'],
  },
  {
    id: 'rosenzweig-enrichment-1962',
    authors: 'Rosenzweig et al.',
    year: 1962,
    title: 'Enriched environment',
    topic: 'plasticity',
    says: 'Ratas en entornos enriquecidos (juguetes, compañía, exploración) desarrollan corteza más gruesa y más sinapsis que en jaulas estándar.',
    matters: 'Antecedente de BDNF, ejercicio y estimulación cognitiva como promotores de plasticidad.',
    limits: 'Roedores; “enriquecimiento” humano es más complejo que juguetes.',
    relatedLessons: ['bdnf-exercise', 'hebb-plasticity'],
  },
  {
    id: 'craik-lockhart-1972',
    authors: 'Craik & Lockhart',
    year: 1972,
    title: 'Levels of processing',
    topic: 'memory',
    doi: '10.1016/S0022-5371(72)80001-X',
    says: 'El recuerdo depende de la profundidad de procesamiento semántico, no de la intención de memorizar. Procesar significado > repetir superficialmente.',
    matters: 'Argumento contra el estudio mecánico: elaborar, conectar y aplicar consolida mejor.',
    limits: 'No explica toda la memoria (procedimental, emocional). Efecto puede interactuar con prueba.',
    relatedLessons: ['hippocampus-consolidation', 'reconsolidation'],
  },
  {
    id: 'tulving-episodic-1972',
    authors: 'Tulving',
    year: 1972,
    title: 'Episodic vs semantic memory',
    topic: 'memory',
    says: 'Memoria episódica (eventos autobiográficos con contexto) es distinta de memoria semántica (hechos descontextualizados). Sistemas pero interactuantes.',
    matters: 'Marco para entender HM, Clive Wearing y por qué “saber” ≠ “recordar cuándo aprendiste”.',
    limits: 'La frontera episódico/semántica es más difusa de lo que Tulving postuló inicialmente.',
    relatedLessons: ['patient-hm', 'clive-wearing'],
  },
  {
    id: 'kahneman-systems-2011',
    authors: 'Kahneman',
    year: 2011,
    title: 'Thinking, Fast and Slow (síntesis)',
    topic: 'attention',
    says: 'Sistema 1: rápido, automático, sesgado. Sistema 2: lento, analítico, costoso en energía. La mayoría de decisiones usan atajos heurísticos.',
    matters: 'Puente entre economía conductual y neurociencia de PFC/striatum en decisiones.',
    limits: 'Modelo popular, no mapa literal de circuitos. Críticas a la replicabilidad de algunos efectos citados.',
    relatedLessons: ['prefrontal-decisions', 'gonogo-impulse'],
  },
  {
    id: 'sapolsky-stress-2004',
    authors: 'Sapolsky',
    year: 2004,
    title: 'Glucocorticoids and PFC',
    topic: 'emotion',
    says: 'El estrés crónico eleva glucocorticoides que atrofian dendritas en PFC e hipertrofian amígdala. Estrés agudo puede mejorar memencia emocional pero dañar ejecutivo.',
    matters: 'Base neurobiológica de por qué el estrés crónico arruina planificación y por qué el sueño/ejercicio importan.',
    limits: 'Mayoría evidencia animal; en humanos los efectos dependen de duración, control percibido y genética.',
    relatedLessons: ['stress-pfc', 'amygdala-threat'],
  },
  {
    id: 'davidson-mindfulness-2003',
    authors: 'Davidson et al.',
    year: 2003,
    title: 'Meditation and PFC activation',
    topic: 'emotion',
    doi: '10.1073/pnas.1834306100',
    says: 'Monjes con miles de horas de meditación muestran mayor activación PFC izquierda (afecto positivo) y patrones distintos en ínsula y amígdala durante regulación emocional.',
    matters: 'Evidencia de que práctica contemplativa cambia cerebro medible — base de Calma en Mejora.',
    limits: 'Muestra pequeña de expertos; no prueba que 10 min/día repliquen efectos de maestros.',
    relatedLessons: ['breath-vagus', 'default-mode'],
  },
  {
    id: 'buzsaki-hippo-rhythms-2002',
    authors: 'Buzsáki',
    year: 2002,
    title: 'Theta-gamma coupling in hippocampus',
    topic: 'memory',
    says: 'Oscilaciones theta (4–8 Hz) coordinan ensamblajes gamma (30–80 Hz) en hipocampo durante navegación y memoria. El timing neural codifica secuencias.',
    matters: 'Conecta ritmos cerebrales con consolidación, sueño y por qué el cerebelo importa en timing.',
    limits: 'Correlacional en muchos estudios; manipular ritmos en humanos es experimental.',
    relatedLessons: ['hippocampus-consolidation', 'cerebellum-mass'],
  },
  {
    id: 'friston-predictive-2010',
    authors: 'Friston',
    year: 2010,
    title: 'Free energy / predictive brain',
    topic: 'systems',
    doi: '10.1038/nrn2797',
    says: 'El cerebro minimiza “energía libre” (sorpresa) generando predicciones top-down y actualizándolas con error de predicción sensorial bottom-up.',
    matters: 'Marco unificador de percepción, aprendizaje y alucinación. Base de la lección “cerebro predictivo”.',
    limits: 'Marco teórico amplio; difícil de testear como un solo experimento. Riesgo de explicar todo.',
    relatedLessons: ['predictive-brain', 'synesthesia'],
  },
]

export function getPaper(id) {
  return PAPERS.find(p => p.id === id) || null
}

export function filterPapers(filter = {}) {
  const q = (filter.q || '').trim().toLowerCase()
  const topic = filter.topic || 'all'
  return PAPERS.filter(p => {
    if (topic !== 'all' && p.topic !== topic) return false
    if (!q) return true
    const hay = `${p.title} ${p.authors} ${p.says} ${p.matters} ${PAPER_TOPICS[p.topic]?.label || ''}`.toLowerCase()
    return hay.includes(q)
  })
}

function pubmedCard(item) {
  return `<a href="${item.url}" target="_blank" rel="noopener" class="library-card library-card--pubmed no-underline">
    <span class="library-card-meta">PubMed · ${esc(item.year)} · PMID ${item.pmid}</span>
    <strong class="library-card-title">${esc(item.title)}</strong>
    ${item.authors ? `<span class="library-card-authors">${esc(item.authors)}</span>` : ''}
    ${item.journal ? `<span class="library-card-tag">📰 ${esc(item.journal)}</span>` : ''}
    <span class="library-card-link">Ver en PubMed →</span>
  </a>`
}

function relatedPaperCard(r) {
  const href = r.url || (r.doi ? `https://doi.org/${r.doi}` : '#')
  const label = r.source === 'semantic-scholar' ? 'Semantic Scholar' : 'Relacionado'
  return `<a href="${href}" target="_blank" rel="noopener" class="library-related-card no-underline">
    <span class="library-card-meta">${label}${r.year ? ` · ${r.year}` : ''}${r.citationCount != null ? ` · ${r.citationCount} citas` : ''}</span>
    <strong class="library-related-title">${esc(r.title)}</strong>
    ${r.authors ? `<span class="library-card-authors">${esc(r.authors)}</span>` : ''}
  </a>`
}

function paperCard(p) {
  const topic = PAPER_TOPICS[p.topic]
  return `<button type="button" onclick="openPaper('${p.id}')" class="library-card">
    <span class="library-card-meta">${p.year} · ${esc(p.authors)}</span>
    <strong class="library-card-title">${esc(p.title)}</strong>
    <span class="library-card-tag">${topic?.icon || '📄'} ${topic?.label || p.topic}</span>
    <p class="library-card-hook">${esc(p.says.slice(0, 120))}…</p>
  </button>`
}

export function renderLibraryList(filter = {}, pubmed = {}) {
  const papers = filterPapers(filter)
  const f = filter
  const pubmedQ = pubmed.query || ''
  const pubmedResults = pubmed.results || []
  const pubmedLoading = pubmed.loading
  return `
    <section class="school-zone school-zone--panel">
      ${renderZoneHead('Resúmenes curados', 'Qué dicen · por qué importan · limitaciones. Al abrir un paper: Crossref + Semantic Scholar.', `${PAPERS.length} papers`)}
      <div class="library-toolbar">
        <input type="search" class="catalog-search input-field" placeholder="Filtrar por autor o tema…"
          value="${esc(f.q || '')}" oninput="setLibraryFilter('q', this.value)" />
        <select class="catalog-select input-field" onchange="setLibraryFilter('topic', this.value)">
          <option value="all" ${!f.topic || f.topic === 'all' ? 'selected' : ''}>Todos los temas</option>
          ${Object.entries(PAPER_TOPICS).map(([id, t]) =>
            `<option value="${id}" ${f.topic === id ? 'selected' : ''}>${t.icon} ${t.label}</option>`).join('')}
        </select>
      </div>
      <p class="catalog-result-meta">${papers.length} resultado${papers.length === 1 ? '' : 's'}</p>
      <div class="library-grid">
        ${papers.length ? papers.map(paperCard).join('') : '<p class="catalog-empty">Sin resultados.</p>'}
      </div>
    </section>

    <section class="school-zone school-zone--panel school-zone--pubmed">
      ${renderZoneHead('Buscar en PubMed', 'Literatura biomédica en vivo vía NCBI E-utilities.', 'API gratuita')}
      <div class="library-pubmed-search">
        <input type="search" id="pubmed-query" class="catalog-search input-field"
          placeholder="Ej. hippocampus memory, dopamine prediction error…"
          value="${esc(pubmedQ)}"
          onkeydown="if(event.key==='Enter')searchPubMedLibrary()" />
        <button type="button" onclick="searchPubMedLibrary()" class="btn-primary library-pubmed-btn" ${pubmedLoading ? 'disabled' : ''}>
          ${pubmedLoading ? 'Buscando…' : 'Buscar'}
        </button>
      </div>
      ${pubmedLoading ? '<p class="library-loading">Consultando PubMed…</p>' : ''}
      ${!pubmedLoading && pubmedQ && pubmedResults.length === 0
        ? '<p class="catalog-empty">Sin resultados en PubMed.</p>' : ''}
      ${pubmedResults.length ? `
        <p class="catalog-result-meta">${pubmedResults.length} en PubMed</p>
        <div class="library-grid library-grid--pubmed">
          ${pubmedResults.map(pubmedCard).join('')}
        </div>` : ''}
    </section>`
}

export function renderPaperDetail(paper, meta = null) {
  const topic = PAPER_TOPICS[paper.topic]
  const doiLink = paper.doi ? `https://doi.org/${paper.doi}` : null
  const crossref = meta?.crossref
  const openAlex = meta?.openAlex
  const related = meta?.related || []
  const metaLoading = meta?.loading
  const displayTitle = crossref?.title || paper.title
  const displayAuthors = crossref?.authorsDisplay || paper.authors
  const displayYear = crossref?.year || paper.year
  const displayJournal = crossref?.journal || openAlex?.journal
  return `<article class="library-detail animate-fade-in">
    <button type="button" onclick="closePaper()" class="school-back">← Biblioteca</button>
    <header class="library-detail-head">
      ${crossref ? '<span class="library-verified-badge">✓ Verificado Crossref</span>' : metaLoading ? '<span class="library-verified-badge library-verified-badge--loading">Verificando DOI…</span>' : ''}
      <span class="library-card-meta">${displayYear} · ${esc(displayAuthors)}</span>
      <h1 class="library-detail-title">${esc(displayTitle)}</h1>
      ${crossref?.title && crossref.title !== paper.title
        ? `<p class="library-curated-note">Resumen curado: “${esc(paper.title)}”</p>` : ''}
      <span class="library-card-tag">${topic?.icon} ${topic?.label}</span>
      ${displayJournal ? `<p class="library-meta-extra">📰 ${esc(displayJournal)}${crossref?.publisher ? ` · ${esc(crossref.publisher)}` : ''}</p>` : ''}
      ${openAlex?.citedByCount != null ? `<p class="library-meta-extra">📊 ${openAlex.citedByCount.toLocaleString('es')} citas (OpenAlex)</p>` : ''}
      <div class="library-detail-links">
        ${doiLink ? `<a href="${doiLink}" target="_blank" rel="noopener" class="library-link">DOI →</a>` : ''}
        ${openAlex?.openAccessUrl ? `<a href="${openAlex.openAccessUrl}" target="_blank" rel="noopener" class="library-link">Acceso abierto →</a>` : ''}
        ${paper.doi ? `<a href="https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(paper.doi)}" target="_blank" rel="noopener" class="library-link">PubMed →</a>` : ''}
      </div>
    </header>
    <section class="library-section">
      <h2>Qué dice</h2>
      <p>${esc(paper.says)}</p>
    </section>
    <section class="library-section library-section--matters">
      <h2>Por qué importa</h2>
      <p>${esc(paper.matters)}</p>
    </section>
    <section class="library-section library-section--limits">
      <h2>Limitaciones</h2>
      <p>${esc(paper.limits)}</p>
    </section>
    ${paper.relatedLessons?.length ? `<section class="library-section">
      <h2>Lecciones relacionadas</h2>
      <div class="library-related">
        ${paper.relatedLessons.map(id => {
          const L = getLesson(id)
          return `<button type="button" onclick="openLesson('${id}')" class="school-chip">${L ? esc(L.title) : id} →</button>`
        }).join('')}
      </div>
    </section>` : ''}
    <section class="library-section library-section--related">
      <h2>Papers relacionados</h2>
      ${metaLoading && !related.length
        ? '<p class="library-loading">Cargando recomendaciones de Semantic Scholar…</p>'
        : related.length
          ? `<div class="library-related-list">${related.map(relatedPaperCard).join('')}</div>`
          : paper.doi
            ? '<p class="library-meta-extra">No se encontraron recomendaciones para este DOI.</p>'
            : '<p class="library-meta-extra">Sin DOI — no hay recomendaciones automáticas.</p>'}
    </section>
  </article>`
}
