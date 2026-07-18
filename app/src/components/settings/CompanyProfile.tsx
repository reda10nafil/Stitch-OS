import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import {
  Save,
  Building2,
  FileText,
  Image,
  Upload,
  Hash,
  Receipt,
  Package,
  Phone,
  Mail,
  Globe,
} from 'lucide-react'

type ToastMessage = { text: string; type: 'success' | 'error' } | null

export function CompanyProfile() {
  const [ragioneSociale, setRagioneSociale] = useState('Moduli S.r.l.')
  const [pIva, setPIva] = useState('IT12345678901')
  const [indirizzo, setIndirizzo] = useState('Via Roma 42, 20121 Milano MI')
  const [telefono, setTelefono] = useState('+39 02 1234567')
  const [email, setEmail] = useState('info@moduli.it')
  const [sitoWeb, setSitoWeb] = useState('https://www.moduli.it')
  const [invoicePrefix, setInvoicePrefix] = useState('FATT-')
  const [nextNumber, setNextNumber] = useState(248)
  const [defaultIVA, setDefaultIVA] = useState(22)
  const [legalNotes, setLegalNotes] = useState(
    'Pagamento entro 30 giorni data fattura. In caso di ritardo si applicano interessi di mora.\nRegime fiscale: ordinario.\nIBAN: IT00X0000000000000000000000'
  )
  const [showPackingPrices, setShowPackingPrices] = useState(false)
  const [warehouseNotes, setWarehouseNotes] = useState('Imballaggio standard con pluriball e scatola personalizzata.')
  const [toast, setToast] = useState<ToastMessage>(null)

  const handleSave = () => {
    setToast({ text: 'Profilo aziendale salvato con successo', type: 'success' })
    setTimeout(() => setToast(null), 3000)
  }

  const handleLogoUpload = () => {
    setToast({ text: 'Logo caricato (simulazione)', type: 'success' })
    setTimeout(() => setToast(null), 3000)
  }

  const ToggleRow = ({ label, description, checked, onChange }: {
    label: string
    description: string
    checked: boolean
    onChange: (v: boolean) => void
  }) => (
    <div className="flex items-center justify-between py-3 border-b border-[#3f4850] last:border-b-0">
      <div>
        <p className="text-sm font-medium text-[#dfe3e8]">{label}</p>
        <p className="text-xs text-[#8896a4]">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors',
          checked ? 'bg-sky-600' : 'bg-[#3f4850]'
        )}
      >
        <span
          className={cn(
            'pointer-events-none block h-4 w-4 rounded-full bg-white shadow ring-0 transition-transform',
            checked ? 'translate-x-4' : 'translate-x-0'
          )}
        />
      </button>
    </div>
  )

  return (
    <div className="h-full overflow-auto" style={{ color: '#dfe3e8' }}>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold flex items-center gap-2" style={{ color: '#dfe3e8' }}>
          <Building2 size={20} /> Profilo & Documenti Aziendali
        </h1>
      </div>

      <div className="space-y-6 max-w-2xl">
        <Card className="border-[#3f4850]" style={{ backgroundColor: '#1c2024' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2" style={{ color: '#dfe3e8' }}>
              <Building2 size={16} /> Informazioni Aziendali
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#dfe3e8' }}>Ragione Sociale</label>
              <Input
                value={ragioneSociale}
                onChange={e => setRagioneSociale(e.target.value)}
                className="border-[#3f4850] text-[#dfe3e8]"
                style={{ backgroundColor: '#181c20' }}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#dfe3e8' }}>P.IVA</label>
                <Input
                  value={pIva}
                  onChange={e => setPIva(e.target.value)}
                  className="border-[#3f4850] text-[#dfe3e8]"
                  style={{ backgroundColor: '#181c20' }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#dfe3e8' }}>
                  <Phone size={12} className="inline mr-1" /> Telefono
                </label>
                <Input
                  value={telefono}
                  onChange={e => setTelefono(e.target.value)}
                  className="border-[#3f4850] text-[#dfe3e8]"
                  style={{ backgroundColor: '#181c20' }}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#dfe3e8' }}>Indirizzo</label>
              <Input
                value={indirizzo}
                onChange={e => setIndirizzo(e.target.value)}
                className="border-[#3f4850] text-[#dfe3e8]"
                style={{ backgroundColor: '#181c20' }}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#dfe3e8' }}>
                  <Mail size={12} className="inline mr-1" /> Email
                </label>
                <Input
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="border-[#3f4850] text-[#dfe3e8]"
                  style={{ backgroundColor: '#181c20' }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#dfe3e8' }}>
                  <Globe size={12} className="inline mr-1" /> Sito Web
                </label>
                <Input
                  value={sitoWeb}
                  onChange={e => setSitoWeb(e.target.value)}
                  className="border-[#3f4850] text-[#dfe3e8]"
                  style={{ backgroundColor: '#181c20' }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#3f4850]" style={{ backgroundColor: '#1c2024' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2" style={{ color: '#dfe3e8' }}>
              <Receipt size={16} /> Template Documenti
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#dfe3e8' }}>
                  <Hash size={12} className="inline mr-1" /> Prefisso Fattura
                </label>
                <Input
                  value={invoicePrefix}
                  onChange={e => setInvoicePrefix(e.target.value)}
                  className="border-[#3f4850] text-[#dfe3e8]"
                  style={{ backgroundColor: '#181c20' }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#dfe3e8' }}>Prossimo Numero</label>
                <Input
                  type="number"
                  value={nextNumber}
                  onChange={e => setNextNumber(Number(e.target.value))}
                  className="border-[#3f4850] text-[#dfe3e8]"
                  style={{ backgroundColor: '#181c20' }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#dfe3e8' }}>IVA Default (%)</label>
                <Input
                  type="number"
                  value={defaultIVA}
                  onChange={e => setDefaultIVA(Number(e.target.value))}
                  className="border-[#3f4850] text-[#dfe3e8]"
                  style={{ backgroundColor: '#181c20' }}
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm" style={{ color: '#dfe3e8' }}>Anteprima:</span>
              <code className="px-3 py-1.5 rounded border text-sm" style={{ backgroundColor: '#181c20', borderColor: '#3f4850', color: '#dfe3e8' }}>
                {invoicePrefix}{String(nextNumber).padStart(4, '0')}
              </code>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#3f4850]" style={{ backgroundColor: '#1c2024' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2" style={{ color: '#dfe3e8' }}>
              <Image size={16} /> Logo Aziendale
            </CardTitle>
          </CardHeader>
          <CardContent>
            <button
              onClick={handleLogoUpload}
              className="w-full h-32 rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-colors hover:border-sky-600 hover:bg-sky-600/5 cursor-pointer"
              style={{ borderColor: '#3f4850', backgroundColor: '#181c20' }}
            >
              <Upload size={24} style={{ color: '#8896a4' }} />
              <span className="text-sm" style={{ color: '#8896a4' }}>Clicca per caricare il logo</span>
              <span className="text-xs" style={{ color: '#5a6670' }}>PNG, JPG o SVG (max 2MB)</span>
            </button>
          </CardContent>
        </Card>

        <Card className="border-[#3f4850]" style={{ backgroundColor: '#1c2024' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2" style={{ color: '#dfe3e8' }}>
              <FileText size={16} /> Note Legali in Fattura
            </CardTitle>
          </CardHeader>
          <CardContent>
            <textarea
              value={legalNotes}
              onChange={e => setLegalNotes(e.target.value)}
              rows={5}
              className="flex w-full rounded-md border px-3 py-2 text-sm transition-colors focus:ring-2 focus:ring-sky-500 focus:outline-none resize-vertical"
              style={{ backgroundColor: '#181c20', borderColor: '#3f4850', color: '#dfe3e8' }}
            />
          </CardContent>
        </Card>

        <Card className="border-[#3f4850]" style={{ backgroundColor: '#1c2024' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2" style={{ color: '#dfe3e8' }}>
              <Package size={16} /> Impostazioni Packing List
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ToggleRow
              label="Mostra Prezzi"
              description="Visualizza i prezzi sulla packing list"
              checked={showPackingPrices}
              onChange={setShowPackingPrices}
            />
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#dfe3e8' }}>Note Magazzino</label>
              <textarea
                value={warehouseNotes}
                onChange={e => setWarehouseNotes(e.target.value)}
                rows={2}
                className="flex w-full rounded-md border px-3 py-2 text-sm transition-colors focus:ring-2 focus:ring-sky-500 focus:outline-none resize-vertical"
                style={{ backgroundColor: '#181c20', borderColor: '#3f4850', color: '#dfe3e8' }}
              />
            </div>
          </CardContent>
        </Card>

        <Button onClick={handleSave}>
          <Save size={14} /> Salva Profilo
        </Button>
      </div>

      {toast && (
        <div
          className={cn(
            'fixed bottom-4 right-4 px-4 py-3 rounded-md shadow-lg text-sm font-medium transition-all',
            toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
          )}
        >
          {toast.text}
        </div>
      )}
    </div>
  )
}