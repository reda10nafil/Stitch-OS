import { useState, useCallback, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown, Package, BarChart3, Download, RefreshCw } from 'lucide-react'
import type { Product } from '@/types'

type Period = '7g' | '30g' | '3m' | 'ytd'

const COLORS = ['#0284c7','#10b981','#f97316','#8b5cf6','#ef4444','#eab308','#14b8a6','#ec4899','#6366f1','#84cc16']

const PERIOD_LABELS: Record<Period, string> = { '7g':'7 Giorni', '30g':'30 Giorni', '3m':'3 Mesi', 'ytd':'YTD' }

interface CategorySlice { label: string; value: number; color: string }
interface TopProductBar { name: string; value: number; color?: string }
interface TrendPoint { label: string; value: number }

interface TooltipState { visible: boolean; x: number; y: number; content: string; subContent?: string }

function formatPrice(n: number): string {
  return new Intl.NumberFormat('it-IT', { style:'currency', currency:'EUR' }).format(n)
}

function ChartTooltip({ tooltip }: { tooltip: TooltipState }) {
  if (!tooltip.visible) return null
  return (
    <div className="fixed pointer-events-none z-50 bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 shadow-xl" style={{ left:tooltip.x+12, top:tooltip.y-40 }}>
      <p className="text-xs font-semibold text-slate-100">{tooltip.content}</p>
      {tooltip.subContent && <p className="text-[11px] text-slate-400 mt-0.5">{tooltip.subContent}</p>}
    </div>
  )
}

function useTooltip() {
  const [tooltip, setTooltip] = useState<TooltipState>({ visible:false, x:0, y:0, content:'' })
  const show = useCallback((e:React.MouseEvent, content:string, sub?:string) => {
    const n = e.nativeEvent as MouseEvent
    setTooltip({ visible:true, x:n.pageX, y:n.pageY, content, subContent:sub })
  }, [])
  const hide = useCallback(() => setTooltip(t => ({ ...t, visible:false })), [])
  return { tooltip, show, hide }
}

function KpiCard({ title, value, subtitle, trend, alertBadge }: { title:string; value:string; subtitle:string; trend?:'up'|'down'; alertBadge?:string }) {
  return (
    <div className="flex-1 bg-slate-800 border border-slate-700 rounded-lg p-4 hover:border-slate-600 transition-colors">
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs font-medium tracking-wider text-slate-400">{title}</p>
        {alertBadge && <span className="text-[10px] font-bold text-red-400 bg-red-500/10 border border-red-500/20 rounded px-1.5 py-0.5 animate-pulse">{alertBadge}</span>}
      </div>
      <p className="text-2xl font-bold text-slate-100 mb-1">{value}</p>
      <div className="flex items-center gap-1">
        {trend === 'up' && <TrendingUp size={12} className="text-emerald-400" />}
        {trend === 'down' && <TrendingDown size={12} className="text-red-400" />}
        <p className="text-xs text-slate-500">{subtitle}</p>
      </div>
    </div>
  )
}

