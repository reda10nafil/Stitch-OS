import { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Search, Send, Phone, MapPin, Plus, X, MessageSquare, Download } from 'lucide-react'
import type { Client, ChatMessage, MemoryLog } from '@/types'

type Message = ChatMessage

interface ContactWithMessages {
  client: Client
  lastMessage: string
  messages: Message[]
  status: 'ai_attiva' | 'in_attesa' | 'gestione_manuale'
}

const MOCK_MEMORY: MemoryLog[] = [
  { id: 1, cliente_id: 1, chiave_preferenza: 'TAGLIA_PREFERITA', valore_preferenza: 'M', data_aggiornamento: '2026-06-10' },
  { id: 2, cliente_id: 1, chiave_preferenza: 'COLORE_PREFERITO', valore_preferenza: 'Blu Navy', data_aggiornamento: '2026-06-12' },
  { id: 3, cliente_id: 1, chiave_preferenza: 'NOTE_SPEDIZIONE', valore_preferenza: 'Citofonare Rossi se assente', data_aggiornamento: '2026-06-15' },
  { id: 4, cliente_id: 1, chiave_preferenza: 'BRAND_FOCUS', valore_preferenza: 'Nike', data_aggiornamento: '2026-06-16' },
]

const MOCK_CONTACTS: ContactWithMessages[] = [
  {
    client: { id: 1, nome: 'Mario', cognome: 'Rossi', telefono: '+39 333 1111111', canale_provenienza: 'whatsapp', indirizzo_spedizione: 'Via Roma 42, Milano', ai_enabled: 1, created_at: '2026-05-01' },
    lastMessage: 'Va bene, prendo la taglia M in blu navy...',
    status: 'ai_attiva',
    messages: [
      { id: 'm1', cliente_id: 1, testo: 'Ciao! Avete la sneaker in taglia M?', mittente: 'cliente', timestamp: '2026-06-16T10:00:00' },
      { id: 'm2', cliente_id: 1, testo: 'Certo Mario! Abbiamo la Sneaker Urban in taglia M, colore Blu Navy. Vuoi che ti mostri le foto?', mittente: 'ai', timestamp: '2026-06-16T10:00:30' },
      { id: 'm3', cliente_id: 1, testo: 'Sì perfetto!', mittente: 'cliente', timestamp: '2026-06-16T10:01:00' },
      { id: 'm4', cliente_id: 1, testo: 'Ecco le foto del prodotto. Prezzo: €89,90 con spedizione gratuita.', mittente: 'ai', timestamp: '2026-06-16T10:01:15' },
      { id: 'm5', cliente_id: 1, testo: 'Va bene, prendo la taglia M in blu navy. Procedi con l\'ordine.', mittente: 'cliente', timestamp: '2026-06-16T10:02:00' },
      { id: 'm6', cliente_id: 1, testo: 'Perfetto! Procedo subito. Ti mando il link di pagamento via WhatsApp.', mittente: 'operatore', timestamp: '2026-06-16T10:03:00' },
    ],
  },
  {
    client: { id: 2, nome: 'Anna', cognome: 'Bianchi', telefono: '+39 333 2222222', canale_provenienza: 'telegram', indirizzo_spedizione: null, ai_enabled: 1, created_at: '2026-04-15' },
    lastMessage: 'Arrivo verso le 15:30...',
    status: 'in_attesa',
    messages: [
      { id: 'm7', cliente_id: 2, testo: 'Ciao, ho un appuntamento per oggi pomeriggio?', mittente: 'cliente', timestamp: '2026-06-16T14:00:00' },
      { id: 'm8', cliente_id: 2, testo: 'Sì Anna! Il tuo appuntamento è alle 15:30 per provare la Giacca Tech Wind.', mittente: 'ai', timestamp: '2026-06-16T14:00:20' },
      { id: 'm9', cliente_id: 2, testo: 'Arrivo verso le 15:30 allora, grazie!', mittente: 'cliente', timestamp: '2026-06-16T14:01:00' },
    ],
  },
  {
    client: { id: 3, nome: 'Luca', cognome: 'Verdi', telefono: '+39 333 3333333', canale_provenienza: 'whatsapp', indirizzo_spedizione: 'Corso Italia 15, Torino', ai_enabled: 0, created_at: '2026-06-01' },
    lastMessage: 'Non mi è chiaro il prezzo...',
    status: 'gestione_manuale',
    messages: [
      { id: 'm10', cliente_id: 3, testo: 'Mi potete inviare il catalogo completo?', mittente: 'cliente', timestamp: '2026-06-16T09:00:00' },
      { id: 'm11', cliente_id: 3, testo: 'Ci sono molte promozioni attive. Preferisco parlare con un operatore umano.', mittente: 'cliente', timestamp: '2026-06-16T09:02:00' },
      { id: 'm12', cliente_id: 3, testo: 'Buongiorno Luca, sono un operatore. Come posso aiutarti?', mittente: 'operatore', timestamp: '2026-06-16T09:03:00' },
      { id: 'm13', cliente_id: 3, testo: 'Non mi è chiaro il prezzo della borsa, è scontata?', mittente: 'cliente', timestamp: '2026-06-16T09:03:30' },
    ],
  },
  {
    client: { id: 4, nome: 'Giulia', cognome: 'Neri', telefono: '+39 333 4444444', canale_provenienza: 'telegram', indirizzo_spedizione: null, ai_enabled: 1, created_at: '2026-06-10' },
    lastMessage: 'Grazie, a domani!',
    status: 'ai_attiva',
    messages: [
      { id: 'm14', cliente_id: 4, testo: 'Vorrei fissare un appuntamento per domani', mittente: 'cliente', timestamp: '2026-06-16T16:00:00' },
      { id: 'm15', cliente_id: 4, testo: 'Certamente Giulia! Ho uno slot libero domani alle 11:00. Ti va bene?', mittente: 'ai', timestamp: '2026-06-16T16:00:20' },
      { id: 'm16', cliente_id: 4, testo: 'Perfetto, grazie! A domani!', mittente: 'cliente', timestamp: '2026-06-16T16:01:00' },
    ],
  },
]

