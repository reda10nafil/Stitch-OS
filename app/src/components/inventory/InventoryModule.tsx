import { useMemo, useState, useCallback, useEffect, useRef, type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Plus, X, Filter, Package, BarChart3, FileSpreadsheet, AlertTriangle, RefreshCw } from 'lucide-react'
import { useAppStore } from '@/stores/appStore'
import { InventoryProducts, MOCK_PRODUCTS } from './InventoryProducts'
import { InventoryStats } from './InventoryStats'
import { InventoryCategories } from './InventoryCategories'
import { dbGetProducts, dbCheckIntegrity, dbReset } from '@/lib/db'
import type { Product, SavedInventoryView, InventoryViewFilter } from '@/types'

const TAB_STYLE = {
  base: 'px-3 py-1.5 text-sm rounded-md transition-colors select-none',
  active: 'bg-sky-600 text-white',
  inactive: 'text-[#8b939c] hover:text-[#dfe3e8] hover:bg-[#2a3038]',
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(TAB_STYLE.base, active ? TAB_STYLE.active : TAB_STYLE.inactive)}
    >
      {children}
    </button>
  )
}

function NewViewDialog({ onSave, onClose }: { onSave: (view: SavedInventoryView) => void; onClose: () => void }) {
  const [viewName, setViewName] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [stockMin, setStockMin] = useState('')
  const [stockMax, setStockMax] = useState('')
  const [priceMin, setPriceMin] = useState('')
  const [priceMax, setPriceMax] = useState('')

  function handleSave() {
    const name = viewName.trim()
    if (!name) return
    const filter: InventoryViewFilter = {}
    const cats = categoryFilter.trim()
    if (cats) filter.categories = cats.split(',').map(c => c.trim()).filter(Boolean)
    if (stockMin) filter.stockMin = parseInt(stockMin)
    if (stockMax) filter.stockMax = parseInt(stockMax)
    if (priceMin) filter.priceMin = parseFloat(priceMin.replace(',', '.'))
    if (priceMax) filter.priceMax = parseFloat(priceMax.replace(',', '.'))
    const defaultCategory = filter.categories && filter.categories.length === 1 ? filter.categories[0] : undefined
    onSave({ id: `custom-${Date.now()}`, name, filter, defaultCategory })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="rounded-lg shadow-2xl border border-[#3f4850] bg-[#1c2024] w-96 p-5"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-[#dfe3e8]">Nuova Vista Inventario</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-[#2a3038] text-[#8b939c]">
            <X size={16} />
          </button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-[#8b939c] mb-1">Nome Vista *</label>
            <input
              type="text"
              value={viewName}
              onChange={e => setViewName(e.target.value)}
              placeholder="es. Scarpe Premium, Stock Basso..."
              className="flex h-9 w-full rounded-md border bg-[#1a1e23] border-[#3f4850] px-3 py-1 text-sm text-[#dfe3e8] placeholder:text-[#636c75] focus:ring-2 focus:ring-sky-500 focus:outline-none"
              onKeyDown={e => { if (e.key === 'Enter') handleSave() }}
              autoFocus
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#8b939c] mb-1">Categorie (separate da virgola)</label>
            <input
              type="text"
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              placeholder="es. Scarpe, Borse, Accessori"
              className="flex h-9 w-full rounded-md border bg-[#1a1e23] border-[#3f4850] px-3 py-1 text-sm text-[#dfe3e8] placeholder:text-[#636c75] focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-[#8b939c] mb-1">Stock min</label>
              <input
                type="number"
                value={stockMin}
                onChange={e => setStockMin(e.target.value)}
                placeholder="0"
                min="0"
                className="flex h-9 w-full rounded-md border bg-[#1a1e23] border-[#3f4850] px-3 py-1 text-sm text-[#dfe3e8] placeholder:text-[#636c75] focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#8b939c] mb-1">Stock max</label>
              <input
                type="number"
                value={stockMax}
                onChange={e => setStockMax(e.target.value)}
                placeholder="∞"
                min="0"
                className="flex h-9 w-full rounded-md border bg-[#1a1e23] border-[#3f4850] px-3 py-1 text-sm text-[#dfe3e8] placeholder:text-[#636c75] focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-[#8b939c] mb-1">Prezzo min €</label>
              <input
                type="text"
                value={priceMin}
                onChange={e => setPriceMin(e.target.value)}
                placeholder="0"
                className="flex h-9 w-full rounded-md border bg-[#1a1e23] border-[#3f4850] px-3 py-1 text-sm text-[#dfe3e8] placeholder:text-[#636c75] focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#8b939c] mb-1">Prezzo max €</label>
              <input
                type="text"
                value={priceMax}
                onChange={e => setPriceMax(e.target.value)}
                placeholder="∞"
                className="flex h-9 w-full rounded-md border bg-[#1a1e23] border-[#3f4850] px-3 py-1 text-sm text-[#dfe3e8] placeholder:text-[#636c75] focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-5">
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-md border border-[#3f4850] text-[#dfe3e8] hover:bg-[#2a3038]">
            Annulla
          </button>
          <button
            onClick={handleSave}
            disabled={!viewName.trim()}
            className="px-4 py-2 text-sm rounded-md bg-sky-600 text-white hover:bg-sky-700 font-medium disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Crea Vista
          </button>
        </div>
      </div>
    </div>
  )
}

export function InventoryModule() {
  const { router, addSavedInventoryView, removeSavedInventoryView, navigateInventorySubPage, sharedProducts, setSharedProducts } = useAppStore()
  const [showNewViewDialog, setShowNewViewDialog] = useState(false)
  const [dbCorrupted, setDbCorrupted] = useState(false)
  const [resetMessage, setResetMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  const [resettingDb, setResettingDb] = useState(false)
  const loadedRef = useRef(false)
  const [refreshCounter, setRefreshCounter] = useState(0)
  const activeSubPage = router.currentInventorySubPage || 'products'

  useEffect(() => {
    dbCheckIntegrity().then(r => {
      if (!r.healthy) setDbCorrupted(true)
    }).catch(() => {})
  }, [])

  const triggerRefresh = useCallback(() => {
    loadedRef.current = false
    setRefreshCounter(c => c + 1)
  }, [])

  const handleResetDb = async () => {
    if (!confirm('ATTENZIONE: Questa operazione cancellerà TUTTI i dati del database e li ricreerà da zero. I prodotti attualmente visualizzati andranno persi. Continuare?')) return
    setResettingDb(true)
    try {
      const result = await dbReset()
      if (result.reset) {
        setDbCorrupted(false)
        setSharedProducts(MOCK_PRODUCTS)
        loadedRef.current = false
        setResetMessage({ text: 'Database ricreato con successo. I dati di esempio sono stati caricati.', type: 'success' })
        setTimeout(() => setResetMessage(null), 5000)
      } else {
        setResetMessage({ text: 'Errore: ' + result.message, type: 'error' })
        setTimeout(() => setResetMessage(null), 5000)
      }
    } catch (e) {
      setResetMessage({ text: 'Errore reset database: ' + (e instanceof Error ? e.message : String(e)), type: 'error' })
      setTimeout(() => setResetMessage(null), 5000)
    } finally {
      setResettingDb(false)
    }
  }

  useEffect(() => {
    if (loadedRef.current || sharedProducts.length > 0) return
    loadedRef.current = true
    dbGetProducts().then(p => {
      setSharedProducts(prev => {
        if (prev.length === 0) return p.length > 0 ? p : MOCK_PRODUCTS
        return prev
      })
    }).catch(() => {
      setSharedProducts(prev => prev.length === 0 ? MOCK_PRODUCTS : prev)
    })
  }, [sharedProducts.length, setSharedProducts, refreshCounter])

  function handleProductUpdate(updated: Product[]) {
    setSharedProducts(updated)
  }

  const allTabs = useMemo(() => {
    const tabs: { label: string; icon: ReactNode; id: string; removable: boolean }[] = [
      { label: 'Prodotti', icon: <Package size={14} />, id: 'products', removable: false },
      { label: 'Statistiche', icon: <BarChart3 size={14} />, id: 'statistics', removable: false },
      { label: 'Categorie', icon: <FileSpreadsheet size={14} />, id: 'categories', removable: false },
    ]
    for (const v of router.savedInventoryViews) {
      tabs.push({ label: v.name, icon: <Filter size={14} />, id: v.id, removable: true })
    }
    return tabs
  }, [router.savedInventoryViews])

  const activeView = useMemo(() => {
    return allTabs.find(t => t.id === activeSubPage)
  }, [allTabs, activeSubPage])

  function handleAddView(view: SavedInventoryView) {
    addSavedInventoryView(view)
    navigateInventorySubPage(view.id)
  }

  function handleRemoveView(viewId: string) {
    removeSavedInventoryView(viewId)
  }

  return (
    <div className="h-full flex flex-col">
      {dbCorrupted && (
        <div className="mb-4 px-4 py-3 rounded-lg border border-red-500/50 bg-red-600/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle size={18} className="text-red-400" />
            <div>
              <p className="text-sm font-medium text-red-400">Database corrotto rilevato</p>
              <p className="text-xs text-[#8b939c]">Il file del database è danneggiato. Le operazioni di lettura/scrittura potrebbero fallire.</p>
            </div>
          </div>
          <button
            onClick={handleResetDb}
            disabled={resettingDb}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md bg-red-600 text-white hover:bg-red-700 font-medium disabled:opacity-50"
          >
            <RefreshCw size={14} className={resettingDb ? 'animate-spin' : ''} />
            {resettingDb ? 'Ripristino...' : 'Ripristina Database'}
          </button>
        </div>
      )}
      {resetMessage && (
        <div className={cn(
          'mb-4 px-4 py-3 rounded-lg border text-sm font-medium',
          resetMessage.type === 'success' && 'border-emerald-500/50 bg-emerald-600/10 text-emerald-400',
          resetMessage.type === 'error' && 'border-red-500/50 bg-red-600/10 text-red-400'
        )}>
          {resetMessage.text}
        </div>
      )}
      {/* Tab Bar */}
      <div className="flex items-center gap-1 mb-4 border-b border-[#3f4850] pb-3 overflow-x-auto" style={{ scrollbarWidth: 'thin' }}>
        {allTabs.map(t => (
          <div key={t.id} className="flex items-center">
            <TabButton active={activeSubPage === t.id} onClick={() => navigateInventorySubPage(t.id)}>
              <span className="flex items-center gap-1.5">
                {t.icon}
                {t.label}
              </span>
            </TabButton>
            {t.removable && activeSubPage !== t.id && (
              <button
                onClick={() => handleRemoveView(t.id)}
                className="ml-0.5 p-0.5 rounded hover:bg-red-500/10 text-[#636c75] hover:text-red-400 transition-colors"
                title="Elimina vista"
              >
                <X size={10} />
              </button>
            )}
          </div>
        ))}
        <button
          onClick={() => setShowNewViewDialog(true)}
          className={cn(TAB_STYLE.base, TAB_STYLE.inactive, 'flex items-center gap-1')}
          title="Crea nuova vista filtrata"
        >
          <Plus size={14} />
          <span className="text-xs">Nuova Vista</span>
        </button>
      </div>

      {/* Sub-page Content */}
      <div className="flex-1 min-h-0 flex flex-col">
        {activeSubPage === 'products' && <InventoryProducts sharedProducts={sharedProducts} onProductsChange={handleProductUpdate} requestSync={triggerRefresh} />}
        {activeSubPage === 'statistics' && <InventoryStats products={sharedProducts} />}
        {activeSubPage === 'categories' && <InventoryCategories products={sharedProducts} onProductsChange={handleProductUpdate} />}
        {activeView?.removable && activeSubPage === activeView?.id && (() => {
          const savedView = router.savedInventoryViews.find(v => v.id === activeSubPage)
          return (
            <InventoryProducts
              sharedProducts={sharedProducts}
              onProductsChange={handleProductUpdate}
              requestSync={triggerRefresh}
              prefilter={savedView?.filter}
              viewContext={savedView ? { name: savedView.name, defaultCategory: savedView.defaultCategory } : undefined}
            />
          )
        })()}
      </div>

      {/* New View Dialog */}
      {showNewViewDialog && (
        <NewViewDialog
          onSave={handleAddView}
          onClose={() => setShowNewViewDialog(false)}
        />
      )}
    </div>
  )
}