function DonutChart({ data, selectedIndex, onSelect, tooltip, showTooltip, hideTooltip }: {
  data: CategorySlice[]; selectedIndex: number|null; onSelect: (i:number|null)=>void;
  tooltip: TooltipState; showTooltip: (e:React.MouseEvent, c:string, s?:string)=>void; hideTooltip: ()=>void;
}) {
  const total = data.reduce((a,b)=>a+b.value, 0)
  const cx=120; const cy=120; const outerR=95; const innerR=57
  let cumAngle = -90
  const slices = data.map((d, idx) => {
    const sliceAngle = (d.value/total)*360
    const startAngle = cumAngle; cumAngle += sliceAngle; const endAngle = cumAngle
    const startRad = (startAngle*Math.PI)/180; const endRad = (endAngle*Math.PI)/180
    const midRad = ((startAngle+endAngle)/2*Math.PI)/180
    const offset = selectedIndex===idx ? 8 : 0
    const ox = offset*Math.cos(midRad); const oy = offset*Math.sin(midRad)
    const x1o = cx+ox+outerR*Math.cos(startRad); const y1o = cy+oy+outerR*Math.sin(startRad)
    const x2o = cx+ox+outerR*Math.cos(endRad); const y2o = cy+oy+outerR*Math.sin(endRad)
    const x1i = cx+ox+innerR*Math.cos(startRad); const y1i = cy+oy+innerR*Math.sin(startRad)
    const x2i = cx+ox+innerR*Math.cos(endRad); const y2i = cy+oy+innerR*Math.sin(endRad)
    const large = sliceAngle>180 ? 1 : 0
    const path = `M ${x1o} ${y1o} A ${outerR} ${outerR} 0 ${large} 1 ${x2o} ${y2o} L ${x2i} ${y2i} A ${innerR} ${innerR} 0 ${large} 0 ${x1i} ${y1i} Z`
    return { path, color:d.color, label:d.label, value:d.value, idx, sliceAngle }
  })
  return (
    <div className="flex flex-col items-center">
      <svg width="240" height="240" viewBox="0 0 240 240">
        <style>{`@keyframes donut-in{from{opacity:0;transform:scale(0.8)}to{opacity:1;transform:scale(1)}} .slice{animation:donut-in .5s ease-out both;transform-origin:${cx}px ${cy}px}`}</style>
        {slices.map((s,i)=>(
          <g key={s.idx} onClick={()=>onSelect(selectedIndex===s.idx?null:s.idx)} className="cursor-pointer transition-transform" style={{animationDelay:`${i*100}ms`}}>
            <path d={s.path} fill={s.color} stroke={selectedIndex===s.idx?'#f8fafc':'#1e293b'} strokeWidth={selectedIndex===s.idx?2.5:1.5} opacity={selectedIndex!==null&&selectedIndex!==s.idx?0.4:1} className="slice" onMouseEnter={e=>showTooltip(e,`${s.label}: ${s.value}`, `${((s.value/total)*100).toFixed(1)}%`)} onMouseMove={e=>showTooltip(e,`${s.label}: ${s.value}`, `${((s.value/total)*100).toFixed(1)}%`)} onMouseLeave={hideTooltip}/>
          </g>
        ))}
        <circle cx={cx} cy={cy} r={innerR} fill="#0f172a"/>
        <text x={cx} y={cy-6} textAnchor="middle" className="text-lg font-bold" fill="#f1f5f9">{total}</text>
        <text x={cx} y={cy+12} textAnchor="middle" className="text-[11px]" fill="#94a3b8">Prodotti</text>
      </svg>
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 mt-3">
        {data.map((d,i)=>(
          <button key={i} onClick={()=>onSelect(selectedIndex===i?null:i)} className={cn('flex items-center gap-1.5 text-xs transition-opacity', selectedIndex!==null&&selectedIndex!==i?'opacity-40':'opacity-100')}>
            <div className="w-2.5 h-2.5 rounded-sm" style={{backgroundColor:d.color}}/><span className="text-slate-400">{d.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function TopProductsChart({ data, tooltip, showTooltip, hideTooltip }: { data:TopProductBar[]; tooltip:TooltipState; showTooltip:(e:React.MouseEvent,c:string,s?:string)=>void; hideTooltip:()=>void }) {
  const [animated, setAnimated] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  useEffect(()=>{ const o=new IntersectionObserver(([e])=>{if(e.isIntersecting){setAnimated(true);o.disconnect()}},{threshold:0.3}); if(containerRef.current) o.observe(containerRef.current); return ()=>o.disconnect() },[data])
  const maxVal = Math.max(...data.map(d=>d.value), 1)
  const chartH=160; const barW=32
  return (
    <div ref={containerRef}>
      <svg width="100%" height={chartH+60} viewBox={`0 0 520 ${chartH+60}`} preserveAspectRatio="xMidYMid meet">
        <text x={260} y={12} textAnchor="middle" fill="#64748b" fontSize="11" fontWeight="500">Valore Stock (€)</text>
        {[0,0.25,0.5,0.75,1].map((pct,i)=>{ const y=22+chartH-pct*chartH; const val=Math.round(pct*maxVal); return (
          <g key={i}><line x1={15} x2={510} y1={y} y2={y} stroke="#334155" strokeWidth="1" strokeDasharray="4 2"/><text x={8} y={y+4} textAnchor="end" fill="#64748b" fontSize="8">{val}</text></g>
        )})}
        {data.map((d,i)=>{ const x=i*50+15; const barH=animated?(d.value/maxVal)*chartH:0; const y=22+chartH-barH; return (
          <g key={i} className="cursor-pointer">
            <rect x={x} y={y} width={barW} height={barH} rx="4" ry="4" fill="#10b981" opacity="0.9" style={{transition:`height .5s ease ${i*.06}s, y .5s ease ${i*.06}s`}} onMouseEnter={e=>showTooltip(e,d.name,formatPrice(d.value))} onMouseMove={e=>showTooltip(e,d.name,formatPrice(d.value))} onMouseLeave={hideTooltip}/>
            <text x={x+barW/2} y={y-5} textAnchor="middle" fill="#94a3b8" fontSize="10" fontWeight="600">{Math.round(d.value)}</text>
            <text x={x+barW/2} y={22+chartH+16} textAnchor="middle" fill="#64748b" fontSize="8" transform={`rotate(-30 ${x+barW/2} ${22+chartH+16})`}>{d.name.length>10?d.name.substring(0,10)+'..':d.name}</text>
          </g>
        )})}
        <text x={260} y={chartH+56} textAnchor="middle" fill="#64748b" fontSize="11" fontWeight="500">Prodotto</text>
      </svg>
    </div>
  )
}

function ValueLineChart({ data, title, tooltip, showTooltip, hideTooltip }: { data:TrendPoint[]; title:string; tooltip:TooltipState; showTooltip:(e:React.MouseEvent,c:string,s?:string)=>void; hideTooltip:()=>void }) {
  const [animated, setAnimated] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  useEffect(()=>{ const o=new IntersectionObserver(([e])=>{if(e.isIntersecting){setAnimated(true);o.disconnect()}},{threshold:0.3}); if(containerRef.current) o.observe(containerRef.current); return ()=>o.disconnect() },[data])
  const w=520; const h=240; const pad={top:20,right:25,bottom:40,left:60}
  const plotW=w-pad.left-pad.right; const plotH=h-pad.top-pad.bottom
  const values=data.map(d=>d.value)
  const maxVal=Math.max(...values); const minVal=Math.min(...values)
  const avgVal=Math.round(values.reduce((a,b)=>a+b,0)/Math.max(values.length,1))
  const rangeMin=minVal*0.8; const rangeMax=maxVal*1.1; const range=rangeMax-rangeMin
  const points=data.map((d,i)=>({ x:pad.left+(i/Math.max(data.length-1,1))*plotW, y:pad.top+plotH-((d.value-rangeMin)/range)*plotH, ...d }))
  const linePath=`M ${points.map(p=>`${p.x} ${p.y}`).join(' L ')}`
  const areaPath=`${linePath} L ${points[points.length-1].x} ${pad.top+plotH} L ${points[0].x} ${pad.top+plotH} Z`
  const yStep=range/4; const yTicks=Array.from({length:5},(_,i)=>Math.round(rangeMin+yStep*i))
  const lineLength=points.reduce((acc,p,i)=>i===0?0:acc+Math.sqrt((p.x-points[i-1].x)**2+(p.y-points[i-1].y)**2),0)
  return (
    <div ref={containerRef}>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="w-full h-auto">
        <defs>
          <linearGradient id="statsArea" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#0284c7" stopOpacity="0.15"/><stop offset="100%" stopColor="#0284c7" stopOpacity="0.01"/></linearGradient>
        </defs>
        <text x={pad.left+plotW/2} y={10} textAnchor="middle" fill="#64748b" fontSize="11" fontWeight="500">{title}</text>
        {yTicks.map((t,i)=>{ const y=pad.top+plotH-((t-rangeMin)/range)*plotH; return <g key={i}><line x1={pad.left} x2={pad.left+plotW} y1={y} y2={y} stroke="#334155" strokeWidth="1" strokeDasharray="4 2"/><text x={pad.left-8} y={y+4} textAnchor="end" fill="#64748b" fontSize="10">€{t.toLocaleString('it-IT')}</text></g> })}
        {points.map((p,i)=><text key={`x-${i}`} x={p.x} y={pad.top+plotH+18} textAnchor="middle" fill="#64748b" fontSize="9">{p.label}</text>)}
        <path d={areaPath} fill="url(#statsArea)" opacity={animated?1:0} style={{transition:'opacity .6s ease'}}/>
        <path d={linePath} fill="none" stroke="#0284c7" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" strokeDasharray={animated?'none':`${lineLength}`} strokeDashoffset={animated?0:lineLength} style={{transition:'stroke-dashoffset 1.2s ease-out'}}/>
        {points.map((p,i)=>(<g key={i}>
          <circle cx={p.x} cy={p.y} r={animated?4:0} fill="#0f172a" stroke="#0284c7" strokeWidth="2" style={{transition:`r .3s ease ${.8+i*.05}s`}} onMouseEnter={e=>showTooltip(e,p.label,formatPrice(p.value))} onMouseMove={e=>showTooltip(e,p.label,formatPrice(p.value))} onMouseLeave={hideTooltip} className="cursor-pointer"/>
          <circle cx={p.x} cy={p.y} r="12" fill="transparent" onMouseEnter={e=>showTooltip(e,p.label,formatPrice(p.value))} onMouseMove={e=>showTooltip(e,p.label,formatPrice(p.value))} onMouseLeave={hideTooltip} className="cursor-pointer"/>
        </g>))}
      </svg>
      <div className="flex items-center justify-center gap-6 mt-1 text-xs text-slate-400">
        <span>Min: <span className="text-red-400 font-medium">{formatPrice(minVal)}</span></span>
        <span>Max: <span className="text-emerald-400 font-medium">{formatPrice(maxVal)}</span></span>
        <span>Media: <span className="text-sky-400 font-medium">{formatPrice(avgVal)}</span></span>
      </div>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex gap-4">
        {[1,2,3,4].map(i=><div key={i} className="flex-1 bg-slate-800 border border-slate-700 rounded-lg p-4"><div className="h-3 w-2/3 bg-slate-700 rounded mb-3"/><div className="h-6 w-1/3 bg-slate-700 rounded mb-2"/><div className="h-3 w-1/2 bg-slate-700 rounded"/></div>)}
      </div>
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-5"><div className="h-48 bg-slate-700 rounded"/></div>
    </div>
  )
}

function computeTrendData(products: Product[], period: Period): { data: TrendPoint[]; metrics: { min: number; max: number; avg: number; total: number; stockValue: number; potentialValue: number } } {
  const stockValue = products.reduce((s, p) => s + p.costo_acquisto * p.quantita_stock, 0)
  const potentialValue = products.reduce((s, p) => s + p.prezzo_vendita * p.quantita_stock, 0)
  const today = new Date()

  type SubData = { points: TrendPoint[]; label: string }
  const sub: Record<Period, SubData> = {
    '7g': {
      points: Array.from({ length: 7 }, (_, i) => {
        const d = new Date(today)
        d.setDate(d.getDate() - 6 + i)
        const label = d.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })
        const base = stockValue + potentialValue
        const variation = Math.round(base * (0.85 + (i / 6) * 0.3))
        return { label, value: variation }
      }),
      label: 'Proiezione giornaliera'
    },
    '30g': {
      points: Array.from({ length: 8 }, (_, i) => {
        const d = new Date(today)
        d.setDate(d.getDate() - 28 + (i + 1) * 4)
        const label = d.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })
        const base = stockValue + potentialValue
        const variation = Math.round(base * (0.7 + (i / 7) * 0.6))
        return { label, value: variation }
      }),
      label: 'Proiezione settimanale'
    },
    '3m': {
      points: Array.from({ length: 8 }, (_, i) => {
        const d = new Date(today)
        d.setDate(d.getDate() - 84 + (i + 1) * 12)
        const label = d.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })
        const base = stockValue + potentialValue
        const variation = Math.round(base * (0.55 + (i / 7) * 0.9))
        return { label, value: variation }
      }),
      label: 'Proiezione mensile'
    },
    'ytd': {
      points: Array.from({ length: 6 }, (_, i) => {
        const d = new Date(today.getFullYear(), i, 1)
        const label = d.toLocaleDateString('it-IT', { month: 'short' })
        const base = stockValue + potentialValue
        const variation = Math.round(base * (0.4 + (i / 5) * 0.8))
        return { label, value: variation }
      }),
      label: 'Proiezione annuale'
    },
  }

  const sel = sub[period]
  const values = sel.points.map(p => p.value)
  return {
    data: sel.points,
    metrics: {
      min: Math.min(...values),
      max: Math.max(...values),
      avg: Math.round(values.reduce((a, b) => a + b, 0) / values.length),
      total: values.reduce((a, b) => a + b, 0),
      stockValue,
      potentialValue,
    }
  }
}

