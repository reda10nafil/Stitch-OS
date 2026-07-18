import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import {
  Save,
  Bell,
  Database as DatabaseIcon,
  Monitor,
  Building2,
  RotateCcw,
  Download,
  Upload,
  HardDrive,
  ChevronRight,
} from 'lucide-react'

type ToastMessage = { text: string; type: 'success' | 'error' } | null

export function SystemSettings() {
  const [companyName, setCompanyName] = useState('Moduli S.r.l.')
  const [language, setLanguage] = useState('IT')
  const [timezone, setTimezone] = useState('Europe/Rome')
  const [currency, setCurrency] = useState('EUR')
  const [whatsappEnabled, setWhatsappEnabled] = useState(true)
  const [telegramEnabled, setTelegramEnabled] = useState(true)
  const [emailEnabled, setEmailEnabled] = useState(true)
  const [desktopEnabled, setDesktopEnabled] = useState(false)
  const [dbPath, setDbPath] = useState('/data/moduli.db')
  const [fontSize, setFontSize] = useState(14)
  const [sidebarWidth, setSidebarWidth] = useState<64 | 240>(64)
  const [toast, setToast] = useState<ToastMessage>(null)

  const handleSave = () => {
    setToast({ text: 'Impostazioni salvate con successo', type: 'success' })
    setTimeout(() => setToast(null), 3000)
  }

  const handleBackup = () => {
    setToast({ text: 'Backup database creato', type: 'success' })
    setTimeout(() => setToast(null), 3000)
  }

  const handleRestore = () => {
    setToast({ text: 'Ripristino completato', type: 'success' })
    setTimeout(() => setToast(null), 3000)
  }

  const handleCompact = () => {
    setToast({ text: 'Database compattato con successo', type: 'success' })
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
          <Monitor size={20} /> Impostazioni di Sistema
        </h1>
      </div>

      <div className="space-y-6 max-w-2xl">
        <Card className="border-[#3f4850]" style={{ backgroundColor: '#1c2024' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2" style={{ color: '#dfe3e8' }}>
              <Building2 size={16} /> Generale
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#dfe3e8' }}>Nome Azienda</label>
              <Input
                value={companyName}
                onChange={e => setCompanyName(e.target.value)}
                className="border-[#3f4850] text-[#dfe3e8]"
                style={{ backgroundColor: '#181c20' }}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#dfe3e8' }}>Lingua</label>
                <select
                  value={language}
                  onChange={e => setLanguage(e.target.value)}
                  className="flex h-9 w-full rounded-md border px-3 py-1 text-sm transition-colors focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  style={{ backgroundColor: '#181c20', borderColor: '#3f4850', color: '#dfe3e8' }}
                >
                  <option value="IT">Italiano</option>
                  <option value="EN">English</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#dfe3e8' }}>Timezone</label>
                <select
                  value={timezone}
                  onChange={e => setTimezone(e.target.value)}
                  className="flex h-9 w-full rounded-md border px-3 py-1 text-sm transition-colors focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  style={{ backgroundColor: '#181c20', borderColor: '#3f4850', color: '#dfe3e8' }}
                >
                  <option value="Europe/Rome">Europe/Rome</option>
                  <option value="Europe/London">Europe/London</option>
                  <option value="UTC">UTC</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#dfe3e8' }}>Valuta</label>
                <select
                  value={currency}
                  onChange={e => setCurrency(e.target.value)}
                  className="flex h-9 w-full rounded-md border px-3 py-1 text-sm transition-colors focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  style={{ backgroundColor: '#181c20', borderColor: '#3f4850', color: '#dfe3e8' }}
                >
                  <option value="EUR">EUR (€)</option>
                  <option value="USD">USD ($)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#3f4850]" style={{ backgroundColor: '#1c2024' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2" style={{ color: '#dfe3e8' }}>
              <Bell size={16} /> Notifiche
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ToggleRow label="WhatsApp" description="Notifiche via WhatsApp Business API" checked={whatsappEnabled} onChange={setWhatsappEnabled} />
            <ToggleRow label="Telegram" description="Notifiche via Telegram Bot" checked={telegramEnabled} onChange={setTelegramEnabled} />
            <ToggleRow label="Email" description="Notifiche via email SMTP" checked={emailEnabled} onChange={setEmailEnabled} />
            <ToggleRow label="Desktop" description="Notifiche desktop native" checked={desktopEnabled} onChange={setDesktopEnabled} />
          </CardContent>
        </Card>

        <Card className="border-[#3f4850]" style={{ backgroundColor: '#1c2024' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2" style={{ color: '#dfe3e8' }}>
              <DatabaseIcon size={16} /> Database
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#dfe3e8' }}>Percorso Database</label>
              <div className="flex items-center gap-2">
                <HardDrive size={16} style={{ color: '#8896a4' }} />
                <code className="flex-1 text-sm px-3 py-1.5 rounded border" style={{ backgroundColor: '#181c20', borderColor: '#3f4850', color: '#dfe3e8' }}>
                  {dbPath}
                </code>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={handleBackup} className="border-[#3f4850] text-[#dfe3e8] hover:bg-[#2a3036]" style={{ backgroundColor: '#181c20' }}>
                <Download size={14} /> Backup
              </Button>
              <Button variant="outline" onClick={handleRestore} className="border-[#3f4850] text-[#dfe3e8] hover:bg-[#2a3036]" style={{ backgroundColor: '#181c20' }}>
                <Upload size={14} /> Ripristina
              </Button>
              <Button variant="outline" onClick={handleCompact} className="border-[#3f4850] text-[#dfe3e8] hover:bg-[#2a3036]" style={{ backgroundColor: '#181c20' }}>
                <RotateCcw size={14} /> Compatta / Vacuum
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#3f4850]" style={{ backgroundColor: '#1c2024' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2" style={{ color: '#dfe3e8' }}>
              <ChevronRight size={16} /> Interfaccia
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#dfe3e8' }}>Tema</label>
              <div className="flex items-center gap-2">
                <span
                  className="px-3 py-1 text-xs rounded-full border"
                  style={{ backgroundColor: '#181c20', borderColor: '#3f4850', color: '#dfe3e8' }}
                >
                  Dark (predefinito)
                </span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#dfe3e8' }}>
                Dimensione Font: {fontSize}px
              </label>
              <input
                type="range"
                min={12}
                max={20}
                value={fontSize}
                onChange={e => setFontSize(Number(e.target.value))}
                className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                style={{ accentColor: '#0ea5e9', backgroundColor: '#3f4850' }}
              />
              <div className="flex justify-between text-xs mt-1" style={{ color: '#8896a4' }}>
                <span>12px</span>
                <span>20px</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#dfe3e8' }}>Larghezza Sidebar</label>
              <div className="flex gap-2">
                {([64, 240] as const).map(w => (
                  <button
                    key={w}
                    onClick={() => setSidebarWidth(w)}
                    className={cn(
                      'px-4 py-2 text-sm rounded-md border transition-colors',
                      sidebarWidth === w
                        ? 'border-sky-600 bg-sky-600/15 text-sky-400'
                        : 'text-[#8896a4] hover:text-[#dfe3e8]'
                    )}
                    style={{ borderColor: sidebarWidth === w ? undefined : '#3f4850' }}
                  >
                    {w === 64 ? 'Collassata (64px)' : 'Estesa (240px)'}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center gap-3">
          <Button onClick={handleSave}>
            <Save size={14} /> Salva Impostazioni
          </Button>
        </div>
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