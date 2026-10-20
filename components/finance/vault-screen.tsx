'use client'

import { useState } from 'react'
import { ImageOff, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatMoney, formatDate, type Receipt } from '@/lib/finance-data'
import { useStore } from '@/lib/store'
import { ScreenHeader } from './primitives'

export function VaultScreen({ onOpen }: { onOpen: (receipt: Receipt) => void }) {
  const { receipts, settings } = useStore()
  const [filter, setFilter] = useState('All')
  const [query, setQuery] = useState('')

  const filters = ['All', ...Array.from(new Set(receipts.map((r) => r.category)))]
  const visible = receipts.filter(
    (r) => (filter === 'All' || r.category === filter) && r.merchant.toLowerCase().includes(query.trim().toLowerCase()),
  )
  const kb = Math.round(receipts.reduce((n, r) => n + r.image.length * 0.75, 0) / 1024)

  return (
    <main>
      <ScreenHeader
        title="Receipt Vault"
        subtitle={`${receipts.length} receipt${receipts.length === 1 ? '' : 's'} • ${kb > 1024 ? (kb / 1024).toFixed(1) + ' MB' : kb + ' KB'} on device`}
      />

      <div className="px-6">
        <label className="flex items-center gap-2 border-b border-border pb-2 focus-within:border-foreground">
          <Search className="size-4 text-muted-foreground" strokeWidth={1.5} aria-hidden="true" />
          <span className="sr-only">Search receipts</span>
          <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search merchants" className="w-full bg-transparent text-[15px] outline-none placeholder:text-muted-foreground" />
        </label>
      </div>

      <div className="scrollbar-none flex gap-6 overflow-x-auto border-b border-border px-6 pt-5" role="tablist" aria-label="Filter receipts">
        {filters.map((f) => (
          <button
            key={f}
            type="button"
            role="tab"
            aria-selected={filter === f}
            onClick={() => setFilter(f)}
            className={cn('shrink-0 border-b pb-3 text-sm transition-colors', filter === f ? 'border-foreground font-medium text-foreground' : 'border-transparent text-muted-foreground')}
          >
            {f}
          </button>
        ))}
      </div>

      <ul className="px-6">
        {visible.map((r) => (
          <li key={r.id} className="border-b border-border last:border-b-0">
            <button type="button" onClick={() => onOpen(r)} className="flex w-full items-start gap-4 py-5 text-left">
              <div className="relative flex h-[72px] w-14 shrink-0 items-center justify-center overflow-hidden rounded-sm bg-muted">
                {r.image ? <img src={r.image} alt="" className="size-full object-cover" /> : <ImageOff className="size-5 text-muted-foreground" strokeWidth={1.5} />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-medium uppercase tracking-[1px] text-muted-foreground">{r.category}</p>
                <p className="mt-0.5 font-serif text-lg font-semibold leading-snug text-pretty">{r.merchant}</p>
                <p className="mt-1 text-[13px] text-muted-foreground">{formatDate(r.ts)}</p>
              </div>
              <p className="shrink-0 pt-4 font-serif text-[17px] font-semibold tabular">{settings.ghost ? '••••' : formatMoney(-r.total)}</p>
            </button>
          </li>
        ))}
        {visible.length === 0 && (
          <li className="py-16 text-center font-serif italic text-muted-foreground">
            {receipts.length === 0 ? 'No receipts yet. Tap Scan to add one.' : 'No receipts match.'}
          </li>
        )}
      </ul>
      <p className="px-6 pt-4 text-center text-xs text-muted-foreground">Receipt photos are removed automatically after 45 days; the spend stays in your history.</p>
    </main>
  )
}
