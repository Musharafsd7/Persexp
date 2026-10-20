export type Source = 'receipt' | 'manual' | 'income'

export type Transaction = {
  id: string
  merchant: string
  category: string
  ts: number
  amount: number // negative = spend, positive = income
  source: Source
  receiptId?: string
}

export type Receipt = {
  id: string
  merchant: string
  category: string
  ts: number
  total: number
  tax?: number
  confidence: number
  image: string // JPEG data URL; empty once purged after 45 days
  rawText: string
}

export type Stock = {
  ticker: string
  name: string
  shares: number
  alertBelow?: number
  price?: number
  prevClose?: number
  dayHigh?: number
  dayLow?: number
  volume?: number
  week52Low?: number
  week52High?: number
  series?: number[]
  updatedAt?: number
  lastAlertAt?: number
}

export type Index = { symbol: string; name: string; value?: number; change?: number }

export type Settings = {
  name: string
  currency: 'INR' | 'USD' | 'EUR' | 'GBP'
  startingBalance: number
  budget: number
  dark: boolean
  ghost: boolean
  alertsOn: boolean
  onboarded: boolean
}

export const CATEGORIES = ['Groceries', 'Dining', 'Transport', 'Utilities', 'Home', 'Shopping', 'Health', 'Other']

export const DEFAULT_TICKERS: Pick<Stock, 'ticker' | 'name'>[] = [
  { ticker: 'AAPL', name: 'Apple Inc.' },
  { ticker: 'GOOG', name: 'Alphabet Inc.' },
  { ticker: 'NVDA', name: 'NVIDIA Corp.' },
  { ticker: 'MSFT', name: 'Microsoft Corp.' },
  { ticker: 'TSLA', name: 'Tesla, Inc.' },
]

export const INDICES: Index[] = [
  { symbol: '^GSPC', name: 'S&P 500' },
  { symbol: '^IXIC', name: 'Nasdaq' },
  { symbol: '^DJI', name: 'Dow' },
]

export const DEFAULT_SETTINGS: Settings = {
  name: '',
  currency: 'INR',
  startingBalance: 0,
  budget: 0,
  dark: false,
  ghost: false,
  alertsOn: true,
  onboarded: false,
}

let activeCurrency: Settings['currency'] = 'INR'
const fmtCache = new Map<string, Intl.NumberFormat>()
export function setActiveCurrency(c: Settings['currency']) {
  activeCurrency = c
}
export function currencySymbol(c: Settings['currency'] = activeCurrency) {
  return { INR: '₹', USD: '$', EUR: '€', GBP: '£' }[c]
}

function nf(currency: string, locale: string) {
  const key = currency + locale
  let f = fmtCache.get(key)
  if (!f) {
    f = new Intl.NumberFormat(locale, { style: 'currency', currency, minimumFractionDigits: 2 })
    fmtCache.set(key, f)
  }
  return f
}

export function formatMoney(value: number, { signed = false, usd = false } = {}) {
  const currency = usd ? 'USD' : activeCurrency
  const locale = !usd && activeCurrency === 'INR' ? 'en-IN' : 'en-US'
  const formatted = nf(currency, locale).format(Math.abs(value))
  if (value < 0) return `-${formatted}`
  return signed ? `+${formatted}` : formatted
}

export function formatPercent(value: number) {
  return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`
}

const dayMs = 86_400_000
export function formatWhen(ts: number) {
  const d = new Date(ts)
  const now = new Date()
  const startOf = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime()
  const diff = Math.round((startOf(now) - startOf(d)) / dayMs)
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  if (diff === 0) return `Today • ${time}`
  if (diff === 1) return `Yesterday • ${time}`
  return `${d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' })} • ${time}`
}

export function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
}

export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
