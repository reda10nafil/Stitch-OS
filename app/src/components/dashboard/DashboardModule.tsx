import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import {
  TrendingUp, TrendingDown, BarChart3, Activity, RefreshCw,
  Download, ChevronRight, X, AlertTriangle
} from 'lucide-react'
import type { KpiData } from '@/types'

type Period = '7g' | '30g' | '3m' | '12m' | 'ytd'

interface SalesPoint { label: string; value: number }
interface LostDeal { label: string; value: number; color: string; details: string[] }
interface Product { name: string; value: number; color?: string }
interface WeeklyBar { day: string; thisWeek: number; lastWeek: number }
interface AgentRow { metrica: string; whatsapp: number; telegram: number; allarme: number; sparklineData: number[] }

const KPI: KpiData = {
  capitale_investito: 14250,
  capitale_potenziale: 32800,
  margine_lordo: 56.55,
  prodotti_esauriti: 2,
}

const LOST_DEALS: LostDeal[] = [
  { label: 'Prezzo ritenuto alto', value: 12, color: '#ef4444', details: ['Scarpe sportive: 5', 'Abbigliamento: 4', 'Accessori: 3'] },
  { label: 'Mancanza stock taglia', value: 7, color: '#f97316', details: ['Taglia M: 3', 'Taglia L: 2', 'Taglia XL: 2'] },
  { label: 'Incompatibilità orari', value: 4, color: '#64748b', details: ['Appuntamento pomeridiano: 2', 'Fine settimana: 2'] },
  { label: 'Preferenza altro brand', value: 3, color: '#8b5cf6', details: ['Brand concorrente A: 2', 'Brand concorrente B: 1'] },
]

const WEEKLY_COMPARISON: WeeklyBar[] = [
  { day: 'Lun', thisWeek: 42, lastWeek: 35 },
  { day: 'Mar', thisWeek: 55, lastWeek: 48 },
  { day: 'Mer', thisWeek: 38, lastWeek: 52 },
  { day: 'Gio', thisWeek: 62, lastWeek: 44 },
  { day: 'Ven', thisWeek: 71, lastWeek: 58 },
  { day: 'Sab', thisWeek: 50, lastWeek: 39 },
  { day: 'Dom', thisWeek: 28, lastWeek: 22 },
]

const TOP_PRODUCTS: Product[] = [
  { name: 'Sneaker Urban', value: 34 },
  { name: 'Zaino Explorer', value: 28 },
  { name: 'Giacca Tech', value: 22 },
  { name: 'Felpa Cotton', value: 18 },
  { name: 'Borsa Tote', value: 15 },
  { name: 'Cintura Classic', value: 12 },
  { name: 'Cappello', value: 9 },
  { name: 'Occhiali Sport', value: 7 },
  { name: 'Guanti Winter', value: 5 },
  { name: 'Calze Sport', value: 4 },
]

const AGENTS: AgentRow[] = [
  { metrica: 'Tasso Risoluzione Autonoma', whatsapp: 84.2, telegram: 91.5, allarme: 68.5, sparklineData: [78, 80, 82, 81, 83, 84.2] },
  { metrica: 'Tempo Medio Risposta (s)', whatsapp: 1.4, telegram: 0.9, allarme: 3.2, sparklineData: [1.8, 1.6, 1.5, 1.5, 1.4, 1.4] },
  { metrica: 'Messaggi Gestiti/giorno', whatsapp: 142, telegram: 89, allarme: 56, sparklineData: [120, 130, 125, 135, 138, 142] },
  { metrica: 'Soddisfazione Cliente (%)', whatsapp: 92, telegram: 95, allarme: 78, sparklineData: [88, 89, 90, 91, 92, 92] },
  { metrica: 'Ticket Escalati', whatsapp: 3, telegram: 1, allarme: 8, sparklineData: [5, 4, 5, 3, 4, 3] },
]

function generateSalesData(period: Period): SalesPoint[] {
  switch (period) {
    case '7g':
      return [
        { label: '12 Giu', value: 580 }, { label: '13 Giu', value: 720 }, { label: '14 Giu', value: 510 },
        { label: '15 Giu', value: 890 }, { label: '16 Giu', value: 1050 }, { label: '17 Giu', value: 680 },
        { label: '18 Giu', value: 920 },
      ]
    case '30g':
      return [
        { label: '20 Mag', value: 420 }, { label: '25 Mag', value: 610 }, { label: '30 Mag', value: 480 },
        { label: '04 Giu', value: 940 }, { label: '08 Giu', value: 720 }, { label: '12 Giu', value: 560 },
        { label: '16 Giu', value: 1050 }, { label: '18 Giu', value: 920 },
      ]
    case '3m':
      return [
        { label: 'Settimana 1 Apr', value: 4200 }, { label: 'Settimana 2 Apr', value: 5100 }, { label: 'Settimana 1 Mag', value: 4800 },
        { label: 'Settimana 2 Mag', value: 6200 }, { label: 'Settimana 3 Mag', value: 5800 }, { label: 'Settimana 1 Giu', value: 7200 },
        { label: 'Settimana 2 Giu', value: 8900 }, { label: 'Settimana 3 Giu', value: 9500 },
      ]
    case '12m':
      return [
        { label: 'Lug', value: 8200 }, { label: 'Ago', value: 6100 }, { label: 'Set', value: 9300 },
        { label: 'Ott', value: 10400 }, { label: 'Nov', value: 11800 }, { label: 'Dic', value: 15200 },
        { label: 'Gen', value: 8900 }, { label: 'Feb', value: 7200 }, { label: 'Mar', value: 9500 },
        { label: 'Apr', value: 10800 }, { label: 'Mag', value: 12500 }, { label: 'Giu', value: 14100 },
      ]
    case 'ytd':
      return [
        { label: 'Gen', value: 8900 }, { label: 'Feb', value: 7200 }, { label: 'Mar', value: 9500 },
        { label: 'Apr', value: 10800 }, { label: 'Mag', value: 12500 }, { label: 'Giu', value: 14100 },
      ]
  }
}

