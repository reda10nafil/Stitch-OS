import { useState, useRef, useCallback, useMemo, useEffect } from 'react'
import { cn } from '@/lib/utils'
import {
  Search, Upload, Download, Plus, MoreHorizontal, Trash2, Pencil,
  ChevronLeft, ChevronRight, X, ArrowRight, AlertTriangle,
  Image as ImageIcon, GripVertical, Columns3, FileSpreadsheet,
  Link as LinkIcon, ChevronUp, ChevronDown, Eye, Camera, Video,
  ImageOff, Play,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import * as XLSX from 'xlsx'
import type { Product, ProductPhoto, InventoryViewFilter } from '@/types'
import { dbGetProducts, dbSaveProduct, dbDeleteProduct, dbBulkDeleteProducts, dbBulkAddProducts, dbUpdateStock, isTauriAvailable } from '@/lib/db'

export const MOCK_PRODUCTS: Product[] = [
  { sku: 'SKU-001', nome: 'Sneaker Urban', descrizione: 'Scarpa sportiva casual con suola in gomma', prezzo_vendita: 89.90, costo_acquisto: 45.00, quantita_stock: 24, link_foto_originale: null, link_foto_elaborata: null, foto_locali: [], video_url: null, categoria: 'Scarpe', taglia_variante: '42', barcode: null, fornitore: null, note: null },
  { sku: 'SKU-002', nome: 'Borsa Tote Premium', descrizione: 'Borsa in pelle vegana con interni foderati', prezzo_vendita: 120.00, costo_acquisto: 65.00, quantita_stock: 5, link_foto_originale: null, link_foto_elaborata: null, foto_locali: [], video_url: null, categoria: 'Borse', taglia_variante: 'Unica', barcode: null, fornitore: null, note: null },
  { sku: 'SKU-003', nome: 'Cintura Classic', descrizione: 'Cintura in cuoio con fibbia argento', prezzo_vendita: 45.00, costo_acquisto: 22.00, quantita_stock: 0, link_foto_originale: null, link_foto_elaborata: null, foto_locali: [], video_url: null, categoria: 'Accessori', taglia_variante: 'M', barcode: null, fornitore: null, note: null },
  { sku: 'SKU-004', nome: 'Giacca Tech Wind', descrizione: 'Giacca antivento tecnica con cappuccio', prezzo_vendita: 199.00, costo_acquisto: 110.00, quantita_stock: 15, link_foto_originale: null, link_foto_elaborata: null, foto_locali: [], video_url: null, categoria: 'Abbigliamento', taglia_variante: 'L', barcode: null, fornitore: null, note: null },
  { sku: 'SKU-005', nome: 'Cappello Baseball', descrizione: 'Cappello con visiera curva regolabile', prezzo_vendita: 29.90, costo_acquisto: 12.00, quantita_stock: 3, link_foto_originale: null, link_foto_elaborata: null, foto_locali: [], video_url: null, categoria: 'Accessori', taglia_variante: 'Unica', barcode: null, fornitore: null, note: null },
  { sku: 'SKU-006', nome: 'Zaino Explorer', descrizione: 'Zaino da trekking 40L impermeabile', prezzo_vendita: 149.00, costo_acquisto: 80.00, quantita_stock: 0, link_foto_originale: null, link_foto_elaborata: null, foto_locali: [], video_url: null, categoria: 'Borse', taglia_variante: 'Unica', barcode: null, fornitore: null, note: null },
  { sku: 'SKU-007', nome: 'Felpa Cotton', descrizione: 'Felpa 100% cotone organico felpato', prezzo_vendita: 69.90, costo_acquisto: 35.00, quantita_stock: 18, link_foto_originale: null, link_foto_elaborata: null, foto_locali: [], video_url: null, categoria: 'Abbigliamento', taglia_variante: 'XL', barcode: null, fornitore: null, note: null },
  { sku: 'SKU-008', nome: 'Occhiali Sport', descrizione: 'Occhiali da sole polarizzati UV400', prezzo_vendita: 59.90, costo_acquisto: 28.00, quantita_stock: 7, link_foto_originale: null, link_foto_elaborata: null, foto_locali: [], video_url: null, categoria: 'Accessori', taglia_variante: 'Unica', barcode: null, fornitore: null, note: null },
]

type FormData = Omit<Product, 'link_foto_elaborata' | 'foto_locali' | 'video_url'> & {
  link_foto_elaborata?: string | null
  foto_locali: ProductPhoto[]
  video_url: string | null
  customFields?: Record<string, string>
}

const EMPTY_FORM: FormData = {
  sku: '',
  nome: '',
  descrizione: '',
  prezzo_vendita: 0,
  costo_acquisto: 0,
  quantita_stock: 0,
  link_foto_originale: '',
  foto_locali: [],
  video_url: null,
  categoria: '',
  taglia_variante: '',
  barcode: '',
  fornitore: '',
  note: '',
  customFields: {},
}

type ImportStep = 'drop' | 'mapping' | 'importing' | 'result'

interface ImportState {
  step: ImportStep
  file: File | null
  rawHeaders: string[]
  rawRows: string[][]
  previewRows: string[][]
  mappings: Record<string, string>
  result: { inserted: number; skipped: number; skippedSkus: string[] } | null
  source: 'csv' | 'xlsx' | 'sheets' | null
  sheetsUrl: string
  mode: 'ignore' | 'replace'
}

const INITIAL_IMPORT: ImportState = {
  step: 'drop',
  file: null,
  rawHeaders: [],
  rawRows: [],
  previewRows: [],
  mappings: {},
  result: null,
  source: null,
  sheetsUrl: '',
  mode: 'ignore',
}

const DB_FIELDS: { key: string; label: string; required: boolean; type: ColumnFieldType; aliases?: string[] }[] = [
  { key: 'foto', label: 'Foto Prodotto', required: false, type: 'image_url', aliases: ['image', 'immagine', 'photo', 'pic', 'foto'] },
  { key: 'sku', label: 'SKU', required: false, type: 'text', aliases: ['codice', 'product_code', 'id'] },
  { key: 'nome', label: 'Nome', required: false, type: 'text', aliases: ['title', 'name', 'product_name', 'denominazione'] },
  { key: 'descrizione', label: 'Descrizione', required: false, type: 'text', aliases: ['description', 'desc', '*notes'] },
  { key: 'prezzo_vendita', label: 'Prezzo Vendita', required: false, type: 'number', aliases: ['price', 'prezzo', 'selling_price', 'retail_price'] },
  { key: 'costo_acquisto', label: 'Costo Acquisto', required: false, type: 'number', aliases: ['cost', 'purchase_price', 'wholesale', 'acquisto'] },
  { key: 'quantita_stock', label: 'Quantità Stock', required: false, type: 'number', aliases: ['stock', 'quantity', 'qty', 'inv', 'inventory'] },
  { key: 'categoria', label: 'Categoria', required: false, type: 'text', aliases: ['category', 'cat', 'tipo', 'type'] },
  { key: 'taglia_variante', label: 'Taglia / Variante', required: false, type: 'text', aliases: ['size', 'taglia', 'variant', 'variante', 'dimension'] },
  { key: 'link_foto_originale', label: 'Link Foto (remoto)', required: false, type: 'image_url', aliases: ['image_url', 'url_foto', 'foto_url', 'image_link', 'url_immagine', 'link foto', 'link immagine'] },
  { key: 'barcode', label: 'Codice a Barre (EAN)', required: false, type: 'text', aliases: ['ean', 'codice_barre', 'codice a barre', 'upc', 'gtin'] },
  { key: 'fornitore', label: 'Fornitore', required: false, type: 'text', aliases: ['supplier', 'vendor', 'brand', 'marca'] },
  { key: 'note', label: 'Note', required: false, type: 'text', aliases: ['notes', 'comments', 'remarques', 'annotazioni'] },
]

type ColumnFieldType = 'text' | 'number' | 'image_url' | 'url' | 'date'

interface ColumnDef {
  id: string
  label: string
  visible: boolean
  order: number
  custom?: boolean
  width?: number
  fieldType?: ColumnFieldType
}

const DEFAULT_COLUMN_WIDTHS: Record<string, number> = {
  foto: 70,
  sku: 100,
  nome_categoria: 200,
  prezzo_vendita: 100,
  quantita_stock: 90,
  azioni: 60,
  costo_acquisto: 100,
  margine: 100,
}

const COL_WIDTHS_KEY = 'inventory_col_widths'

function loadPersistedWidths(): Record<string, number> {
  try {
    const raw = localStorage.getItem(COL_WIDTHS_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return {}
}

function persistWidths(columns: ColumnDef[]) {
  try {
    const map: Record<string, number> = {}
    for (const c of columns) {
      if (c.width) map[c.id] = c.width
    }
    localStorage.setItem(COL_WIDTHS_KEY, JSON.stringify(map))
  } catch {}
}

function mergePersistedWidths(cols: ColumnDef[]): ColumnDef[] {
  const saved = loadPersistedWidths()
  if (Object.keys(saved).length === 0) return cols
  return cols.map(c => (saved[c.id] ? { ...c, width: saved[c.id] } : c))
}

const DEFAULT_COLUMNS: ColumnDef[] = mergePersistedWidths([
  { id: 'foto', label: 'Foto', visible: true, order: 0, width: DEFAULT_COLUMN_WIDTHS.foto },
  { id: 'sku', label: 'SKU', visible: true, order: 1, width: DEFAULT_COLUMN_WIDTHS.sku },
  { id: 'nome_categoria', label: 'Nome & Categoria', visible: true, order: 2, width: DEFAULT_COLUMN_WIDTHS.nome_categoria },
  { id: 'prezzo_vendita', label: 'Prezzo', visible: true, order: 3, width: DEFAULT_COLUMN_WIDTHS.prezzo_vendita },
  { id: 'quantita_stock', label: 'Stock', visible: true, order: 4, width: DEFAULT_COLUMN_WIDTHS.quantita_stock },
  { id: 'azioni', label: 'Azioni', visible: true, order: 5, width: DEFAULT_COLUMN_WIDTHS.azioni },
  { id: 'costo_acquisto', label: 'Costo', visible: false, order: 6, width: DEFAULT_COLUMN_WIDTHS.costo_acquisto },
  { id: 'margine', label: 'Margine', visible: false, order: 7, width: DEFAULT_COLUMN_WIDTHS.margine },
])

function StockBadge({ qty }: { qty: number }) {
  if (qty === 0) return <span className="inline-flex items-center rounded-md bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800 animate-pulse">Esaurito</span>
  if (qty <= 5) return <span className="inline-flex items-center rounded-md bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-800">{qty} unità</span>
  return <span className="inline-flex items-center rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">{qty} unità</span>
}

function formatPrice(n: number): string {
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(n)
}

function parseCSV(text: string): { headers: string[]; rows: string[][] } {
  const lines = text
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l.length > 0)
  if (lines.length === 0) return { headers: [], rows: [] }
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))
  const rows = lines.slice(1).map(line => {
    const cells: string[] = []
    let current = ''
    let inQuotes = false
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"'
          i++
        } else {
          inQuotes = !inQuotes
        }
      } else if (ch === ',' && !inQuotes) {
        cells.push(current.trim())
        current = ''
      } else {
        current += ch
      }
    }
    cells.push(current.trim())
    return cells.map(c => c.replace(/^"|"$/g, ''))
  })
  return { headers, rows }
}

function parseXLSX(buffer: ArrayBuffer): { headers: string[]; rows: string[][] } {
  const wb = XLSX.read(buffer, { type: 'array' })
  const ws = wb.Sheets[wb.SheetNames[0]]
  if (!ws) return { headers: [], rows: [] }
  const data: string[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })
  if (data.length === 0) return { headers: [], rows: [] }
  const headers = data[0].map(String)
  const rows = data.slice(1).map(row => row.map(String))
  return { headers, rows }
}

function generateSKU(products: Product[]): string {
  const maxNum = products.reduce((max, p) => {
    const match = p.sku.match(/^SKU-(\d+)$/)
    return match ? Math.max(max, parseInt(match[1])) : max
  }, 0)
  return `SKU-${String(maxNum + 1).padStart(3, '0')}`
}

