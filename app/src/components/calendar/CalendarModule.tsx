import { useState, useCallback, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { Clock, Filter, X, ChevronLeft, ChevronRight, MapPin, Plus, Search } from 'lucide-react'
import type { Appointment } from '@/types'

const HOURS = Array.from({ length: 12 }, (_, i) => `${String(i + 8).padStart(2, '0')}:00`)
const DAYS = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom']

const MOCK_CLIENTS = ['Mario Rossi', 'Anna Bianchi', 'Luca Verdi', 'Giulia Neri', 'Paolo Gialli', 'Sara Marrone', 'Marco Blu']

const TIME_SLOTS = (() => {
  const slots: string[] = []
  for (let h = 8; h <= 18; h++) {
    for (let m = 0; m < 60; m += 30) {
      if (h === 18 && m > 30) break
      slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
    }
  }
  return slots
})()

const DURATA_OPTIONS = [
  { label: '30 min', minutes: 30 },
  { label: '1 ora', minutes: 60 },
  { label: '1 ora 30', minutes: 90 },
  { label: '2 ore', minutes: 120 },
]

const MOCK_APPOINTMENTS: Appointment[] = [
  { id: 1, cliente_id: 1, data_inizio: '2026-06-16 09:00:00', data_fine: '2026-06-16 10:00:00', stato: 'confermato', note_ai: 'Mario Rossi - Taglia M' },
  { id: 2, cliente_id: 2, data_inizio: '2026-06-16 14:00:00', data_fine: '2026-06-16 14:30:00', stato: 'in_attesa', note_ai: 'Anna Bianchi' },
  { id: 3, cliente_id: 3, data_inizio: '2026-06-17 10:30:00', data_fine: '2026-06-17 11:30:00', stato: 'confermato', note_ai: 'Luca Verdi - Sneaker' },
  { id: 4, cliente_id: 4, data_inizio: '2026-06-18 15:30:00', data_fine: '2026-06-18 16:00:00', stato: 'disdetto', note_ai: null },
  { id: 5, cliente_id: 5, data_inizio: '2026-06-19 11:00:00', data_fine: '2026-06-19 12:00:00', stato: 'in_attesa', note_ai: 'Giulia Neri' },
]

function getMonday(d: Date): Date {
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  const monday = new Date(d)
  monday.setDate(d.getDate() + diff)
  monday.setHours(0, 0, 0, 0)
  return monday
}

function getStatusColor(stato: Appointment['stato']) {
  switch (stato) {
    case 'confermato': return 'bg-emerald-900/40 text-emerald-300 border-emerald-700'
    case 'in_attesa': return 'bg-orange-900/40 text-orange-300 border-orange-700'
    case 'disdetto': return 'bg-red-900/40 text-red-400 border-red-700 opacity-60'
  }
}

function getStatusLabel(stato: Appointment['stato']) {
  switch (stato) {
    case 'confermato': return 'Confermato'
    case 'in_attesa': return 'In attesa'
    case 'disdetto': return 'Disdetto'
  }
}

export function CalendarModule() {
  const TODAY = useRef(new Date())
  const [weekOffset, setWeekOffset] = useState(0)
  const [buffer, setBuffer] = useState(15)
  const [workingDays, setWorkingDays] = useState([0, 1, 2, 3, 4])
  const [showConfirmed, setShowConfirmed] = useState(true)
  const [showPending, setShowPending] = useState(true)
  const [appointments, setAppointments] = useState<Appointment[]>(MOCK_APPOINTMENTS)
  const [dragAppt, setDragAppt] = useState<Appointment | null>(null)
  const [shakeId, setShakeId] = useState<number | null>(null)
  const [hoverId, setHoverId] = useState<number | null>(null)

  const [modalOpen, setModalOpen] = useState(false)
  const [formCliente, setFormCliente] = useState('')
  const [formData, setFormData] = useState('')
  const [formOra, setFormOra] = useState('09:00')
  const [formDurata, setFormDurata] = useState(60)
  const [formNote, setFormNote] = useState('')
  const [formStato, setFormStato] = useState<'in_attesa' | 'confermato'>('confermato')
  const [clienteSuggestions, setClienteSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)

  const [clientFilter, setClientFilter] = useState('')
  const [showClientFilter, setShowClientFilter] = useState(false)
  const [clientFilterSuggestions, setClientFilterSuggestions] = useState<string[]>([])

  const [toasts, setToasts] = useState<{ id: number; message: string }[]>([])
  const [tooltipCell, setTooltipCell] = useState<string | null>(null)

  const WEEK_START = getMonday(new Date(TODAY.current.getTime() + weekOffset * 7 * 24 * 60 * 60 * 1000))

  const addToast = (message: string) => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 2800)
  }

  const timeToMinutes = (time: string) => {
    const d = new Date(time)
    return d.getHours() * 60 + d.getMinutes()
  }

  const getDayDate = (dayIndex: number): string => {
    const d = new Date(WEEK_START)
    d.setDate(WEEK_START.getDate() + dayIndex)
    return d.toISOString().split('T')[0]
  }

  const getAppointmentsForDay = (dayIndex: number) => {
    return appointments.filter(a => {
      const d = new Date(a.data_inizio)
      const dayOfWeek = d.getDay()
      const adjustedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1
      if (adjustedDay !== dayIndex) return false
      if (a.stato === 'confermato' && !showConfirmed) return false
      if (a.stato === 'in_attesa' && !showPending) return false
      if (clientFilter) {
        const clientName = getClientName(a.note_ai)
        if (!clientName.toLowerCase().includes(clientFilter.toLowerCase())) return false
      }
      return true
    })
  }

  const getClientName = (note: string | null): string => {
    if (!note) return ''
    const match = MOCK_CLIENTS.find(c => note.includes(c))
    return match || note.split(' - ')[0] || ''
  }

  const getTopAndHeight = (start: string, end: string) => {
    const startMin = timeToMinutes(start) - 480
    const endMin = timeToMinutes(end) - 480
    const top = (startMin / 30) * 40
    const height = ((endMin - startMin) / 30) * 40
    return { top, height: Math.max(height, 32) }
  }

  const toggleWorkingDay = (day: number) => {
    setWorkingDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day])
  }

  const deleteAppointment = (id: number) => {
    setAppointments(prev => prev.filter(a => a.id !== id))
    addToast('Appuntamento eliminato')
  }

  const handleDragStart = (appt: Appointment) => {
    setDragAppt(appt)
  }

  const handleDrop = (dayIndex: number, hourSlot: string) => {
    if (!dragAppt) return
    const targetDate = getDayDate(dayIndex)
    const targetStart = `${targetDate} ${hourSlot}:00`
    const d = new Date(targetStart)
    d.setMinutes(d.getMinutes() + 30)
    const targetEnd = d.toISOString().replace('T', ' ').substring(0, 19)

    const hasCollision = appointments.some(a =>
      a.id !== dragAppt.id &&
      a.data_inizio < targetEnd &&
      a.data_fine > targetStart &&
      (a.stato === 'confermato' || a.stato === 'in_attesa')
    )

    if (hasCollision) {
      setShakeId(dragAppt.id)
      setTimeout(() => setShakeId(null), 600)
      setDragAppt(null)
      return
    }

    setAppointments(prev => prev.map(a =>
      a.id === dragAppt.id
        ? { ...a, data_inizio: targetStart, data_fine: targetEnd }
        : a
    ))
    setDragAppt(null)
    addToast('Appuntamento spostato')
  }

  const handleCellClick = (dayIndex: number, hourSlot: string) => {
    const targetDate = getDayDate(dayIndex)
    const start = `${targetDate} ${hourSlot}:00`
    const d = new Date(start)
    d.setMinutes(d.getMinutes() + 30)
    const end = d.toISOString().replace('T', ' ').substring(0, 19)

    const hasCollision = appointments.some(a =>
      a.data_inizio < end &&
      a.data_fine > start &&
      (a.stato === 'confermato' || a.stato === 'in_attesa')
    )

    if (hasCollision) return

    const newAppt: Appointment = {
      id: Date.now(),
      cliente_id: null,
      data_inizio: start,
      data_fine: end,
      stato: 'in_attesa',
      note_ai: null,
    }
    setAppointments(prev => [...prev, newAppt])
    addToast('Nuovo appuntamento creato')
  }

  const handleClienteInput = (value: string) => {
    setFormCliente(value)
    if (value.trim()) {
      const filtered = MOCK_CLIENTS.filter(c => c.toLowerCase().includes(value.toLowerCase()))
      setClienteSuggestions(filtered)
      setShowSuggestions(filtered.length > 0)
    } else {
      setShowSuggestions(false)
    }
  }

  const handleClientFilterInput = (value: string) => {
    setClientFilter(value)
    if (value.trim()) {
      const filtered = MOCK_CLIENTS.filter(c => c.toLowerCase().includes(value.toLowerCase()))
      setClientFilterSuggestions(filtered)
      setShowClientFilter(true)
    } else {
      setShowClientFilter(false)
    }
  }

  const handleSaveAppointment = () => {
    if (!formData) return
    const startDateTime = `${formData} ${formOra}:00`
    const d = new Date(startDateTime)
    d.setMinutes(d.getMinutes() + formDurata)
    const endDateTime = d.toISOString().replace('T', ' ').substring(0, 19)

    const hasCollision = appointments.some(a =>
      a.data_inizio < endDateTime &&
      a.data_fine > startDateTime &&
      (a.stato === 'confermato' || a.stato === 'in_attesa')
    )

    if (hasCollision) {
      addToast('Conflitto: esiste gia un appuntamento in questa fascia')
      return
    }

    const newAppt: Appointment = {
      id: Date.now(),
      cliente_id: null,
      data_inizio: startDateTime,
      data_fine: endDateTime,
      stato: formStato,
      note_ai: formCliente ? `${formCliente}${formNote ? ' - ' + formNote : ''}` : (formNote || null),
    }
    setAppointments(prev => [...prev, newAppt])
    addToast('Appuntamento salvato')
    setModalOpen(false)
    setFormCliente('')
    setFormData('')
    setFormOra('09:00')
    setFormDurata(60)
    setFormNote('')
    setFormStato('confermato')
    setShowSuggestions(false)
  }

  const todayMonday = getMonday(TODAY.current)
  const currentMonday = getMonday(new Date(TODAY.current.getTime() + weekOffset * 7 * 24 * 60 * 60 * 1000))

  const formatWeekRange = () => {
    const start = new Date(WEEK_START)
    const end = new Date(WEEK_START)
    end.setDate(end.getDate() + 6)
    const sameMonth = start.getMonth() === end.getMonth()
    const sameYear = start.getFullYear() === end.getFullYear()
    if (sameYear && sameMonth) {
      return `${start.toLocaleDateString('it-IT', { day: 'numeric' })} — ${end.toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}`
    }
    return `${start.toLocaleDateString('it-IT', { day: 'numeric', month: 'long' })} — ${end.toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}`
  }

  return (
    <div className="flex h-full gap-4">
      {/* Left Panel - Rules */}
      <div className="w-56 flex-shrink-0 bg-slate-900 border border-slate-800 rounded-lg p-4 flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
          <Clock size={18} /> Regole
        </h2>

        <div>
          <label className="text-xs font-medium text-slate-400 block mb-2">Buffer tra slot</label>
          <div className="flex gap-1">
            {[10, 15, 30].map(v => (
              <button
                key={v}
                onClick={() => setBuffer(v)}
                className={cn(
                  'px-3 py-1 text-xs rounded-md border transition-colors',
                  buffer === v
                    ? 'bg-sky-600 text-white border-sky-600'
                    : 'border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                )}
              >
                {v}min
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-slate-400 block mb-2">Giorni lavorativi</label>
          {DAYS.map((day, i) => (
            <label key={i} className="flex items-center gap-2 text-sm py-0.5 cursor-pointer text-slate-300">
              <input
                type="checkbox"
                checked={workingDays.includes(i)}
                onChange={() => toggleWorkingDay(i)}
                className="rounded border-slate-600 bg-slate-800 text-sky-500 focus:ring-sky-500 focus:ring-offset-slate-900"
              />
              {day}
            </label>
          ))}
        </div>

        <div>
          <label className="text-xs font-medium text-slate-400 flex items-center gap-1 mb-2">
            <Filter size={14} /> Filtri
          </label>
          <label className="flex items-center gap-2 text-sm py-0.5 cursor-pointer text-slate-300">
            <input
              type="checkbox"
              checked={showConfirmed}
              onChange={() => setShowConfirmed(!showConfirmed)}
              className="rounded border-slate-600 bg-slate-800 text-sky-500 focus:ring-sky-500 focus:ring-offset-slate-900"
            />
            Confermati
          </label>
          <label className="flex items-center gap-2 text-sm py-0.5 cursor-pointer text-slate-300">
            <input
              type="checkbox"
              checked={showPending}
              onChange={() => setShowPending(!showPending)}
              className="rounded border-slate-600 bg-slate-800 text-sky-500 focus:ring-sky-500 focus:ring-offset-slate-900"
            />
            In attesa
          </label>
        </div>

        {/* Client Filter */}
        <div className="relative">
          <label className="text-xs font-medium text-slate-400 flex items-center gap-1 mb-2">
            <Search size={14} /> Filtra per cliente
          </label>
          <input
            type="text"
            value={clientFilter}
            onChange={e => handleClientFilterInput(e.target.value)}
            onFocus={() => { if (clientFilter) setShowClientFilter(true) }}
            onBlur={() => setTimeout(() => setShowClientFilter(false), 200)}
            placeholder="Cerca cliente..."
            className="w-full h-8 text-sm rounded-md border border-slate-700 px-2 bg-slate-800 text-slate-200 placeholder:text-slate-500 focus:ring-2 focus:ring-sky-500 focus:outline-none"
          />
          {clientFilter && (
            <button
              onClick={() => { setClientFilter(''); setShowClientFilter(false) }}
              className="absolute right-2 top-8 text-slate-400 hover:text-slate-200"
            >
              <X size={12} />
            </button>
          )}
          {showClientFilter && clientFilterSuggestions.length > 0 && (
            <div className="absolute z-30 top-16 left-0 right-0 bg-slate-800 border border-slate-700 rounded-md shadow-lg max-h-32 overflow-y-auto">
              {clientFilterSuggestions.map(name => (
                <button
                  key={name}
                  onMouseDown={() => { setClientFilter(name); setShowClientFilter(false) }}
                  className="w-full text-left px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-700 first:rounded-t-md last:rounded-b-md"
                >
                  {name}
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="text-xs font-medium text-slate-400 flex items-center gap-1 mb-2">
            <MapPin size={14} /> Fuso orario
          </label>
          <select className="w-full h-8 text-sm rounded-md border border-slate-700 px-2 bg-slate-800 text-slate-200 focus:ring-2 focus:ring-sky-500 focus:outline-none">
            <option>Europe/Rome</option>
            <option>Europe/London</option>
            <option>America/New_York</option>
          </select>
        </div>

        <button className="mt-auto w-full py-2 text-sm font-medium rounded-md border border-red-800 text-red-400 hover:bg-red-900/30 transition-colors">
          Blocca giornata
        </button>
      </div>

      {/* Main Calendar */}
      <div className="flex-1 border border-slate-800 rounded-lg overflow-hidden flex flex-col bg-slate-900">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setWeekOffset(o => o - 1)}
              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-sm font-semibold text-slate-200">
              {formatWeekRange()}
            </span>
            <button
              onClick={() => setWeekOffset(o => o + 1)}
              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <div className="flex items-center gap-2">
            {weekOffset !== 0 && (
              <button
                onClick={() => setWeekOffset(0)}
                className="px-3 py-1 text-xs font-medium rounded-md border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors"
              >
                Oggi
              </button>
            )}
            <button
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-sky-600 text-white hover:bg-sky-700 transition-colors"
            >
              <Plus size={14} />
              Nuovo Appuntamento
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          <div className="flex border-b border-slate-800 bg-slate-900 sticky top-0 z-10">
            <div className="w-14 flex-shrink-0" />
            {DAYS.map((day, i) => {
              const date = getDayDate(i)
              const todayStr = TODAY.current.toISOString().split('T')[0]
              const isToday = date === todayStr
              return (
                <div
                  key={day}
                  className={cn(
                    'flex-1 text-center py-2 border-r border-slate-800 last:border-r-0',
                    isToday && 'bg-sky-900/30'
                  )}
                >
                  <div className="text-xs font-medium text-slate-500">{day}</div>
                  <div className={cn('text-sm font-semibold', isToday ? 'text-sky-400' : 'text-slate-300')}>
                    {new Date(date).getDate()}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="flex">
            <div className="w-14 flex-shrink-0">
              {HOURS.map(hour => (
                <div key={hour} className="h-10 flex items-start justify-end pr-2 pt-0 text-xs text-slate-500">
                  {hour}
                </div>
              ))}
            </div>

            <div className="flex-1 flex">
              {DAYS.map((_, dayIndex) => (
                <div key={dayIndex} className="flex-1 border-r border-slate-800/50 last:border-r-0 relative">
                  {HOURS.map(hour => {
                    const cellKey = `${dayIndex}-${hour}`
                    return (
                      <div
                        key={hour}
                        className="h-10 border-b border-slate-800/30 hover:bg-slate-800/50 cursor-pointer transition-colors relative group"
                        onClick={() => handleCellClick(dayIndex, hour)}
                        onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('bg-sky-900/30') }}
                        onDragLeave={e => { e.currentTarget.classList.remove('bg-sky-900/30') }}
                        onDrop={e => { e.currentTarget.classList.remove('bg-sky-900/30'); handleDrop(dayIndex, hour) }}
                        onMouseEnter={() => setTooltipCell(cellKey)}
                        onMouseLeave={() => setTooltipCell(null)}
                      >
                        {tooltipCell === cellKey && (
                          <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                            <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                              Clicca per creare
                            </span>
                          </div>
                        )}
                      </div>
                    )
                  })}

                  {getAppointmentsForDay(dayIndex).map(appt => {
                    const { top, height } = getTopAndHeight(appt.data_inizio, appt.data_fine)
                    return (
                      <div
                        key={appt.id}
                        draggable
                        onDragStart={() => handleDragStart(appt)}
                        onMouseEnter={() => setHoverId(appt.id)}
                        onMouseLeave={() => setHoverId(null)}
                        className={cn(
                          'absolute left-1 right-1 rounded-md border px-2 py-1 text-xs cursor-pointer transition-all z-10',
                          getStatusColor(appt.stato),
                          shakeId === appt.id && 'animate-shake',
                          hoverId === appt.id && 'shadow-lg'
                        )}
                        style={{ top: `${top}px`, height: `${height}px` }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="min-w-0">
                            <div className="font-semibold truncate text-xs">
                              {appt.note_ai || 'Nuovo appuntamento'}
                            </div>
                            <div className="text-xs opacity-70">
                              {new Date(appt.data_inizio).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                          {hoverId === appt.id && (
                            <button
                              onClick={e => { e.stopPropagation(); deleteAppointment(appt.id) }}
                              className="w-5 h-5 flex items-center justify-center rounded-full bg-red-900/60 text-red-300 hover:bg-red-800 flex-shrink-0"
                            >
                              <X size={12} />
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-slate-100">Nuovo Appuntamento</h2>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex flex-col gap-4">
              <div className="relative">
                <label className="text-xs font-medium text-slate-400 block mb-1">Cliente</label>
                <input
                  type="text"
                  value={formCliente}
                  onChange={e => handleClienteInput(e.target.value)}
                  onFocus={() => { if (clienteSuggestions.length > 0) setShowSuggestions(true) }}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  placeholder="Nome cliente..."
                  className="w-full h-9 text-sm rounded-md border border-slate-700 px-3 bg-slate-800 text-slate-200 placeholder:text-slate-500 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
                {showSuggestions && clienteSuggestions.length > 0 && (
                  <div className="absolute z-40 top-16 left-0 right-0 bg-slate-800 border border-slate-700 rounded-md shadow-lg max-h-32 overflow-y-auto">
                    {clienteSuggestions.map(name => (
                      <button
                        key={name}
                        onMouseDown={() => { setFormCliente(name); setShowSuggestions(false) }}
                        className="w-full text-left px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-700 first:rounded-t-md last:rounded-b-md"
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-medium text-slate-400 block mb-1">Data</label>
                <input
                  type="date"
                  value={formData}
                  onChange={e => setFormData(e.target.value)}
                  className="w-full h-9 text-sm rounded-md border border-slate-700 px-3 bg-slate-800 text-slate-200 focus:ring-2 focus:ring-sky-500 focus:outline-none [color-scheme:dark]"
                />
              </div>

              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-xs font-medium text-slate-400 block mb-1">Ora inizio</label>
                  <select
                    value={formOra}
                    onChange={e => setFormOra(e.target.value)}
                    className="w-full h-9 text-sm rounded-md border border-slate-700 px-2 bg-slate-800 text-slate-200 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  >
                    {TIME_SLOTS.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="text-xs font-medium text-slate-400 block mb-1">Durata</label>
                  <select
                    value={formDurata}
                    onChange={e => setFormDurata(Number(e.target.value))}
                    className="w-full h-9 text-sm rounded-md border border-slate-700 px-2 bg-slate-800 text-slate-200 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  >
                    {DURATA_OPTIONS.map(d => (
                      <option key={d.minutes} value={d.minutes}>{d.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-400 block mb-1">Note</label>
                <input
                  type="text"
                  value={formNote}
                  onChange={e => setFormNote(e.target.value)}
                  placeholder="Note opzionali..."
                  className="w-full h-9 text-sm rounded-md border border-slate-700 px-3 bg-slate-800 text-slate-200 placeholder:text-slate-500 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-400 block mb-1">Stato</label>
                <select
                  value={formStato}
                  onChange={e => setFormStato(e.target.value as 'in_attesa' | 'confermato')}
                  className="w-full h-9 text-sm rounded-md border border-slate-700 px-2 bg-slate-800 text-slate-200 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                >
                  <option value="confermato">Confermato</option>
                  <option value="in_attesa">In attesa</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setModalOpen(false)}
                className="flex-1 py-2 text-sm font-medium rounded-md border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors"
              >
                Annulla
              </button>
              <button
                onClick={handleSaveAppointment}
                className="flex-1 py-2 text-sm font-medium rounded-md bg-sky-600 text-white hover:bg-sky-700 transition-colors"
              >
                Salva
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast notifications */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className="animate-in slide-in-from-right px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm text-slate-200 shadow-lg pointer-events-auto"
          >
            {toast.message}
          </div>
        ))}
      </div>
    </div>
  )
}