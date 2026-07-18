import { useCallback, useEffect } from 'react'
import { useAppStore } from '@/stores/appStore'
import type { AppInterface } from '@/types'

export function useKeyboard() {
  const { navigate, router } = useAppStore()

  const interfaces: AppInterface[] = ['calendar', 'inventory', 'crm', 'connectors', 'billing', 'dashboard']

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const ctrl = e.ctrlKey || e.metaKey

    if (e.key === 'Escape') {
      return
    }

    if (ctrl && e.key === 'Tab') {
      e.preventDefault()
      const currentIdx = interfaces.indexOf(router.currentInterface)
      const nextIdx = (currentIdx + 1) % interfaces.length
      navigate(interfaces[nextIdx], 'keyboard')
    }
  }, [navigate, router.currentInterface])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
}