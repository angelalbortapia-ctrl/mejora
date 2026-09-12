/** Currículo Escuela Mejora — 12 semanas (sin dependencias de academia) */

export const FACULTIES = {
  cerebro: { label: 'Cerebro y sistemas', icon: '🔬', color: '#06b6d4', categories: ['systems'] },
  mente: { label: 'Mente en acción', icon: '🧩', color: '#00d4ff', categories: ['memory', 'attention'] },
  emocion: { label: 'Emoción y conducta', icon: '🫧', color: '#a78bfa', categories: ['emotion'] },
  tiempo: { label: 'Cerebro en el tiempo', icon: '💤', color: '#818cf8', categories: ['sleep', 'plasticity'] },
}

export const CURRICULUM = [
  { week: 1, title: 'Fundamentos del cerebro', faculty: 'cerebro', lessons: ['neurotransmitters', 'predictive-brain', 'cerebellum-mass', 'glia-brain-glue'], caseId: 'phineas-gage', lab: 'stroop' },
  { week: 2, title: 'Memoria: el buffer y el archivo', faculty: 'mente', lessons: ['wm-ram', 'hippocampus-consolidation', 'patient-hm', 'clive-wearing'], caseId: 'patient-hm', lab: 'corsi' },
  { week: 3, title: 'Memoria en acción', faculty: 'mente', lessons: ['nback-transfer', 'reconsolidation', 'false-memories', 'korsakoff'], caseId: 'korsakoff', lab: 'nback' },
  { week: 4, title: 'Atención y percepción', faculty: 'mente', lessons: ['attention-networks', 'stroop-life', 'attention-switch', 'hemispatial-neglect'], caseId: 'blindsight', lab: 'flanker' },
  { week: 5, title: 'Control e impulso', faculty: 'mente', lessons: ['gonogo-impulse', 'prefrontal-decisions', 'prosopagnosia', 'mirror-neurons'], caseId: 'split-brain', lab: 'gonogo' },
  { week: 6, title: 'Emoción y amenaza', faculty: 'emocion', lessons: ['amygdala-threat', 'stress-pfc', 'interoception', 'oxytocin-social'], caseId: 'patient-sm', lab: 'stroop' },
  { week: 7, title: 'Emoción clínica', faculty: 'emocion', lessons: ['breath-vagus', 'default-mode', 'trauma-hippocampus', 'alexithymia'], caseId: 'capgras', lab: 'stroop' },
  { week: 8, title: 'Hábitos y recompensa', faculty: 'emocion', lessons: ['dopamine-habits', 'basal-ganglia-habits', 'bdnf-exercise', 'serotonin-debate'], caseId: 'phantom-limb', lab: 'switching' },
  { week: 9, title: 'Sueño y ritmos', faculty: 'tiempo', lessons: ['sleep-consolidation', 'glymphatic-sleep', 'circadian-clocks', 'caffeine-adenosine'], caseId: 'london-taxi', lab: 'corsi' },
  { week: 10, title: 'Plasticidad cerebral', faculty: 'tiempo', lessons: ['hebb-plasticity', 'myelin-speed', 'critical-periods', 'cannabis-adolescent'], caseId: 'synesthesia', lab: 'nback' },
  { week: 11, title: 'Sala de casos I', faculty: 'cerebro', lessons: ['phineas-gage', 'split-brain', 'phantom-limb', 'broca-tan'], caseId: 'phineas-gage', lab: 'logic' },
  { week: 12, title: 'Sala de casos II', faculty: 'cerebro', lessons: ['blindsight', 'synesthesia', 'alien-hand', 'cotard-delusion'], caseId: 'cotard-delusion', lab: 'symbols' },
]

export function getLessonCurriculumWeek(lessonId) {
  for (const block of CURRICULUM) {
    if (block.lessons.includes(lessonId)) return block.week
  }
  return null
}

export function isCurriculumLessonUnlocked(lessonId, currentWeek) {
  const w = getLessonCurriculumWeek(lessonId)
  return w != null && w <= currentWeek
}
