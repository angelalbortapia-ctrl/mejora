/** APIs académicas gratuitas — PubMed, Semantic Scholar, Crossref, OpenAlex */

const TIMEOUT_MS = 12000
const S2_HEADERS = { Accept: 'application/json' }

async function fetchJson(url, options = {}) {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(url, { ...options, signal: ctrl.signal })
    clearTimeout(timer)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return res.json()
  } catch (e) {
    clearTimeout(timer)
    throw e
  }
}

function formatAuthorList(authors, max = 5) {
  if (!authors?.length) return ''
  const shown = authors.slice(0, max).join(', ')
  return authors.length > max ? `${shown} et al.` : shown
}

/** Crossref — DOI, título y autores oficiales */
export async function fetchCrossrefMeta(doi) {
  const data = await fetchJson(`https://api.crossref.org/works/${encodeURIComponent(doi)}`)
  const item = data.message
  const authors = (item.author || []).map(a => {
    if (a.literal) return a.literal
    return [a.given, a.family].filter(Boolean).join(' ')
  }).filter(Boolean)
  const year = item.published?.['date-parts']?.[0]?.[0]
    || item.created?.['date-parts']?.[0]?.[0]
    || item.issued?.['date-parts']?.[0]?.[0]
  return {
    title: (item.title?.[0] || '').replace(/\.$/, ''),
    authors,
    authorsDisplay: formatAuthorList(authors),
    year,
    journal: item['container-title']?.[0] || item['short-container-title']?.[0] || '',
    doi: item.DOI || doi,
    publisher: item.publisher || '',
    verified: true,
  }
}

/** OpenAlex — citas y acceso abierto */
export async function fetchOpenAlexMeta(doi) {
  const data = await fetchJson(`https://api.openalex.org/works/https://doi.org/${encodeURIComponent(doi)}`, {
    headers: { Accept: 'application/json' },
  })
  return {
    citedByCount: data.cited_by_count,
    openAccessUrl: data.open_access?.oa_url,
    journal: data.primary_location?.source?.display_name,
  }
}

function mapSemanticScholarPapers(papers) {
  return papers.map(p => ({
    title: p.title || 'Sin título',
    authors: (p.authors || []).map(a => a.name).slice(0, 3).join(', '),
    year: p.year,
    doi: p.externalIds?.DOI || null,
    citationCount: p.citationCount,
    url: p.url || (p.externalIds?.DOI ? `https://doi.org/${p.externalIds.DOI}` : null),
    source: 'semantic-scholar',
  })).filter(p => p.title && p.title !== 'Sin título')
}

/** Semantic Scholar — papers relacionados por DOI */
export async function fetchSemanticScholarRelated(doi, limit = 5) {
  const paperId = encodeURIComponent(`DOI:${doi}`)
  try {
    const recUrl = `https://api.semanticscholar.org/recommendations/v1/papers/forpaper/${paperId}?fields=title,authors,year,externalIds,citationCount,url&limit=${limit}`
    const recData = await fetchJson(recUrl, { headers: S2_HEADERS })
    if (recData.recommendedPapers?.length) {
      return mapSemanticScholarPapers(recData.recommendedPapers)
    }
  } catch { /* fallback abajo */ }

  const graphUrl = `https://api.semanticscholar.org/graph/v1/paper/${paperId}?fields=references.title,references.year,references.externalIds,references.citationCount,references.authors`
  const graphData = await fetchJson(graphUrl, { headers: S2_HEADERS })
  return mapSemanticScholarPapers((graphData.references || []).slice(0, limit))
}

/** PubMed E-utilities — búsqueda por tema */
export async function searchPubMed(query, max = 8) {
  const term = (query || '').trim()
  if (!term) return []
  const searchData = await fetchJson(
    `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(term)}&retmax=${max}&retmode=json&sort=relevance`
  )
  const ids = searchData.esearchresult?.idlist || []
  if (!ids.length) return []
  const summaryData = await fetchJson(
    `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${ids.join(',')}&retmode=json`
  )
  const result = summaryData.result || {}
  return ids.map(id => {
    const item = result[id]
    if (!item || typeof item !== 'object') return null
    let doi = null
    if (item.elocationid?.toLowerCase().startsWith('doi:')) doi = item.elocationid.slice(4)
    if (!doi && item.articleids) {
      const d = item.articleids.find(a => a.idtype === 'doi')
      if (d) doi = d.value
    }
    return {
      pmid: id,
      title: (item.title || '').replace(/\.$/, ''),
      authors: (item.authors || []).map(a => a.name).slice(0, 3).join(', '),
      journal: item.fulljournalname || item.source || '',
      year: (item.pubdate || '').split(' ')[0] || '',
      doi,
      url: `https://pubmed.ncbi.nlm.nih.gov/${id}/`,
      source: 'pubmed',
    }
  }).filter(Boolean)
}

/** Carga paralela de metadatos para un paper curado */
export async function fetchPaperLiveMeta(paper) {
  const doi = paper?.doi
  const meta = { crossref: null, openAlex: null, related: [], loading: false }
  if (!doi) return meta

  const [crossref, openAlex, related] = await Promise.allSettled([
    fetchCrossrefMeta(doi),
    fetchOpenAlexMeta(doi),
    fetchSemanticScholarRelated(doi, 5),
  ])

  if (crossref.status === 'fulfilled') meta.crossref = crossref.value
  if (openAlex.status === 'fulfilled') meta.openAlex = openAlex.value
  if (related.status === 'fulfilled') meta.related = related.value

  return meta
}
