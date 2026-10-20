'use client'

import { useEffect, useRef, useState } from 'react'
import { Camera, Check, Cpu, FolderClosed, Image as ImageIcon, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CATEGORIES, currencySymbol } from '@/lib/finance-data'
import { useStore } from '@/lib/store'
import { loadImage, scanReceipt } from '@/lib/ocr'
import { Eyebrow, PillButton, Switch } from './primitives'

type Phase = 'idle' | 'scanning' | 'review' | 'saved' | 'error'

const toInputDate = (ts: number) => {
  const d = new Date(ts)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function ScannerScreen({ onClose }: { onClose: () => void }) {
  const { addReceipt, settings } = useStore()
  const camRef = useRef<HTMLInputElement>(null)
  const galRef = useRef<HTMLInputElement>(null)
  const [phase, setPhase] = useState<Phase>('idle')
  const [progress, setProgress] = useState(0)
  const [image, setImage] = useState('')
  const [raw, setRaw] = useState('')
  const [confidence, setConfidence] = useState(0)
  const [merchant, setMerchant] = useState('')
  const [amount, setAmount] = useState('')
  const [tax, setTax] = useState<number | undefined>()
  const [date, setDate] = useState(toInputDate(Date.now()))
  const [category, setCategory] = useState('Other')
  const [keepImage, setKeepImage] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (phase !== 'saved') return
    const t = setTimeout(onClose, 900)
    return () => clearTimeout(t)
  }, [phase, onClose])

  const onFile = async (file?: File | null) => {
    if (!file) return
    setPhase('scanning')
    setProgress(0)
    setError('')
    try {
      const forOcr = await loadImage(file, 1800, 0.9)
      setImage(await loadImage(file, 1100, 0.7))
      const r = await scanReceipt(forOcr, setProgress)
      setRaw(r.rawText)
      setConfidence(r.confidence)
      setMerchant(r.merchant)
      setAmount(r.total !== undefined ? String(r.total) : '')
      setTax(r.tax)
      setDate(toInputDate(r.ts ?? Date.now()))
      setCategory(r.category)
      setPhase('review')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not read this receipt')
      setPhase('error')
    }
  }

  const valid = Number(amount) > 0 && merchant.trim().length > 0
  const save = () => {
    if (!valid) return
    const [y, m, d] = date.split('-').map(Number)
    const now = new Date()
    const ts = new Date(y, m - 1, d, now.getHours(), now.getMinutes()).getTime()
    const total = Number(amount)
    addReceipt(
      { merchant: merchant.trim(), category, ts, total, tax, confidence, image: keepImage ? image : '', rawText: raw },
      { merchant: merchant.trim(), category, ts, amount: -total, source: 'receipt' },
    )
    setPhase('saved')
  }

  const busy = phase === 'scanning'

  return (
    <div role="dialog" aria-modal="true" aria-label="Scan receipt" className="fixed inset-0 z-50 flex justify-center bg-black animate-in fade-in">
      <div className="relative flex h-dvh w-full max-w-[430px] flex-col">
        <div className="relative min-h-[200px] flex-1 overflow-hidden">
          {image && <img src={image} alt="Captured receipt" className="absolute inset-0 size-full object-cover opacity-80" />}

          <div className="absolute inset-x-0 top-0 flex items-center justify-between px-5 pt-[max(env(safe-area-inset-top),1.25rem)]">
            <button type="button" onClick={onClose} aria-label="Close scanner" className="rounded-full bg-black/40 p-2 text-white backdrop-blur">
              <X className="size-5" strokeWidth={1.5} />
            </button>
            <span className="flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-1.5 text-xs font-medium tracking-[0.2px] text-white backdrop-blur">
              <Cpu className="size-3.5" strokeWidth={1.5} aria-hidden="true" />
              On-device OCR
            </span>
            <span className="size-9" />
          </div>

          <div className="absolute inset-x-10 top-[16%] bottom-[10%]" aria-hidden="true">
            <Corner className="top-0 left-0 border-t border-l" />
            <Corner className="top-0 right-0 border-t border-r" />
            <Corner className="bottom-0 left-0 border-b border-l" />
            <Corner className="right-0 bottom-0 border-r border-b" />
            {busy && <div className="animate-scan absolute inset-x-2 h-px bg-[#3fae3b] shadow-[0_0_12px_2px_rgba(63,174,59,0.6)]" />}
          </div>

          {phase === 'idle' || phase === 'error' ? (
            <div className="absolute inset-x-8 top-1/2 flex -translate-y-1/2 flex-col items-center gap-3 text-center text-white">
              <p className="font-serif text-xl">{phase === 'error' ? 'Couldn’t read that image' : 'Capture a bill or receipt'}</p>
              <p className="text-[13px] text-white/70">{phase === 'error' ? error : 'Lay it flat, good light, whole receipt in frame.'}</p>
            </div>
          ) : (
            <p className="absolute inset-x-0 bottom-4 text-center text-[13px] text-white/80" aria-live="polite">
              {busy ? `Reading receipt… ${Math.round(progress * 100)}%` : 'Receipt captured'}
            </p>
          )}
        </div>

        <input ref={camRef} type="file" accept="image/*" capture="environment" className="hidden" data-testid="cam-input" onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = '' }} />
        <input ref={galRef} type="file" accept="image/*" className="hidden" data-testid="gallery-input" onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = '' }} />

        <section className="max-h-[62dvh] overflow-y-auto rounded-t-2xl bg-background px-6 pt-6 pb-[max(env(safe-area-inset-bottom),1.5rem)] text-foreground">
          {phase === 'idle' || phase === 'error' ? (
            <div className="flex gap-3">
              <PillButton variant="solid" className="flex-1" onClick={() => camRef.current?.click()}>
                <Camera className="size-4" aria-hidden="true" />
                Take photo
              </PillButton>
              <PillButton variant="outline" className="flex-1" onClick={() => galRef.current?.click()}>
                <ImageIcon className="size-4" aria-hidden="true" />
                Gallery
              </PillButton>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <Eyebrow>OCR preview — check and edit</Eyebrow>
                <span className={cn('text-xs font-medium', busy ? 'text-muted-foreground' : 'text-positive')}>
                  {busy ? 'Analyzing…' : `${confidence}% confidence`}
                </span>
              </div>

              <div className="mt-3">
                <Field label="Merchant" loading={busy}>
                  <input value={merchant} onChange={(e) => setMerchant(e.target.value)} placeholder="Merchant" className="w-full bg-transparent text-right text-[15px] font-medium outline-none" />
                </Field>
                <Field label="Date" loading={busy}>
                  <input type="date" value={date} max={toInputDate(Date.now())} onChange={(e) => setDate(e.target.value)} className="bg-transparent text-right text-[15px] font-medium outline-none" />
                </Field>
                <div className="flex items-end justify-between py-3">
                  <span className="text-[13px] text-muted-foreground">Detected total</span>
                  {busy ? (
                    <span className="block h-8 w-28 animate-pulse rounded bg-muted" />
                  ) : (
                    <span className="flex items-baseline gap-1 font-serif text-[32px] leading-none tracking-tight tabular">
                      <span className="text-muted-foreground">{currencySymbol(settings.currency)}</span>
                      <input inputMode="decimal" aria-label="Total" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ''))} placeholder="0.00" className="w-32 bg-transparent text-right outline-none" />
                    </span>
                  )}
                </div>
                {!busy && (
                  <div className="scrollbar-none flex gap-2 overflow-x-auto pb-1">
                    {CATEGORIES.map((c) => (
                      <button key={c} type="button" aria-pressed={category === c} onClick={() => setCategory(c)} className={cn('shrink-0 rounded-full border px-3.5 py-1 text-[13px] font-medium', category === c ? 'border-foreground bg-foreground text-background' : 'border-border text-muted-foreground')}>
                        {c}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-4 flex items-center gap-3 border-y border-border py-4">
                <FolderClosed className="size-5 shrink-0 text-muted-foreground" strokeWidth={1.5} aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-medium">Keep photo in vault</p>
                  <p className="text-[13px] text-muted-foreground">Photos auto-delete after 45 days</p>
                </div>
                <Switch checked={keepImage} onChange={setKeepImage} label="Keep photo in vault" />
              </div>

              <div className="mt-5 flex gap-3">
                <PillButton variant="outline" className="flex-1" onClick={() => { setPhase('idle'); setImage('') }} disabled={busy}>
                  Retake
                </PillButton>
                <PillButton variant="solid" className="flex-1" disabled={busy || !valid || phase === 'saved'} onClick={save}>
                  {phase === 'saved' ? (<><Check className="size-4" aria-hidden="true" />Saved</>) : 'Confirm'}
                </PillButton>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  )
}

function Corner({ className }: { className: string }) {
  return <span className={cn('absolute size-7 border-white', className)} />
}

function Field({ label, loading, children }: { label: string; loading: boolean; children: React.ReactNode }) {
  return (
    <label className="flex items-center justify-between gap-4 border-b border-border py-3">
      <span className="text-[13px] text-muted-foreground">{label}</span>
      {loading ? <span className="block h-4 w-32 animate-pulse rounded bg-muted" /> : children}
    </label>
  )
}
