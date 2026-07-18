import { AppStoreProvider } from '@/stores/appStore'
import { AppShell } from '@/components/shell/AppShell'

export default function App() {
  return (
    <AppStoreProvider>
      <AppShell />
    </AppStoreProvider>
  )
}