function buildExportCSV(products: Product[]): string {
  const allCustomKeys = new Set<string>()
  for (const p of products) {
    if (p.customFields) Object.keys(p.customFields).forEach(k => allCustomKeys.add(k))
  }
  const customKeys = [...allCustomKeys].sort()
  const headers = ['SKU', 'Nome', 'Descrizione', 'Prezzo Vendita', 'Costo Acquisto', 'Quantita Stock', 'Categoria', 'Taglia/Variante', 'Link Foto', 'Link Foto Elaborata', 'Codice a Barre', 'Fornitore', 'Note', ...customKeys]
  const escape = (v: string | number | null | undefined): string => {
    if (v === null || v === undefined) return ''
    const s = String(v)
    if (s.includes(',') || s.includes('"') || s.includes('\n')) return `"${s.replace(/"/g, '""')}"`
    return s
  }
  const rows = products.map(p => [
    escape(p.sku), escape(p.nome), escape(p.descrizione), escape(p.prezzo_vendita),
    escape(p.costo_acquisto), escape(p.quantita_stock), escape(p.categoria),
    escape(p.taglia_variante), escape(p.link_foto_originale),
    escape(p.link_foto_elaborata), escape(p.barcode), escape(p.fornitore), escape(p.note),
    ...customKeys.map(k => escape(p.customFields?.[k])),
  ])
  return [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n')
}

function parsePrice(val: string): number {
  if (!val) return 0
  // Rimuove simboli valuta, prefissi come "da", spazi, e gestisce la virgola decimale italiana
  const cleaned = val
    .replace(/[€$£¥]/g, '')
    .replace(/\s+/g, ' ')
    .replace(/^[a-zA-ZÀ-ÿ\s]+/, '')
    .trim()
    .replace(/\./g, '') // rimuove i separatori delle migliaia (italiano)
    .replace(',', '.')
  return parseFloat(cleaned) || 0
}

function getPhotoUrl(p: Product): string | null {
  if (p.link_foto_elaborata) return p.link_foto_elaborata
  if (p.link_foto_originale) return p.link_foto_originale
  if (p.foto_locali.length > 0) return p.foto_locali[0].url
  return null
}

interface MediaItem {
  type: 'image' | 'video'
  url: string
}

function getProductMedia(p: Product): MediaItem[] {
  const items: MediaItem[] = []
  for (const ph of p.foto_locali) {
    items.push({ type: 'image', url: ph.url })
  }
  if (p.link_foto_elaborata) items.push({ type: 'image', url: p.link_foto_elaborata })
  if (p.link_foto_originale) items.push({ type: 'image', url: p.link_foto_originale })
  if (p.video_url) items.push({ type: 'video', url: p.video_url })
  return items
}

function PhotoThumbnail({ product, size = 32, onClick }: { product: Product; size?: number; onClick?: () => void }) {
  const url = getPhotoUrl(product)
  const hasVideo = !!product.video_url
  if (!url && !hasVideo) {
    return (
      <div
        className="rounded bg-[#2a3038] flex items-center justify-center text-[#636c75]"
        style={{ width: size, height: size }}
      >
        <ImageOff size={size * 0.5} />
      </div>
    )
  }
  return (
    <div className="relative" onClick={onClick}>
      {url ? (
        <img
          src={url}
          alt={product.nome}
          className={cn('rounded object-cover', onClick && 'cursor-pointer hover:ring-2 hover:ring-sky-500 transition-all')}
          style={{ width: size, height: size }}
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none'
            const parent = (e.target as HTMLImageElement).parentElement
            if (parent) {
              parent.innerHTML = ''
              const placeholder = document.createElement('div')
              placeholder.className = 'rounded bg-[#2a3038] flex items-center justify-center text-[#636c75]'
              placeholder.style.width = size + 'px'
              placeholder.style.height = size + 'px'
              placeholder.style.display = 'flex'
              const icon = document.createElement('span')
              icon.textContent = '?'
              icon.style.fontSize = (size * 0.4) + 'px'
              placeholder.appendChild(icon)
              parent.appendChild(placeholder)
            }
          }}
        />
      ) : (
        <div
          className="rounded bg-[#2a3038] flex items-center justify-center text-[#636c75] cursor-pointer hover:ring-2 hover:ring-sky-500 transition-all"
          style={{ width: size, height: size }}
        >
          <Video size={size * 0.5} />
        </div>
      )}
      {hasVideo && (
        <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-sky-600 flex items-center justify-center" title="Video disponibile">
          <Play size={7} className="text-white" />
        </div>
      )}
    </div>
  )
}

