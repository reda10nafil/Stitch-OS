import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { QrCode, CheckCircle, Loader2, AlertCircle, Smartphone } from 'lucide-react'

function QrModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [phase, setPhase] = useState<'init' | 'qr' | 'success'>('init')
  const [countdown, setCountdown] = useState(60)

  useEffect(() => {
    if (!open) { setPhase('init'); setCountdown(60); return }
    const t1 = setTimeout(() => setPhase('qr'), 3000)
    return () => clearTimeout(t1)
  }, [open])

  useEffect(() => {
    if (phase !== 'qr') return
    if (countdown <= 0) { setCountdown(60); return }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [phase, countdown])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-[420px] p-8 flex flex-col items-center" onClick={e => e.stopPropagation()}>
        {phase === 'init' && (
          <>
            <Loader2 size={40} className="animate-spin text-sky-600 mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Inizializzazione</h3>
            <p className="text-sm text-slate-500 text-center">
              Avvio del server di connessione locale in corso... Attendi.
            </p>
          </>
        )}

        {phase === 'qr' && (
          <>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Scannerizza il QR Code</h3>
            <div className="w-[250px] h-[250px] bg-slate-100 border-2 border-slate-200 rounded-lg flex items-center justify-center mb-4 relative">
              <QrCode size={160} className="text-slate-800" />
              <div className="absolute bottom-2 right-2">
                <svg width="40" height="40" viewBox="0 0 40 40">
                  <circle cx="20" cy="20" r="16" fill="none" stroke="#0284c7" strokeWidth="3" />
                  <circle cx="20" cy="20" r="16" fill="none" stroke="#e2e8f0" strokeWidth="3"
                    strokeDasharray={`${2 * Math.PI * 16}`}
                    strokeDashoffset={`${2 * Math.PI * 16 * (1 - countdown / 60)}`}
                    transform="rotate(-90 20 20)" />
                  <text x="20" y="24" textAnchor="middle" fontSize="11" fontWeight="600" fill="#0284c7">
                    {countdown}s
                  </text>
                </svg>
              </div>
            </div>
            <div className="text-sm text-slate-600 space-y-1">
              <div className="flex items-start gap-2">
                <span className="font-bold text-sky-600">1.</span>
                <span>Apri WhatsApp sul telefono</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold text-sky-600">2.</span>
                <span>Vai in Dispositivi Connessi</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold text-sky-600">3.</span>
                <span>Inquadra lo schermo</span>
              </div>
            </div>
            <button className="mt-4 text-xs text-sky-600 hover:underline" onClick={() => setPhase('success')}>
              Simula connessione riuscita →
            </button>
          </>
        )}

        {phase === 'success' && (
          <>
            <CheckCircle size={56} className="text-emerald-550 mb-4 animate-success-pop" />
            <h3 className="text-lg font-semibold text-slate-900 mb-1">Connesso!</h3>
            <p className="text-sm text-slate-500">WhatsApp sincronizzato con successo.</p>
          </>
        )}
      </div>
    </div>
  )
}

function ConnectorCard({ title, icon: Icon, children }: { title: string; icon: typeof QrCode; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-md bg-slate-100 flex items-center justify-center">
          <Icon size={18} className="text-slate-600" />
        </div>
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      </div>
      {children}
    </div>
  )
}

export function ConnectorsModule() {
  const [whatsappConnected, setWhatsappConnected] = useState(false)
  const [telegramToken, setTelegramToken] = useState('')
  const [telegramVerified, setTelegramVerified] = useState(false)
  const [showQrModal, setShowQrModal] = useState(false)

  const verifyTelegram = () => {
    if (telegramToken.length > 10) {
      setTelegramVerified(true)
    } else {
      setTelegramVerified(false)
    }
  }

  const handleQrSuccess = () => {
    setWhatsappConnected(true)
    setShowQrModal(false)
  }

  return (
    <div className="h-full overflow-auto">
      <h1 className="text-xl font-bold text-slate-900 mb-4">Hub Connettori</h1>

      <div className="grid grid-cols-2 gap-4">
        <ConnectorCard title="Telegram Bot" icon={QrCode}>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">API Token BotFather</label>
              <input
                type="password"
                value={telegramToken}
                onChange={e => { setTelegramToken(e.target.value); setTelegramVerified(false) }}
                placeholder="123456:ABC-DEF1234ghIkl..."
                className="w-full px-3 py-1.5 text-sm font-mono border border-slate-200 rounded-md focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>
            <button
              onClick={verifyTelegram}
              className="px-4 py-1.5 text-sm font-medium text-white bg-sky-600 rounded-md hover:bg-sky-700"
            >
              Verifica e Attiva Connettore
            </button>
            {telegramVerified && (
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-550" />
                <span className="text-emerald-700 font-medium">In esecuzione — Polling attivo</span>
              </div>
            )}
            {telegramToken.length > 0 && !telegramVerified && (
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                <span className="text-red-700">Errore di connessione — Verifica il token</span>
              </div>
            )}
          </div>
        </ConnectorCard>

        <ConnectorCard title="WhatsApp (OpenWA)" icon={Smartphone}>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Stato</span>
              <span className={cn(
                'text-sm font-medium flex items-center gap-1.5',
                whatsappConnected ? 'text-emerald-700' : 'text-slate-400'
              )}>
                <div className={cn('w-2.5 h-2.5 rounded-full', whatsappConnected ? 'bg-emerald-550' : 'bg-slate-300')} />
                {whatsappConnected ? 'Connesso — Operativo' : 'Disconnesso'}
              </span>
            </div>
            <button
              onClick={() => setShowQrModal(true)}
              className={cn(
                'w-full py-2 text-sm font-medium rounded-md transition-colors flex items-center justify-center gap-2',
                whatsappConnected
                  ? 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                  : 'bg-sky-600 text-white hover:bg-sky-700'
              )}
            >
              {whatsappConnected ? 'Disconnetti WhatsApp' : 'Connetti WhatsApp'}
            </button>
          </div>
        </ConnectorCard>

        <ConnectorCard title="AI Generativa" icon={Smartphone}>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Higgsfield API Key</label>
              <input
                type="password"
                placeholder="••••••••••••••"
                className="w-full px-3 py-1.5 text-sm font-mono border border-slate-200 rounded-md focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Nanobanana API Key</label>
              <input
                type="password"
                placeholder="••••••••••••••"
                className="w-full px-3 py-1.5 text-sm font-mono border border-slate-200 rounded-md focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>
            <button className="px-4 py-1.5 text-sm font-medium text-white bg-sky-600 rounded-md hover:bg-sky-700">
              Salva Chiavi
            </button>
          </div>
        </ConnectorCard>

        <ConnectorCard title="Altri Connettori" icon={QrCode}>
          <div className="border border-dashed border-slate-200 rounded-md p-8 flex flex-col items-center justify-center text-slate-400">
            <QrCode size={32} className="mb-2 opacity-40" />
            <p className="text-sm">Placeholder per futuri plugin</p>
            <p className="text-xs mt-1">Estendibile tramite architettura a plugin</p>
          </div>
        </ConnectorCard>
      </div>

      <QrModal open={showQrModal} onClose={() => { setShowQrModal(false); setWhatsappConnected(true) }} />
    </div>
  )
}