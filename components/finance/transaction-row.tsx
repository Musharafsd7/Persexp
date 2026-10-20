import { ArrowDownLeft, PenLine, ReceiptText } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatMoney, formatWhen, type Transaction } from '@/lib/finance-data'
import { useStore } from '@/lib/store'

const sourceMeta = {
  receipt: { label: 'Scanned receipt', icon: ReceiptText },
  manual: { label: 'Manual entry', icon: PenLine },
  income: { label: 'Income', icon: ArrowDownLeft },
} as const

export function TransactionRow({ tx, onClick }: { tx: Transaction; onClick?: () => void }) {
  const { settings } = useStore()
  const meta = sourceMeta[tx.source]
  const Icon = meta.icon
  const isIncome = tx.amount > 0

  const content = (
    <>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-medium leading-snug">{tx.merchant}</p>
        <p className="mt-1 flex items-center gap-1.5 text-[13px] text-muted-foreground">
          <Icon className="size-3.5 shrink-0" strokeWidth={1.5} aria-hidden="true" />
          <span className="truncate">
            {formatWhen(tx.ts)} • {tx.category}
          </span>
        </p>
      </div>
      <p className={cn('shrink-0 font-serif text-[17px] font-semibold tabular', isIncome && 'text-positive')}>
        {settings.ghost ? '••••' : formatMoney(tx.amount, { signed: true })}
      </p>
    </>
  )

  if (!onClick) return <div className="flex items-center gap-4 py-4">{content}</div>

  return (
    <button
      type="button"
      onClick={onClick}
      className="-mx-2 flex w-[calc(100%+1rem)] items-center gap-4 rounded-md px-2 py-4 text-left transition-colors active:bg-muted/60"
    >
      {content}
    </button>
  )
}
