'use client'

import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cn('text-[11px] font-medium uppercase tracking-[1px] text-muted-foreground', className)}>
      {children}
    </p>
  )
}

export function ScreenHeader({
  title,
  subtitle,
  action,
}: {
  title: string
  subtitle?: string
  action?: ReactNode
}) {
  return (
    <header className="flex items-end justify-between gap-4 px-6 pt-10 pb-5">
      <div>
        <h1 className="font-serif text-[28px] font-bold leading-tight tracking-tight text-balance">{title}</h1>
        {subtitle && <p className="mt-1 text-[13px] text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </header>
  )
}

export function SectionHeading({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between px-6 pt-8 pb-2">
      <h2 className="font-serif text-xl font-semibold tracking-tight">{title}</h2>
      {action}
    </div>
  )
}

export function PillButton({
  children,
  variant = 'outline',
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'outline' | 'solid' | 'ghost' }) {
  return (
    <button
      type="button"
      {...props}
      className={cn(
        'inline-flex h-10 items-center justify-center gap-2 rounded-full px-5 text-sm font-medium tracking-[0.2px] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50',
        variant === 'solid' && 'bg-primary text-primary-foreground hover:bg-primary/90',
        variant === 'outline' && 'border border-foreground text-foreground ',
        variant === 'ghost' && 'text-muted-foreground hover:text-foreground',
        className,
      )}
    >
      {children}
    </button>
  )
}

export function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (value: boolean) => void
  label: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-10 shrink-0 items-center rounded-full transition-colors',
        checked ? 'bg-primary' : 'bg-input',
      )}
    >
      <span
        className={cn(
          'inline-block size-5 rounded-full bg-white transition-transform',
          checked ? 'translate-x-[18px]' : 'translate-x-0.5',
        )}
      />
    </button>
  )
}

export function Sheet({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: ReactNode
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/40 animate-in fade-in"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative flex max-h-[94dvh] w-full max-w-[430px] flex-col overflow-hidden rounded-t-2xl bg-surface text-foreground animate-in slide-in-from-bottom duration-300"
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <span className="text-sm font-medium tracking-[0.2px]">{title}</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-2 rounded-full p-2 text-muted-foreground  hover:text-foreground"
          >
            <X className="size-5" strokeWidth={1.5} />
          </button>
        </div>
        <div className="overflow-y-auto pb-[env(safe-area-inset-bottom)]">{children}</div>
      </div>
    </div>
  )
}
