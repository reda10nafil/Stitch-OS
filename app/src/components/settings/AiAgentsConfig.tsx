import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import {
  Bot,
  Wifi,
  WifiOff,
  Zap,
  Brain,
  MemoryStick as MemoryIcon,
  Shield,
  Play,
  Settings2,
  Thermometer,
  Cpu,
} from 'lucide-react'

type ToastMessage = { text: string; type: 'success' | 'error' } | null

export function AiAgentsConfig() {
  const [endpoint, setEndpoint] = useState('http://localhost:11434')
  const [model, setModel] = useState('llama3:8b-instruct')
  const [timeout, setTimeout_] = useState(30)
  const [maxTokens, setMaxTokens] = useState(2048)
  const [temperature, setTemperature] = useState(0.7)
  const [systemPrompt, setSystemPrompt] = useState(
    'Sei un assistente commerciale esperto. Rispondi in italiano, sii professionale e cortese.'
  )
  const [personality, setPersonality] = useState('Formale')
  const [maxMemoryEntries, setMaxMemoryEntries] = useState(100)
  const [autoLearn, setAutoLearn] = useState(true)
  const [retentionDays, setRetentionDays] = useState(90)
  const [consecutiveTimeouts, setConsecutiveTimeouts] = useState(3)
  const [fallbackMessage, setFallbackMessage] = useState(
    'Mi dispiace, al momento non riesco a processare la richiesta. Un operatore ti risponderà al più presto.'
  )
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected'>('disconnected')
  const [testing, setTesting] = useState(false)
  const [toast, setToast] = useState<ToastMessage>(null)

  const handleTestConnection = () => {
    setTesting(true)
    setTimeout(() => {
      setConnectionStatus('connected')
      setTesting(false)
      setToast({ text: 'Connessione a Ollama riuscita', type: 'success' })
      setTimeout(() => setToast(null), 3000)
    }, 1500)
  }

  const handleSave = () => {
    setToast({ text: 'Configurazione agenti AI salvata', type: 'success' })
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

  const RangeSlider = ({ label, min, max, step, value, onChange, unit = '' }: {
    label: string
    min: number
    max: number
    step: number
    value: number
    onChange: (v: number) => void
    unit?: string
  }) => (
    <div>
      <label className="block text-sm font-medium mb-1" style={{ color: '#dfe3e8' }}>
        {label}: {value}{unit}
      </label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-2 rounded-lg appearance-none cursor-pointer"
        style={{ accentColor: '#0ea5e9', backgroundColor: '#3f4850' }}
      />
      <div className="flex justify-between text-xs mt-1" style={{ color: '#8896a4' }}>
        <span>{min}{unit}</span>
        <span>{max}{unit}</span>
      </div>
    </div>
  )

  return (
    <div className="h-full overflow-auto" style={{ color: '#dfe3e8' }}>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold flex items-center gap-2" style={{ color: '#dfe3e8' }}>
          <Bot size={20} /> Configurazione Agenti AI
        </h1>
        <div className="flex items-center gap-2">
          <Badge
            variant={connectionStatus === 'connected' ? 'success' : 'destructive'}
            className="flex items-center gap-1"
          >
            {connectionStatus === 'connected' ? <Wifi size={12} /> : <WifiOff size={12} />}
            {connectionStatus === 'connected' ? 'Connesso' : 'Disconnesso'}
          </Badge>
        </div>
      </div>

      <div className="space-y-6 max-w-2xl">
        <Card className="border-[#3f4850]" style={{ backgroundColor: '#1c2024' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2" style={{ color: '#dfe3e8' }}>
              <Cpu size={16} /> Connessione Ollama
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#dfe3e8' }}>Endpoint</label>
              <Input
                value={endpoint}
                onChange={e => setEndpoint(e.target.value)}
                className="border-[#3f4850] text-[#dfe3e8]"
                style={{ backgroundColor: '#181c20' }}
                placeholder="http://localhost:11434"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#dfe3e8' }}>Modello</label>
              <select
                value={model}
                onChange={e => setModel(e.target.value)}
                className="flex h-9 w-full rounded-md border px-3 py-1 text-sm transition-colors focus:ring-2 focus:ring-sky-500 focus:outline-none"
                style={{ backgroundColor: '#181c20', borderColor: '#3f4850', color: '#dfe3e8' }}
              >
                <option value="llama3:8b-instruct">llama3:8b-instruct</option>
                <option value="phi3:medium">phi3:medium</option>
                <option value="mistral">mistral</option>
              </select>
            </div>
            <RangeSlider label="Timeout" min={10} max={60} step={5} value={timeout} onChange={setTimeout_} unit="s" />
            <RangeSlider label="Max Tokens" min={512} max={4096} step={128} value={maxTokens} onChange={setMaxTokens} />
            <Button
              variant="outline"
              onClick={handleTestConnection}
              disabled={testing}
              className="border-[#3f4850] text-[#dfe3e8] hover:bg-[#2a3036]"
              style={{ backgroundColor: '#181c20' }}
            >
              <Play size={14} /> {testing ? 'Test in corso...' : 'Test Connessione'}
            </Button>
          </CardContent>
        </Card>

        <Card className="border-[#3f4850]" style={{ backgroundColor: '#1c2024' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2" style={{ color: '#dfe3e8' }}>
              <Settings2 size={16} /> Comportamento Agente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <RangeSlider
              label="Temperature"
              min={0}
              max={2}
              step={0.1}
              value={temperature}
              onChange={setTemperature}
            />
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#dfe3e8' }}>System Prompt</label>
              <textarea
                value={systemPrompt}
                onChange={e => setSystemPrompt(e.target.value)}
                rows={4}
                className="flex w-full rounded-md border px-3 py-2 text-sm transition-colors focus:ring-2 focus:ring-sky-500 focus:outline-none resize-vertical"
                style={{ backgroundColor: '#181c20', borderColor: '#3f4850', color: '#dfe3e8' }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#dfe3e8' }}>
                Personalità Agente Vendite
              </label>
              <div className="flex gap-2">
                {['Formale', 'Amichevole', 'Tecnico'].map(p => (
                  <button
                    key={p}
                    onClick={() => setPersonality(p)}
                    className={cn(
                      'px-3 py-1.5 text-sm rounded-md border transition-colors',
                      personality === p
                        ? 'border-sky-600 bg-sky-600/15 text-sky-400'
                        : 'text-[#8896a4] hover:text-[#dfe3e8]'
                    )}
                    style={{ borderColor: personality === p ? undefined : '#3f4850' }}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#3f4850]" style={{ backgroundColor: '#1c2024' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2" style={{ color: '#dfe3e8' }}>
              <Brain size={16} /> Memoria
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#dfe3e8' }}>
                Max Voci Memoria per Cliente
              </label>
              <Input
                type="number"
                value={maxMemoryEntries}
                onChange={e => setMaxMemoryEntries(Number(e.target.value))}
                className="border-[#3f4850] text-[#dfe3e8]"
                style={{ backgroundColor: '#181c20', maxWidth: 160 }}
              />
            </div>
            <ToggleRow
              label="Auto-Apprendimento"
              description="L'agente apprende automaticamente dalle interazioni"
              checked={autoLearn}
              onChange={setAutoLearn}
            />
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#dfe3e8' }}>
                Retention Giorni Memoria
              </label>
              <Input
                type="number"
                value={retentionDays}
                onChange={e => setRetentionDays(Number(e.target.value))}
                className="border-[#3f4850] text-[#dfe3e8]"
                style={{ backgroundColor: '#181c20', maxWidth: 160 }}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#3f4850]" style={{ backgroundColor: '#1c2024' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2" style={{ color: '#dfe3e8' }}>
              <Shield size={16} /> Fallback
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#dfe3e8' }}>
                Timeout Consecutivi per Fallback
              </label>
              <Input
                type="number"
                value={consecutiveTimeouts}
                onChange={e => setConsecutiveTimeouts(Number(e.target.value))}
                className="border-[#3f4850] text-[#dfe3e8]"
                style={{ backgroundColor: '#181c20', maxWidth: 160 }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#dfe3e8' }}>Messaggio di Fallback</label>
              <textarea
                value={fallbackMessage}
                onChange={e => setFallbackMessage(e.target.value)}
                rows={3}
                className="flex w-full rounded-md border px-3 py-2 text-sm transition-colors focus:ring-2 focus:ring-sky-500 focus:outline-none resize-vertical"
                style={{ backgroundColor: '#181c20', borderColor: '#3f4850', color: '#dfe3e8' }}
              />
            </div>
          </CardContent>
        </Card>

        <Button onClick={handleSave}>
          <Zap size={14} /> Salva Configurazione
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