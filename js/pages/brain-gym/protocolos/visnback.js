/** Protocolo Visuoespacial N-back — Strategy */
export function createVisNBackProtocol(render) {
  return { id: 'visnback', clinical: true, domain: 'wm', render }
}
