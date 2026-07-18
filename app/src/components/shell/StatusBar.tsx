import { cn } from '@/lib/utils'
import { useAppStore } from '@/stores/appStore'

export function StatusBar() {
  const { appStatus, setAppStatus } = useAppStore()
  const { queueCount, aiLatency, aiStatus, fallbackActive } = appStatus

  const toggleFallback = () => {
    setAppStatus({
      fallbackActive: !fallbackActive,
      aiStatus: !fallbackActive ? 'disconnected' : 'connected',
    })
  }

  return (
    <div
      className={cn(
        'h-6 flex-shrink-0 flex items-center justify-between px-3 text-xs border-t border-slate-600',
        queueCount >= 50
          ? 'bg-orange-100 text-orange-800'
          : 'bg-slate-800 text-slate-400'
      )}
    >
      <div className="flex items-center gap-2">
        <span
          className={cn(
            queueCount >= 50 ? 'font-bold' : ''
          )}
        >
          Coda: {queueCount}
          {queueCount >= 50 ? ' — Sovraccarico' : ''}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5">
          <div
            className={cn(
              'w-2 h-2 rounded-full',
              fallbackActive ? 'bg-red-500' : aiStatus === 'connected' ? 'bg-emerald-550' : 'bg-red-500'
            )}
          />
          <span>
            {fallbackActive
              ? 'AI Offline — Fallback Umano Attivo'
              : aiStatus === 'timeout'
              ? 'AI Timeout'
              : `AI: ${aiLatency}ms`}
          </span>
        </div>
      </div>

      <button
        onClick={toggleFallback}
        className={cn(
          'px-2 py-0.5 rounded text-xs transition-colors',
          fallbackActive
            ? 'bg-red-500 text-white hover:bg-red-600'
            : 'hover:bg-slate-200'
        )}
      >
        {fallbackActive ? 'Riattiva AI' : 'Switch Fallback Globale'}
      </button>
    </div>
  )
}