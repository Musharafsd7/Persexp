'use client'

import { useEffect, useRef, useState } from 'react'
import { Bell, X } from 'lucide-react'
import { BottomNav, type Tab } from './bottom-nav'
import { DashboardScreen } from './dashboard-screen'
import { VaultScreen } from './vault-screen'
import { WatchlistScreen } from './watchlist-screen'
import { ScannerScreen } from './scanner-screen'
import { AddSpendSheet } from './add-spend-sheet'
import { ReceiptSheet } from './receipt-sheet'
import { TxSheet } from './tx-sheet'
import { SettingsSheet } from './settings-sheet'
import { StoreProvider, useStore } from '@/lib/store'
import type { Receipt, Transaction } from '@/lib/finance-data'

export function AppShell() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  )
}

function Shell() {
  const { ready, settings, receipts, alertBanner, dismissAlert } = useStore()
  const [tab, setTab] = useState<Tab>('home')
  const [scanning, setScanning] = useState(false)
  const [adding, setAdding] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [openReceipt, setOpenReceipt] = useState<Receipt | null>(null)
  const [openTx, setOpenTx] = useState<Transaction | null>(null)

  // Android hardware back button: close the top-most layer, then go home, then exit.
  const state = useRef({ scanning, adding, settingsOpen, openReceipt, openTx, tab })
  state.current = { scanning, adding, settingsOpen, openReceipt, openTx, tab }
  useEffect(() => {
    let remove: (() => void) | undefined
    import('@capacitor/app')
      .then(async ({ App }) => {
        const h = await App.addListener('backButton', () => {
          const s = state.current
          if (s.scanning) setScanning(false)
          else if (s.adding) setAdding(false)
          else if (s.settingsOpen) setSettingsOpen(false)
          else if (s.openReceipt) setOpenReceipt(null)
          else if (s.openTx) setOpenTx(null)
          else if (s.tab !== 'home') setTab('home')
          else App.exitApp()
        })
        remove = () => h.remove()
      })
      .catch(() => {})
    return () => remove?.()
  }, [])

  // Hide the native splash once data is loaded
  useEffect(() => {
    if (!ready) return
    import('@capacitor/splash-screen').then(({ SplashScreen }) => SplashScreen.hide()).catch(() => {})
  }, [ready])

  if (!ready) return <div className="min-h-dvh bg-background" />

  const showTx = (tx: Transaction) => {
    const r = tx.receiptId ? receipts.find((x) => x.id === tx.receiptId) : undefined
    if (r) setOpenReceipt(r)
    else setOpenTx(tx)
  }

  return (
    <div className="min-h-dvh bg-background text-foreground transition-colors">
      <div className="relative mx-auto min-h-dvh max-w-[430px] pb-28 sm:border-x sm:border-border">
        {alertBanner && (
          <div role="alert" className="fixed inset-x-0 top-0 z-40 mx-auto flex max-w-[430px] items-start gap-3 bg-foreground px-5 pt-[max(env(safe-area-inset-top),0.75rem)] pb-3 text-background">
            <Bell className="mt-0.5 size-4 shrink-0" strokeWidth={1.75} />
            <p className="flex-1 whitespace-pre-line text-[13px] font-medium">{alertBanner}</p>
            <button type="button" onClick={dismissAlert} aria-label="Dismiss alert"><X className="size-4" /></button>
          </div>
        )}
        {tab === 'home' && (
          <DashboardScreen
            onScan={() => setScanning(true)}
            onAdd={() => setAdding(true)}
            onSettings={() => setSettingsOpen(true)}
            onOpenTx={showTx}
            onOpenWatchlist={() => setTab('watchlist')}
          />
        )}
        {tab === 'vault' && <VaultScreen onOpen={setOpenReceipt} />}
        {tab === 'watchlist' && <WatchlistScreen />}

        <BottomNav active={tab} onChange={setTab} onScan={() => setScanning(true)} />
      </div>

      {scanning && <ScannerScreen onClose={() => setScanning(false)} />}
      {adding && <AddSpendSheet onClose={() => setAdding(false)} />}
      {openReceipt && <ReceiptSheet receipt={openReceipt} onClose={() => setOpenReceipt(null)} />}
      {openTx && <TxSheet tx={openTx} onClose={() => setOpenTx(null)} />}
      {(settingsOpen || !settings.onboarded) && (
        <SettingsSheet welcome={!settings.onboarded} onClose={() => setSettingsOpen(false)} />
      )}
    </div>
  )
}
