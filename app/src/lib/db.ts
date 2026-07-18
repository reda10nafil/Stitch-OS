import { invoke } from '@tauri-apps/api/core'
import type { Product, ProductPhoto } from '@/types'

interface DbProduct {
  sku: string
  nome: string
  descrizione: string | null
  prezzo_vendita: number
  costo_acquisto: number
  quantita_stock: number
  link_foto_originale: string | null
  link_foto_elaborata: string | null
  foto_locali: string
  video_url: string | null
  categoria: string | null
  taglia_variante: string | null
  barcode: string | null
  fornitore: string | null
  note: string | null
  custom_fields: string
}

function toFrontend(db: DbProduct): Product {
  let fotoLocali: ProductPhoto[] = []
  try {
    fotoLocali = JSON.parse(db.foto_locali || '[]')
  } catch {}

  let customFields: Record<string, string> | undefined
  try {
    const parsed = JSON.parse(db.custom_fields || '{}')
    if (Object.keys(parsed).length > 0) customFields = parsed
  } catch {}

  return {
    sku: db.sku,
    nome: db.nome,
    descrizione: db.descrizione,
    prezzo_vendita: db.prezzo_vendita,
    costo_acquisto: db.costo_acquisto,
    quantita_stock: db.quantita_stock,
    link_foto_originale: db.link_foto_originale,
    link_foto_elaborata: db.link_foto_elaborata,
    foto_locali: fotoLocali,
    video_url: db.video_url,
    categoria: db.categoria,
    taglia_variante: db.taglia_variante,
    barcode: db.barcode,
    fornitore: db.fornitore,
    note: db.note,
    customFields,
  }
}

function toDb(p: Product): DbProduct {
  return {
    sku: p.sku,
    nome: p.nome,
    descrizione: p.descrizione ?? null,
    prezzo_vendita: p.prezzo_vendita,
    costo_acquisto: p.costo_acquisto,
    quantita_stock: p.quantita_stock,
    link_foto_originale: p.link_foto_originale ?? null,
    link_foto_elaborata: p.link_foto_elaborata ?? null,
    foto_locali: JSON.stringify(p.foto_locali ?? []),
    video_url: p.video_url ?? null,
    categoria: p.categoria ?? null,
    taglia_variante: p.taglia_variante ?? null,
    barcode: p.barcode ?? null,
    fornitore: p.fornitore ?? null,
    note: p.note ?? null,
    custom_fields: JSON.stringify(p.customFields ?? {}),
  }
}

let _isTauri: boolean | null = null

let _tauriWarned = false
function warnTauriUnavailable(fn: string) {
  if (!_tauriWarned) {
    _tauriWarned = true
    console.warn(
      `[DB] Tauri backend non disponibile. Le operazioni DB (${fn}, etc.) sono no-op. ` +
      `I dati vengono mantenuti solo in memoria e andranno persi al refresh. ` +
      `Per la persistenza reale, esegui l'app come applicazione Tauri nativa.`
    )
  }
}

export function isTauriAvailable(): boolean {
  if (_isTauri !== null) return _isTauri
  _isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window
  return _isTauri
}

export async function dbGetProducts(): Promise<Product[]> {
  if (!isTauriAvailable()) { warnTauriUnavailable('getProducts'); return [] }
  const rows = await invoke<DbProduct[]>('get_products')
  return rows.map(toFrontend)
}

export async function dbSaveProduct(product: Product): Promise<void> {
  if (!isTauriAvailable()) { warnTauriUnavailable('saveProduct'); return }
  await invoke('save_product', { product: toDb(product) })
}

export async function dbDeleteProduct(sku: string): Promise<number> {
  if (!isTauriAvailable()) { warnTauriUnavailable('deleteProduct'); return 0 }
  const deleted = await invoke<number>('delete_product', { sku })
  return deleted
}

export async function dbBulkDeleteProducts(skus: string[]): Promise<number> {
  if (!isTauriAvailable()) { warnTauriUnavailable('bulkDeleteProducts'); return 0 }
  return invoke<number>('bulk_delete_products', { skus })
}

export async function dbBulkAddProducts(products: Product[], mode: 'ignore' | 'replace' = 'ignore'): Promise<number> {
  // Returns 0 = no products persisted (Tauri unavailable)
  if (!isTauriAvailable()) { warnTauriUnavailable('bulkAddProducts'); return 0 }
  const dbProducts = products.map(toDb)
  return invoke<number>('bulk_add_products', { products: dbProducts, mode })
}

export async function dbUpdateStock(sku: string, quantitaStock: number): Promise<void> {
  if (!isTauriAvailable()) { warnTauriUnavailable('updateStock'); return }
  await invoke('update_stock', { sku, quantitaStock })
}

export async function dbSearchProducts(query: string, limit = 10): Promise<Product[]> {
  if (!isTauriAvailable()) { warnTauriUnavailable('searchProducts'); return [] }
  const rows = await invoke<DbProduct[]>('search_products', { query, limit })
  return rows.map(toFrontend)
}

export async function dbCheckIntegrity(): Promise<{ healthy: boolean }> {
  if (!isTauriAvailable()) { warnTauriUnavailable('checkIntegrity'); return { healthy: false } }
  return invoke<{ healthy: boolean }>('check_db_integrity')
}

export async function dbReset(): Promise<{ reset: boolean; message: string }> {
  if (!isTauriAvailable()) { warnTauriUnavailable('resetDb'); return { reset: false, message: 'Tauri backend non disponibile' } }
  return invoke<{ reset: boolean; message: string }>('reset_db')
}
