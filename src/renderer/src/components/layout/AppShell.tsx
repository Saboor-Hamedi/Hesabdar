import { useState, useEffect } from 'react'
import { ActivityBar } from './ActivityBar'
import { TitleBar, TITLEBAR_HEIGHT } from '../titlebar/TitleBar'
import { ActivationView } from '../../features/activation/ActivationView'
import { POSView } from '../../features/pos/components/POSView'
import { SoldView } from '../../features/sold/components/SoldView'
import { ProductsView } from '../../features/products/components/ProductsView'
import { DashboardView } from '../../features/dashboard/components/DashboardView'
import { CustomersView } from '../../features/customers/components/CustomersView'
import { SuppliersView } from '../../features/suppliers/components/SuppliersView'
import { ReportsView } from '../../features/reports/components/ReportsView'
import { SettingsView } from '../../features/settings/components/SettingsView'
import { ToastContainer } from '../ui/ToastContainer'

const TAB_STORAGE_KEY = 'hesabdar_active_tab'

/**
 * AppShell: Main desktop application shell.
 * Coordinates the TitleBar, ActivityBar icon rail, and active view router.
 * Statefully preserves active tab across app refreshes and sessions.
 */
export function AppShell() {
  const [checking, setChecking] = useState(true)
  const [licensed, setLicensed] = useState(false)

  useEffect(() => {
    window.api?.license?.check?.().then((result: any) => {
      if (result?.valid) {
        setLicensed(true)
      }
      setChecking(false)
    }).catch(() => {
      setChecking(false)
    })

    const offRevoked = window.api?.license?.onRevoked?.(() => {
      setLicensed(false)
    })

    return () => {
      offRevoked?.()
    }
  }, [])

  const [active, setActive] = useState(() => {
    try {
      const saved = localStorage.getItem(TAB_STORAGE_KEY)
      if (saved) return saved
    } catch {}
    return 'pos'
  })

  // Persist active tab selection to localStorage
  const handleTabChange = (newTab: string) => {
    setActive(newTab)
    try {
      localStorage.setItem(TAB_STORAGE_KEY, newTab)
    } catch (err) {
      console.error('Failed to persist active tab:', err)
    }
  }

  // Render the active view based on ActivityBar selection
  const renderContent = () => {
    switch (active) {
      case 'pos':
        return <POSView />
      case 'sold':
        return <SoldView />
      case 'products':
        return <ProductsView />
      case 'dashboard':
        return <DashboardView />
      case 'customers':
        return <CustomersView />
      case 'suppliers':
        return <SuppliersView />
      case 'reports':
        return <ReportsView />
      case 'settings':
        return <SettingsView />
      default:
        return <POSView />
    }
  }

  if (checking) {
    return (
      <div className="flex h-screen w-screen flex-col overflow-hidden bg-[#fafafa]">
        <TitleBar />
        <div className="flex flex-1 items-center justify-center" style={{ paddingTop: TITLEBAR_HEIGHT }}>
          <div className="w-8 h-8 border-2 border-[#5A8F7B] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  if (!licensed) {
    return (
      <div className="flex h-screen w-screen flex-col overflow-hidden bg-[#fafafa]">
        <TitleBar />
        <ActivationView onActivated={() => setLicensed(true)} />
      </div>
    )
  }

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-[#fafafa] rounded-none">
      {/* Custom frameless desktop Title Bar */}
      <TitleBar />

      {/* Main layout container offset by titlebar height */}
      <div
        className="flex flex-1 overflow-hidden"
        style={{ paddingTop: TITLEBAR_HEIGHT }}
      >
        {/* Left vertical navigation icon rail */}
        <ActivityBar active={active} onChange={handleTabChange} />

        {/* Content View Pane */}
        <main className="flex-1 overflow-auto p-4 bg-[#fafafa]">
          {renderContent()}
        </main>
      </div>

      {/* Global Toast Notification System */}
      <ToastContainer />
    </div>
  )
}

export default AppShell