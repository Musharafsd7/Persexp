'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { get, set } from 'idb-keyval'
import {
  DEFAULT_SETTINGS,
  DEFAULT_TICKERS,
  INDICES,
  setActiveCurrency,
  uid,
  type Index,
  type Receipt,
  type Settings,
  type Stock,
  type Transaction,
} from './finance-data'
import { fetchQuote } from './quotes'
import { notify } from './notify'

type Persisted = {
  settings: Settings
  transactions: Transaction[]
  receipts: Receipt[]
  stocks: Stock[]
}

const KEY = 'persexp:v1'
const PURGE_MS = 45 * 86_400_000
const ALERT_COOLDOWN = 6 * 3_600_000

const initial = (): Persisted => ({
  settings: DEFAULT_SETTINGS,
  transactions: [],
  receipts: [],
  stocks: DEFAULT_TICKERS.map((t) => ({ ...t, shares: 0 })),
})

type Store = Persisted & {
  ready: boolean
  indices: Index[]
  refreshing: boolean
  lastRefresh?: number
  offline: boolean
  alertBanner: string | null
  dismissAlert: () => void
  // derived
  balance: number
  spentThisMonth: number
  remaining: number
  daysLeft: number
  dailyRemaining: number
  // actions
  updateSettings: (s: Partial<Settings>) => void
  addTransaction: (t: Omit<Transaction, 'id'>) => string
  deleteTransaction: (id: string) => void
  addReceipt: (r: Omit<Receipt, 'id'>, tx: Omit<Transaction, 'id' | 'receiptId'>) => void
  deleteReceipt: (id: string) => void
  addStock: (ticker: string, name?: string) => Promise<boolean>
  updateStock: (ticker: string, patch: Partial<Stock>) => void
  removeStock: (ticker: string) => void
  refreshQuotes: () => Promise<void>
  exportJson: () => string
  resetAll: () => void
}

