'use client'

import { Archive, House, LineChart, ScanLine } from 'lucide-react'
import { cn } from '@/lib/utils'

export type Tab = 'home' | 'vault' | 'watchlist'

const items: { id: Tab; label: string; icon: typeof House }[] = [
  { id: 'home', label: 'Home', icon: House },
  { id: 'vault', label: 'Vault', icon: Archive },
  { id: 'watchlist', label: 'Watchlist', icon: LineChart },
]

export function BottomNav({
  active,
  onChange,
  onScan,
}: {
  active: Tab
  onChange: (tab: Tab) => void
  onScan: () => void
}) {
  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-[430px] border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur sm:border-x"
    >
      <ul className="flex items-stretch justify-around px-2">
        {items.slice(0, 2).map((item) => (
          <NavItem key={item.id} {...item} active={active === item.id} onClick={() => onChange(item.id)} />
        ))}
        <li className="flex flex-1 items-center justify-center">
          <button
            type="button"
            onClick={onScan}
            className="flex flex-col items-center gap-1 py-3 text-muted-foreground transition-colors hover:text-foreground"
          >
            <ScanLine className="size-[22px]" strokeWidth={1.5} aria-hidden="true" />
            <span className="text-[11px] font-medium tracking-[0.2px]">Scan</span>
          </button>
        </li>
        {items.slice(2).map((item) => (
          <NavItem key={item.id} {...item} active={active === item.id} onClick={() => onChange(item.id)} />
        ))}
      </ul>
    </nav>
  )
}

function NavItem({
  label,
  icon: Icon,
  active,
  onClick,
}: {
  label: string
  icon: typeof House
  active: boolean
  onClick: () => void
}) {
  return (
    <li className="flex flex-1 items-center justify-center">
      <button
        type="button"
        onClick={onClick}
        aria-current={active ? 'page' : undefined}
        className={cn(
          'relative flex flex-col items-center gap-1 py-3 transition-colors',
          active ? 'text-positive' : 'text-muted-foreground hover:text-foreground',
        )}
      >
        <Icon className="size-[22px]" strokeWidth={active ? 2 : 1.5} aria-hidden="true" />
        <span className="text-[11px] font-medium tracking-[0.2px]">{label}</span>
        {active && <span className="absolute top-0 h-0.5 w-6 rounded-full bg-positive" aria-hidden="true" />}
      </button>
    </li>
  )
}