export function InventoryProducts({ prefilter, sharedProducts, onProductsChange, viewContext, requestSync }: { prefilter?: InventoryViewFilter; sharedProducts?: Product[]; onProductsChange?: (updated: Product[]) => void; viewContext?: { name: string; defaultCategory?: string }; requestSync?: () => void }) {
  const [localProducts, setLocalProducts] = useState<Product[]>([])
  const [dbLoaded, setDbLoaded] = useState(false)
  const isStandalone = sharedProducts === undefined

  useEffect(() => {
    if (!isStandalone) return
    if (dbLoaded) return
    dbGetProducts().then(dbProducts => {
      if (dbProducts.length > 0) {
        setLocalProducts(dbProducts)
      } else {
        setLocalProducts(MOCK_PRODUCTS)
        if (isTauriAvailable()) {
          dbBulkAddProducts(MOCK_PRODUCTS).catch((err) => {
            showNotification('Errore inizializzazione dati mock: ' + (err instanceof Error ? err.message : String(err)), 'error')
          })
        }
      }
      setDbLoaded(true)
    }).catch((err) => {
      showNotification('Errore caricamento prodotti dal database: ' + (err instanceof Error ? err.message : String(err)), 'error')
      setLocalProducts(MOCK_PRODUCTS)
      setDbLoaded(true)
    })
  }, [isStandalone, dbLoaded])

  const products = isStandalone ? localProducts : (sharedProducts || [])

  const updateProducts = (next: Product[]) => {
    if (isStandalone) {
      setLocalProducts(next)
    } else if (onProductsChange) {
      onProductsChange(next)
    }
  }

  const mutateProducts = (fn: (prev: Product[]) => Product[]) => {
    const prev = isStandalone ? localProducts : (sharedProducts || [])
    const next = fn(prev)
    updateProducts(next)
  }

  const [search, setSearch] = useState('')
  const [editingStockSku, setEditingStockSku] = useState<string | null>(null)
  const [editStockValue, setEditStockValue] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [selectedSkus, setSelectedSkus] = useState<Set<string>>(new Set())
  const [bulkStockValue, setBulkStockValue] = useState('')
  const [bulkPriceValue, setBulkPriceValue] = useState('')
  const [showBulkActions, setShowBulkActions] = useState(false)
  const [actionsMenuPos, setActionsMenuPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 })
  const [galleryImages, setGalleryImages] = useState<{ urls: string[]; index: number } | null>(null)
  const [mediaGallery, setMediaGallery] = useState<{ items: MediaItem[]; index: number } | null>(null)
  const [photoPopover, setPhotoPopover] = useState<{ product: Product; rect: DOMRect } | null>(null)
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [columns, setColumns] = useState<ColumnDef[]>(DEFAULT_COLUMNS)
  const [showColConfig, setShowColConfig] = useState(false)
  const [exportMenuOpen, setExportMenuOpen] = useState(false)
  const [newColName, setNewColName] = useState('')
  const [newColType, setNewColType] = useState<ColumnFieldType>('text')

  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info'; key: number } | null>(null)

  const showNotification = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setNotification({ message, type, key: Date.now() })
  }, [])

  useEffect(() => {
    if (!notification) return
    const timer = setTimeout(() => setNotification(null), 5000)
    return () => clearTimeout(timer)
  }, [notification])

  const [mappingPopupFor, setMappingPopupFor] = useState<string | null>(null)
  const [selectedUnmappedCols, setSelectedUnmappedCols] = useState<Set<string>>(new Set())

  const [modal, setModal] = useState<{ open: boolean; mode: 'add' | 'edit'; product: FormData }>({
    open: false,
    mode: 'add',
    product: { ...EMPTY_FORM },
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  const [importState, setImportState] = useState<ImportState>({ ...INITIAL_IMPORT })
  const fileInputRef = useRef<HTMLInputElement>(null)
  const xlsxInputRef = useRef<HTMLInputElement>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)
  const tableRef = useRef<HTMLTableElement>(null)
  const resizeRef = useRef<{ colId: string; startX: number; startWidth: number } | null>(null)
  const [resizingColId, setResizingColId] = useState<string | null>(null)
  const [selectedColId, setSelectedColId] = useState<string | null>(null)
  const [unmappedColTypes, setUnmappedColTypes] = useState<Record<string, ColumnFieldType>>({})
  const sortedColumns = useMemo(() => [...columns].sort((a, b) => a.order - b.order), [columns])
  const visibleColumns = useMemo(() => sortedColumns.filter(c => c.visible), [sortedColumns])
  const columnCount = visibleColumns.length + 1

  const unmappedHeaders = useMemo(() => {
    if (importState.step !== 'drop' && importState.rawHeaders.length > 0) {
      return importState.rawHeaders.filter(h => !Object.values(importState.mappings).includes(h))
    }
    return []
  }, [importState.step, importState.rawHeaders, importState.mappings])

  const prefilteredProducts = useMemo(() => {
    if (!prefilter) return products
    return products.filter(p => {
      if (prefilter.categories && prefilter.categories.length > 0) {
        if (!p.categoria || !prefilter.categories.includes(p.categoria)) return false
      }
      if (prefilter.stockMin !== undefined && p.quantita_stock < prefilter.stockMin) return false
      if (prefilter.stockMax !== undefined && p.quantita_stock > prefilter.stockMax) return false
      if (prefilter.priceMin !== undefined && p.prezzo_vendita < prefilter.priceMin) return false
      if (prefilter.priceMax !== undefined && p.prezzo_vendita > prefilter.priceMax) return false
      return true
    })
  }, [products, prefilter])

  const filtered = prefilteredProducts.filter(p =>
    p.nome.toLowerCase().includes(search.toLowerCase()) ||
    p.sku.toLowerCase().includes(search.toLowerCase()) ||
    (p.categoria || '').toLowerCase().includes(search.toLowerCase())
  )

  const totalPages = Math.ceil(filtered.length / perPage)
  const paged = filtered.slice((page - 1) * perPage, page * perPage)

  useEffect(() => {
    if (photoPopover) {
      const handler = () => setPhotoPopover(null)
      document.addEventListener('click', handler)
      return () => document.removeEventListener('click', handler)
    }
  }, [photoPopover])

  const GUIDE_ID = '__col_resize_guide__'

  function purgeGuides() {
    document.querySelectorAll(`#${GUIDE_ID}`).forEach(el => el.remove())
  }

  useEffect(() => {
    if (!resizingColId) return
    purgeGuides()
    const guide = document.createElement('div')
    guide.id = GUIDE_ID
    guide.style.cssText = 'position:fixed;width:2px;background:#38bdf8;opacity:0.6;z-index:100;pointer-events:none;display:none'
    document.body.appendChild(guide)

    const handleMouseMove = (e: MouseEvent) => {
      const r = resizeRef.current!
      const delta = e.clientX - r.startX
      const newWidth = Math.max(50, Math.min(500, r.startWidth + delta))
      setColumns(prev => prev.map(c => c.id === r.colId ? { ...c, width: newWidth } : c))
      if (tableRef.current) {
        const container = tableRef.current.parentElement
        const th = tableRef.current.querySelector<HTMLTableCellElement>(`th[data-col-id="${r.colId}"]`)
        if (th && container) {
          const containerRect = container.getBoundingClientRect()
          const thRect = th.getBoundingClientRect()
          guide.style.display = 'block'
          guide.style.top = `${containerRect.top}px`
          guide.style.bottom = `${window.innerHeight - containerRect.bottom}px`
          guide.style.left = `${thRect.left + newWidth - 1}px`
        }
      }
    }
    const stopResize = () => {
      if (resizeRef.current) {
        setColumns(prev => { persistWidths(prev); return prev })
      }
      resizeRef.current = null
      setResizingColId(null)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      purgeGuides()
    }
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', stopResize)
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', stopResize)
      purgeGuides()
    }
  }, [resizingColId])

  const startResize = (e: React.MouseEvent, colId: string, currentWidth: number) => {
    e.preventDefault()
    e.stopPropagation()
    resizeRef.current = { colId, startX: e.clientX, startWidth: currentWidth }
    setResizingColId(colId)
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }

  const autoFitColumn = (colId: string) => {
    if (!tableRef.current) return
    const colIndex = visibleColumns.findIndex(c => c.id === colId)
    if (colIndex < 0) return
    const cells = tableRef.current.querySelectorAll<HTMLTableCellElement>(
      `tbody tr td:nth-child(${colIndex + 1}), thead tr th:nth-child(${colIndex + 1})`
    )
    let maxW = 60
    for (const cell of cells) {
      const clone = cell.cloneNode(true) as HTMLElement
      clone.style.position = 'absolute'
      clone.style.visibility = 'hidden'
      clone.style.whiteSpace = 'nowrap'
      clone.style.overflow = 'visible'
      clone.style.width = 'auto'
      clone.style.display = 'inline-block'
      clone.style.paddingLeft = getComputedStyle(cell).paddingLeft
      clone.style.paddingRight = getComputedStyle(cell).paddingRight
      clone.style.fontSize = getComputedStyle(cell).fontSize
      clone.style.fontFamily = getComputedStyle(cell).fontFamily
      document.body.appendChild(clone)
      const w = clone.scrollWidth + 8
      document.body.removeChild(clone)
      if (w > maxW) maxW = w
    }
    const clamped = Math.max(50, Math.min(500, maxW))
    setColumns(prev => {
      const next = prev.map(c => c.id === colId ? { ...c, width: clamped } : c)
      persistWidths(next)
      return next
    })
  }

  const startStockEdit = (sku: string, currentQty: number) => {
    setEditingStockSku(sku)
    setEditStockValue(String(currentQty))
    setOpenMenu(null)
  }

  const saveStockEdit = () => {
    if (editingStockSku) {
      const qty = Math.max(0, parseInt(editStockValue) || 0)
      const sku = editingStockSku
      const prevQty = products.find(p => p.sku === sku)?.quantita_stock ?? 0
      mutateProducts(prev => prev.map(p =>
        p.sku === sku ? { ...p, quantita_stock: qty } : p
      ))
      dbUpdateStock(sku, qty).catch((err) => {
        mutateProducts(prev => prev.map(p =>
          p.sku === sku ? { ...p, quantita_stock: prevQty } : p
        ))
        showNotification('Errore aggiornamento stock: ' + (err instanceof Error ? err.message : String(err)), 'error')
      })
    }
    setEditingStockSku(null)
  }

  const deleteProduct = (sku: string) => {
    const deletedProduct = products.find(p => p.sku === sku)
    mutateProducts(prev => prev.filter(p => p.sku !== sku))
    dbDeleteProduct(sku).catch((err) => {
      if (deletedProduct) {
        mutateProducts(prev => [...prev, deletedProduct])
      }
      showNotification('Errore eliminazione: ' + (err instanceof Error ? err.message : String(err)), 'error')
    })
    setShowDeleteConfirm(null)
    setOpenMenu(null)
  }

  const toggleSelect = (sku: string) => {
    setSelectedSkus(prev => {
      const next = new Set(prev)
      if (next.has(sku)) next.delete(sku)
      else next.add(sku)
      return next
    })
  }

  const toggleSelectAll = () => {
    setSelectedSkus(prev => {
      if (prev.size === filtered.length && filtered.length > 0) return new Set<string>()
      return new Set(filtered.map(p => p.sku))
    })
  }

  const bulkSetStock = () => {
    const qty = Math.max(0, parseInt(bulkStockValue) || 0)
    const prevQuantities: Record<string, number> = {}
    for (const sku of selectedSkus) {
      prevQuantities[sku] = products.find(p => p.sku === sku)?.quantita_stock ?? 0
    }
    mutateProducts(prev => prev.map(p =>
      selectedSkus.has(p.sku) ? { ...p, quantita_stock: qty } : p
    ))
    for (const sku of selectedSkus) {
      dbUpdateStock(sku, qty).catch((err) => {
        mutateProducts(prev => prev.map(p =>
          p.sku === sku ? { ...p, quantita_stock: prevQuantities[sku] } : p
        ))
        showNotification('Errore aggiornamento stock per ' + sku + ': ' + (err instanceof Error ? err.message : String(err)), 'error')
      })
    }
    setBulkStockValue('')
  }

  const bulkSetPrice = () => {
    const price = parseFloat(bulkPriceValue.replace(',', '.'))
    if (isNaN(price) || price < 0) return
    const prevPrices: Record<string, number> = {}
    for (const sku of selectedSkus) {
      prevPrices[sku] = products.find(p => p.sku === sku)?.prezzo_vendita ?? 0
    }
    mutateProducts(prev => prev.map(p =>
      selectedSkus.has(p.sku) ? { ...p, prezzo_vendita: price } : p
    ))
    for (const sku of selectedSkus) {
      const product = products.find(p => p.sku === sku)
      if (product) {
        dbSaveProduct({ ...product, prezzo_vendita: price }).catch((err) => {
          mutateProducts(prev => prev.map(p =>
            p.sku === sku ? { ...p, prezzo_vendita: prevPrices[sku] } : p
          ))
          showNotification('Errore aggiornamento prezzo per ' + sku + ': ' + (err instanceof Error ? err.message : String(err)), 'error')
        })
      }
    }
    setBulkPriceValue('')
  }

  const bulkDelete = () => {
    const deletedProducts = products.filter(p => selectedSkus.has(p.sku))
    mutateProducts(prev => prev.filter(p => !selectedSkus.has(p.sku)))
    const skusToDelete = Array.from(selectedSkus)
    dbBulkDeleteProducts(skusToDelete).then((deletedCount) => {
      if (deletedCount === 0 && skusToDelete.length > 0) {
        // Nessun prodotto eliminato, ripristina la UI
        mutateProducts(prev => [...prev, ...deletedProducts])
        showNotification('Errore: nessun prodotto eliminato dal database', 'error')
      }
    }).catch((err) => {
      // Ripristina tutti i prodotti in caso di errore
      mutateProducts(prev => [...prev, ...deletedProducts])
      showNotification('Errore eliminazione prodotti: ' + (err instanceof Error ? err.message : String(err)), 'error')
    })
    setSelectedSkus(new Set())
    setShowBulkActions(false)
  }

  const openAddModal = () => {
    setFormErrors({})
    setModal({
      open: true,
      mode: 'add',
      product: {
        ...EMPTY_FORM,
        sku: generateSKU(products),
        categoria: viewContext?.defaultCategory || EMPTY_FORM.categoria,
      },
    })
  }

  const openEditModal = (product: Product) => {
    setFormErrors({})
    setOpenMenu(null)
    setModal({
      open: true,
      mode: 'edit',
      product: { ...product },
    })
  }

  const closeModal = () => {
    setModal(prev => ({ ...prev, open: false }))
  }

  const updateFormField = (field: keyof FormData, value: string | number | ProductPhoto[] | Record<string, string> | null) => {
    setModal(prev => ({
      ...prev,
      product: {
        ...prev.product,
        [field]: field === 'customFields'
          ? value
          : ['prezzo_vendita', 'costo_acquisto', 'quantita_stock'].includes(field as string)
            ? (parseFloat(value as string) || 0)
            : value,
      },
    }))
    if (formErrors[field as string]) {
      setFormErrors(prev => { const n = { ...prev }; delete n[field as string]; return n })
    }
  }

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    const currentPhotos = modal.product.foto_locali || []
    const newPhotos: ProductPhoto[] = []
    const maxPhotos = 10
    for (let i = 0; i < files.length && currentPhotos.length + newPhotos.length < maxPhotos; i++) {
      const file = files[i]
      if (!file.type.startsWith('image/')) continue
      const url = URL.createObjectURL(file)
      newPhotos.push({ url, type: 'local', name: file.name })
    }
    updateFormField('foto_locali', [...currentPhotos, ...newPhotos])
    e.target.value = ''
  }

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !file.type.startsWith('video/')) return
    const url = URL.createObjectURL(file)
    updateFormField('video_url', url)
    e.target.value = ''
  }

  const removePhoto = (index: number) => {
    const photos = [...(modal.product.foto_locali || [])]
    if (photos[index]?.type === 'local') {
      URL.revokeObjectURL(photos[index].url)
    }
    photos.splice(index, 1)
    updateFormField('foto_locali', photos)
  }

  const removeVideo = () => {
    if (modal.product.video_url?.startsWith('blob:')) {
      URL.revokeObjectURL(modal.product.video_url)
    }
    updateFormField('video_url', null)
  }

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}
    const p = modal.product
    if (!p.sku.trim()) errors.sku = 'SKU obbligatorio'
    if (!p.nome.trim()) errors.nome = 'Nome obbligatorio'
    if (p.prezzo_vendita <= 0) errors.prezzo_vendita = 'Il prezzo deve essere > 0'
    if (p.costo_acquisto <= 0) errors.costo_acquisto = 'Il costo deve essere > 0'
    if (p.quantita_stock < 0) errors.quantita_stock = 'La quantità non può essere negativa'
    if (modal.mode === 'add' && products.some(x => x.sku === p.sku.trim())) {
      errors.sku = 'SKU già esistente'
    }
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const submitForm = () => {
    if (!validateForm()) return
    const p = modal.product
    const product: Product = {
      sku: p.sku.trim(),
      nome: p.nome.trim(),
      descrizione: p.descrizione?.trim() || null,
      prezzo_vendita: p.prezzo_vendita,
      costo_acquisto: p.costo_acquisto,
      quantita_stock: p.quantita_stock,
      link_foto_originale: p.link_foto_originale?.trim() || null,
      link_foto_elaborata: null,
      foto_locali: p.foto_locali || [],
      video_url: p.video_url || null,
      categoria: p.categoria?.trim() || null,
      taglia_variante: p.taglia_variante?.trim() || null,
      barcode: p.barcode?.trim() || null,
      fornitore: p.fornitore?.trim() || null,
      note: p.note?.trim() || null,
      customFields: p.customFields && Object.keys(p.customFields).length > 0 ? p.customFields : undefined,
    }
    dbSaveProduct(product).then(() => {
      if (modal.mode === 'add') {
        mutateProducts(prev => [...prev, product])
      } else {
        mutateProducts(prev => prev.map(x => x.sku === product.sku ? product : x))
      }
      requestSync?.()
    }).catch((err) => {
      showNotification('Errore nel salvataggio: ' + (err instanceof Error ? err.message : String(err)), 'error')
    })
    closeModal()
  }

  const ITALIAN_STOPWORDS = /\b(a|di|da|in|con|su|per|tra|fra|e|ed|o|od|il|lo|la|i|gli|le|un|una|uno|del|dei|degli|della|delle|al|allo|alla|agli|alle|dal|dallo|dalla|dagli|dalle|nel|nello|nella|negli|nelle|sul|sullo|sulla|sugli|sulle|col|coi)\b/gi

function normalizeHeader(text: string): string {
  return text.toLowerCase().replace(ITALIAN_STOPWORDS, '').replace(/[^a-z0-9]/g, '').trim()
}

