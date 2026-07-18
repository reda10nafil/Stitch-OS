import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import type { AppInterface, RouterState, AppStatus, InventorySubPage, SavedInventoryView, Product } from '@/types'

const INVENTORY_SUBPAGE_KEY = 'inventory_active_subpage'
const INVENTORY_VIEWS_KEY = 'inventory_custom_views'

function loadPersistedSubPage(): InventorySubPage | undefined {
  try {
    const raw = localStorage.getItem(INVENTORY_SUBPAGE_KEY)
    if (raw) return raw
  } catch {}
  return undefined
}

function persistSubPage(subPage: InventorySubPage | undefined) {
  try {
    if (subPage) localStorage.setItem(INVENTORY_SUBPAGE_KEY, subPage)
    else localStorage.removeItem(INVENTORY_SUBPAGE_KEY)
  } catch {}
}

function loadPersistedViews(): SavedInventoryView[] {
  try {
    const raw = localStorage.getItem(INVENTORY_VIEWS_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return []
}

function persistViews(views: SavedInventoryView[]) {
  try {
    localStorage.setItem(INVENTORY_VIEWS_KEY, JSON.stringify(views))
  } catch {}
}

interface AppStoreContext {
  router: RouterState
  navigate: (target: AppInterface, source?: 'sidebar' | 'keyboard' | 'programmatic') => void
  navigateInventorySubPage: (subPage: InventorySubPage) => void
  addSavedInventoryView: (view: SavedInventoryView) => void
  removeSavedInventoryView: (viewId: string) => void
  setUnsavedChanges: (value: boolean) => void
  appStatus: AppStatus
  setAppStatus: (status: Partial<AppStatus>) => void
  forceNavigation: (target: AppInterface) => void
  sharedProducts: Product[]
  setSharedProducts: (products: Product[] | ((prev: Product[]) => Product[])) => void
}

const AppStoreCtx = createContext<AppStoreContext | null>(null)

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [router, setRouter] = useState<RouterState>({
    currentInterface: 'dashboard',
    currentInventorySubPage: loadPersistedSubPage() || 'products',
    savedInventoryViews: loadPersistedViews(),
    previousInterface: null,
    isNavigating: false,
    hasUnsavedChanges: false,
  })
  const [appStatus, setAppStatusState] = useState<AppStatus>({
    aiStatus: 'connected',
    aiLatency: 230,
    queueCount: 0,
    fallbackActive: false,
  })
  const [sharedProducts, setSharedProductsState] = useState<Product[]>([])
  const [pendingNav, setPendingNav] = useState<AppInterface | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)

  const setSharedProducts = useCallback((products: Product[] | ((prev: Product[]) => Product[])) => {
    setSharedProductsState(products)
  }, [])

  const setUnsavedChanges = useCallback((value: boolean) => {
    setRouter(prev => ({ ...prev, hasUnsavedChanges: value }))
  }, [])

  const forceNavigation = useCallback((target: AppInterface) => {
    setRouter(prev => ({
      ...prev,
      currentInterface: target,
      previousInterface: prev.currentInterface,
      isNavigating: false,
      hasUnsavedChanges: false,
    }))
    setShowConfirm(false)
    setPendingNav(null)
  }, [])

  const navigate = useCallback((target: AppInterface, source: 'sidebar' | 'keyboard' | 'programmatic' = 'sidebar') => {
    if (target === router.currentInterface) return

    if (router.hasUnsavedChanges) {
      setPendingNav(target)
      setShowConfirm(true)
      return
    }

    setRouter(prev => ({
      ...prev,
      currentInterface: target,
      previousInterface: prev.currentInterface,
      isNavigating: false,
      hasUnsavedChanges: false,
    }))
  }, [router.currentInterface, router.hasUnsavedChanges])

  const navigateInventorySubPage = useCallback((subPage: InventorySubPage) => {
    persistSubPage(subPage)
    setRouter(prev => ({ ...prev, currentInventorySubPage: subPage }))
  }, [])

  const addSavedInventoryView = useCallback((view: SavedInventoryView) => {
    setRouter(prev => {
      const next = [...prev.savedInventoryViews, view]
      persistViews(next)
      return { ...prev, savedInventoryViews: next }
    })
  }, [])

  const removeSavedInventoryView = useCallback((viewId: string) => {
    setRouter(prev => {
      const next = prev.savedInventoryViews.filter(v => v.id !== viewId)
      persistViews(next)
      if (prev.currentInventorySubPage === viewId) {
        persistSubPage('products')
        return { ...prev, savedInventoryViews: next, currentInventorySubPage: 'products' }
      }
      return { ...prev, savedInventoryViews: next }
    })
}, [])
  const setAppStatus = useCallback((status: Partial<AppStatus>) => {
    setAppStatusState(prev => ({ ...prev, ...status }))
  }, [])

  const handleCancel = useCallback(() => {
    setShowConfirm(false)
    setPendingNav(null)
  }, [])

  const handleConfirm = useCallback(() => {
    if (pendingNav) {
      forceNavigation(pendingNav)
    }
  }, [pendingNav, forceNavigation])

  return (
    <AppStoreCtx.Provider value={{ router, navigate, navigateInventorySubPage, addSavedInventoryView, removeSavedInventoryView, setUnsavedChanges, appStatus, setAppStatus, forceNavigation, sharedProducts, setSharedProducts }}>
      {children}
      {showConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50" onClick={handleCancel}>
          <div
            className="bg-white rounded-lg shadow-xl w-96 p-6 animate-slide-up"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Modifiche non salvate</h3>
            <p className="text-sm text-slate-600 mb-6">
              Sono presenti modifiche non salvate. Sei sicuro di voler lasciare questa pagina?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200 focus-ring"
              >
                Annulla
              </button>
              <button
                onClick={handleConfirm}
                className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-md hover:bg-red-600 focus-ring"
              >
                Esci senza salvare
              </button>
            </div>
          </div>
        </div>
      )}
    </AppStoreCtx.Provider>
  )
}

export function useAppStore() {
  const ctx = useContext(AppStoreCtx)
  if (!ctx) throw new Error('useAppStore must be within AppStoreProvider')
  return ctx
}