const Ctx = createContext<Store | null>(null)
export const useStore = () => {
  const c = useContext(Ctx)
  if (!c) throw new Error('StoreProvider missing')
  return c
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<Persisted>(initial)
  const [ready, setReady] = useState(false)
  const [indices, setIndices] = useState<Index[]>(INDICES)
  const [refreshing, setRefreshing] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<number>()
  const [offline, setOffline] = useState(false)
  const [alertBanner, setAlertBanner] = useState<string | null>(null)
  const dataRef = useRef(data)
  dataRef.current = data

  // Load
  useEffect(() => {
    let alive = true
    ;(async () => {
      let loaded: Persisted | undefined
      try {
        loaded = await get<Persisted>(KEY)
      } catch {}
      if (!alive) return
      if (loaded) {
        const now = Date.now()
        const receipts = loaded.receipts.map((r) => (r.image && now - r.ts > PURGE_MS ? { ...r, image: '' } : r))
        setData({ ...initial(), ...loaded, settings: { ...DEFAULT_SETTINGS, ...loaded.settings }, receipts })
      }
      setReady(true)
    })()
    return () => {
      alive = false
    }
  }, [])

  // Persist (debounced)
  useEffect(() => {
    if (!ready) return
    const t = setTimeout(() => {
      set(KEY, data).catch(() => {})
    }, 300)
    return () => clearTimeout(t)
  }, [data, ready])

  // Theme + currency
  useEffect(() => {
    setActiveCurrency(data.settings.currency)
    document.documentElement.classList.toggle('dark', data.settings.dark)
    import('@capacitor/status-bar')
      .then(({ StatusBar, Style }) => {
        StatusBar.setStyle({ style: data.settings.dark ? Style.Dark : Style.Light }).catch(() => {})
        StatusBar.setBackgroundColor({ color: data.settings.dark ? '#121212' : '#ffffff' }).catch(() => {})
      })
      .catch(() => {})
  }, [data.settings.dark, data.settings.currency])

  const patch = useCallback((fn: (d: Persisted) => Persisted) => setData((d) => fn(d)), [])

  const refreshQuotes = useCallback(async () => {
    setRefreshing(true)
    try {
      const tickers = dataRef.current.stocks.map((s) => s.ticker)
      const [stockQuotes, indexQuotes] = await Promise.all([
        Promise.all(tickers.map((t) => fetchQuote(t))),
        Promise.all(INDICES.map((i) => fetchQuote(i.symbol))),
      ])
      const anyOk = stockQuotes.some(Boolean) || indexQuotes.some(Boolean)
      setOffline(!anyOk)
      if (!anyOk) return
      setIndices(
        INDICES.map((i, n) => {
          const q = indexQuotes[n]
          return q ? { ...i, value: q.price, change: q.change } : i
        }),
      )
      const now = Date.now()
      const fired: string[] = []
      patch((d) => ({
        ...d,
        stocks: d.stocks.map((s) => {
          const q = stockQuotes[tickers.indexOf(s.ticker)]
          if (!q) return s
          const next: Stock = {
            ...s,
            name: s.name || q.name,
            price: q.price,
            prevClose: q.prevClose,
            dayHigh: q.dayHigh,
            dayLow: q.dayLow,
            volume: q.volume,
            week52Low: q.week52Low,
            week52High: q.week52High,
            series: q.series,
            updatedAt: now,
          }
          if (d.settings.alertsOn && s.alertBelow && q.price < s.alertBelow && now - (s.lastAlertAt ?? 0) > ALERT_COOLDOWN) {
            next.lastAlertAt = now
            fired.push(`${s.ticker} fell to ${q.price.toFixed(2)} — below your ${s.alertBelow.toFixed(2)} alert`)
          }
          return next
        }),
      }))
      setLastRefresh(now)
      if (fired.length) {
        setAlertBanner(fired.join('\n'))
        notify('Price-drop alert', fired.join('\n'))
      }
    } finally {
      setRefreshing(false)
    }
  }, [patch])

  // Refresh on start, every 60s, and when app returns to foreground
  useEffect(() => {
    if (!ready) return
    refreshQuotes()
    const iv = setInterval(refreshQuotes, 60_000)
    const vis = () => document.visibilityState === 'visible' && refreshQuotes()
    document.addEventListener('visibilitychange', vis)
    return () => {
      clearInterval(iv)
      document.removeEventListener('visibilitychange', vis)
    }
  }, [ready, refreshQuotes])

  const actions = useMemo(
    () => ({
      updateSettings: (s: Partial<Settings>) => patch((d) => ({ ...d, settings: { ...d.settings, ...s } })),
      addTransaction: (t: Omit<Transaction, 'id'>) => {
        const id = uid()
        patch((d) => ({ ...d, transactions: [{ ...t, id }, ...d.transactions].sort((a, b) => b.ts - a.ts) }))
        return id
      },
      deleteTransaction: (id: string) => patch((d) => ({ ...d, transactions: d.transactions.filter((t) => t.id !== id) })),
      addReceipt: (r: Omit<Receipt, 'id'>, tx: Omit<Transaction, 'id' | 'receiptId'>) => {
        const rid = uid()
        patch((d) => ({
          ...d,
          receipts: [{ ...r, id: rid }, ...d.receipts].sort((a, b) => b.ts - a.ts),
          transactions: [{ ...tx, id: uid(), receiptId: rid }, ...d.transactions].sort((a, b) => b.ts - a.ts),
        }))
      },
      deleteReceipt: (id: string) =>
        patch((d) => ({
          ...d,
          receipts: d.receipts.filter((r) => r.id !== id),
          transactions: d.transactions.filter((t) => t.receiptId !== id),
        })),
      addStock: async (ticker: string, name?: string) => {
        const t = ticker.trim().toUpperCase()
        if (!t || dataRef.current.stocks.some((s) => s.ticker === t)) return !!t
        const q = await fetchQuote(t)
        if (!q) return false
        patch((d) => ({
          ...d,
          stocks: [
            ...d.stocks,
            { ticker: t, name: name || q.name, shares: 0, price: q.price, prevClose: q.prevClose, dayHigh: q.dayHigh, dayLow: q.dayLow, volume: q.volume, week52Low: q.week52Low, week52High: q.week52High, series: q.series, updatedAt: Date.now() },
          ],
        }))
        return true
      },
      updateStock: (ticker: string, p: Partial<Stock>) =>
        patch((d) => ({ ...d, stocks: d.stocks.map((s) => (s.ticker === ticker ? { ...s, ...p } : s)) })),
      removeStock: (ticker: string) => patch((d) => ({ ...d, stocks: d.stocks.filter((s) => s.ticker !== ticker) })),
      exportJson: () =>
        JSON.stringify(
          { ...dataRef.current, receipts: dataRef.current.receipts.map((r) => ({ ...r, image: r.image ? '[image omitted]' : '' })) },
          null,
          2,
        ),
      resetAll: () => {
        setData(initial())
        setAlertBanner(null)
      },
    }),
    [patch],
  )

  const derived = useMemo(() => {
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime()
    const balance = data.settings.startingBalance + data.transactions.reduce((s, t) => s + t.amount, 0)
    const spentThisMonth = -data.transactions.filter((t) => t.ts >= monthStart && t.amount < 0).reduce((s, t) => s + t.amount, 0)
    const remaining = data.settings.budget - spentThisMonth
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
    const daysLeft = daysInMonth - now.getDate() + 1
    return { balance, spentThisMonth, remaining, daysLeft, dailyRemaining: Math.max(0, remaining) / daysLeft }
  }, [data.settings.startingBalance, data.settings.budget, data.transactions])

  const value: Store = {
    ...data,
    ready,
    indices,
    refreshing,
    lastRefresh,
    offline,
    alertBanner,
    dismissAlert: () => setAlertBanner(null),
    ...derived,
    ...actions,
    addStock: actions.addStock,
    refreshQuotes,
  }

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
