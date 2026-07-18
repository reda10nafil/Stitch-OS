import { dbSearchProducts } from './db'
import type { Product } from '@/types'

const IT_STOPWORDS = new Set([
  'il', 'lo', 'la', 'le', 'i', 'gli', 'un', 'una', 'uno',
  'di', 'a', 'da', 'in', 'con', 'su', 'per', 'tra', 'fra',
  'e', 'o', 'né', 'che', 'non', 'più', 'molto', 'poco',
  'questo', 'questa', 'quello', 'quella', 'questi', 'queste',
  'quei', 'quegli', 'quelle', 'cui', 'nel', 'nello', 'nella',
  'nei', 'negli', 'nelle', 'al', 'allo', 'alla', 'ai', 'agli', 'alle',
  'del', 'dello', 'della', 'dei', 'degli', 'delle',
  'sul', 'sullo', 'sulla', 'sui', 'sugli', 'sulle',
  'dal', 'dallo', 'dalla', 'dai', 'dagli', 'dalle',
  'è', 'sono', 'ha', 'hanno', 'era', 'erano',
  'si', 'no', 'anche', 'come', 'ancora', 'già', 'sempre',
  'solo', 'ogni', 'tutto', 'tutti', 'tutta', 'tutte',
  'essere', 'avere', 'fare', 'stare', 'potere', 'dovere', 'sapere',
])

export function extractKeywords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\sàèéìòù]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length >= 2 && !IT_STOPWORDS.has(t))
}

export async function ragSearch(
  query: string,
  limit = 10,
): Promise<Product[]> {
  const keywords = extractKeywords(query)
  if (keywords.length === 0) return []
  const ftsQuery = keywords.join(' ')
  return dbSearchProducts(ftsQuery, limit)
}

export function buildRAGContext(products: Product[], maxChars = 2000): string {
  if (products.length === 0) return '[Nessun prodotto trovato]'
  const lines: string[] = []
  let totalLen = 0
  for (const p of products) {
    const parts = [p.sku, p.nome]
    if (p.categoria) parts.push(`cat:${p.categoria}`)
    parts.push(`€${p.prezzo_vendita}`)
    parts.push(`stock:${p.quantita_stock}`)
    if (p.fornitore) parts.push(`forn:${p.fornitore}`)
    if (p.descrizione) parts.push(p.descrizione.slice(0, 80))
    if (p.customFields) {
      for (const [k, v] of Object.entries(p.customFields)) {
        parts.push(`${k}:${v}`)
      }
    }
    const line = parts.join(' | ')
    if (totalLen + line.length > maxChars) break
    lines.push(line)
    totalLen += line.length
  }
  return lines.join('\n')
}
