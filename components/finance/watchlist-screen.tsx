'use client'

import { useState } from 'react'
import { Bell, Plus, RefreshCw, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatMoney, formatPercent, type Stock } from '@/lib/finance-data'
import { useStore } from '@/lib/store'
import { Eyebrow, PillButton, ScreenHeader, SectionHeading, Sheet, Switch } from './primitives'
import { Sparkline } from './sparkline'

export function WatchlistScreen() {
  const s = useStore()
  const [adding, setAdding] = useState(false)
  const [open, setOpen] = useState<string | null>(null)
  const selected = s.stocks.find((x) => x.ticker === open)

  const sub = s.offline
    ? 'Offline — showing last known prices'
    : s.lastRefresh
      ? `Updated ${new Date(s.lastRefresh).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} • prices in USD`
      : 'Fetching prices…'

  return (
    <main>
      <ScreenHeader
        title="Stock Watchlist"
        subtitle={sub}
        action={
          <div className="flex gap-2">
            <button type="button" aria-label="Refresh prices" onClick={s.refreshQuotes} className="rounded-full border border-border p-2 active:bg-muted">
              <RefreshCw className={cn('size-4', s.refreshing && 'animate-spin')} strokeWidth={1.5} />
            </button>
            <button type="button" aria-label="Add ticker" onClick={() => setAdding(true)} className="rounded-full border border-border p-2 active:bg-muted">
              <Plus className="size-4" strokeWidth={1.5} />
            </button>
          </div>
        }
      />

      <dl className="mx-6 grid grid-cols-3 border-y border-foreground/80">
        {s.indices.map((idx, i) => (
          <div key={idx.name} className={cn('py-3', i > 0 && 'border-l border-border pl-3')}>
            <dt className="text-[11px] font-medium uppercase tracking-[1px] text-muted-foreground">{idx.name}</dt>
            <dd className="mt-0.5 font-serif text-[15px] font-semibold tabular">
              {idx.value !== undefined ? idx.value.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : '—'}
            </dd>
            <dd className={cn('text-xs font-medium tabular', (idx.change ?? 0) >= 0 ? 'text-positive' : 'text-negative')}>
              {idx.change !== undefined ? formatPercent(idx.change) : ''}
            </dd>
          </div>
        ))}
      </dl>

      <ul className="mt-2 px-6">
        {s.stocks.map((st) => {
          const chg = st.price && st.prevClose ? ((st.price - st.prevClose) / st.prevClose) * 100 : 0
          const up = chg >= 0
          return (
            <li key={st.ticker} className="border-b border-border last:border-b-0">
              <button type="button" onClick={() => setOpen(st.ticker)} className="grid w-full grid-cols-[1fr_auto_auto] items-center gap-4 py-4 text-left">
                <div className="min-w-0">
                  <p className="text-[15px] font-semibold tracking-[0.2px]">{st.ticker}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {st.name}
                    {st.shares > 0 && ` • ${st.shares} sh`}
                  </p>
                </div>
                <Sparkline data={st.series} positive={up} />
                <div className="flex min-w-[104px] flex-col items-end gap-1">
                  <span className="font-serif text-[17px] font-semibold tabular">{st.price !== undefined ? formatMoney(st.price, { usd: true }) : '—'}</span>
                  {st.price !== undefined && (
                    <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-medium tabular', up ? 'bg-positive/10 text-positive' : 'bg-negative/10 text-negative')}>
                      {formatPercent(chg)}
                    </span>
                  )}
                </div>
                {st.alertBelow && (
                  <p className="col-span-3 -mt-1 flex items-center gap-1.5 justify-self-start rounded-full bg-muted px-2.5 py-1 text-[12px] text-muted-foreground">
                    <Bell className="size-3" strokeWidth={1.5} aria-hidden="true" />
                    Alert if drops below {formatMoney(st.alertBelow, { usd: true })}
                  </p>
                )}
              </button>
            </li>
          )
        })}
        {s.stocks.length === 0 && <li className="py-10 text-center font-serif italic text-muted-foreground">Add a ticker to start tracking.</li>}
      </ul>

      <SectionHeading title="Price-drop alerts" />
      <div className="px-6">
        <div className="flex items-center gap-4 border-b border-border py-4">
          <div className="flex-1">
            <p className="text-[15px] font-medium">Threshold triggers</p>
            <p className="text-[13px] text-muted-foreground">Checked whenever the app refreshes prices. Tap a stock to set its limit.</p>
          </div>
          <Switch checked={s.settings.alertsOn} onChange={(v) => s.updateSettings({ alertsOn: v })} label="Enable price-drop alerts" />
        </div>
      </div>

      {adding && <AddTicker onClose={() => setAdding(false)} />}
      {selected && <StockSheet stock={selected} onClose={() => setOpen(null)} />}
    </main>
  )
}

