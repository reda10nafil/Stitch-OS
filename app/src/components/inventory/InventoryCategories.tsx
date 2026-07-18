import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Package, Search, Pencil, Check, X, ChevronRight, ArrowLeft, FileSpreadsheet } from 'lucide-react'
import { dbSaveProduct } from '@/lib/db'
import type { Product } from '@/types'

const COL = { surface:'bg-[#1c2024]', surface2:'bg-[#242a30]', border:'border-[#3f4850]' }

function formatPrice(n: number): string {
  return new Intl.NumberFormat('it-IT', { style:'currency', currency:'EUR' }).format(n)
}

function StockBadge({ qty }: { qty: number }) {
  if (qty===0) return <span className="inline-flex items-center rounded-md bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">Esaurito</span>
  if (qty<=5) return <span className="inline-flex items-center rounded-md bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-800">{qty} unità</span>
  return <span className="inline-flex items-center rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">{qty} unità</span>
}

interface CategoryInfo {
  name: string
  count: number
  totalStock: number
  totalValue: number
  products: Product[]
}

function computeCategories(products: Product[]): CategoryInfo[] {
  const map = new Map<string, Product[]>()
  for (const p of products) {
    const key = p.categoria || 'Senza Categoria'
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(p)
  }
  return Array.from(map.entries()).map(([name, prods]) => ({
    name,
    count: prods.length,
    totalStock: prods.reduce((s,p)=>s+p.quantita_stock,0),
    totalValue: prods.reduce((s,p)=>s+p.prezzo_vendita*p.quantita_stock,0),
    products: prods,
  })).sort((a,b)=>a.name.localeCompare(b.name))
}

