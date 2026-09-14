/** Protocolo ANT (atención) — Strategy */
export function createANTProtocol(render) {
  return { id: 'ant', clinical: true, domain: 'attention', render }
}
