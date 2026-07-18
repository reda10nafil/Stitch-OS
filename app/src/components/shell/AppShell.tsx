import { useAppStore } from '@/stores/appStore'
import { useKeyboard } from '@/hooks/useKeyboard'
import { Sidebar } from './Sidebar'
import { StatusBar } from './StatusBar'
import { CalendarModule } from '@/components/calendar/CalendarModule'
import { InventoryModule } from '@/components/inventory/InventoryModule'
import { CrmModule } from '@/components/crm/CrmModule'
import { ConnectorsModule } from '@/components/connectors/ConnectorsModule'
import { BillingModule } from '@/components/billing/BillingModule'
import { DashboardModule } from '@/components/dashboard/DashboardModule'
import { SystemSettings } from '@/components/settings/SystemSettings'
import { AiAgentsConfig } from '@/components/settings/AiAgentsConfig'
import { CompanyProfile } from '@/components/settings/CompanyProfile'

export function AppShell() {
  const { router } = useAppStore()
  useKeyboard()

  const renderModule = () => {
    switch (router.currentInterface) {
      case 'calendar': return <CalendarModule />
      case 'inventory': return <InventoryModule />
      case 'crm': return <CrmModule />
      case 'connectors': return <ConnectorsModule />
      case 'billing': return <BillingModule />
      case 'dashboard': return <DashboardModule />
      case 'settings': return <SystemSettings />
      case 'ai-agents': return <AiAgentsConfig />
      case 'profile': return <CompanyProfile />
    }
  }

  return (
    <div className="h-screen flex flex-col bg-slate-900">
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        <main className="flex-1 bg-surface overflow-hidden p-6">
          <div className="h-full overflow-auto" key={router.currentInterface}>
            {renderModule()}
          </div>
        </main>
      </div>
      <StatusBar />
    </div>
  )
}