function generateRevenueCostData(period: Period): { revenue: SalesPoint[]; cost: SalesPoint[] } {
  switch (period) {
    case '7g':
      return {
        revenue: [
          { label: '12 Giu', value: 580 }, { label: '13 Giu', value: 720 }, { label: '14 Giu', value: 510 },
          { label: '15 Giu', value: 890 }, { label: '16 Giu', value: 1050 }, { label: '17 Giu', value: 680 },
          { label: '18 Giu', value: 920 },
        ],
        cost: [
          { label: '12 Giu', value: 320 }, { label: '13 Giu', value: 380 }, { label: '14 Giu', value: 290 },
          { label: '15 Giu', value: 450 }, { label: '16 Giu', value: 510 }, { label: '17 Giu', value: 360 },
          { label: '18 Giu', value: 480 },
        ],
      }
    case '30g':
      return {
        revenue: [
          { label: '20 Mag', value: 420 }, { label: '25 Mag', value: 610 }, { label: '30 Mag', value: 480 },
          { label: '04 Giu', value: 940 }, { label: '08 Giu', value: 720 }, { label: '12 Giu', value: 560 },
          { label: '16 Giu', value: 1050 }, { label: '18 Giu', value: 920 },
        ],
        cost: [
          { label: '20 Mag', value: 240 }, { label: '25 Mag', value: 340 }, { label: '30 Mag', value: 270 },
          { label: '04 Giu', value: 490 }, { label: '08 Giu', value: 380 }, { label: '12 Giu', value: 310 },
          { label: '16 Giu', value: 530 }, { label: '18 Giu', value: 480 },
        ],
      }
    case '3m':
      return {
        revenue: [
          { label: 'Sett. 1 Apr', value: 4200 }, { label: 'Sett. 2 Apr', value: 5100 }, { label: 'Sett. 1 Mag', value: 4800 },
          { label: 'Sett. 2 Mag', value: 6200 }, { label: 'Sett. 3 Mag', value: 5800 }, { label: 'Sett. 1 Giu', value: 7200 },
          { label: 'Sett. 2 Giu', value: 8900 }, { label: 'Sett. 3 Giu', value: 9500 },
        ],
        cost: [
          { label: 'Sett. 1 Apr', value: 2200 }, { label: 'Sett. 2 Apr', value: 2600 }, { label: 'Sett. 1 Mag', value: 2500 },
          { label: 'Sett. 2 Mag', value: 3200 }, { label: 'Sett. 3 Mag', value: 2900 }, { label: 'Sett. 1 Giu', value: 3600 },
          { label: 'Sett. 2 Giu', value: 4400 }, { label: 'Sett. 3 Giu', value: 4800 },
        ],
      }
    case '12m':
      return {
        revenue: [
          { label: 'Lug', value: 8200 }, { label: 'Ago', value: 6100 }, { label: 'Set', value: 9300 },
          { label: 'Ott', value: 10400 }, { label: 'Nov', value: 11800 }, { label: 'Dic', value: 15200 },
          { label: 'Gen', value: 8900 }, { label: 'Feb', value: 7200 }, { label: 'Mar', value: 9500 },
          { label: 'Apr', value: 10800 }, { label: 'Mag', value: 12500 }, { label: 'Giu', value: 14100 },
        ],
        cost: [
          { label: 'Lug', value: 4300 }, { label: 'Ago', value: 3200 }, { label: 'Set', value: 4800 },
          { label: 'Ott', value: 5300 }, { label: 'Nov', value: 5900 }, { label: 'Dic', value: 7800 },
          { label: 'Gen', value: 4600 }, { label: 'Feb', value: 3700 }, { label: 'Mar', value: 4900 },
          { label: 'Apr', value: 5500 }, { label: 'Mag', value: 6400 }, { label: 'Giu', value: 7200 },
        ],
      }
    case 'ytd':
      return {
        revenue: [
          { label: 'Gen', value: 8900 }, { label: 'Feb', value: 7200 }, { label: 'Mar', value: 9500 },
          { label: 'Apr', value: 10800 }, { label: 'Mag', value: 12500 }, { label: 'Giu', value: 14100 },
        ],
        cost: [
          { label: 'Gen', value: 4600 }, { label: 'Feb', value: 3700 }, { label: 'Mar', value: 4900 },
          { label: 'Apr', value: 5500 }, { label: 'Mag', value: 6400 }, { label: 'Giu', value: 7200 },
        ],
      }
  }
}

const PERIOD_LABELS: Record<Period, string> = {
  '7g': '7 Giorni',
  '30g': '30 Giorni',
  '3m': '3 Mesi',
  '12m': '12 Mesi',
  'ytd': 'YTD',
}

interface TooltipState {
  visible: boolean
  x: number
  y: number
  content: string
  subContent?: string
}

function ChartTooltip({ tooltip }: { tooltip: TooltipState }) {
  if (!tooltip.visible) return null
  return (
    <div
      className="fixed pointer-events-none z-50 bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 shadow-xl"
      style={{ left: tooltip.x + 12, top: tooltip.y - 40 }}
    >
      <p className="text-xs font-semibold text-slate-100">{tooltip.content}</p>
      {tooltip.subContent && <p className="text-[11px] text-slate-400 mt-0.5">{tooltip.subContent}</p>}
    </div>
  )
}

function useTooltip() {
  const [tooltip, setTooltip] = useState<TooltipState>({ visible: false, x: 0, y: 0, content: '' })
  const show = useCallback((e: React.MouseEvent, content: string, subContent?: string) => {
    setTooltip({ visible: true, x: e.clientX, y: e.clientY, content, subContent })
  }, [])
  const hide = useCallback(() => setTooltip(t => ({ ...t, visible: false })), [])
  return { tooltip, show, hide }
}