export function InventoryStats({ products: forcedProducts }: { products: Product[] }) {
  const [refreshing, setRefreshing] = useState(false)
  const [period, setPeriod] = useState<Period>('7g')
  const [selectedSlice, setSelectedSlice] = useState<number|null>(null)
  const { tooltip, show, hide } = useTooltip()

  const products = forcedProducts

  const kpi = {
    totale: products.length,
    valoreStock: products.reduce((s,p)=>s+p.costo_acquisto*p.quantita_stock,0),
    valorePotenziale: products.reduce((s,p)=>s+p.prezzo_vendita*p.quantita_stock,0),
    esauriti: products.filter(p=>p.quantita_stock===0).length,
  }
  const margineMedio = products.length ? Math.round(products.reduce((s,p)=>s+((p.prezzo_vendita-p.costo_acquisto)/Math.max(p.prezzo_vendita,1))*100,0)/products.length) : 0

  const categorySlices: CategorySlice[] = (()=>{
    const map = new Map<string, number>()
    for (const p of products) { const c = p.categoria || 'Senza Categoria'; map.set(c, (map.get(c)||0)+1) }
    return Array.from(map.entries()).map(([label,value],i)=>({ label, value, color:COLORS[i%COLORS.length] })).sort((a,b)=>b.value-a.value)
  })()

  const topByValue: TopProductBar[] = [...products].sort((a,b)=> (b.prezzo_vendita*b.quantita_stock) - (a.prezzo_vendita*a.quantita_stock) ).slice(0,10).map((p,i)=>({ name:p.nome||p.sku, value:p.prezzo_vendita*p.quantita_stock, color:COLORS[i%COLORS.length] }))

  const trend = computeTrendData(products, period)

  if (products.length === 0) return (
    <div className="flex items-center justify-center h-full text-[#636c75] text-sm">
      <div className="text-center"><Package size={48} className="mx-auto mb-3 opacity-30"/><p>Nessun prodotto in inventario</p><p className="text-xs mt-1">Importa prodotti per visualizzare le statistiche</p></div>
    </div>
  )

  function handleRefresh() {
    setRefreshing(true)
    setTimeout(() => setRefreshing(false), 600)
  }

  function exportStatsCSV() {
    const lines: string[] = []
    lines.push('Metodo;Valore')
    lines.push(`Totale Prodotti;${kpi.totale}`)
    lines.push(`Valore Stock;${kpi.valoreStock}`)
    lines.push(`Valore Potenziale;${kpi.valorePotenziale}`)
    lines.push(`Prodotti Esauriti;${kpi.esauriti}`)
    lines.push(`Margine Medio;${margineMedio}%`)
    lines.push('')
    lines.push('Categoria;Conteggio')
    for (const s of categorySlices) {
      lines.push(`${s.label};${s.value}`)
    }
    lines.push('')
    lines.push('Top 10 Prodotti;Valore Stock')
    for (const t of topByValue) {
      lines.push(`${t.name};${t.value}`)
    }
    lines.push('')
    lines.push(`Periodo;${PERIOD_LABELS[period]}`)
    lines.push('Data;Valore Proiettato')
    for (const p of trend.data) {
      lines.push(`${p.label};${p.value}`)
    }
    const blob = new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `statistiche_inventario_${period}_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-1">
          {(Object.keys(PERIOD_LABELS) as Period[]).map(p => (
            <button key={p} onClick={()=>setPeriod(p)} className={cn('px-3 py-1 text-xs rounded-md transition-colors', period===p?'bg-sky-600 text-white':'text-[#8b939c] hover:text-[#dfe3e8] hover:bg-[#2a3038]')}>
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            className="flex items-center gap-1.5 px-3 py-1 text-xs rounded-md border border-[#3f4850] text-[#dfe3e8] hover:bg-[#2a3038] transition-colors"
          >
            <RefreshCw size={13} className={cn(refreshing && 'animate-spin')} />
            Aggiorna
          </button>
          <button
            onClick={exportStatsCSV}
            className="flex items-center gap-1.5 px-3 py-1 text-xs rounded-md border border-[#3f4850] text-[#dfe3e8] hover:bg-[#2a3038] transition-colors"
          >
            <Download size={13} />
            Esporta Report
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        <KpiCard title="Totale Prodotti" value={String(kpi.totale)} subtitle="SKU in catalogo" trend="up"/>
        <KpiCard title="Valore Stock" value={formatPrice(kpi.valoreStock)} subtitle={`Costo medio: ${products.length?formatPrice(Math.round(kpi.valoreStock/products.length)):'€0'}`} trend="down"/>
        <KpiCard title="Valore Potenziale" value={formatPrice(kpi.valorePotenziale)} subtitle={`Ricavo stimato al ${Math.round(kpi.valorePotenziale/Math.max(kpi.valoreStock,1)*100)}%`} trend="up"/>
        <KpiCard title="Prodotti Esauriti" value={String(kpi.esauriti)} subtitle={`Margine medio ${margineMedio}%`} trend="down" alertBadge={kpi.esauriti>0?`${kpi.esauriti} esauriti`:undefined}/>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
          <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2"><BarChart3 size={16} className="text-sky-400"/>Distribuzione per Categoria</h3>
          <DonutChart data={categorySlices} selectedIndex={selectedSlice} onSelect={setSelectedSlice} tooltip={tooltip} showTooltip={show} hideTooltip={hide}/>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
          <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2"><BarChart3 size={16} className="text-emerald-400"/>Top 10 per Valore Stock</h3>
          <TopProductsChart data={topByValue} tooltip={tooltip} showTooltip={show} hideTooltip={hide}/>
        </div>
      </div>

      {/* Trend line */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
        <h3 className="text-sm font-semibold text-slate-200 mb-1 flex items-center gap-2"><TrendingUp size={16} className="text-sky-400"/>Proiezione Valore Inventario ({PERIOD_LABELS[period]})</h3>
        <p className="text-xs text-slate-500 mb-4">Stima basata sullo stock corrente ({products.length} prodotti) — il valore evolve in base alla giacenza attuale</p>
        <ValueLineChart data={trend.data} title="Valore Combinato (€)" tooltip={tooltip} showTooltip={show} hideTooltip={hide}/>
        <div className="flex items-center justify-center gap-6 mt-2 text-xs text-slate-500">
          <span><span className="text-slate-400">Stock reale:</span> {formatPrice(trend.metrics.stockValue)}</span>
          <span><span className="text-slate-400">Potenziale:</span> {formatPrice(trend.metrics.potentialValue)}</span>
          <span><span className="text-slate-400">Esauriti:</span> {kpi.esauriti} SKU</span>
          <span><span className="text-slate-400">Stock basso:</span> {products.filter(p=>p.quantita_stock>0&&p.quantita_stock<=5).length} SKU</span>
        </div>
      </div>
      <ChartTooltip tooltip={tooltip}/>
    </div>
  )
}