/** Gimnasia — navegación centralizada (auditar botones aquí) */

const VIEW_ALIASES = {
  school: 'learn', academy: 'learn', catalogo: 'learn', catalog: 'learn',
  neurons: 'home', neuronas: 'home', inicio: 'home',
  lab: 'train', program: 'train', programa: 'train', entrenar: 'train',
  nutrition: 'body', alimentacion: 'body', fasting: 'body', ayuno: 'body', cuerpo: 'body',
}

export function normalizeBrainView(view) {
  return VIEW_ALIASES[view] || view || 'home'
}

function renderNow(immediate = true) {
  if (typeof window.render === 'function') window.render(immediate)
}

export function goBrainTab(view, opts = {}) {
  if (typeof window.brainState === 'undefined') return
  const s = window.brainState
  s.brainView = normalizeBrainView(view)
  if (opts.trainSection) s.trainSection = opts.trainSection
  if (opts.bodySection) s.bodySection = opts.bodySection
  if (opts.schoolSection) s.schoolSection = opts.schoolSection
  if ('schoolFaculty' in opts) s.schoolFaculty = opts.schoolFaculty
  if (opts.resetFaculty) s.schoolFaculty = null
  if (opts.resetPaper) { s.activePaper = null; s.paperMeta = null }
  if (opts.resetLesson) { s.activeLesson = null; s.lessonFlow = null }
  renderNow(true)
}

export function goLearn(section = 'curriculum', opts = {}) {
  const {
    faculty = null,
    resetLesson = true,
    resetPaper = true,
    ...rest
  } = opts
  goBrainTab('learn', {
    schoolSection: section,
    schoolFaculty: faculty,
    resetPaper,
    resetLesson,
    ...rest,
  })
}

export function goTrain(section = 'program') {
  goBrainTab('train', { trainSection: section, resetLesson: true })
}

export function goBody(section = 'nutrition') {
  goBrainTab('body', { bodySection: section })
}

export function goHome() {
  goBrainTab('home', { resetLesson: true, resetPaper: true })
}

export function startTodaySession(repeat = false) {
  if (typeof window.startGuidedSession === 'function') {
    window.startGuidedSession(repeat)
  }
}

export function exploreRegion(regionId) {
  if (typeof window.brainState === 'undefined') return
  window.brainState.catalogFilter = { ...window.brainState.catalogFilter, region: regionId }
  goLearn('explore')
  if (typeof window.navigate === 'function') window.navigate('/gimnasia/catalogo')
}

export function exitExercise() {
  if (typeof window.brainState === 'undefined') return
  window.brainState.exercise = null
  goTrain(window.brainState.trainSection === 'lab' ? 'lab' : 'program')
}

export function bindBrainNavGlobals() {
  window.normalizeBrainView = normalizeBrainView
  window.goBrainTab = goBrainTab
  window.goLearn = goLearn
  window.goTrain = goTrain
  window.goBody = goBody
  window.goHome = goHome
  window.startTodaySession = startTodaySession
  window.exploreRegion = exploreRegion
  window.exitExercise = exitExercise
}
