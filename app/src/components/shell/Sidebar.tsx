import { cn } from '@/lib/utils'
import type { AppInterface } from '@/types'
import { useAppStore } from '@/stores/appStore'
import { Calendar, Box, MessageSquare, Plug, FileText, BarChart3, Settings, Bot, Building2 } from 'lucide-react'

const NAV_ITEMS: { id: AppInterface; icon: typeof Calendar; label: string }[] = [
  { id: 'calendar', icon: Calendar, label: 'Calendario' },
  { id: 'inventory', icon: Box, label: 'Inventario' },
  { id: 'crm', icon: MessageSquare, label: 'CRM' },
  { id: 'connectors', icon: Plug, label: 'Connettori' },
  { id: 'billing', icon: FileText, label: 'Fatturazione' },
  { id: 'dashboard', icon: BarChart3, label: 'Dashboard' },
]

export function Sidebar() {
  const { router, navigate, appStatus } = useAppStore()

  return (
    <div className="w-16 flex-shrink-0 bg-slate-900 border-r border-slate-800 flex flex-col items-center py-3">
      <div className="mb-6">
        <div className="w-8 h-8 rounded-md bg-sky-600 flex items-center justify-center">
          <span className="text-white text-xs font-bold">S</span>
        </div>
      </div>

      <nav className="flex-1 flex flex-col items-center gap-2">
        {NAV_ITEMS.map(item => {
          const isActive = router.currentInterface === item.id
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.id, 'sidebar')}
              className={cn(
                'relative w-10 h-10 flex items-center justify-center rounded-md transition-all duration-150',
                isActive
                  ? 'bg-white/10 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              )}
              title={item.label}
            >
              {isActive && (
                <div className="absolute left-0 top-1 bottom-1 w-0.5 bg-sky-500 rounded-r-full" />
              )}
              <item.icon size={20} />
            </button>
          )
        })}
      </nav>

      <div className="w-8 h-px bg-slate-800 my-2" />

      <nav className="flex flex-col items-center gap-2">
        {(
          [
            { id: 'settings' as const, icon: Settings, label: 'Impostazioni' },
            { id: 'ai-agents' as const, icon: Bot, label: 'Agenti AI' },
            { id: 'profile' as const, icon: Building2, label: 'Profilo' },
          ]
        ).map(item => {
          const isActive = router.currentInterface === item.id
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.id, 'sidebar')}
              className={cn(
                'relative w-10 h-10 flex items-center justify-center rounded-md transition-all duration-150',
                isActive
                  ? 'bg-white/10 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              )}
              title={item.label}
            >
              {isActive && (
                <div className="absolute left-0 top-1 bottom-1 w-0.5 bg-sky-500 rounded-r-full" />
              )}
              <item.icon size={20} />
            </button>
          )
        })}
      </nav>

      <div className="mt-auto" title={`AI: ${appStatus.fallbackActive ? 'Offline' : appStatus.aiLatency + 'ms'}`}>
        <div
          className={cn(
            'w-2.5 h-2.5 rounded-full',
            appStatus.fallbackActive || appStatus.aiStatus === 'disconnected'
              ? 'bg-red-500'
              : appStatus.aiStatus === 'timeout'
              ? 'bg-orange-500'
              : 'bg-emerald-550'
          )}
        />
      </div>
    </div>
  )
}