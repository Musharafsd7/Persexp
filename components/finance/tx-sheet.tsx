'use client'

import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { formatDate, formatMoney, type Transaction } from '@/lib/finance-data'
import { useStore } from '@/lib/store'
import { Eyebrow, PillButton, Sheet } from './primitives'

export function TxSheet({ tx, onClose }: { tx: Transaction; onClose: () => void }) {
  const { deleteTransaction } = useStore()
  const [confirm, setConfirm] = useState(false)
  return (
    <Sheet title="Transaction" onClose={onClose}>
      <article className="px-6 pt-8 pb-8">
        <Eyebrow>{tx.category}</Eyebrow>
        <h2 className="mt-1 font-serif text-2xl font-bold leading-tight">{tx.merchant}</h2>
        <p className="mt-4 font-serif text-[36px] leading-none tracking-tight tabular">{formatMoney(tx.amount, { signed: true })}</p>
        <p className="mt-2 text-[13px] text-muted-foreground">{formatDate(tx.ts)}</p>
        <div className="mt-8 flex gap-3">
          <PillButton variant="solid" className="flex-1" onClick={onClose}>
            Done
          </PillButton>
        </div>
        <button
          type="button"
          onClick={() => (confirm ? (deleteTransaction(tx.id), onClose()) : setConfirm(true))}
          className="mt-5 flex w-full items-center justify-center gap-2 text-[13px] font-medium text-negative"
        >
          <Trash2 className="size-4" strokeWidth={1.5} />
          {confirm ? 'Tap again to delete' : 'Delete transaction'}
        </button>
      </article>
    </Sheet>
  )
}