function CategoryTable({ categories, onSelect }: { categories: CategoryInfo[]; onSelect: (c: CategoryInfo) => void }) {
  return (
    <div className={cn('flex-1 border rounded-lg overflow-hidden flex flex-col', COL.border)} style={{minHeight:0}}>
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10">
            <tr className={cn('border-b', COL.border, 'bg-[#2a3038]')}>
              <th className="h-10 px-3 text-xs font-semibold text-[#8b939c] text-left">Categoria</th>
              <th className="h-10 px-3 text-xs font-semibold text-[#8b939c] text-right">Prodotti</th>
              <th className="h-10 px-3 text-xs font-semibold text-[#8b939c] text-right">Stock Tot</th>
              <th className="h-10 px-3 text-xs font-semibold text-[#8b939c] text-right">Valore Stock</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((c,i)=>(
              <tr key={c.name} className={cn('border-b transition-colors cursor-pointer', COL.border, i%2===0?COL.surface:COL.surface2, 'hover:bg-[#2a3038]')} onClick={()=>onSelect(c)}>
                <td className="px-3 py-2.5 font-medium text-[#dfe3e8] flex items-center gap-2">{c.name}<ChevronRight size={14} className="text-[#636c75]"/></td>
                <td className="px-3 py-2.5 text-right tabular-nums text-[#8b939c]">{c.count}</td>
                <td className="px-3 py-2.5 text-right tabular-nums text-[#8b939c]">{c.totalStock}</td>
                <td className="px-3 py-2.5 text-right tabular-nums text-[#dfe3e8]">{formatPrice(c.totalValue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className={cn('flex items-center justify-between px-4 py-2 border-t', COL.border, COL.surface)}>
        <span className="text-xs text-[#8b939c]">{categories.length} categorie</span>
      </div>
    </div>
  )
}

function CategoryDetail({ category, onBack, allProducts, onProductsChange }: { category: CategoryInfo; onBack: () => void; allProducts: Product[]; onProductsChange?: (updated: Product[]) => void }) {
  const [editing, setEditing] = useState(false)
  const [newName, setNewName] = useState(category.name)
  const [renamed, setRenamed] = useState(false)

  function handleRename() {
    const name = newName.trim()
    if (!name || name === category.name) { setEditing(false); return }
    const newCategoria = name === 'Senza Categoria' ? null : name
    for (const p of category.products) {
      const updated = { ...p, categoria: newCategoria }
      dbSaveProduct(updated).catch((err) => {})
    }
    if (onProductsChange) {
      const updated = allProducts.map(p =>
        category.products.some(cp => cp.sku === p.sku) ? { ...p, categoria: newCategoria } : p
      )
      onProductsChange(updated)
    }
    setRenamed(true)
    setEditing(false)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-1.5 rounded hover:bg-[#2a3038] text-[#8b939c]"><ArrowLeft size={18}/></button>
        <div className="flex items-center gap-2 flex-1">
          {editing ? (
            <>
              <input type="text" value={newName} onChange={e=>setNewName(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')handleRename(); if(e.key==='Escape')setEditing(false)}} autoFocus className="flex h-8 rounded-md border bg-[#1a1e23] border-[#3f4850] px-3 py-1 text-sm text-[#dfe3e8] w-48 focus:ring-2 focus:ring-sky-500 focus:outline-none"/>
              <button onClick={handleRename} className="p-1 rounded hover:bg-emerald-500/20 text-emerald-400"><Check size={15}/></button>
              <button onClick={()=>setEditing(false)} className="p-1 rounded hover:bg-red-500/20 text-red-400"><X size={15}/></button>
            </>
          ) : (
            <>
              <h2 className="text-lg font-bold text-[#dfe3e8]">
                {renamed ? newName : category.name}
                {renamed && <span className="text-xs font-normal text-emerald-400 ml-2">(rinominata)</span>}
              </h2>
              {category.name !== 'Senza Categoria' && (
                <button onClick={()=>{setNewName(category.name); setEditing(true)}} className="p-1 rounded hover:bg-[#2a3038] text-[#636c75]" title="Rinomina categoria"><Pencil size={13}/></button>
              )}
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className={cn('border rounded-lg p-4', COL.border, COL.surface)}><p className="text-xs text-[#8b939c] mb-1">Prodotti</p><p className="text-xl font-bold text-[#dfe3e8]">{category.count}</p></div>
        <div className={cn('border rounded-lg p-4', COL.border, COL.surface)}><p className="text-xs text-[#8b939c] mb-1">Stock Totale</p><p className="text-xl font-bold text-[#dfe3e8]">{category.totalStock}</p></div>
        <div className={cn('border rounded-lg p-4', COL.border, COL.surface)}><p className="text-xs text-[#8b939c] mb-1">Valore Stock</p><p className="text-xl font-bold text-[#dfe3e8]">{formatPrice(category.totalValue)}</p></div>
      </div>

      <div className={cn('flex-1 border rounded-lg overflow-hidden flex flex-col', COL.border)} style={{minHeight:0}}>
        <div className="flex-1 overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10"><tr className={cn('border-b', COL.border, 'bg-[#2a3038]')}>
              <th className="h-10 px-3 text-xs font-semibold text-[#8b939c] text-left">SKU</th>
              <th className="h-10 px-3 text-xs font-semibold text-[#8b939c] text-left">Nome</th>
              <th className="h-10 px-3 text-xs font-semibold text-[#8b939c] text-right">Prezzo</th>
              <th className="h-10 px-3 text-xs font-semibold text-[#8b939c] text-right">Stock</th>
              <th className="h-10 px-3 text-xs font-semibold text-[#8b939c] text-right">Valore</th>
            </tr></thead>
            <tbody>{category.products.map((p,i)=>(<tr key={p.sku} className={cn('border-b', COL.border, i%2===0?COL.surface:COL.surface2)}>
              <td className="px-3 py-2 text-xs font-mono text-[#8b939c]">{p.sku}</td>
              <td className="px-3 py-2 text-[#dfe3e8]">{p.nome||p.sku}</td>
              <td className="px-3 py-2 text-right tabular-nums text-[#dfe3e8]">{formatPrice(p.prezzo_vendita)}</td>
              <td className="px-3 py-2 text-right"><StockBadge qty={p.quantita_stock}/></td>
              <td className="px-3 py-2 text-right tabular-nums text-[#8b939c]">{formatPrice(p.prezzo_vendita*p.quantita_stock)}</td>
            </tr>))}</tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export function InventoryCategories({ products: forcedProducts, onProductsChange }: { products: Product[]; onProductsChange?: (updated: Product[]) => void }) {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<CategoryInfo|null>(null)

  const products = forcedProducts

  const allCategories = computeCategories(products)

  const filtered = search
    ? allCategories.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.products.some(p=>p.nome.toLowerCase().includes(search.toLowerCase())||p.sku.toLowerCase().includes(search.toLowerCase())))
    : allCategories

  const selectedInfo = selected ? allCategories.find(c=>c.name===selected.name) || selected : null

  if (products.length === 0) return (
    <div className="flex items-center justify-center h-full text-[#636c75]"><div className="text-center"><Package size={48} className="mx-auto mb-3 opacity-30"/><p>Nessun prodotto</p></div></div>
  )

  if (selectedInfo) return <CategoryDetail category={selectedInfo} onBack={()=>setSelected(null)} allProducts={products} onProductsChange={onProductsChange}/>

  return (
    <div className="h-full flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-bold text-[#dfe3e8] flex items-center gap-2"><FileSpreadsheet size={18} className="text-sky-400"/>Categorie</h2>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8b939c]"/>
          <input type="text" placeholder="Cerca categoria..." value={search} onChange={e=>setSearch(e.target.value)}
            className="flex h-8 w-56 rounded-md border bg-[#1a1e23] border-[#3f4850] pl-9 pr-3 py-1 text-sm text-[#dfe3e8] placeholder:text-[#636c75] focus:ring-2 focus:ring-sky-500 focus:outline-none"
          />
        </div>
        <span className="text-xs text-[#8b939c] ml-auto">{allCategories.length} categorie, {products.length} prodotti</span>
      </div>
      <CategoryTable categories={filtered} onSelect={setSelected}/>
    </div>
  )
}