const parseAndStartMapping = useCallback((headers: string[], rows: string[][], source: 'csv' | 'xlsx' | 'sheets', file: File | null) => {
    if (headers.length === 0 || rows.length === 0) {
      setImportState({ ...INITIAL_IMPORT })
      return
    }
    const preview = rows.slice(0, 5)
    const autoMappings: Record<string, string> = {}
    for (const dbField of DB_FIELDS) {
      // 1. Prova match esatto (case-insensitive)
      let match = headers.find(h =>
        normalizeHeader(h) === dbField.key.toLowerCase().replace(/_/g, '')
      )
      // 2. Prova con alias se non trovato
      if (!match && dbField.aliases) {
        for (const alias of dbField.aliases) {
          match = headers.find(h =>
            normalizeHeader(h) === normalizeHeader(alias)
          )
          if (match) break
        }
      }
      // 3. Prova partial match per le colonne lunghissime (es. "Grid-product__image Image")
      if (!match) {
        const dbKeyNormalized = dbField.key.toLowerCase().replace(/_/g, '')
        match = headers.find(h => {
          const hNorm = normalizeHeader(h)
          return hNorm.includes(dbKeyNormalized) || (dbField.aliases?.some(a => hNorm.includes(normalizeHeader(a))) ?? false)
        })
      }
      if (match) autoMappings[dbField.key] = match
    }
    setSelectedUnmappedCols(new Set())
    setImportState({
      step: 'mapping',
      file,
      rawHeaders: headers,
      rawRows: rows,
      previewRows: preview,
      mappings: autoMappings,
      result: null,
      source,
      sheetsUrl: '',
    })
  }, [])

  const handleCSVFileSelect = useCallback((file: File) => {
    setImportState(prev => ({ ...prev, file, step: 'importing', source: 'csv' }))
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const { headers, rows } = parseCSV(text)
      parseAndStartMapping(headers, rows, 'csv', file)
    }
    reader.onerror = () => setImportState({ ...INITIAL_IMPORT })
    reader.readAsText(file)
  }, [parseAndStartMapping])

  const handleXLSXFileSelect = useCallback((file: File) => {
    setImportState(prev => ({ ...prev, file, step: 'importing', source: 'xlsx' }))
    const reader = new FileReader()
    reader.onload = (e) => {
      const buffer = e.target?.result as ArrayBuffer
      const { headers, rows } = parseXLSX(buffer)
      parseAndStartMapping(headers, rows, 'xlsx', file)
    }
    reader.onerror = () => setImportState({ ...INITIAL_IMPORT })
    reader.readAsArrayBuffer(file)
  }, [parseAndStartMapping])

  const handleGoogleSheetsImport = useCallback(async () => {
    const url = importState.sheetsUrl.trim()
    if (!url) return
    const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/)
    if (!match) return
    const sheetId = match[1]
    const exportUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`
    setImportState(prev => ({ ...prev, step: 'importing', source: 'sheets', file: null }))
    try {
      const response = await fetch(exportUrl)
      if (!response.ok) throw new Error('Errore nel download del foglio')
      const text = await response.text()
      const { headers, rows } = parseCSV(text)
      parseAndStartMapping(headers, rows, 'sheets', null)
    } catch {
      setImportState({ ...INITIAL_IMPORT })
    }
  }, [importState.sheetsUrl, parseAndStartMapping])

  const updateImportMapping = (dbField: string, csvHeader: string) => {
    setImportState(prev => ({
      ...prev,
      mappings: { ...prev.mappings, [dbField]: csvHeader },
    }))
    setMappingPopupFor(null)
  }

  const removeImportMapping = (dbField: string) => {
    setImportState(prev => {
      const newMappings = { ...prev.mappings }
      delete newMappings[dbField]
      return { ...prev, mappings: newMappings }
    })
  }

  const selectUnmappedForField = (dbField: string, csvHeader: string) => {
    updateImportMapping(dbField, csvHeader)
  }

  const executeImport = () => {

    const headerIndex: Record<string, number> = {}
    importState.rawHeaders.forEach((h, i) => { headerIndex[h] = i })

    const unmappedHeaders = importState.rawHeaders.filter(h =>
      selectedUnmappedCols.has(h)
    )
    if (unmappedHeaders.length > 0) {
      setColumns(prev => {
        const maxOrder = Math.max(...prev.map(c => c.order), 0)
        const newCols = unmappedHeaders.map((h, i) => {
          const id = `custom_${h.toLowerCase().replace(/[^a-z0-9]/g, '_')}`
          if (prev.some(c => c.id === id)) return null
          return { id, label: h, visible: true, order: maxOrder + 1 + i, custom: true, width: 120, fieldType: unmappedColTypes[h] || 'text' } as ColumnDef
        }).filter(Boolean) as ColumnDef[]
        return [...prev, ...newCols]
      })
    }

    const imageUrlCols = unmappedHeaders.filter(h => (unmappedColTypes[h] || 'text') === 'image_url')

    const newProducts: Product[] = []
    const skippedSkus: string[] = []

    for (const row of importState.rawRows) {
      const getVal = (dbField: string): string => {
        const csvCol = importState.mappings[dbField]
        if (!csvCol) return ''
        const idx = headerIndex[csvCol]
        return idx !== undefined && idx < row.length ? row[idx] : ''
      }

      const nome = getVal('nome').trim()
      // Se il nome non è mappato, non blocchiamo l'importazione.
      // Generiamo un nome descrittivo basato sui dati disponibili.
      let finalNome = nome
      if (!finalNome) {
        // Se c'è uno SKU, usa lo SKU come nome (molto descrittivo)
        finalNome = getVal('sku').trim() || `Prodotto-${newProducts.length + 1}`
      }

      let sku = getVal('sku').trim()
      if (!sku) {
        const allProducts = [...products, ...newProducts]
        sku = generateSKU(allProducts)
      }
      if (sku && /^https?:\/\//i.test(sku)) {
        const allProducts = [...products, ...newProducts]
        sku = generateSKU(allProducts)
      }

      if (newProducts.some(p => p.sku === sku)) {
        skippedSkus.push(sku)
        continue
      }
      const customFields: Record<string, string> = {}
      for (const h of unmappedHeaders) {
        const idx = headerIndex[h]
        if (idx !== undefined && idx < row.length && row[idx].trim()) {
          const fieldKey = h.toLowerCase().replace(/[^a-z0-9]/g, '_')
          customFields[fieldKey] = row[idx].trim()
        }
      }
      newProducts.push({
        sku,
        nome: nome || 'Senza Nome',
        descrizione: getVal('descrizione').trim() || null,
        prezzo_vendita: parsePrice(getVal('prezzo_vendita')),
        costo_acquisto: parsePrice(getVal('costo_acquisto')),
        quantita_stock: parseInt(getVal('quantita_stock')) || 0,
        link_foto_originale: (getVal('foto') || getVal('link_foto_originale')).trim() || null,
        link_foto_elaborata: null,
        foto_locali: [],
        video_url: null,
        categoria: getVal('categoria').trim() || null,
        taglia_variante: getVal('taglia_variante').trim() || null,
        barcode: getVal('barcode').trim() || null,
        fornitore: getVal('fornitore').trim() || null,
        note: getVal('note').trim() || null,
        customFields: Object.keys(customFields).length > 0 ? customFields : undefined,
      })
    }

    if (newProducts.length > 0) {
      const importMode = importState.mode;
      dbBulkAddProducts(newProducts, importMode).then((inserted) => {
        mutateProducts(prev => [...prev, ...newProducts])
        requestSync?.()
        setImportState(prev => ({
          ...prev,
          step: 'result',
          result: { inserted, skipped: skippedSkus.length + (newProducts.length - inserted), skippedSkus },
        }))
        if (importMode === 'replace' && inserted > 0) {
          showNotification(`${inserted} prodotti importati/aggiornati con successo nel database.`, 'success')
        } else if (inserted < newProducts.length) {
          showNotification(`${inserted} di ${newProducts.length} prodotti importati con successo nel database. ${newProducts.length - inserted} duplicati saltati.`, 'success')
        } else {
          showNotification(`${inserted} di ${newProducts.length} prodotti importati con successo nel database`, 'success')
        }

        if (imageUrlCols.length > 0) {
          downloadImportImages(newProducts, imageUrlCols, headerIndex)
        }

        for (const p of newProducts) {
          if (p.link_foto_originale && p.link_foto_originale.startsWith('http')) {
            downloadProductImage(p.sku, p.link_foto_originale)
          }
        }
      }).catch((err) => {
        showNotification('Errore importazione: ' + (err instanceof Error ? err.message : String(err)), 'error')
        setImportState(prev => ({
          ...prev,
          step: 'result',
          result: { inserted: 0, skipped: skippedSkus.length + newProducts.length, skippedSkus },
        }))
      })
    } else {
      setImportState(prev => ({
        ...prev,
        step: 'result',
        result: { inserted: 0, skipped: skippedSkus.length, skippedSkus },
      }))
    }
  }

  const downloadProductImage = (sku: string, url: string) => {
    fetch(url)
      .then(r => r.blob())
      .then(blob => {
        const localName = `${sku}_foto_${Date.now()}.${blob.type.split('/')[1] || 'jpg'}`
        const localUrl = URL.createObjectURL(blob)
        const photo: ProductPhoto = { url: localUrl, type: 'local', name: localName }
        mutateProducts(prev => prev.map(pp => {
          if (pp.sku !== sku) return pp
          return { ...pp, foto_locali: [...pp.foto_locali, photo] }
        }))
      })
      .catch((err) => {
        showNotification('Errore download immagine per ' + sku + ': ' + (err instanceof Error ? err.message : String(err)), 'error')
      })
  }

  const downloadImportImages = (importedProducts: Product[], imgCols: string[], headerIndex: Record<string, number>) => {
    for (const col of imgCols) {
      const fieldKey = col.toLowerCase().replace(/[^a-z0-9]/g, '_')
      const idx = headerIndex[col]
      for (const p of importedProducts) {
        const url = p.customFields?.[fieldKey]
        if (!url || !url.startsWith('http')) continue
        fetch(url)
          .then(r => r.blob())
          .then(blob => {
            const localName = `${p.sku}_${fieldKey}_${Date.now()}.${blob.type.split('/')[1] || 'jpg'}`
            const localUrl = URL.createObjectURL(blob)
            const photo: ProductPhoto = { url: localUrl, type: 'local', name: localName }
            mutateProducts(prev => prev.map(pp => {
              if (pp.sku !== p.sku) return pp
              return { ...pp, foto_locali: [...pp.foto_locali, photo] }
            }))
          })
          .catch((err) => {
            showNotification('Errore download immagine import per ' + p.sku + ': ' + (err instanceof Error ? err.message : String(err)), 'error')
          })
      }
    }
  }

  const exportCSV = () => {
    const csvContent = buildExportCSV(products)
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `inventario_${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const exportXLSX = () => {
    const allCustomKeys = new Set<string>()
    for (const p of products) {
      if (p.customFields) Object.keys(p.customFields).forEach(k => allCustomKeys.add(k))
    }
    const customKeys = [...allCustomKeys].sort()
    const headers = ['SKU', 'Nome', 'Descrizione', 'Prezzo Vendita', 'Costo Acquisto', 'Quantita Stock', 'Categoria', 'Taglia/Variante', 'Link Foto', 'Link Foto Elaborata', 'Codice a Barre', 'Fornitore', 'Note', ...customKeys]
    const data = products.map(p => [
      p.sku, p.nome, p.descrizione, p.prezzo_vendita, p.costo_acquisto, p.quantita_stock,
      p.categoria, p.taglia_variante, p.link_foto_originale, p.link_foto_elaborata,
      p.barcode, p.fornitore, p.note,
      ...customKeys.map(k => p.customFields?.[k] ?? ''),
    ])
    const ws = XLSX.utils.aoa_to_sheet([headers, ...data])
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Inventario')
    XLSX.writeFile(wb, `inventario_${new Date().toISOString().slice(0, 10)}.xlsx`)
  }

  const exportGoogleSheets = () => {
    const csvContent = buildExportCSV(products)
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `inventario_google-sheets_${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const resetImport = () => {
    setSelectedUnmappedCols(new Set())
    setUnmappedColTypes({})
    setImportState({ ...INITIAL_IMPORT })
  }

  const toggleColumn = (id: string) => {
    if (id === 'azioni') return
    setColumns(prev => prev.map(c =>
      c.id === id ? { ...c, visible: !c.visible } : c
    ))
  }

  const moveColumn = (id: string, direction: 'up' | 'down') => {
    setColumns(prev => {
      const sorted = [...prev].sort((a, b) => a.order - b.order)
      const idx = sorted.findIndex(c => c.id === id)
      if (idx < 0) return prev
      const swapIdx = direction === 'up' ? idx - 1 : idx + 1
      if (swapIdx < 0 || swapIdx >= sorted.length) return prev
      const newOrders = sorted.map((c, i) => ({ ...c, order: i }))
      const temp = newOrders[idx].order
      newOrders[idx] = { ...newOrders[idx], order: newOrders[swapIdx].order }
      newOrders[swapIdx] = { ...newOrders[swapIdx], order: temp }
      return newOrders
    })
  }

  const addCustomColumn = () => {
    const name = newColName.trim()
    if (!name) return
    const id = `custom_${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`
    if (columns.some(c => c.id === id)) return
    const maxOrder = Math.max(...columns.map(c => c.order), 0) + 1
    setColumns(prev => [...prev, { id, label: name, visible: true, order: maxOrder, custom: true, width: 120, fieldType: newColType }])
    setNewColName('')
    setNewColType('text')
  }

  const removeCustomColumn = (id: string) => {
    if (!id.startsWith('custom_')) return
    setColumns(prev => prev.filter(c => c.id !== id))
    mutateProducts(prev => prev.map(p => {
      if (!p.customFields) return p
      const cf = { ...p.customFields }
      const fieldKey = id.replace('custom_', '')
      delete cf[fieldKey]
      return { ...p, customFields: cf }
    }))
  }

  const handleColumnHeaderClick = (colId: string) => {
    if (!selectedColId) {
      setSelectedColId(colId)
      return
    }
    if (selectedColId === colId) {
      setSelectedColId(null)
      return
    }
    setColumns(prev => {
      const sorted = [...prev].sort((a, b) => a.order - b.order)
      const idxA = sorted.findIndex(c => c.id === selectedColId)
      const idxB = sorted.findIndex(c => c.id === colId)
      if (idxA < 0 || idxB < 0) return prev
      const temp = sorted[idxA].order
      sorted[idxA] = { ...sorted[idxA], order: sorted[idxB].order }
      sorted[idxB] = { ...sorted[idxB], order: temp }
      return sorted
    })
    setSelectedColId(null)
  }

  const col = {
    surface: 'bg-[#1c2024]',
    surface2: 'bg-[#242a30]',
    surface3: 'bg-[#2a3038]',
    border: 'border-[#3f4850]',
    text: 'text-[#dfe3e8]',
    textMuted: 'text-[#8b939c]',
    textDim: 'text-[#636c75]',
    input: 'bg-[#1a1e23] border-[#3f4850] text-[#dfe3e8] placeholder:text-[#636c75]',
    hover: 'hover:bg-[#2a3038]',
    accent: 'text-sky-400',
    accentBg: 'bg-sky-600 hover:bg-sky-700',
    dangerBg: 'bg-red-500/20 text-red-400',
  }

  const inputClass = cn(
    'flex h-9 w-full rounded-md border bg-[#1a1e23] border-[#3f4850] px-3 py-1 text-sm text-[#dfe3e8] placeholder:text-[#636c75]',
    'transition-colors focus:ring-2 focus:ring-sky-500 focus:ring-offset-1 focus:ring-offset-[#1c2024] focus:outline-none focus:border-sky-500',
  )

  const labelClass = 'block text-xs font-medium text-[#8b939c] mb-1'

  const renderCell = (p: Product, columnId: string, idx: number) => {
    switch (columnId) {
      case 'foto': {
        const media = getProductMedia(p)
        return (
          <PhotoThumbnail
            product={p}
            size={32}
            onClick={media.length > 0 ? () => setMediaGallery({ items: media, index: 0 }) : undefined}
          />
        )
      }
      case 'sku':
        return <span className="font-mono text-xs text-[#8b939c]">{p.sku}</span>
      case 'nome_categoria':
        return (
          <div>
            <div className="font-medium text-[#dfe3e8]">{p.nome || p.sku || '(Senza Nome)'}</div>
            <div className="text-xs text-[#636c75]">
              {[p.categoria, p.taglia_variante].filter(Boolean).join(' · ')}
            </div>
          </div>
        )
      case 'prezzo_vendita':
        return <span className="font-medium tabular-nums">{formatPrice(p.prezzo_vendita)}</span>
      case 'costo_acquisto':
        return <span className="text-[#8b939c] tabular-nums">{formatPrice(p.costo_acquisto)}</span>
      case 'margine':
        return (
          <span className={p.prezzo_vendita - p.costo_acquisto >= 0 ? 'text-emerald-400' : 'text-red-400'}>
            {formatPrice(p.prezzo_vendita - p.costo_acquisto)}
          </span>
        )
      case 'quantita_stock':
        return editingStockSku === p.sku ? (
          <input
            type="number"
            value={editStockValue}
            onChange={e => setEditStockValue(e.target.value)}
            onBlur={saveStockEdit}
            onKeyDown={e => { if (e.key === 'Enter') saveStockEdit() }}
            autoFocus
            className={cn(inputClass, 'w-20 h-7 text-xs')}
          />
        ) : (
          <div className="cursor-pointer" onClick={() => startStockEdit(p.sku, p.quantita_stock)} title="Clicca per modificare">
            <StockBadge qty={p.quantita_stock} />
          </div>
        )
      case 'azioni':
        return (
          <div className="text-right">
            <button
              onClick={(e) => {
                if (openMenu === p.sku) {
                  setOpenMenu(null)
                } else {
                  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
                  const menuW = 192
                  const menuH = 130
                  let top = rect.bottom + 4
                  let left = rect.right - menuW
                  if (top + menuH > window.innerHeight) top = rect.top - menuH - 4
                  if (left < 8) left = rect.left
                  if (left + menuW > window.innerWidth) left = window.innerWidth - menuW - 8
                  setActionsMenuPos({ top, left })
                  setOpenMenu(p.sku)
                }
              }}
              className="p-1 rounded hover:bg-[#3f4850] text-[#8b939c]"
            >
              <MoreHorizontal size={16} />
            </button>
            {openMenu === p.sku && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setOpenMenu(null)} />
                <div
                  className={cn('fixed rounded-md shadow-lg z-30 py-1 border bg-[#1c2024] w-48', col.border)}
                  style={{ top: actionsMenuPos.top, left: Math.max(8, actionsMenuPos.left) }}
                >
                  <button
                    onClick={() => openEditModal(p)}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-[#2a3038] flex items-center gap-2 text-[#dfe3e8]"
                  >
                    <Pencil size={14} className="text-[#8b939c]" />
                    Modifica Prodotto
                  </button>
                  <button
                    onClick={() => startStockEdit(p.sku, p.quantita_stock)}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-[#2a3038] flex items-center gap-2 text-[#dfe3e8]"
                  >
                    <Pencil size={14} className="text-[#8b939c]" />
                    Modifica Stock
                  </button>
                  <div className={cn('border-t my-1', col.border)} />
                  <button
                    onClick={() => { setShowDeleteConfirm(p.sku); setOpenMenu(null) }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-red-500/10 text-red-400 flex items-center gap-2"
                  >
                    <Trash2 size={14} />
                    Elimina Prodotto
                  </button>
                </div>
              </>
            )}
          </div>
        )
      default: {
        if (columnId.startsWith('custom_')) {
          const fieldKey = columnId.replace('custom_', '')
          const val = p.customFields?.[fieldKey]
          if (!val) return null
          const colDef = columns.find(c => c.id === columnId)
          if (colDef?.fieldType === 'image_url' && val.startsWith('http')) {
            return (
              <div className="flex items-center gap-1">
                <img src={val} alt="" className="w-7 h-7 rounded object-cover border border-[#3f4850]" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                <a href={val} target="_blank" rel="noopener noreferrer" className="text-xs text-sky-400 hover:underline truncate max-w-[80px]">{val.split('/').pop()}</a>
              </div>
            )
          }
          if (colDef?.fieldType === 'url' && val.startsWith('http')) {
            return <a href={val} target="_blank" rel="noopener noreferrer" className="text-xs text-sky-400 hover:underline truncate max-w-[150px]">{val}</a>
          }
          if (colDef?.fieldType === 'number') {
            return <span className="text-xs text-[#8b939c] text-right tabular-nums">{val}</span>
          }
          return <span className="text-xs text-[#8b939c]">{val}</span>
        }
        return null
      }
    }
  }

  const getCellAlignment = (columnId: string): string => {
    if (['prezzo_vendita', 'costo_acquisto', 'margine'].includes(columnId)) return 'text-right'
    if (columnId === 'azioni') return 'text-right'
    return 'text-left'
  }

  return (
    <>
      {notification && (
        <div key={notification.key} className={cn(
          'fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium max-w-md border',
          notification.type === 'success' && 'bg-emerald-600/90 text-white border-emerald-500',
          notification.type === 'error' && 'bg-red-600/90 text-white border-red-500',
          notification.type === 'info' && 'bg-sky-600/90 text-white border-sky-500'
        )}>
          {notification.message}
        </div>
      )}
      <div className="flex-1 min-h-0 flex flex-col text-[#dfe3e8]">
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <h1 className="text-xl font-bold text-[#dfe3e8]">
          {viewContext ? viewContext.name : 'Inventario'}
          {viewContext?.defaultCategory && (
            <span className="ml-2 text-sm font-normal text-[#8b939c]">· {viewContext.defaultCategory}</span>
          )}
        </h1>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8b939c]" />
            <input
              type="text"
              placeholder="Cerca per SKU, nome o categoria..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              className={cn(inputClass, 'pl-9 w-60')}
            />
          </div>
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setExportMenuOpen(!exportMenuOpen)}
              className="border-[#3f4850] bg-[#1c2024] text-[#dfe3e8] hover:bg-[#2a3038]"
            >
              <Download size={15} />
              Esporta
            </Button>
            {exportMenuOpen && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setExportMenuOpen(false)} />
                <div className={cn('absolute right-0 mt-2 w-48 rounded-md shadow-lg z-30 py-1 border', col.border, 'bg-[#1c2024]')}>
                  <button
                    onClick={() => { exportCSV(); setExportMenuOpen(false) }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-[#2a3038] flex items-center gap-2 text-[#dfe3e8]"
                  >
                    <FileSpreadsheet size={14} className="text-[#8b939c]" />
                    CSV
                  </button>
                  <button
                    onClick={() => { exportXLSX(); setExportMenuOpen(false) }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-[#2a3038] flex items-center gap-2 text-[#dfe3e8]"
                  >
                    <FileSpreadsheet size={14} className="text-[#8b939c]" />
                    XLSX
                  </button>
                  <button
                    onClick={() => { exportGoogleSheets(); setExportMenuOpen(false) }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-[#2a3038] flex items-center gap-2 text-[#dfe3e8]"
                  >
                    <LinkIcon size={14} className="text-[#8b939c]" />
                    CSV per Google Sheets
                  </button>
                </div>
              </>
            )}
          </div>
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowColConfig(!showColConfig)}
              className="border-[#3f4850] bg-[#1c2024] text-[#dfe3e8] hover:bg-[#2a3038]"
            >
              <Columns3 size={15} />
              Colonne
            </Button>
            {showColConfig && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setShowColConfig(false)} />
                <div className={cn('absolute right-0 mt-1 w-72 rounded-md shadow-lg z-30 border bg-[#1c2024] p-3', col.border)}>
                  <h4 className="text-xs font-semibold text-[#8b939c] mb-2">Configura Colonne</h4>
                  <div className="space-y-1 max-h-60 overflow-y-auto">
                    {sortedColumns.map(c => (
                      <div key={c.id} className="flex items-center gap-1.5">
                        <GripVertical size={12} className="text-[#636c75] cursor-grab" />
                        <button
                          onClick={() => moveColumn(c.id, 'up')}
                          className="p-0.5 rounded hover:bg-[#2a3038] text-[#636c75] disabled:opacity-20"
                          disabled={c.order === 0}
                        >
                          <ChevronUp size={12} />
                        </button>
                        <button
                          onClick={() => moveColumn(c.id, 'down')}
                          className="p-0.5 rounded hover:bg-[#2a3038] text-[#636c75] disabled:opacity-20"
                          disabled={c.order === sortedColumns.length - 1}
                        >
                          <ChevronDown size={12} />
                        </button>
                        <label className="flex items-center gap-2 flex-1 cursor-pointer text-xs text-[#dfe3e8]">
                          <input
                            type="checkbox"
                            checked={c.visible}
                            onChange={() => toggleColumn(c.id)}
                            disabled={c.id === 'azioni'}
                            className="rounded border-[#3f4850] accent-sky-600"
                          />
                          {c.label}
                          {c.custom && <span className="text-[6px] uppercase bg-sky-600/20 text-sky-400 px-1 py-0.5 rounded">custom</span>}
                          {c.fieldType && c.fieldType !== 'text' && (
                            <span className="text-[6px] uppercase bg-amber-600/20 text-amber-400 px-1 py-0.5 rounded">{c.fieldType === 'image_url' ? 'img' : c.fieldType === 'number' ? 'num' : c.fieldType === 'url' ? 'url' : 'date'}</span>
                          )}
                        </label>
                        {c.custom && (
                          <button
                            onClick={() => removeCustomColumn(c.id)}
                            className="p-0.5 rounded hover:bg-red-500/20 text-red-400"
                          >
                            <X size={12} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 pt-3 border-t border-[#3f4850]">
                    <p className="text-[10px] text-[#636c75] mb-1.5">Aggiungi colonna personalizzata</p>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        value={newColName}
                        onChange={e => setNewColName(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') addCustomColumn() }}
                        placeholder="Nome colonna..."
                        className={cn(inputClass, 'flex-1 h-7 text-xs')}
                      />
                      <select
                        value={newColType}
                        onChange={e => setNewColType(e.target.value as ColumnFieldType)}
                        className={cn(inputClass, 'h-7 text-xs px-2 w-[100px]')}
                      >
                        <option value="text">Testo</option>
                        <option value="number">Numero</option>
                        <option value="image_url">URL Immagine</option>
                        <option value="url">URL</option>
                        <option value="date">Data</option>
                      </select>
                      <button
                        onClick={addCustomColumn}
                        disabled={!newColName.trim()}
                        className="px-2 py-1 text-xs rounded-md bg-sky-600 text-white hover:bg-sky-700 disabled:opacity-40"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                  {unmappedHeaders.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-[#3f4850]">
                      <p className="text-[10px] text-[#636c75] mb-1">Colonne non mappate dall'ultimo import:</p>
                      <div className="flex flex-wrap gap-1">
                        {unmappedHeaders.map(h => (
                          <span key={h} className="text-[10px] bg-orange-500/10 text-orange-400 px-1.5 py-0.5 rounded">{h}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
          <Button size="sm" onClick={openAddModal}
            className="bg-sky-600 text-white hover:bg-sky-700 border-0">
            <Plus size={15} />
            Aggiungi Prodotto
          </Button>
        </div>
      </div>

      {/* Import Zone */}
      {importState.step === 'drop' && (
        <div className={cn('border-2 border-dashed rounded-lg p-6 mb-4', col.surface, col.border, 'hover:border-sky-500 hover:bg-sky-500/5 transition-all cursor-pointer')}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('border-sky-500', 'bg-sky-500/5') }}
          onDragLeave={e => { e.currentTarget.classList.remove('border-sky-500', 'bg-sky-500/5') }}
          onDrop={e => {
            e.preventDefault()
            e.currentTarget.classList.remove('border-sky-500', 'bg-sky-500/5')
            const file = e.dataTransfer.files[0]
            if (file) {
              if (file.name.endsWith('.csv') || file.type === 'text/csv') handleCSVFileSelect(file)
              else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) handleXLSXFileSelect(file)
            }
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={e => { const file = e.target.files?.[0]; if (file) handleCSVFileSelect(file); e.target.value = '' }}
          />
          <input
            ref={xlsxInputRef}
            type="file"
            accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            className="hidden"
            onChange={e => { const file = e.target.files?.[0]; if (file) handleXLSXFileSelect(file); e.target.value = '' }}
          />
          <div className="flex flex-col items-center gap-2">
            <Upload size={24} className="text-[#8b939c]" />
            <p className="text-sm text-[#8b939c]">
              Trascina qui un file <span className="text-[#dfe3e8] font-medium">.csv</span> o <span className="text-[#dfe3e8] font-medium">.xlsx</span> oppure clicca per sfogliare
            </p>
            <div className="flex gap-3 mt-2">
              <button
                onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click() }}
                className="px-3 py-1.5 text-xs rounded-md border border-[#3f4850] text-[#dfe3e8] hover:bg-[#2a3038] flex items-center gap-1.5"
              >
                <FileSpreadsheet size={14} />
                CSV
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); xlsxInputRef.current?.click() }}
                className="px-3 py-1.5 text-xs rounded-md border border-[#3f4850] text-[#dfe3e8] hover:bg-[#2a3038] flex items-center gap-1.5"
              >
                <FileSpreadsheet size={14} />
                XLSX
              </button>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-[#3f4850]">
            <p className="text-xs text-[#636c75] mb-2">Oppure importa da Google Sheets (link pubblico):</p>
            <div className="flex gap-2">
              <input
                type="url"
                placeholder="https://docs.google.com/spreadsheets/d/..."
                value={importState.sheetsUrl}
                onChange={e => setImportState(prev => ({ ...prev, sheetsUrl: e.target.value }))}
                onClick={e => e.stopPropagation()}
                className={cn(inputClass, 'flex-1 h-8 text-xs')}
              />
              <button
                onClick={(e) => { e.stopPropagation(); handleGoogleSheetsImport() }}
                disabled={!importState.sheetsUrl.trim()}
                className="px-3 py-1.5 text-xs rounded-md bg-sky-600 text-white hover:bg-sky-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                <LinkIcon size={14} />
                Importa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Mapping Step */}
      {importState.step === 'mapping' && (
        <div className={cn('border rounded-lg p-5 mb-4', col.border, col.surface)}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-[#dfe3e8] text-sm">Mappatura Colonne — {importState.source?.toUpperCase()}</h3>
              <p className="text-xs text-[#8b939c]">
                {importState.file?.name || 'Google Sheets'} — {importState.rawRows.length} righe rilevate
              </p>
            </div>
            <button onClick={resetImport} className="p-1 rounded hover:bg-[#2a3038] text-[#8b939c]">
              <X size={18} />
            </button>
          </div>

          <p className="text-xs text-[#8b939c] mb-3">
            Associa ogni colonna del file CSV ai campi dell'inventario. Le colonne non mappate possono essere importate come campi personalizzati.
          </p>

          {/* Fields mapping grid */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            {DB_FIELDS.map(field => {
              const currentMapping = importState.mappings[field.key] || ''
              const isMapped = currentMapping !== ''
              return (
                <div key={field.key} className="flex items-center gap-2">
                  <label className="text-xs font-medium text-[#8b939c] w-[130px] flex-shrink-0 text-right">
                    {field.label}
                    {field.required && <span className="text-red-400 ml-0.5">*</span>}
                  </label>
                  <span className="text-[#636c75] text-xs">→</span>
                  <select
                    value={currentMapping}
                    onChange={e => {
                      const value = e.target.value
                      if (value === '') {
                        removeImportMapping(field.key)
                      } else {
                        updateImportMapping(field.key, value)
                      }
                    }}
                    className={cn(
                      inputClass, 'flex-1 h-8 text-xs px-2',
                      isMapped && 'border-emerald-500/40 text-emerald-300'
                    )}
                  >
                    <option value="">-- ignora --</option>
                    {importState.rawHeaders.map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>
              )
            })}
          </div>

          {/* Unmapped columns — custom fields */}
          {unmappedHeaders.length > 0 && (
            <div className="mb-4 p-3 rounded-md bg-sky-500/10 border border-sky-500/20">
              <p className="text-xs text-sky-400 mb-2 font-medium">Colonne non mappate — importa come campi personalizzati:</p>
              <div className="space-y-1.5">
                {unmappedHeaders.map(h => {
                  const isSelected = selectedUnmappedCols.has(h)
                  const currentType = unmappedColTypes[h] || 'text'
                  return (
                    <div key={h} className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedUnmappedCols(prev => {
                            const newSet = new Set(prev)
                            if (newSet.has(h)) { newSet.delete(h) } else { newSet.add(h) }
                            return newSet
                          })
                        }}
                        className={cn(
                          'text-xs px-2.5 py-1 rounded-md border transition-all duration-200 flex-1 text-left',
                          isSelected
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : 'bg-sky-500/20 text-sky-300 border-transparent hover:bg-sky-500/30 cursor-pointer'
                        )}
                      >
                        {isSelected ? '✓ ' : '⌧ '}{h}
                      </button>
                      <select
                        value={currentType}
                        onChange={e => setUnmappedColTypes(prev => ({ ...prev, [h]: e.target.value as ColumnFieldType }))}
                        className={cn(inputClass, 'h-6 text-[10px] px-1.5 w-[100px]')}
                      >
                        <option value="text">Testo</option>
                        <option value="number">Numero</option>
                        <option value="image_url">URL Immagine</option>
                        <option value="url">URL</option>
                        <option value="date">Data</option>
                      </select>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {importState.previewRows.length > 0 && (
            <div className="mb-4">
              <p className="text-xs text-[#8b939c] mb-2">Anteprima (prime {Math.min(5, importState.previewRows.length)} righe):</p>
              <div className={cn('rounded overflow-auto max-h-40', col.border)}>
                <table className="w-full text-xs">
                  <thead>
                    <tr className={col.surface3}>
                      {importState.rawHeaders.map(h => {
                        const isAutoMapped = Object.values(importState.mappings).includes(h)
                        const isSelectedUnmapped = selectedUnmappedCols.has(h)
                        return (
                          <th
                            key={h}
                            className={cn(
                              'px-3 py-1.5 text-left font-medium whitespace-nowrap transition-colors',
                              (isAutoMapped || isSelectedUnmapped) ? 'text-emerald-400 font-semibold' : 'text-[#8b939c]'
                            )}
                          >
                            {h}
                          </th>
                        )
                       })}
                    </tr>
                  </thead>
                  <tbody>
                    {importState.previewRows.map((row, ri) => (
                      <tr key={ri} className={cn(ri % 2 === 0 ? col.surface : col.surface2)}>
                        {row.map((cell, ci) => (
                          <td key={ci} className="px-3 py-1.5 whitespace-nowrap text-[#dfe3e8]">{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-3">
              <span className="text-xs text-[#8b939c]">In caso di SKU già esistenti:</span>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="import-mode"
                    checked={importState.mode === 'ignore'}
                    onChange={() => setImportState(prev => ({ ...prev, mode: 'ignore' }))}
                    className="accent-sky-500"
                  />
                  <span className="text-xs text-[#dfe3e8]">Ignora</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="import-mode"
                    checked={importState.mode === 'replace'}
                    onChange={() => setImportState(prev => ({ ...prev, mode: 'replace' }))}
                    className="accent-sky-500"
                  />
                  <span className="text-xs text-[#dfe3e8]">Aggiorna</span>
                </label>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={resetImport} className="px-4 py-1.5 text-sm rounded-md border border-[#3f4850] text-[#dfe3e8] hover:bg-[#2a3038]">
                Annulla
              </button>
              <button onClick={executeImport} className="px-4 py-1.5 text-sm rounded-md bg-sky-600 text-white hover:bg-sky-700 font-medium">
                Importa {importState.rawRows.length} righe
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Result */}
      {importState.step === 'result' && importState.result && (
        <div className={cn('border rounded-lg p-5 mb-4', col.border, col.surface)}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-[#dfe3e8] text-sm">Risultato Importazione</h3>
            <button onClick={resetImport} className="p-1 rounded hover:bg-[#2a3038] text-[#8b939c]">
              <X size={18} />
            </button>
          </div>
          <div className="flex gap-4 mb-3">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
                {importState.result.inserted}
              </span>
              <span className="text-sm text-[#dfe3e8]">prodotti inseriti</span>
            </div>
            {importState.result.skipped > 0 && (
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center rounded-md bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-800">
                  {importState.result.skipped}
                </span>
                <span className="text-sm text-[#dfe3e8]">SKU già esistenti (saltati)</span>
              </div>
            )}
          </div>
          {importState.result.skippedSkus.length > 0 && (
            <div className="mb-3">
              <p className="text-xs text-[#8b939c] mb-1">SKU duplicati:</p>
              <div className="flex flex-wrap gap-1">
                {importState.result.skippedSkus.map(sku => (
                  <span key={sku} className="text-xs bg-orange-500/10 text-orange-400 px-1.5 py-0.5 rounded font-mono">
                    {sku}
                  </span>
                ))}
              </div>
            </div>
          )}
          {prefilter && importState.result.inserted > 0 && (() => {
            const visibleInView = products.filter(p => {
              if (prefilter.categories && prefilter.categories.length > 0) {
                if (!p.categoria || !prefilter.categories.includes(p.categoria)) return false
              }
              if (prefilter.stockMin !== undefined && p.quantita_stock < prefilter.stockMin) return false
              if (prefilter.stockMax !== undefined && p.quantita_stock > prefilter.stockMax) return false
              if (prefilter.priceMin !== undefined && p.prezzo_vendita < prefilter.priceMin) return false
              if (prefilter.priceMax !== undefined && p.prezzo_vendita > prefilter.priceMax) return false
              return true
            }).length
            if (visibleInView < importState.result.inserted) return (
              <div className="mb-3 p-2 rounded bg-amber-500/10 border border-amber-500/20">
                <p className="text-xs text-amber-400">
                  {visibleInView === 0
                    ? 'Nessun prodotto importato corrisponde al filtro di questa vista. Vai alla scheda "Prodotti" per visualizzarli tutti.'
                    : `${importState.result.inserted - visibleInView} prodotti importati non corrispondono al filtro di questa vista. Vai alla scheda "Prodotti" per visualizzarli tutti.`}
                </p>
              </div>
            )
            return null
          })()}
          <button onClick={resetImport} className="px-4 py-1.5 text-sm rounded-md bg-sky-600 text-white hover:bg-sky-700 font-medium">
            Chiudi
          </button>
        </div>
      )}

      {/* Bulk Actions Bar */}
      {selectedSkus.size > 0 && (
        <div className={cn('border rounded-lg px-4 py-3 mb-3 flex items-center gap-4 flex-wrap', col.border, col.surface, 'animate-in fade-in slide-in-from-top-2')}>
          <span className="text-sm font-semibold text-[#dfe3e8]">
            {selectedSkus.size} selezionati
          </span>
          <div className="flex items-center gap-2">
            <Input
              placeholder="Nuovo stock..."
              value={bulkStockValue}
              onChange={e => setBulkStockValue(e.target.value)}
              className="w-28 h-8 text-xs"
              type="number"
              min="0"
            />
            <Button size="sm" variant="outline" onClick={bulkSetStock} disabled={!bulkStockValue}>
              Aggiorna Stock
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Input
              placeholder="Nuovo prezzo..."
              value={bulkPriceValue}
              onChange={e => setBulkPriceValue(e.target.value)}
              className="w-28 h-8 text-xs"
              type="text"
            />
            <Button size="sm" variant="outline" onClick={bulkSetPrice} disabled={!bulkPriceValue}>
              Aggiorna Prezzo
            </Button>
          </div>
          <div className="flex-1" />
          <Button size="sm" variant="outline" className="text-red-400 border-red-500/30 hover:bg-red-500/10" onClick={() => setShowBulkActions(true)}>
            <Trash2 size={14} className="mr-1" />
            Elimina {selectedSkus.size}
          </Button>
          <Button size="sm" variant="outline" onClick={() => setSelectedSkus(new Set())}>
            <X size={14} className="mr-1" />
            Deseleziona
          </Button>
        </div>
      )}
      {showBulkActions && (
        <div className={cn('border rounded-lg p-4 mb-3', col.border, col.surface)}>
          <p className="text-sm text-[#dfe3e8] mb-3">
            Eliminare {selectedSkus.size} prodotti? Questa azione non può essere annullata.
          </p>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => setShowBulkActions(false)}>Annulla</Button>
            <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white" onClick={bulkDelete}>
              <Trash2 size={14} className="mr-1" /> Conferma Elimina
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className={cn('flex-1 border rounded-lg overflow-hidden flex flex-col', col.border)} style={{ minHeight: 0 }}>
        <div className="flex-1 overflow-auto" style={{ minHeight: 0, scrollbarGutter: 'stable both-edges' }}>
          <table ref={tableRef} className="w-full text-sm" style={{ tableLayout: 'fixed', minWidth: visibleColumns.reduce((sum, c) => sum + (c.width || 100), 0) }}>
            <colgroup>
              <col style={{ width: 40 }} />
              {visibleColumns.map(c => (
                <col key={c.id} style={{ width: c.width || 100, transition: 'width 50ms ease' }} />
              ))}
            </colgroup>
            <thead className="sticky top-0 z-10">
              <tr className={cn('border-b', col.border, col.surface3)}>
                <th className="h-10 px-2 w-10 text-center select-none">
                    <input
                      type="checkbox"
                      checked={filtered.length > 0 && selectedSkus.size === filtered.length}
                      onChange={toggleSelectAll}
                      className="w-3.5 h-3.5 rounded accent-sky-500 cursor-pointer"
                    />
                  </th>
                  {visibleColumns.map(c => (
                  <th
                    key={c.id}
                    data-col-id={c.id}
                    className={cn(
                      'h-10 px-3 text-xs font-semibold text-[#8b939c] relative select-none',
                      getCellAlignment(c.id),
                      c.id !== 'azioni' && 'cursor-pointer',
                      selectedColId === c.id && 'bg-sky-500/15 ring-2 ring-inset ring-sky-500',
                      resizingColId === c.id && 'bg-sky-500/10',
                    )}
                    onClick={(e) => {
                      if ((e.target as HTMLElement).closest('[data-resize]')) return
                      if (c.id === 'azioni') return
                      handleColumnHeaderClick(c.id)
                    }}
                  >
                    <div className="flex items-center gap-1">
                      <span className="truncate">{c.label}</span>
                      {selectedColId === c.id && <span className="text-[8px] text-sky-400 shrink-0">●</span>}
                    </div>
                    {c.id !== 'azioni' && (
                      <div
                        data-resize
                        onMouseDown={e => startResize(e, c.id, c.width || 100)}
                        onDoubleClick={() => autoFitColumn(c.id)}
                        className="absolute right-[-6px] top-0 bottom-0 w-3 cursor-col-resize z-20 group"
                      >
                        <div className="absolute inset-x-[5px] top-0 bottom-0 group-hover:bg-sky-500/40 transition-colors rounded-sm" />
                        {resizingColId === c.id && (
                          <div className="absolute inset-x-[5px] top-0 bottom-0 bg-sky-500/60 rounded-sm" />
                        )}
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={columnCount} className="px-3 py-16 text-center text-[#636c75]">
                    {search ? 'Nessun prodotto trovato per la ricerca.' : 'Nessun prodotto in inventario.'}
                  </td>
                </tr>
              ) : (
                paged.map((p, idx) => (
                  <tr
                    key={p.sku}
                    className={cn(
                      'border-b transition-colors', col.border,
                      idx % 2 === 0 ? col.surface : col.surface2,
                      'hover:bg-[#2a3038]',
                    )}
                  >
                    <td className="px-1 py-2.5 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={selectedSkus.has(p.sku)}
                        onChange={() => toggleSelect(p.sku)}
                        className="w-3.5 h-3.5 rounded accent-sky-500 cursor-pointer"
                      />
                    </td>
                    {visibleColumns.map(c => (
                      <td key={c.id} className={cn('px-3 py-2.5 overflow-hidden text-ellipsis whitespace-nowrap relative', getCellAlignment(c.id))}>
                        {renderCell(p, c.id, idx)}
                        {c.id !== 'azioni' && (
                          <div
                            data-resize
                            onMouseDown={e => startResize(e, c.id, c.width || 100)}
                            onDoubleClick={() => autoFitColumn(c.id)}
                            className="absolute right-[-6px] top-0 bottom-0 w-3 cursor-col-resize z-10 opacity-0 hover:opacity-100 transition-opacity"
                          />
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className={cn('flex items-center justify-between px-4 py-2 border-t', col.border, col.surface)}>
          <div className="flex items-center gap-3">
            <span className="text-xs text-[#8b939c]">{filtered.length} prodotti</span>
            <select
              value={perPage}
              onChange={e => { setPerPage(Number(e.target.value)); setPage(1) }}
              className="h-6 rounded text-xs px-1.5 bg-[#1a1e23] border-[#3f4850] text-[#8b939c]"
            >
              {[10, 25, 50, 100].map(n => (
                <option key={n} value={n}>{n} / pagina</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1 rounded hover:bg-[#2a3038] disabled:opacity-30 text-[#8b939c]"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs text-[#8b939c]">Pag. {page} di {totalPages || 1}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || totalPages === 0}
              className="p-1 rounded hover:bg-[#2a3038] disabled:opacity-30 text-[#8b939c]"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Photo Popover */}
      {photoPopover && (
        <div
          className="fixed z-40"
          style={{
            top: photoPopover.rect.bottom + 8,
            left: Math.max(8, Math.min(window.innerWidth - 220, photoPopover.rect.left)),
          }}
          onClick={e => e.stopPropagation()}
        >
          <div className={cn('rounded-lg shadow-2xl border overflow-hidden', col.border, col.surface)}>
            <img
              src={getPhotoUrl(photoPopover.product) || ''}
              alt={photoPopover.product.nome}
              className="w-48 h-48 object-cover"
            />
            <div className="px-2 py-1.5 text-[10px] text-[#8b939c] truncate max-w-[192px]">
              {photoPopover.product.nome}
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Product Modal */}
      {modal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={closeModal}>
          <div
            className={cn('rounded-lg shadow-2xl w-full max-w-2xl mx-4 border flex flex-col max-h-[85vh]', col.border, col.surface)}
            onClick={e => e.stopPropagation()}
          >
            <div className={cn('flex items-center justify-between px-6 py-4 border-b shrink-0', col.border)}>
              <h3 className="font-semibold text-[#dfe3e8]">
                {modal.mode === 'add' ? 'Nuovo Prodotto' : 'Modifica Prodotto'}
              </h3>
              <button onClick={closeModal} className="p-1 rounded hover:bg-[#2a3038] text-[#8b939c]">
                <X size={20} />
              </button>
            </div>

            <div className="px-6 py-4 flex-1 overflow-y-auto space-y-4 min-h-0" style={{ scrollbarGutter: 'stable' }}>
              {/* Foto e Video */}
              <div>
                <label className={labelClass}>Foto Prodotto (max 10 immagini)</label>
                <div className="mt-1 space-y-2">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => photoInputRef.current?.click()}
                      disabled={(modal.product.foto_locali?.length || 0) >= 10}
                      className="px-3 py-1.5 text-xs rounded-md border border-[#3f4850] text-[#dfe3e8] hover:bg-[#2a3038] disabled:opacity-40 flex items-center gap-1.5"
                    >
                      <Camera size={14} />
                      Aggiungi Foto
                    </button>
                    <button
                      type="button"
                      onClick={() => videoInputRef.current?.click()}
                      disabled={!!modal.product.video_url}
                      className="px-3 py-1.5 text-xs rounded-md border border-[#3f4850] text-[#dfe3e8] hover:bg-[#2a3038] disabled:opacity-40 flex items-center gap-1.5"
                    >
                      <Video size={14} />
                      {modal.product.video_url ? 'Video caricato' : 'Aggiungi Video'}
                    </button>
                    <input
                      ref={photoInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handlePhotoUpload}
                    />
                    <input
                      ref={videoInputRef}
                      type="file"
                      accept="video/*"
                      className="hidden"
                      onChange={handleVideoUpload}
                    />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {modal.product.foto_locali && modal.product.foto_locali.map((photo, i) => (
                      <div key={`photo-${i}`} className="relative group cursor-pointer" onClick={() => setGalleryImages({ urls: modal.product.foto_locali!.map(p => p.url), index: i })}>
                        <img src={photo.url} alt={`Foto ${i + 1}`} className="w-16 h-16 rounded object-cover border border-[#3f4850] hover:ring-2 hover:ring-sky-500 transition-all" />
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); removePhoto(i) }}
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={12} />
                        </button>
                        {i === 0 && <span className="absolute bottom-0 left-0 right-0 text-[8px] text-center bg-sky-600 text-white rounded-b">PRINCIPALE</span>}
                      </div>
                    ))}
                    {modal.product.video_url && (
                      <div className="relative group cursor-pointer" onClick={() => {
                        const media: MediaItem[] = [
                          ...(modal.product.foto_locali || []).map(p => ({ type: 'image' as const, url: p.url })),
                          { type: 'video' as const, url: modal.product.video_url! },
                        ]
                        setMediaGallery({ items: media, index: media.length - 1 })
                      }}>
                        <div className="w-16 h-16 rounded object-cover border border-sky-500/50 bg-[#1a1e23] flex items-center justify-center hover:ring-2 hover:ring-sky-500 transition-all">
                          <Video size={20} className="text-sky-400" />
                        </div>
                        <span className="absolute bottom-0 left-0 right-0 text-[8px] text-center bg-sky-600 text-white rounded-b">VIDEO</span>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); removeVideo() }}
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    )}
                    {(!modal.product.foto_locali?.length && !modal.product.video_url) && (
                      <span className="text-xs text-[#636c75] self-center">Nessuna foto o video</span>
                    )}
                    {(modal.product.foto_locali?.length || 0) > 0 && (
                      <span className="text-xs text-[#636c75] self-center">{modal.product.foto_locali.length}/10</span>
                    )}
                  </div>

                  {modal.product.video_url && (
                    <div className="space-y-2">
                      <video
                        src={modal.product.video_url}
                        controls
                        className="w-full max-h-48 rounded border border-[#3f4850] bg-black"
                      />
                      <div className="flex items-center gap-2">
                        <Video size={14} className="text-sky-400" />
                        <span className="text-xs text-[#dfe3e8]">Video caricato</span>
                        <button
                          type="button"
                          onClick={removeVideo}
                          className="ml-auto px-2 py-0.5 text-xs rounded hover:bg-red-500/20 text-red-400 flex items-center gap-1"
                        >
                          <X size={12} />
                          Rimuovi
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>SKU *</label>
                  <input
                    type="text"
                    value={modal.product.sku}
                    onChange={e => updateFormField('sku', e.target.value)}
                    className={cn(inputClass, formErrors.sku && 'border-red-500')}
                    disabled={modal.mode === 'edit'}
                  />
                  {formErrors.sku && <p className="text-xs text-red-400 mt-1">{formErrors.sku}</p>}
                </div>
                <div>
                  <label className={labelClass}>Nome *</label>
                  <input
                    type="text"
                    value={modal.product.nome}
                    onChange={e => updateFormField('nome', e.target.value)}
                    className={cn(inputClass, formErrors.nome && 'border-red-500')}
                  />
                  {formErrors.nome && <p className="text-xs text-red-400 mt-1">{formErrors.nome}</p>}
                </div>
              </div>

              <div>
                <label className={labelClass}>Descrizione</label>
                <textarea
                  value={modal.product.descrizione || ''}
                  onChange={e => updateFormField('descrizione', e.target.value)}
                  rows={2}
                  className={cn(inputClass, 'h-auto resize-none')}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className={labelClass}>Prezzo Vendita *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={modal.product.prezzo_vendita || ''}
                    onChange={e => updateFormField('prezzo_vendita', e.target.value)}
                    className={cn(inputClass, formErrors.prezzo_vendita && 'border-red-500')}
                  />
                  {formErrors.prezzo_vendita && <p className="text-xs text-red-400 mt-1">{formErrors.prezzo_vendita}</p>}
                </div>
                <div>
                  <label className={labelClass}>Costo Acquisto *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={modal.product.costo_acquisto || ''}
                    onChange={e => updateFormField('costo_acquisto', e.target.value)}
                    className={cn(inputClass, formErrors.costo_acquisto && 'border-red-500')}
                  />
                  {formErrors.costo_acquisto && <p className="text-xs text-red-400 mt-1">{formErrors.costo_acquisto}</p>}
                </div>
                <div>
                  <label className={labelClass}>Quantità Stock *</label>
                  <input
                    type="number"
                    min="0"
                    value={modal.product.quantita_stock || ''}
                    onChange={e => updateFormField('quantita_stock', e.target.value)}
                    className={cn(inputClass, formErrors.quantita_stock && 'border-red-500')}
                  />
                  {formErrors.quantita_stock && <p className="text-xs text-red-400 mt-1">{formErrors.quantita_stock}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Categoria</label>
                  <input
                    type="text"
                    value={modal.product.categoria || ''}
                    onChange={e => updateFormField('categoria', e.target.value)}
                    className={inputClass}
                    placeholder="es. Scarpe, Borse, Accessori..."
                  />
                </div>
                <div>
                  <label className={labelClass}>Taglia / Variante</label>
                  <input
                    type="text"
                    value={modal.product.taglia_variante || ''}
                    onChange={e => updateFormField('taglia_variante', e.target.value)}
                    className={inputClass}
                    placeholder="es. M, L, 42, Unica..."
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Link Foto (remoto)</label>
                <input
                  type="url"
                  value={modal.product.link_foto_originale || ''}
                  onChange={e => updateFormField('link_foto_originale', e.target.value)}
                  className={inputClass}
                  placeholder="https://..."
                />
              </div>

              {columns.filter(c => c.custom && c.visible).length > 0 && (
                <div className="pt-4 border-t border-[#3f4850]">
                  <h4 className="text-xs font-semibold text-[#8b939c] mb-3">Campi Personalizzati</h4>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                    {columns.filter(c => c.custom && c.visible).map(c => {
                      const fieldKey = c.id.replace('custom_', '')
                      const currentVal = modal.product?.customFields?.[fieldKey] || ''
                      return (
                        <div key={c.id}>
                          <label className={labelClass}>{c.label}</label>
                          <input
                            type="text"
                            value={currentVal}
                            onChange={e => {
                              const updated = { ...(modal.product?.customFields || {}), [fieldKey]: e.target.value }
                              updateFormField('customFields', updated)
                            }}
                            className={inputClass}
                            placeholder={c.label}
                          />
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className={cn('flex justify-end gap-3 px-6 py-4 border-t shrink-0', col.border)}>
              <button onClick={closeModal} className="px-4 py-2 text-sm rounded-md border border-[#3f4850] text-[#dfe3e8] hover:bg-[#2a3038]">
                Annulla
              </button>
              <button onClick={submitForm} className="px-4 py-2 text-sm rounded-md bg-sky-600 text-white hover:bg-sky-700 font-medium">
                {modal.mode === 'add' ? 'Crea Prodotto' : 'Salva Modifiche'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Media Gallery Viewer (Foto + Video) */}
      {mediaGallery && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80" onClick={() => setMediaGallery(null)}>
          <div className="relative max-w-4xl max-h-[90vh] w-full mx-4 flex flex-col items-center" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setMediaGallery(null)}
              className="absolute -top-2 -right-2 z-10 w-8 h-8 rounded-full bg-[#1c2024] border border-[#3f4850] text-[#dfe3e8] flex items-center justify-center hover:bg-red-600 hover:border-red-600 transition-colors"
            >
              <X size={18} />
            </button>
            <div className="flex items-center justify-center w-full flex-1 min-h-0">
              {mediaGallery.index > 0 && (
                <button
                  onClick={() => setMediaGallery(prev => prev ? { ...prev, index: prev.index - 1 } : null)}
                  className="shrink-0 w-10 h-10 rounded-full bg-[#1c2024]/80 border border-[#3f4850] text-[#dfe3e8] flex items-center justify-center hover:bg-sky-600 transition-colors mr-3"
                >
                  <ChevronLeft size={20} />
                </button>
              )}
              {mediaGallery.items[mediaGallery.index]?.type === 'video' ? (
                <video
                  src={mediaGallery.items[mediaGallery.index].url}
                  controls
                  autoPlay
                  className="max-h-[75vh] max-w-full rounded-lg"
                />
              ) : (
                <img
                  src={mediaGallery.items[mediaGallery.index]?.url}
                  alt={`Media ${mediaGallery.index + 1}`}
                  className="max-h-[75vh] max-w-full rounded-lg object-contain"
                />
              )}
              {mediaGallery.index < mediaGallery.items.length - 1 && (
                <button
                  onClick={() => setMediaGallery(prev => prev ? { ...prev, index: prev.index + 1 } : null)}
                  className="shrink-0 w-10 h-10 rounded-full bg-[#1c2024]/80 border border-[#3f4850] text-[#dfe3e8] flex items-center justify-center hover:bg-sky-600 transition-colors ml-3"
                >
                  <ChevronRight size={20} />
                </button>
              )}
            </div>
            <div className="flex items-center justify-center gap-2 mt-4">
              {mediaGallery.items.map((item, i) => (
                <button
                  key={i}
                  onClick={() => setMediaGallery(prev => prev ? { ...prev, index: i } : null)}
                  className={cn(
                    'transition-colors relative',
                    i === mediaGallery.index
                      ? 'ring-2 ring-sky-500 rounded'
                      : 'hover:opacity-80',
                  )}
                >
                  {item.type === 'video' ? (
                    <div className={cn('w-8 h-8 rounded flex items-center justify-center', i === mediaGallery.index ? 'bg-sky-600' : 'bg-[#3f4850]')}>
                      <Play size={12} className="text-white" />
                    </div>
                  ) : (
                    <img src={item.url} alt="" className={cn('w-8 h-8 rounded object-cover', i !== mediaGallery.index && 'opacity-50')} />
                  )}
                </button>
              ))}
            </div>
            <span className="text-xs text-[#8b939c] mt-2">
              {mediaGallery.index + 1} / {mediaGallery.items.length}
              {mediaGallery.items[mediaGallery.index]?.type === 'video' && ' · Video'}
            </span>
          </div>
        </div>
      )}

      {/* Photo Gallery Viewer (legacy - still used by modal photo clicks) */}
      {galleryImages && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80" onClick={() => setGalleryImages(null)}>
          <div className="relative max-w-4xl max-h-[90vh] w-full mx-4 flex flex-col items-center" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setGalleryImages(null)}
              className="absolute -top-2 -right-2 z-10 w-8 h-8 rounded-full bg-[#1c2024] border border-[#3f4850] text-[#dfe3e8] flex items-center justify-center hover:bg-red-600 hover:border-red-600 transition-colors"
            >
              <X size={18} />
            </button>
            <div className="flex items-center justify-center w-full flex-1 min-h-0">
              {galleryImages.index > 0 && (
                <button
                  onClick={() => setGalleryImages(prev => prev ? { ...prev, index: prev.index - 1 } : null)}
                  className="shrink-0 w-10 h-10 rounded-full bg-[#1c2024]/80 border border-[#3f4850] text-[#dfe3e8] flex items-center justify-center hover:bg-sky-600 transition-colors mr-3"
                >
                  <ChevronLeft size={20} />
                </button>
              )}
              <img
                src={galleryImages.urls[galleryImages.index]}
                alt={`Foto ${galleryImages.index + 1}`}
                className="max-h-[75vh] max-w-full rounded-lg object-contain"
              />
              {galleryImages.index < galleryImages.urls.length - 1 && (
                <button
                  onClick={() => setGalleryImages(prev => prev ? { ...prev, index: prev.index + 1 } : null)}
                  className="shrink-0 w-10 h-10 rounded-full bg-[#1c2024]/80 border border-[#3f4850] text-[#dfe3e8] flex items-center justify-center hover:bg-sky-600 transition-colors ml-3"
                >
                  <ChevronRight size={20} />
                </button>
              )}
            </div>
            <div className="flex items-center justify-center gap-2 mt-4">
              {galleryImages.urls.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setGalleryImages(prev => prev ? { ...prev, index: i } : null)}
                  className={cn(
                    'w-2.5 h-2.5 rounded-full transition-colors',
                    i === galleryImages.index ? 'bg-sky-500' : 'bg-[#3f4850] hover:bg-[#636c75]',
                  )}
                />
              ))}
            </div>
            <span className="text-xs text-[#8b939c] mt-2">{galleryImages.index + 1} / {galleryImages.urls.length}</span>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setShowDeleteConfirm(null)}>
          <div
            className={cn('rounded-lg shadow-2xl w-96 p-6 border', col.border, col.surface)}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                <AlertTriangle size={20} className="text-red-400" />
              </div>
              <div>
                <h3 className="font-semibold text-[#dfe3e8]">Conferma eliminazione</h3>
                <p className="text-xs text-[#8b939c]">Operazione irreversibile</p>
              </div>
            </div>
            <p className="text-sm text-[#8b939c] mb-6">
              Sei sicuro di voler eliminare{' '}
              <strong className="text-[#dfe3e8]">
                {products.find(p => p.sku === showDeleteConfirm)?.nome}
              </strong>
              ? Tutti i dati associati verranno persi.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 text-sm rounded-md border border-[#3f4850] text-[#dfe3e8] hover:bg-[#2a3038]"
              >
                Annulla
              </button>
              <button
                onClick={() => deleteProduct(showDeleteConfirm)}
                className="px-4 py-2 text-sm rounded-md bg-red-600 text-white hover:bg-red-700 font-medium"
              >
                Elimina definitivamente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  )
}