function KpiCard({ title, value, subtitle, trend, alertBadge }: { title: string; value: string; subtitle: string; trend?: 'up' | 'down'; alertBadge?: string }) {
  return (
    <div className="flex-1 bg-slate-800 border border-slate-700 rounded-lg p-4 hover:border-slate-600 transition-colors">
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs font-medium tracking-wider text-slate-400">{title}</p>
        {alertBadge && (
          <span className="text-[10px] font-bold text-red-400 bg-red-500/10 border border-red-500/20 rounded px-1.5 py-0.5 animate-pulse">
            {alertBadge}
          </span>
        )}
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
  data: LostDeal[]
  selectedIndex: number | null
  onSelect: (i: number | null) => void
  tooltip: TooltipState
  showTooltip: (e: React.MouseEvent, content: string, sub?: string) => void
  hideTooltip: () => void
}) {
  const total = data.reduce((a, b) => a + b.value, 0)
  const cx = 120; const cy = 120; const outerR = 95; const innerR = 57
  let cumAngle = -90

  const slices = data.map((d, idx) => {
    const sliceAngle = (d.value / total) * 360
    const startAngle = cumAngle
    cumAngle += sliceAngle
    const endAngle = cumAngle

    const startRad = (startAngle * Math.PI) / 180
    const endRad = (endAngle * Math.PI) / 180

    const midRad = ((startAngle + endAngle) / 2 * Math.PI) / 180
    const offset = selectedIndex === idx ? 8 : 0
    const ox = offset * Math.cos(midRad)
    const oy = offset * Math.sin(midRad)

    const x1o = cx + ox + outerR * Math.cos(startRad); const y1o = cy + oy + outerR * Math.sin(startRad)
    const x2o = cx + ox + outerR * Math.cos(endRad); const y2o = cy + oy + outerR * Math.sin(endRad)
    const x1i = cx + ox + innerR * Math.cos(startRad); const y1i = cy + oy + innerR * Math.sin(startRad)
    const x2i = cx + ox + innerR * Math.cos(endRad); const y2i = cy + oy + innerR * Math.sin(endRad)

    const large = sliceAngle > 180 ? 1 : 0
    const path = `M ${x1o} ${y1o} A ${outerR} ${outerR} 0 ${large} 1 ${x2o} ${y2o} L ${x2i} ${y2i} A ${innerR} ${innerR} 0 ${large} 0 ${x1i} ${y1i} Z`

    return { path, color: d.color, label: d.label, value: d.value, idx, sliceAngle }
  })

  return (
    <div className="flex flex-col items-center">
      <svg width="240" height="240" viewBox="0 0 240 240">
        <style>{`
          @keyframes donut-slice-in {
            from { opacity: 0; transform: scale(0.8); }
            to { opacity: 1; transform: scale(1); }
          }
          .donut-slice { animation: donut-slice-in 0.5s ease-out both; transform-origin: ${cx}px ${cy}px; }
        `}</style>
        {slices.map((s, i) => (
          <g
            key={s.idx}
            onClick={() => onSelect(selectedIndex === s.idx ? null : s.idx)}
            className="cursor-pointer transition-transform"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <path
              d={s.path}
              fill={s.color}
              stroke={selectedIndex === s.idx ? '#f8fafc' : '#1e293b'}
              strokeWidth={selectedIndex === s.idx ? 2.5 : 1.5}
              opacity={selectedIndex !== null && selectedIndex !== s.idx ? 0.4 : 1}
              className="donut-slice"
              onMouseEnter={(e) => showTooltip(e, `${s.label}: ${s.value} deal`, `${((s.value / total) * 100).toFixed(1)}% del totale`)}
              onMouseMove={(e) => showTooltip(e, `${s.label}: ${s.value} deal`, `${((s.value / total) * 100).toFixed(1)}% del totale`)}
              onMouseLeave={hideTooltip}
            />
          </g>
        ))}
        <circle cx={cx} cy={cy} r={innerR} fill="#0f172a" />
        <text x={cx} y={cy - 6} textAnchor="middle" className="text-lg font-bold" fill="#f1f5f9">
          {total}
        </text>
        <text x={cx} y={cy + 12} textAnchor="middle" className="text-[11px]" fill="#94a3b8">
          Lost Deals
        </text>
      </svg>
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 mt-3">
        {data.map((d, i) => (
          <button
            key={i}
            onClick={() => onSelect(selectedIndex === i ? null : i)}
            className={cn(
              'flex items-center gap-1.5 text-xs transition-opacity',
              selectedIndex !== null && selectedIndex !== i ? 'opacity-40' : 'opacity-100'
            )}
          >
            <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: d.color }} />
            <span className="text-slate-400">{d.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function SalesLineChart({ data, tooltip, showTooltip, hideTooltip }: { data: SalesPoint[]; tooltip: TooltipState; showTooltip: (e: React.MouseEvent, content: string, sub?: string) => void; hideTooltip: () => void }) {
  const [animated, setAnimated] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setAnimated(true)
        observer.disconnect()
      }
    }, { threshold: 0.3 })
    if (containerRef.current) observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  const w = 520; const h = 240; const pad = { top: 20, right: 25, bottom: 40, left: 60 }
  const plotW = w - pad.left - pad.right; const plotH = h - pad.top - pad.bottom
  const values = data.map(d => d.value)
  const maxVal = Math.max(...values)
  const minVal = Math.min(...values)
  const avgVal = Math.round(values.reduce((a, b) => a + b, 0) / values.length)
  const rangeMin = minVal * 0.8
  const rangeMax = maxVal * 1.1
  const range = rangeMax - rangeMin

  const points = data.map((d, i) => {
    const x = pad.left + (i / Math.max(data.length - 1, 1)) * plotW
    const y = pad.top + plotH - ((d.value - rangeMin) / range) * plotH
    return { x, y, ...d }
  })

  const linePath = `M ${points.map(p => `${p.x} ${p.y}`).join(' L ')}`
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${pad.top + plotH} L ${points[0].x} ${pad.top + plotH} Z`

  const yStep = range / 4
  const yTicks = Array.from({ length: 5 }, (_, i) => Math.round(rangeMin + yStep * i))

  const lineLength = points.reduce((acc, p, i) => {
    if (i === 0) return 0
    const dx = p.x - points[i - 1].x
    const dy = p.y - points[i - 1].y
    return acc + Math.sqrt(dx * dx + dy * dy)
  }, 0)

  return (
    <div ref={containerRef}>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="w-full h-auto">
        <defs>
          <linearGradient id="salesAreaGrad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#0284c7" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#0284c7" stopOpacity="0.01" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        <text x={pad.left + plotW / 2} y={10} textAnchor="middle" fill="#64748b" fontSize="11" fontWeight="500">
          Fatturato (€)
        </text>

        {yTicks.map((t, i) => {
          const y = pad.top + plotH - ((t - rangeMin) / range) * plotH
          return (
            <g key={i}>
              <line x1={pad.left} x2={pad.left + plotW} y1={y} y2={y} stroke="#334155" strokeWidth="1" strokeDasharray="4 2" />
              <text x={pad.left - 8} y={y + 4} textAnchor="end" fill="#64748b" fontSize="10">
                €{t.toLocaleString('it-IT')}
              </text>
            </g>
          )
        })}

        {points.map((p, i) => (
          <text key={`x-${i}`} x={p.x} y={pad.top + plotH + 18} textAnchor="middle" fill="#64748b" fontSize="9">
            {p.label}
          </text>
        ))}

        <text x={pad.left + plotW / 2} y={pad.top + plotH + 34} textAnchor="middle" fill="#64748b" fontSize="11" fontWeight="500">
          Periodo
        </text>

        <path d={areaPath} fill="url(#salesAreaGrad)" opacity={animated ? 1 : 0} style={{ transition: 'opacity 0.6s ease' }} />

        <path
          d={linePath}
          fill="none"
          stroke="#0284c7"
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
          strokeDasharray={animated ? 'none' : `${lineLength}`}
          strokeDashoffset={animated ? 0 : lineLength}
          style={{ transition: 'stroke-dashoffset 1.2s ease-out' }}
        />

        {points.map((p, i) => (
          <g key={i}>
            <circle
              cx={p.x}
              cy={p.y}
              r={animated ? 4 : 0}
              fill="#0f172a"
              stroke="#0284c7"
              strokeWidth="2"
              style={{ transition: `r 0.3s ease ${0.8 + i * 0.05}s` }}
              onMouseEnter={(e) => showTooltip(e, `${p.label}`, `€${p.value.toLocaleString('it-IT')}`)}
              onMouseMove={(e) => showTooltip(e, `${p.label}`, `€${p.value.toLocaleString('it-IT')}`)}
              onMouseLeave={hideTooltip}
              className="cursor-pointer"
            />
            <circle
              cx={p.x}
              cy={p.y}
              r="12"
              fill="transparent"
              onMouseEnter={(e) => showTooltip(e, `${p.label}`, `€${p.value.toLocaleString('it-IT')}`)}
              onMouseMove={(e) => showTooltip(e, `${p.label}`, `€${p.value.toLocaleString('it-IT')}`)}
              onMouseLeave={hideTooltip}
              className="cursor-pointer"
            />
          </g>
        ))}
      </svg>
      <div className="flex items-center justify-center gap-6 mt-1 text-xs text-slate-400">
        <span>Min: <span className="text-red-400 font-medium">€{minVal.toLocaleString('it-IT')}</span></span>
        <span>Max: <span className="text-emerald-400 font-medium">€{maxVal.toLocaleString('it-IT')}</span></span>
        <span>Media: <span className="text-sky-400 font-medium">€{avgVal.toLocaleString('it-IT')}</span></span>
      </div>
    </div>
  )
}

function RevenueCostChart({ revenue, cost, tooltip, showTooltip, hideTooltip }: {
  revenue: SalesPoint[]
  cost: SalesPoint[]
  tooltip: TooltipState
  showTooltip: (e: React.MouseEvent, content: string, sub?: string) => void
  hideTooltip: () => void
}) {
  const [animated, setAnimated] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setAnimated(true)
        observer.disconnect()
      }
    }, { threshold: 0.3 })
    if (containerRef.current) observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  const w = 520; const h = 240; const pad = { top: 20, right: 25, bottom: 40, left: 60 }
  const plotW = w - pad.left - pad.right; const plotH = h - pad.top - pad.bottom

  const allVals = [...revenue.map(d => d.value), ...cost.map(d => d.value)]
  const maxVal = Math.max(...allVals)
  const minVal = Math.min(...allVals)
  const rangeMin = minVal * 0.8
  const rangeMax = maxVal * 1.1
  const range = rangeMax - rangeMin

  function toPoints(data: SalesPoint[]) {
    return data.map((d, i) => {
      const x = pad.left + (i / Math.max(data.length - 1, 1)) * plotW
      const y = pad.top + plotH - ((d.value - rangeMin) / range) * plotH
      return { x, y, ...d }
    })
  }

  const revPoints = toPoints(revenue)
  const costPoints = toPoints(cost)

  const revLine = `M ${revPoints.map(p => `${p.x} ${p.y}`).join(' L ')}`
  const costLine = `M ${costPoints.map(p => `${p.x} ${p.y}`).join(' L ')}`
  const revArea = `${revLine} L ${revPoints[revPoints.length - 1].x} ${pad.top + plotH} L ${revPoints[0].x} ${pad.top + plotH} Z`
  const costArea = `${costLine} L ${costPoints[costPoints.length - 1].x} ${pad.top + plotH} L ${costPoints[0].x} ${pad.top + plotH} Z`

  const yStep = range / 4
  const yTicks = Array.from({ length: 5 }, (_, i) => Math.round(rangeMin + yStep * i))

  const revLineLength = revPoints.reduce((acc, p, i) => {
    if (i === 0) return 0
    const dx = p.x - revPoints[i - 1].x
    const dy = p.y - revPoints[i - 1].y
    return acc + Math.sqrt(dx * dx + dy * dy)
  }, 0)
  const costLineLength = costPoints.reduce((acc, p, i) => {
    if (i === 0) return 0
    const dx = p.x - costPoints[i - 1].x
    const dy = p.y - costPoints[i - 1].y
    return acc + Math.sqrt(dx * dx + dy * dy)
  }, 0)

  const sharedLabels = revenue.map(d => d.label)

  return (
    <div ref={containerRef}>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="w-full h-auto">
        <defs>
          <linearGradient id="revGrad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#0284c7" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#0284c7" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="costGrad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#f97316" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
          </linearGradient>
        </defs>

        <text x={pad.left + plotW / 2} y={10} textAnchor="middle" fill="#64748b" fontSize="11" fontWeight="500">
          Valore (€)
        </text>

        {yTicks.map((t, i) => {
          const y = pad.top + plotH - ((t - rangeMin) / range) * plotH
          return (
            <g key={i}>
              <line x1={pad.left} x2={pad.left + plotW} y1={y} y2={y} stroke="#334155" strokeWidth="1" strokeDasharray="4 2" />
              <text x={pad.left - 8} y={y + 4} textAnchor="end" fill="#64748b" fontSize="10">
                €{t.toLocaleString('it-IT')}
              </text>
            </g>
          )
        })}

        {sharedLabels.map((l, i) => {
          const x = pad.left + (i / Math.max(sharedLabels.length - 1, 1)) * plotW
          return (
            <text key={i} x={x} y={pad.top + plotH + 18} textAnchor="middle" fill="#64748b" fontSize="9">{l}</text>
          )
        })}

        <text x={pad.left + plotW / 2} y={pad.top + plotH + 34} textAnchor="middle" fill="#64748b" fontSize="11" fontWeight="500">
          Periodo
        </text>

        <path d={revArea} fill="url(#revGrad)" opacity={animated ? 1 : 0} style={{ transition: 'opacity 0.6s ease' }} />
        <path d={costArea} fill="url(#costGrad)" opacity={animated ? 1 : 0} style={{ transition: 'opacity 0.6s ease 0.2s' }} />

        <path
          d={revLine}
          fill="none"
          stroke="#0284c7"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
          strokeDasharray={animated ? 'none' : `${revLineLength}`}
          strokeDashoffset={animated ? 0 : revLineLength}
          style={{ transition: 'stroke-dashoffset 1.2s ease-out' }}
        />
        <path
          d={costLine}
          fill="none"
          stroke="#f97316"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
          strokeDasharray={animated ? '6 3' : `${costLineLength}`}
          strokeDashoffset={animated ? 0 : costLineLength}
          style={{ transition: 'stroke-dashoffset 1s ease-out 0.3s' }}
        />

        {revPoints.map((p, i) => (
          <g key={`r-${i}`}>
            <circle
              cx={p.x} cy={p.y}
              r={animated ? 3 : 0}
              fill="#0f172a" stroke="#0284c7" strokeWidth="1.5"
              style={{ transition: `r 0.3s ease ${0.8 + i * 0.04}s` }}
            />
            <circle cx={p.x} cy={p.y} r="10" fill="transparent"
              onMouseEnter={(e) => showTooltip(e, `Ricavi ${p.label}`, `€${p.value.toLocaleString('it-IT')}`)}
              onMouseMove={(e) => showTooltip(e, `Ricavi ${p.label}`, `€${p.value.toLocaleString('it-IT')}`)}
              onMouseLeave={hideTooltip}
              className="cursor-pointer"
            />
          </g>
        ))}
        {costPoints.map((p, i) => (
          <g key={`c-${i}`}>
            <circle
              cx={p.x} cy={p.y}
              r={animated ? 3 : 0}
              fill="#0f172a" stroke="#f97316" strokeWidth="1.5"
              style={{ transition: `r 0.3s ease ${0.8 + i * 0.04}s` }}
            />
            <circle cx={p.x} cy={p.y} r="10" fill="transparent"
              onMouseEnter={(e) => showTooltip(e, `Costi ${p.label}`, `€${p.value.toLocaleString('it-IT')}`)}
              onMouseMove={(e) => showTooltip(e, `Costi ${p.label}`, `€${p.value.toLocaleString('it-IT')}`)}
              onMouseLeave={hideTooltip}
              className="cursor-pointer"
            />
          </g>
        ))}
      </svg>
      <div className="flex items-center justify-center gap-4 mt-1 text-xs">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 rounded bg-sky-600 inline-block" /> <span className="text-slate-400">Ricavi</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 rounded inline-block" style={{ borderTop: '2px dashed #f97316', height: 0 }} /> <span className="text-slate-400">Costi</span>
        </span>
      </div>
    </div>
  )
}

function WeeklyBarChart({ tooltip, showTooltip, hideTooltip }: { tooltip: TooltipState; showTooltip: (e: React.MouseEvent, content: string, sub?: string) => void; hideTooltip: () => void }) {
  const [animated, setAnimated] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setAnimated(true)
        observer.disconnect()
      }
    }, { threshold: 0.3 })
    if (containerRef.current) observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  const maxVal = Math.max(...WEEKLY_COMPARISON.map(d => Math.max(d.thisWeek, d.lastWeek)))
  const chartH = 160; const barG = 10; const barW = 18
  const w = 520; const h = chartH + 50

  return (
    <div ref={containerRef}>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="w-full h-auto">
        <text x={190} y={12} textAnchor="middle" fill="#64748b" fontSize="11" fontWeight="500">
          Numero vendite
        </text>

        {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
          const y = chartH - pct * chartH + 20
          const val = Math.round(pct * maxVal)
          return (
            <g key={i}>
              <line x1={45} x2={w - 10} y1={y} y2={y} stroke="#334155" strokeWidth="1" strokeDasharray="4 2" />
              <text x={40} y={y + 4} textAnchor="end" fill="#64748b" fontSize="9">{val}</text>
            </g>
          )
        })}

        {WEEKLY_COMPARISON.map((d, i) => {
          const x = i * (barW * 2 + barG + 12) + 48
          const thisH = animated ? (d.thisWeek / maxVal) * chartH : 0
          const lastH = animated ? (d.lastWeek / maxVal) * chartH : 0
          const yBase = chartH + 20

          return (
            <g key={i}>
              <rect
                x={x} y={yBase - thisH} width={barW} height={thisH}
                rx="3" fill="#0284c7" opacity="0.9"
                style={{ transition: `height 0.6s ease ${i * 0.08}s, y 0.6s ease ${i * 0.08}s` }}
                onMouseEnter={(e) => showTooltip(e, `${d.day} — Questa settimana`, `${d.thisWeek} vendite`)}
                onMouseMove={(e) => showTooltip(e, `${d.day} — Questa settimana`, `${d.thisWeek} vendite`)}
                onMouseLeave={hideTooltip}
                className="cursor-pointer"
              />
              <rect
                x={x + barW + 2} y={yBase - lastH} width={barW} height={lastH}
                rx="3" fill="#475569" opacity="0.9"
                style={{ transition: `height 0.6s ease ${i * 0.08 + 0.05}s, y 0.6s ease ${i * 0.08 + 0.05}s` }}
                onMouseEnter={(e) => showTooltip(e, `${d.day} — Settimana scorsa`, `${d.lastWeek} vendite`)}
                onMouseMove={(e) => showTooltip(e, `${d.day} — Settimana scorsa`, `${d.lastWeek} vendite`)}
                onMouseLeave={hideTooltip}
                className="cursor-pointer"
              />
              <text x={x + barW + 1} y={yBase + 16} textAnchor="middle" fill="#64748b" fontSize="10">
                {d.day}
              </text>
            </g>
          )
        })}

        <text x={190} y={h - 2} textAnchor="middle" fill="#64748b" fontSize="11" fontWeight="500">
          Giorno della settimana
        </text>
      </svg>
      <div className="flex items-center justify-center gap-4 mt-0 text-xs">
        <span className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-sky-600" /> <span className="text-slate-400">Questa settimana</span>
        </span>
        <span className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-slate-600" /> <span className="text-slate-400">Settimana scorsa</span>
        </span>
      </div>
    </div>
  )
}

function TopProductsChart({ products, onProductClick, tooltip, showTooltip, hideTooltip }: {
  products: Product[]
  onProductClick: (name: string) => void
  tooltip: TooltipState
  showTooltip: (e: React.MouseEvent, content: string, sub?: string) => void
  hideTooltip: () => void
}) {
  const [animated, setAnimated] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setAnimated(true)
        observer.disconnect()
      }
    }, { threshold: 0.3 })
    if (containerRef.current) observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [products])

  const maxVal = Math.max(...products.map(d => d.value))
  const chartH = 160; const barW = 32

  return (
    <div ref={containerRef}>
      <svg width="100%" height={chartH + 60} viewBox={`0 0 520 ${chartH + 60}`} preserveAspectRatio="xMidYMid meet">
        <text x={260} y={12} textAnchor="middle" fill="#64748b" fontSize="11" fontWeight="500">
          Volumi di vendita
        </text>

        {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
          const y = 22 + chartH - pct * chartH
          const val = Math.round(pct * maxVal)
          return (
            <g key={i}>
              <line x1={15} x2={510} y1={y} y2={y} stroke="#334155" strokeWidth="1" strokeDasharray="4 2" />
              <text x={8} y={y + 4} textAnchor="end" fill="#64748b" fontSize="8">{val}</text>
            </g>
          )
        })}

        {products.map((d, i) => {
          const x = i * 50 + 15
          const barH = animated ? (d.value / maxVal) * chartH : 0
          const y = 22 + chartH - barH
          const ry = 4

          return (
            <g key={i} onClick={() => onProductClick(d.name)} className="cursor-pointer">
              <rect
                x={x} y={y} width={barW} height={barH}
                rx={ry} ry={ry}
                fill="#10b981" opacity="0.9"
                style={{ transition: `height 0.5s ease ${i * 0.06}s, y 0.5s ease ${i * 0.06}s` }}
                onMouseEnter={(e) => showTooltip(e, d.name, `${d.value} vendite`)}
                onMouseMove={(e) => showTooltip(e, d.name, `${d.value} vendite`)}
                onMouseLeave={hideTooltip}
              />
              <rect x={x} y={y} width={barW} height={barH} rx={ry} ry={ry} fill="transparent" className="hover:fill-white/10" />
              <text
                x={x + barW / 2} y={y - 5} textAnchor="middle" fill="#94a3b8" fontSize="10" fontWeight="600"
              >
                {d.value}
              </text>
              <text
                x={x + barW / 2} y={22 + chartH + 16} textAnchor="middle" fill="#64748b" fontSize="8"
                transform={`rotate(-30 ${x + barW / 2} ${22 + chartH + 16})`}
              >
                {d.name.length > 10 ? d.name.substring(0, 10) + '..' : d.name}
              </text>
            </g>
          )
        })}

        <text x={260} y={chartH + 56} textAnchor="middle" fill="#64748b" fontSize="11" fontWeight="500">
          Prodotto
        </text>
      </svg>
    </div>
  )
}

function Sparkline({ data, width, height, color }: { data: number[]; width: number; height: number; color: string }) {
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1

  const points = data.map((d, i) => {
    const x = (i / Math.max(data.length - 1, 1)) * width
    const y = height - ((d - min) / range) * height
    return `${x},${y}`
  }).join(' ')

  const areaPoints = `${points} ${width},${height} 0,${height}`

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="inline-block align-middle">
      <polygon points={areaPoints} fill={color} fillOpacity="0.15" />
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}

function AgentsTable() {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-slate-700">
          <th className="text-left py-2.5 text-xs font-semibold text-slate-400 pl-1">Metrica</th>
          <th className="text-center py-2.5 text-xs font-semibold text-slate-400">WhatsApp</th>
          <th className="text-center py-2.5 text-xs font-semibold text-slate-400">Telegram</th>
          <th className="text-center py-2.5 text-xs font-semibold text-slate-400">Soglia Allarme</th>
        </tr>
      </thead>
      <tbody>
        {AGENTS.map((row, i) => {
          const isRisoluzione = row.metrica.includes('Risoluzione')
          const isTempo = row.metrica.includes('Tempo')
          const isEscalati = row.metrica.includes('Escalati')

          const waAlert = isRisoluzione && row.whatsapp < 70
          const tgAlert = isRisoluzione && row.telegram < 70
          const waSlow = isTempo && row.whatsapp > 3.5
          const tgSlow = isTempo && row.telegram > 3.5
          const escWaAlert = isEscalati && row.whatsapp > 5
          const escTgAlert = isEscalati && row.telegram > 5

          const formatVal = (v: number) => {
            if (isRisoluzione || row.metrica.includes('Soddisfazione')) return `${v}%`
            if (isTempo) return `${v}s`
            return String(v)
          }

          return (
            <tr key={i} className="border-b border-slate-800 hover:bg-slate-800/50">
              <td className="py-2.5 text-slate-300 pl-1 text-xs">{row.metrica}</td>
              <td className="py-2.5 text-center">
                <div className="flex items-center justify-center gap-1.5">
                  <Sparkline data={row.sparklineData} width={50} height={18} color="#0284c7" />
                  <span className={cn('font-semibold text-xs min-w-[40px]', waAlert || waSlow || escWaAlert ? 'text-red-400 font-bold' : 'text-slate-200')}>
                    {formatVal(row.whatsapp)}
                  </span>
                  {waSlow && (
                    <span title="Latenza AI elevata — Verifica risorse hardware Ollama">
                      <AlertTriangle size={12} className="text-amber-400" />
                    </span>
                  )}
                </div>
              </td>
              <td className="py-2.5 text-center">
                <div className="flex items-center justify-center gap-1.5">
                  <Sparkline
                    data={row.sparklineData.map(v => v * (row.telegram / (row.whatsapp || 1)) * 0.9)}
                    width={50} height={18} color="#10b981"
                  />
                  <span className={cn('font-semibold text-xs min-w-[40px]', tgAlert || tgSlow || escTgAlert ? 'text-red-400 font-bold' : 'text-slate-200')}>
                    {formatVal(row.telegram)}
                  </span>
                  {tgSlow && (
                    <span title="Latenza AI elevata — Verifica risorse hardware Ollama">
                      <AlertTriangle size={12} className="text-amber-400" />
                    </span>
                  )}
                </div>
              </td>
              <td className="py-2.5 text-center text-xs text-slate-500">
                {isRisoluzione ? '< 70%' : isTempo ? '> 3.5s' : isEscalati ? '> 5' : '—'}
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

function csvEscape(val: string | number): string {
  const s = String(val)
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

export function DashboardModule() {
  const [period, setPeriod] = useState<Period>('30g')
  const [selectedSlice, setSelectedSlice] = useState<number | null>(null)
  const [productFilter, setProductFilter] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const lineTooltip = useTooltip()
  const revCostTooltip = useTooltip()
  const weeklyTooltip = useTooltip()
  const topTooltip = useTooltip()
  const donutTooltip = useTooltip()

  const salesData = useMemo(() => generateSalesData(period), [period])
  const { revenue, cost } = useMemo(() => generateRevenueCostData(period), [period])

  const filteredProducts = useMemo(() => {
    if (!productFilter) return TOP_PRODUCTS
    return TOP_PRODUCTS.filter(p => p.name === productFilter)
  }, [productFilter])

  const handleRefresh = useCallback(() => {
    setLoading(true)
    setTimeout(() => setLoading(false), 1200)
  }, [])

  const handleExport = useCallback(() => {
    const now = new Date().toISOString().slice(0, 10)
    const lines: string[] = []

    lines.push('Report Dashboard BI')
    lines.push(`Periodo,${PERIOD_LABELS[period]}`)
    lines.push(`Generato,${now}`)
    lines.push('')

    lines.push('KPI')
    lines.push('Capitale Investito,Capitale Potenziale,Margine Lordo')
    lines.push(`${KPI.capitale_investito},${KPI.capitale_potenziale},${KPI.margine_lordo}`)
    lines.push('')

    lines.push('Vendite')
    lines.push('Data,Valore')
    salesData.forEach(s => lines.push(`${s.label},${s.value}`))
    lines.push('')

    lines.push('Ricavi vs Costi')
    lines.push('Data,Ricavi,Costi')
    revenue.forEach((r, i) => lines.push(`${r.label},${r.value},${cost[i]?.value || ''}`))
    lines.push('')

    lines.push('Top Prodotti')
    lines.push('Prodotto,Vendite')
    TOP_PRODUCTS.forEach(p => lines.push(`${p.name},${p.value}`))
    lines.push('')

    lines.push('Confronto Settimanale')
    lines.push('Giorno,Questa Settimana,Settimana Scorsa')
    WEEKLY_COMPARISON.forEach(w => lines.push(`${w.day},${w.thisWeek},${w.lastWeek}`))
    lines.push('')

    lines.push('Lost Deals')
    lines.push('Motivazione,Valore,Dettagli')
    LOST_DEALS.forEach(d => lines.push(`${d.label},${d.value},"${d.details.join('; ')}"`))
    lines.push('')

    lines.push('Performance Agenti')
    lines.push('Metrica,WhatsApp,Telegram,Soglia')
    AGENTS.forEach(a => lines.push(`${a.metrica},${a.whatsapp},${a.telegram},${a.allarme}`))

    const csv = lines.join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `dashboard-report-${now}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }, [period, salesData, revenue, cost])

  return (
    <div className="h-full overflow-auto bg-slate-950 text-slate-100">
      <ChartTooltip tooltip={lineTooltip.tooltip} />
      <ChartTooltip tooltip={revCostTooltip.tooltip} />
      <ChartTooltip tooltip={weeklyTooltip.tooltip} />
      <ChartTooltip tooltip={topTooltip.tooltip} />
      <ChartTooltip tooltip={donutTooltip.tooltip} />

      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <BarChart3 size={20} className="text-sky-400" /> Dashboard BI
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md border border-slate-700 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <Download size={14} /> Esporta Report
          </button>
          <button
            onClick={handleRefresh}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md border border-slate-700 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors',
              loading && 'opacity-60 pointer-events-none'
            )}
          >
            <RefreshCw size={14} className={cn(loading && 'animate-spin')} /> Aggiorna
          </button>
        </div>
      </div>

      <div className="flex gap-1 mb-4 bg-slate-900 border border-slate-800 rounded-lg p-1 w-fit">
        {(Object.entries(PERIOD_LABELS) as [Period, string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setPeriod(key)}
            className={cn(
              'px-3 py-1.5 text-xs rounded-md font-medium transition-all',
              period === key
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex gap-4 mb-6">
        {loading ? (
          <>
            <div className="flex-1 bg-slate-800 border border-slate-700 rounded-lg p-4 animate-pulse">
              <div className="h-3 bg-slate-700 rounded w-32 mb-2" />
              <div className="h-7 bg-slate-700 rounded w-36 mb-2" />
              <div className="h-3 bg-slate-700 rounded w-28" />
            </div>
            <div className="flex-1 bg-slate-800 border border-slate-700 rounded-lg p-4 animate-pulse">
              <div className="h-3 bg-slate-700 rounded w-28 mb-2" />
              <div className="h-7 bg-slate-700 rounded w-40 mb-2" />
              <div className="h-3 bg-slate-700 rounded w-32" />
            </div>
            <div className="flex-1 bg-slate-800 border border-slate-700 rounded-lg p-4 animate-pulse">
              <div className="h-3 bg-slate-700 rounded w-24 mb-2" />
              <div className="h-7 bg-slate-700 rounded w-28 mb-2" />
              <div className="h-3 bg-slate-700 rounded w-36" />
            </div>
          </>
        ) : (
          <>
            <KpiCard
              title="CAPITALE INVESTITO"
              value={`€ ${KPI.capitale_investito.toLocaleString('it-IT')},00`}
              subtitle="+130% ricarico stimato"
              trend="up"
            />
            <KpiCard
              title="VALORE POTENZIALE"
              value={`€ ${KPI.capitale_potenziale.toLocaleString('it-IT')},00`}
              subtitle="Valore di vendita delle scorte"
            />
            <KpiCard
              title="MARGINE LORDO"
              value={`${KPI.margine_lordo} %`}
              subtitle="Efficienza media del catalogo"
              alertBadge={KPI.prodotti_esauriti > 0 ? `${KPI.prodotti_esauriti} esauriti` : undefined}
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
          <h3 className="text-sm font-semibold text-slate-200 mb-4">Lost Deals Analytics</h3>
          <DonutChart
            data={LOST_DEALS}
            selectedIndex={selectedSlice}
            onSelect={setSelectedSlice}
            tooltip={donutTooltip.tooltip}
            showTooltip={donutTooltip.show}
            hideTooltip={donutTooltip.hide}
          />
          {selectedSlice !== null && (
            <div className="mt-3 pt-3 border-t border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-200">
                  {LOST_DEALS[selectedSlice].label} — {LOST_DEALS[selectedSlice].value} deal
                </span>
                <button onClick={() => setSelectedSlice(null)} className="text-slate-500 hover:text-slate-300">
                  <X size={14} />
                </button>
              </div>
              <ul className="space-y-1">
                {LOST_DEALS[selectedSlice].details.map((d, i) => (
                  <li key={i} className="text-xs text-slate-400 flex items-center gap-1.5">
                    <ChevronRight size={10} className="text-slate-600" /> {d}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
          <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
            <Activity size={14} className="text-sky-400" /> Andamento Vendite
          </h3>
          <SalesLineChart
            data={salesData}
            tooltip={lineTooltip.tooltip}
            showTooltip={lineTooltip.show}
            hideTooltip={lineTooltip.hide}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
          <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
            <TrendingUp size={14} className="text-sky-400" /> Ricavi vs Costi
          </h3>
          <RevenueCostChart
            revenue={revenue}
            cost={cost}
            tooltip={revCostTooltip.tooltip}
            showTooltip={revCostTooltip.show}
            hideTooltip={revCostTooltip.hide}
          />
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
          <h3 className="text-sm font-semibold text-slate-200 mb-4">Confronto Settimanale</h3>
          <WeeklyBarChart
            tooltip={weeklyTooltip.tooltip}
            showTooltip={weeklyTooltip.show}
            hideTooltip={weeklyTooltip.hide}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-200">Top 10 Prodotti</h3>
            {productFilter && (
              <button
                onClick={() => setProductFilter(null)}
                className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1"
              >
                <X size={12} /> Rimuovi filtro
              </button>
            )}
          </div>
          {productFilter && (
            <p className="text-xs text-slate-400 mb-2">
              Filtro attivo: <span className="text-sky-400 font-medium">{productFilter}</span>
            </p>
          )}
          <TopProductsChart
            products={filteredProducts}
            onProductClick={setProductFilter}
            tooltip={topTooltip.tooltip}
            showTooltip={topTooltip.show}
            hideTooltip={topTooltip.hide}
          />
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
          <h3 className="text-sm font-semibold text-slate-200 mb-4">Performance Agenti</h3>
          <AgentsTable />
        </div>
      </div>
    </div>
  )
}