function highlightText(text: string, query: string) {
  if (!query.trim()) return text
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`(${escaped})`, 'gi')
  const parts = text.split(regex)
  return parts.map((part, i) =>
    regex.test(part)
      ? <mark key={i} className="bg-sky-500/30 text-sky-300 rounded px-0.5">{part}</mark>
      : part
  )
}

export function CrmModule() {
  const [contacts] = useState(MOCK_CONTACTS)
  const [activeId, setActiveId] = useState(1)
  const [newMessage, setNewMessage] = useState('')
  const [memory, setMemory] = useState(MOCK_MEMORY)
  const [searchTerm, setSearchTerm] = useState('')
  const [editingField, setEditingField] = useState<string | null>(null)
  const [editVal, setEditVal] = useState('')
  const [localMessages, setLocalMessages] = useState(contacts)
  const [showFactForm, setShowFactForm] = useState(false)
  const [newFactKey, setNewFactKey] = useState('')
  const [newFactValue, setNewFactValue] = useState('')
  const [savedIndicator, setSavedIndicator] = useState<string | null>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const factKeyRef = useRef<HTMLInputElement>(null)

  const active = localMessages.find(c => c.client.id === activeId)
  const activeMemory = memory.filter(m => m.cliente_id === activeId)

  const filteredContacts = localMessages.filter(c =>
    `${c.client.nome} ${c.client.cognome}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.client.telefono.includes(searchTerm)
  )

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [activeId])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [localMessages])

  useEffect(() => {
    if (showFactForm && factKeyRef.current) {
      factKeyRef.current.focus()
    }
  }, [showFactForm])

  useEffect(() => {
    if (savedIndicator) {
      const timer = setTimeout(() => setSavedIndicator(null), 1500)
      return () => clearTimeout(timer)
    }
  }, [savedIndicator])

  const sendMessage = () => {
    if (!newMessage.trim() || !active) return
    const msg: ChatMessage = {
      id: `m${Date.now()}`,
      cliente_id: activeId,
      testo: newMessage.trim(),
      mittente: 'operatore',
      timestamp: new Date().toISOString(),
    }
    setLocalMessages(prev => prev.map(c =>
      c.client.id === activeId
        ? { ...c, messages: [...c.messages, msg], lastMessage: msg.testo.substring(0, 50) + '...' }
        : c
    ))
    setNewMessage('')
  }

  const removeMemory = (id: number) => {
    setMemory(prev => prev.filter(m => m.id !== id))
  }

  const addMemoryFact = () => {
    if (!newFactKey.trim() || !newFactValue.trim() || !active) return
    const newLog: MemoryLog = {
      id: Date.now(),
      cliente_id: activeId,
      chiave_preferenza: newFactKey.trim(),
      valore_preferenza: newFactValue.trim(),
      data_aggiornamento: new Date().toISOString().slice(0, 10),
    }
    setMemory(prev => [...prev, newLog])
    setNewFactKey('')
    setNewFactValue('')
    setShowFactForm(false)
  }

  const startEditField = (field: string) => {
    if (!active) return
    setEditingField(field)
    const valueMap: Record<string, string> = {
      nome: `${active.client.nome} ${active.client.cognome}`,
      telefono: active.client.telefono,
      indirizzo: active.client.indirizzo_spedizione || '',
    }
    setEditVal(valueMap[field] || '')
  }

  const saveField = () => {
    if (!active || !editingField) return
    setLocalMessages(prev => prev.map(c => {
      if (c.client.id !== activeId) return c
      const updated = { ...c }
      if (editingField === 'nome') {
        const parts = editVal.split(' ')
        updated.client = { ...updated.client, nome: parts[0] || updated.client.nome, cognome: parts.slice(1).join(' ') || updated.client.cognome }
      } else if (editingField === 'telefono') {
        updated.client = { ...updated.client, telefono: editVal }
      } else if (editingField === 'indirizzo') {
        updated.client = { ...updated.client, indirizzo_spedizione: editVal || null }
      }
      return updated
    }))
    setEditingField(null)
    setSavedIndicator(editingField)
  }

  const exportChat = () => {
    if (!active) return
    const lines: string[] = []
    lines.push(`Chat con ${active.client.nome} ${active.client.cognome}`)
    lines.push(`Telefono: ${active.client.telefono}`)
    lines.push(`Esportato il: ${new Date().toLocaleString('it-IT')}`)
    lines.push('')
    lines.push('--- Messaggi ---')
    lines.push('')
    active.messages.forEach(msg => {
      const mittente = msg.mittente === 'cliente' ? active.client.nome : msg.mittente === 'ai' ? 'AI Bot' : 'Operatore'
      const time = new Date(msg.timestamp).toLocaleString('it-IT')
      lines.push(`[${time}] ${mittente}: ${msg.testo}`)
    })
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `chat-${active.client.nome}-${active.client.cognome}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleFieldKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') saveField()
    if (e.key === 'Escape') setEditingField(null)
  }

  const handleFactKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newFactKey.trim()) {
      e.preventDefault()
      document.getElementById('fact-value-input')?.focus()
    }
    if (e.key === 'Escape') {
      setShowFactForm(false)
      setNewFactKey('')
      setNewFactValue('')
    }
  }

  const handleFactValueKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') addMemoryFact()
    if (e.key === 'Escape') {
      setShowFactForm(false)
      setNewFactKey('')
      setNewFactValue('')
    }
  }

  const formatTime = (ts: string) =>
    new Date(ts).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })

  const statusBadge = (status: string) => {
    switch (status) {
      case 'ai_attiva': return { label: 'AI Attiva', cls: 'bg-emerald-900/50 text-emerald-300 border border-emerald-700/50' }
      case 'in_attesa': return { label: 'In attesa', cls: 'bg-orange-900/50 text-orange-300 border border-orange-700/50' }
      case 'gestione_manuale': return { label: 'Gestione Manuale', cls: 'bg-red-900/50 text-red-300 border border-red-700/50 animate-pulse' }
      default: return { label: status, cls: 'bg-slate-800 text-slate-400' }
    }
  }

  const renderEditableField = (field: string, label: string, icon?: React.ReactNode) => {
    const isEditing = editingField === field
    return (
      <div>
        <label className="text-xs text-slate-400 flex items-center gap-1">
          {icon}{label}
        </label>
        {isEditing ? (
          <div className="relative">
            <input
              type="text"
              value={editVal}
              onChange={e => setEditVal(e.target.value)}
              onKeyDown={handleFieldKeyDown}
              onBlur={saveField}
              className="w-full px-2 py-1 text-sm bg-slate-700 border border-sky-500 rounded mt-0.5 text-slate-100 focus:ring-2 focus:ring-sky-500 focus:outline-none"
              autoFocus
            />
          </div>
        ) : (
          <div
            onClick={() => startEditField(field)}
            className="w-full px-2 py-1 text-sm bg-slate-800 border border-slate-700 rounded mt-0.5 text-slate-200 cursor-text hover:border-slate-600 transition-colors"
          >
            {savedIndicator === field && (
              <span className="absolute right-2 top-1 text-xs text-emerald-400">Salvato</span>
            )}
            {field === 'nome'
              ? active ? `${active.client.nome} ${active.client.cognome}` : ''
              : field === 'telefono'
              ? active?.client.telefono
              : active?.client.indirizzo_spedizione || <span className="text-slate-500">—</span>
            }
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="h-full flex">
      <div className="w-[250px] flex-shrink-0 border-r border-slate-700 flex flex-col bg-surface">
        <div className="p-3 border-b border-slate-700">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Cerca contatto..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-sm rounded-md bg-slate-800 border border-slate-700 w-full text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>
        </div>
        <div className="flex-1 overflow-auto">
          {filteredContacts.map(c => {
            const isActive = c.client.id === activeId
            const status = statusBadge(c.status)
            return (
              <div
                key={c.client.id}
                onClick={() => setActiveId(c.client.id)}
                className={cn(
                  'px-3 py-2.5 border-b border-slate-700 cursor-pointer transition-colors',
                  isActive && 'bg-sky-500/10 border-l-[3px] border-l-sky-500',
                  c.status === 'gestione_manuale' && 'bg-red-500/5'
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-slate-200">
                    {highlightText(`${c.client.nome} ${c.client.cognome}`, searchTerm)}
                  </span>
                  <span className={cn('text-xs px-1.5 py-0.5 rounded-full', status.cls)}>
                    {status.label}
                  </span>
                </div>
                <p className="text-xs text-slate-500 truncate">{c.lastMessage}</p>
                <div className="flex items-center gap-1 mt-1">
                  <span className={cn(
                    'text-xs px-1 py-0 rounded',
                    c.client.canale_provenienza === 'whatsapp'
                      ? 'bg-emerald-900/50 text-emerald-400 border border-emerald-700/50'
                      : 'bg-blue-900/50 text-blue-400 border border-blue-700/50'
                  )}>
                    {c.client.canale_provenienza === 'whatsapp' ? 'WhatsApp' : 'Telegram'}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-slate-900">
        {active ? (
          <>
            <div className="px-4 py-3 border-b border-slate-700 bg-surface flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-100">
                  {active.client.nome} {active.client.cognome}
                </h2>
                <p className="text-xs text-slate-400">{active.client.telefono}</p>
              </div>
              <button
                onClick={exportChat}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md border border-slate-600 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
              >
                <Download size={13} /> Esporta Chat
              </button>
            </div>

            <div className="flex-1 overflow-auto px-4 py-3 space-y-3">
              {active.messages.map(msg => {
                const isClient = msg.mittente === 'cliente'
                return (
                  <div key={msg.id} className={cn('flex', isClient ? 'justify-start' : 'justify-end')}>
                    <div className={cn(
                      'max-w-[70%] rounded-lg px-3 py-2 text-sm',
                      isClient
                        ? 'bg-slate-800 text-slate-300'
                        : msg.mittente === 'ai'
                        ? 'bg-slate-800 text-slate-200 border border-emerald-600/50'
                        : 'bg-slate-800 text-slate-200 border border-sky-600/50'
                    )}>
                      <div className="flex items-center gap-2 mb-1">
                        {!isClient && (
                          <span className={cn(
                            'text-xs font-medium px-1.5 py-0 rounded',
                            msg.mittente === 'ai'
                              ? 'bg-emerald-900/50 text-emerald-400 border border-emerald-700/50'
                              : 'bg-sky-900/50 text-sky-400 border border-sky-700/50'
                          )}>
                            {msg.mittente === 'ai' ? 'AI Bot' : 'Operatore'}
                          </span>
                        )}
                      </div>
                      <p>{msg.testo}</p>
                      <p className="text-xs text-slate-500 text-right mt-1">{formatTime(msg.timestamp)}</p>
                    </div>
                  </div>
                )
              })}
              <div ref={chatEndRef} />
            </div>

            <div className="p-3 border-t border-slate-700 bg-surface flex items-center gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                placeholder="Scrivi un messaggio..."
                className="flex-1 px-3 py-2 text-sm bg-slate-800 border border-slate-700 rounded-md text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
              <button
                onClick={sendMessage}
                className="px-3 py-2 bg-sky-600 text-white rounded-md hover:bg-sky-700 transition-colors flex items-center gap-1"
              >
                <Send size={14} /> Invia
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-600">
            <div className="text-center">
              <MessageSquare size={48} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">Seleziona un contatto per visualizzare la chat</p>
            </div>
          </div>
        )}
      </div>

      <div className="w-[280px] flex-shrink-0 border-l border-slate-700 bg-surface flex flex-col overflow-auto">
        {active ? (
          <div className="p-4">
            <h3 className="text-sm font-semibold text-slate-200 mb-3">Ispettore</h3>

            <div className="space-y-3 mb-6">
              {renderEditableField('nome', 'Nome')}
              {renderEditableField('telefono', 'Telefono')}
              {renderEditableField('indirizzo', 'Indirizzo', <MapPin size={12} />)}
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-200 mb-3">
                Fact Logs
              </h3>
              <div className="space-y-2">
                {activeMemory.map(m => (
                  <div key={m.id} className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-md px-2 py-1.5 text-xs">
                    <span className="font-semibold text-slate-300">{m.chiave_preferenza}:</span>
                    <span className="text-slate-400 flex-1">{m.valore_preferenza}</span>
                    <button
                      onClick={() => removeMemory(m.id)}
                      className="text-slate-500 hover:text-red-400 p-0.5 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
                {activeMemory.length === 0 && !showFactForm && (
                  <p className="text-xs text-slate-500">Nessun fatto memorizzato</p>
                )}

                {showFactForm ? (
                  <div className="space-y-2 bg-slate-800 border border-slate-700 rounded-md p-2">
                    <input
                      ref={factKeyRef}
                      type="text"
                      placeholder="Chiave (es. TAGLIA_PREFERITA)"
                      value={newFactKey}
                      onChange={e => setNewFactKey(e.target.value)}
                      onKeyDown={handleFactKeyDown}
                      className="w-full px-2 py-1 text-xs bg-slate-700 border border-slate-600 rounded text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    />
                    <input
                      id="fact-value-input"
                      type="text"
                      placeholder="Valore (es. XL)"
                      value={newFactValue}
                      onChange={e => setNewFactValue(e.target.value)}
                      onKeyDown={handleFactValueKeyDown}
                      className="w-full px-2 py-1 text-xs bg-slate-700 border border-slate-600 rounded text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    />
                    <div className="flex gap-1.5">
                      <button
                        onClick={addMemoryFact}
                        disabled={!newFactKey.trim() || !newFactValue.trim()}
                        className="flex-1 py-1 text-xs bg-sky-600 text-white rounded hover:bg-sky-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        Salva
                      </button>
                      <button
                        onClick={() => { setShowFactForm(false); setNewFactKey(''); setNewFactValue('') }}
                        className="flex-1 py-1 text-xs border border-slate-600 text-slate-400 rounded hover:bg-slate-700 transition-colors"
                      >
                        Annulla
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowFactForm(true)}
                    className="w-full py-1.5 text-xs text-sky-400 border border-dashed border-slate-600 rounded-md hover:bg-sky-500/10 flex items-center justify-center gap-1 transition-colors"
                  >
                    <Plus size={12} /> Aggiungi fatto
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-500 text-xs">
            Nessun contatto selezionato
          </div>
        )}
      </div>
    </div>
  )
}