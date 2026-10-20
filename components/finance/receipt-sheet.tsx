'use client'

import { useState } from 'react'
import { FolderClosed, ImageOff, Share, Trash2 } from 'lucide-react'
import { formatDate, formatMoney, type Receipt } from '@/lib/finance-data'
import { useStore } from '@/lib/store'
import { Eyebrow, PillButton, Sheet } from './primitives'

export function ReceiptSheet({ receipt, onClose }: { receipt: Receipt; onClose: () => void }) {
  const { deleteReceipt } = useStore()
  const [confirm, setConfirm] = useState(false)
  const time = new Date(receipt.ts).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })

  const specs: [string, string][] = [
    ['Merchant', receipt.merchant],
    ['Date', formatDate(receipt.ts)],
    ['Time', time],
    ['Category', receipt.category],
    ...(receipt.tax ? ([['Tax', formatMoney(receipt.tax)]] as [string, string][]) : []),
    ['OCR confidence', `${receipt.confidence}%`],
  ]

  const share = async () => {
    const text = `${receipt.merchant} — ${formatMoney(receipt.total)} on ${formatDate(receipt.ts)}`
    try {
      if (receipt.image && navigator.canShare) {
        const blob = await (await fetch(receipt.image)).blob()
        const file = new File([blob], `${receipt.merchant.replace(/\W+/g, '-')}.jpg`, { type: 'image/jpeg' })
        if (navigator.canShare({ files: [file] })) return void (await navigator.share({ files: [file], text }))
      }
      if (navigator.share) return void (await navigator.share({ text }))
    } catch {
      return
    }
    if (receipt.image) {
      const a = document.createElement('a')
      a.href = receipt.image
      a.download = `${receipt.merchant}.jpg`
      a.click()
    }
  }

  return (
    <Sheet title="Receipt" onClose={onClose}>
      <div className="relative flex aspect-[3/4] w-full items-center justify-center bg-muted">
        {receipt.image ? (
          <img src={receipt.image} alt={`Scanned receipt from ${receipt.merchant}`} className="size-full object-cover" />
        ) : (
          <p className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
            <ImageOff className="size-6" strokeWidth={1.5} />
            Photo removed
          </p>
        )}
      </div>

      <article className="px-6 pt-6 pb-8">
        <Eyebrow>{receipt.category}</Eyebrow>
        <h2 className="mt-1 font-serif text-2xl font-bold leading-tight text-balance">{receipt.merchant}</h2>
        <p className="mt-4 font-serif text-[36px] leading-none tracking-tight tabular">{formatMoney(receipt.total)}</p>
        <p className="mt-2 font-serif text-sm italic text-muted-foreground">Total detected on-device</p>

        <dl className="mt-8 border-t border-foreground/80">
          {specs.map(([label, value]) => (
            <div key={label} className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-4 border-b border-border py-3">
              <dt className="text-[13px] text-muted-foreground">{label}</dt>
              <dd className="text-right text-[14px] font-medium tabular">{value}</dd>
            </div>
          ))}
          <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-4 py-3">
            <dt className="text-[13px] text-muted-foreground">Stored in</dt>
            <dd className="flex items-center justify-end gap-1.5 text-right text-[14px] font-medium">
              <FolderClosed className="size-3.5 text-muted-foreground" strokeWidth={1.5} aria-hidden="true" />
              This device
            </dd>
          </div>
        </dl>

        <div className="mt-8 flex gap-3">
          <PillButton variant="outline" className="flex-1" onClick={share}>
            <Share className="size-4" strokeWidth={1.5} aria-hidden="true" />
            Export
          </PillButton>
          <PillButton variant="solid" className="flex-1" onClick={onClose}>
            Done
          </PillButton>
        </div>
        <button
          type="button"
          onClick={() => (confirm ? (deleteReceipt(receipt.id), onClose()) : setConfirm(true))}
          className="mt-5 flex w-full items-center justify-center gap-2 text-[13px] font-medium text-negative"
        >
          <Trash2 className="size-4" strokeWidth={1.5} />
          {confirm ? 'Tap again to delete receipt and its spend' : 'Delete receipt'}
        </button>
      </article>
    </Sheet>
  )
}
