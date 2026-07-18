import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { ZoomIn, ZoomOut, Download, Printer, AlertTriangle, Check } from 'lucide-react'

interface BillingItem {
  sku: string; nome: string; qty: number; prezzo: number
}

const MOCK_ITEMS: BillingItem[] = [
  { sku: 'SKU-001', nome: 'Sneaker Urban', qty: 2, prezzo: 89.90 },
  { sku: 'SKU-004', nome: 'Giacca Tech Wind', qty: 1, prezzo: 199.00 },
  { sku: 'SKU-007', nome: 'Felpa Cotton', qty: 1, prezzo: 69.90 },
]

export function BillingModule() {
  const [items] = useState(MOCK_ITEMS)
  const [iva, setIva] = useState(22)
  const [sconto, setSconto] = useState(0)
  const [zoom, setZoom] = useState(100)
  const [indirizzo, setIndirizzo] = useState('Via Roma 42, 20100 Milano (MI)')
  const [showSafety, setShowSafety] = useState(false)
  const [canConfirm, setCanConfirm] = useState(false)
  const [sent, setSent] = useState(false)
  const [showThermal, setShowThermal] = useState(false)

  const imponibile = items.reduce((a, i) => a + i.qty * i.prezzo, 0)
  const scontoVal = imponibile * (sconto / 100)
  const imponibileNet = imponibile - scontoVal
  const ivaVal = imponibileNet * (iva / 100)
  const totale = imponibileNet + ivaVal

  useEffect(() => {
    if (!showSafety) { setCanConfirm(false); return }
    const t = setTimeout(() => setCanConfirm(true), 3000)
    return () => clearTimeout(t)
  }, [showSafety])

  const formatEur = (n: number) => new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(n)

  const confirmSend = () => {
    setSent(true)
    setTimeout(() => { setShowSafety(false); setSent(false) }, 2000)
  }

  return (
    <div className="h-full flex gap-4">
      <div className="w-[380px] flex-shrink-0 bg-white border border-slate-200 rounded-lg p-5 flex flex-col">
        <h2 className="text-lg font-semibold text-slate-900 mb-1">FATT-2026-0001</h2>
        <p className="text-xs text-slate-400 mb-4">Mario Rossi · WhatsApp · +39 333 1111111</p>

        <div className="space-y-2 mb-4 flex-1">
          <label className="text-xs font-medium text-slate-500">Articoli</label>
          {items.map((item, i) => (
            <div key={i} className="flex items-center justify-between text-sm py-1.5 border-b border-slate-100 last:border-0">
              <div>
                <span className="font-mono text-xs text-slate-500 mr-2">{item.sku}</span>
                <span className="text-slate-700">{item.nome}</span>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400">x{item.qty}</span>
                <span className="ml-3 font-medium">{formatEur(item.prezzo)}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-3 pt-3 border-t border-slate-200">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">Imponibile</span>
            <span className="font-medium">{formatEur(imponibile)}</span>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-500 whitespace-nowrap">Aliquota IVA:</label>
            <select
              value={iva}
              onChange={e => setIva(Number(e.target.value))}
              className="text-sm border border-slate-200 rounded px-2 py-1"
            >
              <option value={22}>22%</option><option value={10}>10%</option><option value={4}>4%</option>
            </select>
            <span className="text-sm font-medium ml-auto">{formatEur(ivaVal)}</span>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-500 whitespace-nowrap">Sconto:</label>
            <input
              type="number"
              value={sconto}
              onChange={e => setSconto(Number(e.target.value))}
              className="w-16 text-sm border border-slate-200 rounded px-2 py-0.5"
            />
            <span className="text-xs text-slate-400">%</span>
            <span className="text-sm text-red-500 ml-auto">-{formatEur(scontoVal)}</span>
          </div>

          <div className="flex items-center justify-between text-sm pt-2 border-t border-slate-200">
            <span className="font-semibold text-slate-900">Totale</span>
            <span className="font-bold text-lg">{formatEur(totale)}</span>
          </div>
        </div>

        <div className="mt-4">
          <label className="text-xs text-slate-500 block mb-1">Indirizzo fatturazione</label>
          <input
            type="text"
            value={indirizzo}
            onChange={e => setIndirizzo(e.target.value)}
            className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-md"
          />
        </div>

        <button
          onClick={() => setShowSafety(true)}
          className="mt-4 w-full py-2.5 text-sm font-medium text-white bg-sky-600 rounded-md hover:bg-sky-700 flex items-center justify-center gap-2"
        >
          <SendIcon /> Invia e Incolla in Chat
        </button>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="h-10 bg-slate-800 rounded-t-lg flex items-center justify-between px-4">
          <div className="flex items-center gap-1">
            <button onClick={() => setZoom(z => Math.max(100, z - 25))} className="p-1.5 rounded hover:bg-white/10 text-white">
              <ZoomOut size={16} />
            </button>
            <span className="text-white text-xs mx-2">{zoom}%</span>
            <button onClick={() => setZoom(z => Math.min(150, z + 25))} className="p-1.5 rounded hover:bg-white/10 text-white">
              <ZoomIn size={16} />
            </button>
            <span className="w-px h-4 bg-white/20 mx-2" />
            <button className="p-1.5 rounded hover:bg-white/10 text-white" title="Download PDF">
              <Download size={16} />
            </button>
            <button className="p-1.5 rounded hover:bg-white/10 text-white" title="Stampa">
              <Printer size={16} />
            </button>
            <button
              onClick={() => setShowThermal(!showThermal)}
              className={cn('p-1.5 rounded text-white text-xs px-2', showThermal ? 'bg-white/20' : 'hover:bg-white/10')}
            >
              80mm
            </button>
          </div>
        </div>

        <div className="flex-1 bg-slate-800 rounded-b-lg p-6 overflow-auto flex justify-center">
          {showThermal ? (
            <div className="bg-white font-mono text-black text-xs p-2" style={{ width: '80mm', transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}>
              <div className="border-b border-black pb-2 mb-2 text-center">
                <div className="font-bold">STITCH ERP</div>
                <div>Packing List - FATT-2026-0001</div>
              </div>
              <div className="border-b border-black pb-1 mb-1">
                <div className="font-bold text-sm">DA PRELEVARE:</div>
              </div>
              {items.map((item, i) => (
                <div key={i} className="flex justify-between py-1 border-b border-dashed border-gray-400">
                  <div>
                    <span className="font-bold text-sm">{item.sku}</span>
                    <br /><span className="text-xs">{item.nome}</span>
                  </div>
                  <div className="font-bold text-lg">{item.qty}x</div>
                </div>
              ))}
              <div className="text-center mt-2 pt-2 border-t border-black">
                <div className="text-xs opacity-50">{new Date().toLocaleDateString('it-IT')}</div>
              </div>
            </div>
          ) : (
            <div
              className="bg-white shadow-2xl p-8"
              style={{
                width: '210mm',
                minHeight: '297mm',
                aspectRatio: '210/297',
                maxWidth: '100%',
                transform: `scale(${zoom / 100})`,
                transformOrigin: 'top center',
              }}
            >
              <div className="flex justify-between items-start mb-6 border-b pb-4">
                <div>
                  <div className="w-12 h-12 bg-sky-600 rounded-md flex items-center justify-center mb-2">
                    <span className="text-white font-bold text-sm">S</span>
                  </div>
                  <h2 className="text-sm font-bold text-slate-900">STITCH ERP</h2>
                  <p className="text-xs text-slate-500">Via del Commercio 10, Milano</p>
                  <p className="text-xs text-slate-500">P.IVA 12345678901</p>
                </div>
                <div className="text-right">
                  <h1 className="text-xl font-bold text-slate-900">FATTURA</h1>
                  <p className="text-sm font-semibold text-sky-600">FATT-2026-0001</p>
                  <p className="text-xs text-slate-500">{new Date().toLocaleDateString('it-IT')}</p>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-xs text-slate-500 mb-2">FATTURATO A:</p>
                <p className="text-sm font-semibold text-slate-900">Mario Rossi</p>
                <p className="text-xs text-slate-600">{indirizzo}</p>
                <p className="text-xs text-slate-600">P.IVA / CF: RSSMRA80A01F205X</p>
              </div>

              <table className="w-full text-xs mb-6">
                <thead>
                  <tr className="border-b-2 border-slate-300">
                    <th className="text-left py-2 font-semibold">Codice</th>
                    <th className="text-left py-2 font-semibold">Descrizione</th>
                    <th className="text-center py-2 font-semibold">Qtà</th>
                    <th className="text-right py-2 font-semibold">Prezzo</th>
                    <th className="text-right py-2 font-semibold">Importo</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, i) => (
                    <tr key={i} className="border-b border-slate-200">
                      <td className="py-2 font-mono text-slate-500">{item.sku}</td>
                      <td className="py-2">{item.nome}</td>
                      <td className="py-2 text-center">{item.qty}</td>
                      <td className="py-2 text-right">{formatEur(item.prezzo)}</td>
                      <td className="py-2 text-right font-medium">{formatEur(item.qty * item.prezzo)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="border-t pt-4 ml-auto w-64 space-y-1">
                <div className="flex justify-between text-xs">
                  <span>Imponibile</span><span>{formatEur(imponibile)}</span>
                </div>
                {sconto > 0 && (
                  <div className="flex justify-between text-xs text-red-500">
                    <span>Sconto {sconto}%</span><span>-{formatEur(scontoVal)}</span>
                  </div>
                )}
                <div className="flex justify-between text-xs">
                  <span>IVA {iva}%</span><span>{formatEur(ivaVal)}</span>
                </div>
                <div className="flex justify-between font-bold pt-2 border-t border-slate-300 text-sm">
                  <span>TOTALE</span><span>{formatEur(totale)}</span>
                </div>
              </div>

              <div className="mt-12 pt-6 border-t text-xs text-slate-500 space-y-1">
                <p className="font-semibold text-slate-700">Note legali:</p>
                <p>Pagamento tramite bonifico bancario IBAN IT00X0000000000000000000000</p>
                <p>Operazione non soggetta a ritenuta d'acconto (art.1 c.67-71 L.190/2014)</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {showSafety && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowSafety(false)}>
          <div className="bg-white rounded-lg shadow-xl w-96 p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                <AlertTriangle size={20} className="text-orange-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Conferma Emissione</h3>
                <p className="text-xs text-slate-500">Operazione fiscale definitiva</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 mb-6">
              Stai per emettere la fattura FATT-2026-0001 per un totale di <strong>{formatEur(totale)}</strong>.
              L'operazione è irreversibile.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowSafety(false)}
                className="px-4 py-2 text-sm text-slate-600 bg-slate-100 rounded-md hover:bg-slate-200"
              >
                Annulla
              </button>
              <button
                onClick={confirmSend}
                disabled={!canConfirm}
                className={cn(
                  'px-4 py-2 text-sm font-medium text-white rounded-md flex items-center gap-2 transition-all',
                  canConfirm
                    ? 'bg-sky-600 hover:bg-sky-700 cursor-pointer'
                    : 'bg-slate-300 cursor-not-allowed'
                )}
              >
                {sent ? (
                  <><Check size={16} /> Inviato!</>
                ) : canConfirm ? (
                  'CONFERMA'
                ) : (
                  `Attendi ${3 - Math.floor((Date.now() - (showSafety ? Date.now() : 0)) / 1000)}s...`
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function SendIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  )
}