function AddTicker({ onClose }: { onClose: () => void }) {
  const { addStock } = useStore()
  const [t, setT] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  return (
    <Sheet title="Add ticker" onClose={onClose}>
      <form
        className="px-6 pt-6 pb-8"
        onSubmit={async (e) => {
          e.preventDefault()
          setBusy(true)
          setErr('')
          const ok = await addStock(t)
          setBusy(false)
          if (ok) onClose()
          else setErr('Couldn’t find that ticker. Check the symbol and your connection.')
        }}
      >
        <Eyebrow>Ticker symbol</Eyebrow>
        <input autoFocus value={t} onChange={(e) => setT(e.target.value.toUpperCase().replace(/[^A-Z0-9.^=-]/g, ''))} placeholder="e.g. AMZN, RELIANCE.NS" className="mt-2 w-full border-b border-border bg-transparent pb-3 font-serif text-[28px] outline-none focus:border-foreground" />
        <p className="mt-2 text-[12px] text-muted-foreground">Indian stocks: add .NS (NSE) or .BO (BSE). Prices show in the stock’s own currency.</p>
        {err && <p className="mt-3 text-[13px] text-negative">{err}</p>}
        <PillButton type="submit" variant="solid" className="mt-8 w-full" disabled={!t || busy}>
          {busy ? 'Looking up…' : 'Add to watchlist'}
        </PillButton>
      </form>
    </Sheet>
  )
}

function StockSheet({ stock: st, onClose }: { stock: Stock; onClose: () => void }) {
  const { updateStock, removeStock } = useStore()
  const [shares, setShares] = useState(st.shares ? String(st.shares) : '')
  const [limit, setLimit] = useState(st.alertBelow ? String(st.alertBelow) : '')
  const save = () => {
    updateStock(st.ticker, { shares: Number(shares) || 0, alertBelow: Number(limit) > 0 ? Number(limit) : undefined, lastAlertAt: undefined })
    onClose()
  }
  const stats: [string, string][] = [
    ['Prev close', st.prevClose !== undefined ? formatMoney(st.prevClose, { usd: true }) : '—'],
    ['Day high', st.dayHigh !== undefined ? formatMoney(st.dayHigh, { usd: true }) : '—'],
    ['Day low', st.dayLow !== undefined ? formatMoney(st.dayLow, { usd: true }) : '—'],
    ['Volume', st.volume !== undefined ? Intl.NumberFormat('en-US', { notation: 'compact' }).format(st.volume) : '—'],
    ['52W low', st.week52Low !== undefined ? formatMoney(st.week52Low, { usd: true }) : '—'],
    ['52W high', st.week52High !== undefined ? formatMoney(st.week52High, { usd: true }) : '—'],
  ]
  return (
    <Sheet title={st.ticker} onClose={onClose}>
      <div className="px-6 pt-6 pb-8">
        <h2 className="font-serif text-2xl font-bold">{st.name}</h2>
        <p className="mt-2 font-serif text-[36px] leading-none tabular">{st.price !== undefined ? formatMoney(st.price, { usd: true }) : '—'}</p>
        <dl className="mt-6 grid grid-cols-3 gap-4 border-t border-foreground/80 pt-4">
          {stats.map(([l, v]) => (
            <div key={l}>
              <dt className="text-[11px] uppercase tracking-[0.6px] text-muted-foreground">{l}</dt>
              <dd className="font-serif text-[14px] tabular">{v}</dd>
            </div>
          ))}
        </dl>
        <label className="mt-8 block">
          <Eyebrow>Shares you own</Eyebrow>
          <input inputMode="decimal" value={shares} onChange={(e) => setShares(e.target.value.replace(/[^0-9.]/g, ''))} placeholder="0" className="mt-2 w-full border-b border-border bg-transparent pb-2 font-serif text-[28px] outline-none focus:border-foreground tabular" />
        </label>
        <label className="mt-6 block">
          <Eyebrow>Alert if price drops below</Eyebrow>
          <input inputMode="decimal" value={limit} onChange={(e) => setLimit(e.target.value.replace(/[^0-9.]/g, ''))} placeholder="No alert" className="mt-2 w-full border-b border-border bg-transparent pb-2 font-serif text-[28px] outline-none focus:border-foreground tabular" />
          {st.price !== undefined && Number(limit) > 0 && (
            <span className="mt-2 block font-serif text-sm italic text-muted-foreground">
              Currently {(((st.price - Number(limit)) / st.price) * 100).toFixed(1)}% above your limit.
            </span>
          )}
        </label>
        <PillButton variant="solid" className="mt-8 w-full" onClick={save}>Save</PillButton>
        <button type="button" onClick={() => (removeStock(st.ticker), onClose())} className="mt-5 flex w-full items-center justify-center gap-2 text-[13px] font-medium text-negative">
          <X className="size-4" strokeWidth={1.5} />
          Remove from watchlist
        </button>
      </div>
    </Sheet>
  )
}
