'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { CATEGORIES, currencySymbol } from '@/lib/finance-data'
import { useStore } from '@/lib/store'
import { Eyebrow, PillButton, Sheet } from './primitives'

export function AddSpendSheet({ onClose }: { onClose: () => void }) {
  const { addTransaction, settings } = useStore()
  const [kind, setKind] = useState<'spend' | 'income'>('spend')
  const [amount, setAmount] = useState('')
  const [merchant, setMerchant] = useState('')
  const [category, setCategory] = useState('Groceries')

  const valid = Number(amount) > 0 && merchant.trim().length > 0

  return (
    <Sheet title={kind === 'spend' ? 'Add spend' : 'Add income'} onClose={onClose}>
      <form
        className="px-6 pt-6 pb-8"
        onSubmit={(e) => {
          e.preventDefault()
          if (!valid) return
          const n = Number(amount)
          addTransaction({
            merchant: merchant.trim(),
            category: kind === 'income' ? 'Income' : category,
            ts: Date.now(),
            amount: kind === 'income' ? n : -n,
            source: kind === 'income' ? 'income' : 'manual',
          })
          onClose()
        }}
      >
        <div className="flex gap-6 border-b border-border" role="tablist">
          {(['spend', 'income'] as const).map((k) => (
            <button
              key={k}
              type="button"
              role="tab"
              aria-selected={kind === k}
              onClick={() => setKind(k)}
              className={cn(
                'border-b pb-3 text-sm capitalize',
                kind === k ? 'border-foreground font-medium' : 'border-transparent text-muted-foreground',
              )}
            >
              {k === 'spend' ? 'Expense' : 'Income'}
            </button>
          ))}
        </div>

        <label htmlFor="amount" className="mt-6 block">
          <Eyebrow>Amount</Eyebrow>
        </label>
        <div className="mt-2 flex items-baseline gap-1 border-b border-border pb-3 focus-within:border-foreground">
          <span className="font-serif text-[40px] leading-none text-muted-foreground">{currencySymbol(settings.currency)}</span>
          <input
            id="amount"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ''))}
            placeholder="0.00"
            className="w-full bg-transparent font-serif text-[40px] leading-none tracking-tight outline-none tabular placeholder:text-muted-foreground/50"
          />
        </div>

        <label htmlFor="merchant" className="mt-8 block">
          <Eyebrow>{kind === 'spend' ? 'Merchant' : 'Source'}</Eyebrow>
        </label>
        <input
          id="merchant"
          value={merchant}
          onChange={(e) => setMerchant(e.target.value)}
          placeholder={kind === 'spend' ? 'e.g. Corner Bakery' : 'e.g. Salary'}
          className="mt-2 w-full border-b border-border bg-transparent pb-3 text-[15px] font-medium outline-none focus:border-foreground placeholder:font-normal placeholder:text-muted-foreground"
        />

        {kind === 'spend' && (
          <fieldset className="mt-8">
            <legend>
              <Eyebrow>Category</Eyebrow>
            </legend>
            <div className="mt-3 flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-pressed={category === c}
                  onClick={() => setCategory(c)}
                  className={cn(
                    'rounded-full border px-4 py-1.5 text-[13px] font-medium tracking-[0.2px] transition-colors',
                    category === c ? 'border-foreground bg-foreground text-background' : 'border-border text-muted-foreground',
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
          </fieldset>
        )}

        <PillButton type="submit" variant="solid" className="mt-10 w-full" disabled={!valid}>
          Confirm
        </PillButton>
      </form>
    </Sheet>
  )
}
