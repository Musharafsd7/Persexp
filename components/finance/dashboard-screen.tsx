'use client'

import { useState } from 'react'
import { Eye, EyeOff, Plus, ReceiptText, ScanLine, Settings as Cog } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatMoney, formatPercent, type Transaction } from '@/lib/finance-data'
import { useStore } from '@/lib/store'
import { Eyebrow, PillButton, SectionHeading } from './primitives'
import { TransactionRow } from './transaction-row'
import { Sparkline } from './sparkline'

export function DashboardScreen({
  onScan,
  onAdd,
  onSettings,
  onOpenTx,
  onOpenWatchlist,
}: {
  onScan: () => void
  onAdd: () => void
  onSettings: () => void
  onOpenTx: (tx: Transaction) => void
  onOpenWatchlist: () => void
}) {
  const s = useStore()
  const [showAll, setShowAll] = useState(false)
  const { ghost } = s.settings
  const hide = (text: string) => (ghost ? '••••••' : text)
  const spentPct = s.settings.budget > 0 ? Math.min(100, Math.round((s.spentThisMonth / s.settings.budget) * 100)) : 0
  const now = new Date()
  const month = now.toLocaleDateString('en-US', { month: 'long' })
  const initial = (s.settings.name.trim()[0] ?? 'P').toUpperCase()

  const held = s.stocks.filter((x) => x.shares > 0 && x.price !== undefined)
  const portfolio = held.reduce((sum, x) => sum + x.price! * x.shares, 0)
  const dayChange = held.reduce((sum, x) => sum + (x.price! - (x.prevClose ?? x.price!)) * x.shares, 0)
  const dayPct = portfolio - dayChange > 0 ? (dayChange / (portfolio - dayChange)) * 100 : 0
  const txs = showAll ? s.transactions : s.transactions.slice(0, 5)

  return (
    <main>
      <header className="flex items-center justify-between px-6 pt-[max(env(safe-area-inset-top),1.5rem)]">
        <button type="button" onClick={onSettings} aria-label="Settings" className="flex items-center gap-3">
          <span className="flex size-8 items-center justify-center rounded-full bg-muted font-serif text-sm font-semibold">{initial}</span>
        </button>
        <div className="flex items-center gap-2">
          <time className="text-[13px] text-muted-foreground">
            {now.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'short' })}
          </time>
          <button
            type="button"
            onClick={() => s.updateSettings({ ghost: !ghost })}
            aria-label={ghost ? 'Show amounts' : 'Ghost mode: hide amounts'}
            className="rounded-full p-1.5 text-muted-foreground active:bg-muted"
          >
            {ghost ? <EyeOff className="size-4" strokeWidth={1.5} /> : <Eye className="size-4" strokeWidth={1.5} />}
          </button>
          <button type="button" onClick={onSettings} aria-label="Settings" className="rounded-full p-1.5 text-muted-foreground active:bg-muted">
            <Cog className="size-4" strokeWidth={1.5} />
          </button>
        </div>
      </header>

      <section aria-labelledby="balance-label" className="px-6 pt-12 pb-8">
        <Eyebrow>
          <span id="balance-label">Total estimated balance</span>
        </Eyebrow>
        <p className="mt-2 font-serif text-[48px] leading-none tracking-tight tabular">{hide(formatMoney(s.balance))}</p>
        {s.settings.budget > 0 ? (
          <p className="mt-3 font-serif text-[15px] italic text-muted-foreground">
            {'Approx. '}
            <span className="text-foreground">{hide(`${formatMoney(s.dailyRemaining)}/day`)}</span>
            {` remaining this month`}
          </p>
        ) : (
          <button type="button" onClick={onSettings} className="mt-3 font-serif text-[15px] italic text-positive">
            Set a monthly budget to see your daily allowance
          </button>
        )}

        <div className="mt-8 flex gap-3">
          <PillButton variant="outline" onClick={onAdd}>
            <Plus className="size-4" strokeWidth={1.75} aria-hidden="true" />
            Add Manual
          </PillButton>
          <PillButton variant="solid" onClick={onScan}>
            <ScanLine className="size-4" strokeWidth={1.75} aria-hidden="true" />
            Scan Bill
          </PillButton>
        </div>
      </section>

      {s.settings.budget > 0 && (
        <section aria-label="Monthly budget" className="mx-6 border-y border-border py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Eyebrow>Daily remaining spend</Eyebrow>
              <p className="mt-1.5 font-serif text-2xl tabular">
                {hide(formatMoney(s.dailyRemaining))}
                <span className="ml-1.5 font-sans text-[13px] text-muted-foreground">per day</span>
              </p>
            </div>
            <div className="text-right">
              <Eyebrow>Days left</Eyebrow>
              <p className="mt-1.5 font-serif text-2xl tabular">{s.daysLeft}</p>
            </div>
          </div>
          <div
            className="mt-4 h-[3px] w-full overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-valuenow={spentPct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${month} budget used`}
          >
            <div className={cn('h-full rounded-full', s.remaining < 0 ? 'bg-negative' : 'bg-positive')} style={{ width: `${spentPct}%` }} />
          </div>
          <p className="mt-2 text-[13px] text-muted-foreground">
            {hide(
              s.remaining >= 0
                ? `${formatMoney(s.remaining)} left of ${formatMoney(s.settings.budget)} ${month} budget`
                : `${formatMoney(-s.remaining)} over your ${formatMoney(s.settings.budget)} ${month} budget`,
            )}
          </p>
        </section>
      )}

      <SectionHeading
        title="Recent activity"
        action={
          s.transactions.length > 5 && (
            <button type="button" onClick={() => setShowAll((v) => !v)} className="text-[13px] font-medium text-positive">
              {showAll ? 'Show less' : 'See all'}
            </button>
          )
        }
      />
      <ul className="px-6">
        {txs.map((tx) => (
          <li key={tx.id} className="border-b border-border last:border-b-0">
            <TransactionRow tx={tx} onClick={() => onOpenTx(tx)} />
          </li>
        ))}
        {txs.length === 0 && (
          <li className="py-10 text-center font-serif italic text-muted-foreground">
            Nothing yet. Add a spend or scan a bill to get started.
          </li>
        )}
      </ul>

      <section aria-labelledby="stocks-heading" className="pt-4">
        <SectionHeading
          title="Stocks you track"
          action={
            <button type="button" onClick={onOpenWatchlist} className="text-[13px] font-medium text-positive">
              Watchlist
            </button>
          }
        />
        <div className="px-6">
          <Eyebrow>
            <span id="stocks-heading">Portfolio value (USD)</span>
          </Eyebrow>
          {held.length > 0 ? (
            <div className="mt-1.5 flex flex-wrap items-baseline gap-x-3">
              <p className="font-serif text-[30px] leading-none tracking-tight tabular">{hide(formatMoney(portfolio, { usd: true }))}</p>
              <p className={cn('text-[13px] font-medium tabular', dayChange >= 0 ? 'text-positive' : 'text-negative')}>
                {hide(`${formatMoney(dayChange, { signed: true, usd: true })} (${formatPercent(dayPct)}) today`)}
              </p>
            </div>
          ) : (
            <p className="mt-1.5 font-serif text-[15px] italic text-muted-foreground">
              Tap a stock in the Watchlist and enter your share count to track its value.
            </p>
          )}
          <ul className="mt-3">
            {s.stocks.slice(0, 4).map((st) => {
              const chg = st.price && st.prevClose ? ((st.price - st.prevClose) / st.prevClose) * 100 : 0
              return (
                <li key={st.ticker} className="grid grid-cols-[1fr_auto_auto] items-center gap-4 border-b border-border py-3 last:border-b-0">
                  <div className="min-w-0">
                    <p className="text-[15px] font-semibold">{st.ticker}</p>
                    <p className="truncate text-xs text-muted-foreground">{st.name}</p>
                  </div>
                  <Sparkline data={st.series} positive={chg >= 0} />
                  <span className="min-w-[72px] text-right font-serif text-[16px] font-semibold tabular">
                    {st.price !== undefined ? formatMoney(st.price, { usd: true }) : '—'}
                  </span>
                </li>
              )
            })}
          </ul>
        </div>
      </section>

      <p className="flex items-center justify-center gap-1.5 px-6 pt-6 text-xs text-muted-foreground">
        <ReceiptText className="size-3.5" strokeWidth={1.5} aria-hidden="true" />
        Receipts are processed and stored on this device.
      </p>
    </main>
  )
}
