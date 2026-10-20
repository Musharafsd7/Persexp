'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { currencySymbol, type Settings } from '@/lib/finance-data'
import { useStore } from '@/lib/store'
import { Eyebrow, PillButton, Sheet, Switch } from './primitives'

const CURRENCIES: Settings['currency'][] = ['INR', 'USD', 'EUR', 'GBP']

export function SettingsSheet({ onClose, welcome }: { onClose: () => void; welcome?: boolean }) {
  const { settings, updateSettings, exportJson, resetAll } = useStore()
  const [name, setName] = useState(settings.name)
  const [bal, setBal] = useState(settings.startingBalance ? String(settings.startingBalance) : '')
  const [budget, setBudget] = useState(settings.budget ? String(settings.budget) : '')
  const [confirmReset, setConfirmReset] = useState(false)

  const num = (s: string) => (s === '' || isNaN(Number(s)) ? 0 : Number(s))
  const save = () => {
    updateSettings({ name: name.trim(), startingBalance: num(bal), budget: num(budget), onboarded: true })
    onClose()
  }
  const sym = currencySymbol(settings.currency)

  const exportData = async () => {
    const json = exportJson()
    const file = new File([json], 'persexp-backup.json', { type: 'application/json' })
    try {
      if (navigator.canShare?.({ files: [file] })) return void (await navigator.share({ files: [file] }))
    } catch {
      return
    }
    const a = document.createElement('a')
    a.href = URL.createObjectURL(file)
    a.download = file.name
    a.click()
  }

  return (
    <Sheet title={welcome ? 'Welcome to PersExp' : 'Settings'} onClose={welcome ? save : onClose}>
      <div className="px-6 pt-6 pb-8">
        {welcome && <p className="font-serif text-[15px] italic text-muted-foreground">Set your starting point. You can change this anytime. Everything stays on this device.</p>}

        <label className="mt-6 block">
          <Eyebrow>Your name</Eyebrow>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Optional" className="mt-2 w-full border-b border-border bg-transparent pb-3 text-[15px] font-medium outline-none focus:border-foreground" />
        </label>

        <fieldset className="mt-8">
          <legend><Eyebrow>Currency</Eyebrow></legend>
          <div className="mt-3 flex gap-2">
            {CURRENCIES.map((c) => (
              <button key={c} type="button" aria-pressed={settings.currency === c} onClick={() => updateSettings({ currency: c })} className={cn('rounded-full border px-4 py-1.5 text-[13px] font-medium', settings.currency === c ? 'border-foreground bg-foreground text-background' : 'border-border text-muted-foreground')}>
                {currencySymbol(c)} {c}
              </button>
            ))}
          </div>
        </fieldset>

        <label className="mt-8 block">
          <Eyebrow>Current balance</Eyebrow>
          <div className="mt-2 flex items-baseline gap-1 border-b border-border pb-3 focus-within:border-foreground">
            <span className="font-serif text-[28px] text-muted-foreground">{sym}</span>
            <input inputMode="decimal" value={bal} onChange={(e) => setBal(e.target.value.replace(/[^0-9.-]/g, ''))} placeholder="0.00" className="w-full bg-transparent font-serif text-[28px] outline-none tabular" />
          </div>
        </label>

        <label className="mt-8 block">
          <Eyebrow>Monthly budget</Eyebrow>
          <div className="mt-2 flex items-baseline gap-1 border-b border-border pb-3 focus-within:border-foreground">
            <span className="font-serif text-[28px] text-muted-foreground">{sym}</span>
            <input inputMode="decimal" value={budget} onChange={(e) => setBudget(e.target.value.replace(/[^0-9.]/g, ''))} placeholder="0.00" className="w-full bg-transparent font-serif text-[28px] outline-none tabular" />
          </div>
        </label>

        <div className="mt-8 border-t border-border">
          <Row title="Dark mode" sub="Easier on the eyes at night"><Switch checked={settings.dark} onChange={(v) => updateSettings({ dark: v })} label="Dark mode" /></Row>
          <Row title="Ghost mode" sub="Hide balances and amounts"><Switch checked={settings.ghost} onChange={(v) => updateSettings({ ghost: v })} label="Ghost mode" /></Row>
          <Row title="Price-drop alerts" sub="Notify when a stock falls below its limit"><Switch checked={settings.alertsOn} onChange={(v) => updateSettings({ alertsOn: v })} label="Price-drop alerts" /></Row>
        </div>

        <PillButton variant="solid" className="mt-8 w-full" onClick={save}>{welcome ? 'Get started' : 'Save'}</PillButton>

        {!welcome && (
          <div className="mt-8 flex flex-col gap-4 border-t border-border pt-6">
            <button type="button" onClick={exportData} className="text-left text-[14px] font-medium">Export backup (JSON)</button>
            <button type="button" onClick={() => (confirmReset ? (resetAll(), onClose()) : setConfirmReset(true))} className="text-left text-[14px] font-medium text-negative">
              {confirmReset ? 'Tap again to erase all data on this device' : 'Erase all data'}
            </button>
          </div>
        )}
      </div>
    </Sheet>
  )
}

function Row({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4 border-b border-border py-4">
      <div className="flex-1">
        <p className="text-[15px] font-medium">{title}</p>
        <p className="text-[13px] text-muted-foreground">{sub}</p>
      </div>
      {children}
    </div>
  )
}
