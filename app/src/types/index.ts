export type AppInterface = 'calendar' | 'inventory' | 'crm' | 'connectors' | 'billing' | 'dashboard' | 'settings' | 'ai-agents' | 'profile'

export type InventorySubPage = 'products' | 'statistics' | 'categories' | string

export interface InventoryViewFilter {
  categories?: string[]
  stockMin?: number
  stockMax?: number
  priceMin?: number
  priceMax?: number
  search?: string
}

export interface SavedInventoryView {
  id: string
  name: string
  filter: InventoryViewFilter
  defaultCategory?: string
}

export interface RouterState {
  currentInterface: AppInterface
  currentInventorySubPage?: InventorySubPage
  savedInventoryViews: SavedInventoryView[]
  previousInterface: AppInterface | null
  isNavigating: boolean
  hasUnsavedChanges: boolean
}

export interface NavigationEvent {
  type: 'NAVIGATION_CHANGE'
  payload: {
    target: AppInterface
    source: 'sidebar' | 'keyboard' | 'programmatic'
    timestamp: number
  }
}

export interface Client {
  id: number
  nome: string
  cognome: string
  telefono: string
  canale_provenienza: 'whatsapp' | 'telegram' | 'manuale'
  indirizzo_spedizione: string | null
  ai_enabled: number
  created_at: string
}

export interface ProductPhoto {
  url: string
  type: 'local' | 'remote'
  name?: string
}

export interface Product {
  sku: string
  nome: string
  descrizione: string | null
  prezzo_vendita: number
  costo_acquisto: number
  quantita_stock: number
  link_foto_originale: string | null
  link_foto_elaborata: string | null
  foto_locali: ProductPhoto[]
  video_url: string | null
  categoria: string | null
  taglia_variante: string | null
  barcode: string | null
  fornitore: string | null
  note: string | null
  customFields?: Record<string, string>
}

export interface Appointment {
  id: number
  cliente_id: number | null
  data_inizio: string
  data_fine: string
  stato: 'in_attesa' | 'confermato' | 'disdetto'
  note_ai: string | null
}

export interface Order {
  id: number
  cliente_id: number | null
  stato_ordine: 'in_attesa_pagamento' | 'pagato' | 'spedito' | 'annullato'
  totale_ordine: number
  link_pagamento_stripe: string | null
  data_ordine: string
}

export interface OrderDetail {
  id: number
  ordine_id: number
  sku_prodotto: string
  quantita: number
  prezzo_unitario: number
}

export interface MemoryLog {
  id: number
  cliente_id: number
  chiave_preferenza: string
  valore_preferenza: string
  data_aggiornamento: string
}

export interface ChatMessage {
  id: string
  cliente_id: number
  testo: string
  mittente: 'cliente' | 'ai' | 'operatore'
  timestamp: string
}

export interface TimeSlot {
  start: string
  end: string
  available: boolean
}

export type AiStatus = 'connected' | 'disconnected' | 'timeout'

export interface AppStatus {
  aiStatus: AiStatus
  aiLatency: number
  queueCount: number
  fallbackActive: boolean
}

export interface KpiData {
  capitale_investito: number
  capitale_potenziale: number
  margine_lordo: number
  prodotti_esauriti: number
}

export interface TopProduct {
  sku_prodotto: string
  nome: string
  volumi_vendita: number
}

export interface SalesTrend {
  giorno: string
  fatturato: number
}

export type ConnectorState = 'disconnesso' | 'in_attesa' | 'qr_valido' | 'connesso' | 'errore'