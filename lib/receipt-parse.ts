import { CATEGORIES } from './finance-data'

export type Parsed = { merchant: string; total?: number; tax?: number; ts?: number; category: string }

const AMOUNT = /(?:^|[^\d])(\d{1,3}(?:[,\s]\d{2,3})*[.,]\d{2}|\d+[.,]\d{2})(?!\d)/g

function toNum(s: string): number {
  const t = s.replace(/\s/g, '')
  // decide decimal separator: last separator followed by exactly 2 digits
  const m = t.match(/[.,](\d{2})$/)
  if (!m) return NaN
  const intPart = t.slice(0, t.length - 3).replace(/[.,]/g, '')
  return parseFloat(`${intPart}.${m[1]}`)
}

function amountsIn(line: string): number[] {
  const out: number[] = []
  for (const m of line.matchAll(AMOUNT)) {
    const n = toNum(m[1])
    if (!isNaN(n)) out.push(n)
  }
  return out
}

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']

function parseDate(text: string): number | undefined {
  let m = text.match(/\b(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})\b/)
  if (m) return mk(+m[1], +m[2], +m[3])
  m = text.match(/\b(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})\b/)
  if (m) {
    let y = +m[3]
    if (y < 100) y += 2000
    const a = +m[1]
    const b = +m[2]
    // day-first (India/UK) unless impossible
    return a > 12 ? mk(y, b, a) : b > 12 ? mk(y, a, b) : mk(y, b, a)
  }
  m = text.match(/\b(\d{1,2})\s+([A-Za-z]{3,9})[a-z]*[,.]?\s+(\d{2,4})\b/)
  if (m) {
    const mi = MONTHS.indexOf(m[2].slice(0, 3).toLowerCase())
    if (mi >= 0) return mk(+m[3] < 100 ? 2000 + +m[3] : +m[3], mi + 1, +m[1])
  }
  m = text.match(/\b([A-Za-z]{3,9})\s+(\d{1,2})[,.]?\s+(\d{4})\b/)
  if (m) {
    const mi = MONTHS.indexOf(m[1].slice(0, 3).toLowerCase())
    if (mi >= 0) return mk(+m[3], mi + 1, +m[2])
  }
  return undefined
}

function mk(y: number, mo: number, d: number): number | undefined {
  if (y < 2000 || y > 2100 || mo < 1 || mo > 12 || d < 1 || d > 31) return undefined
  const dt = new Date(y, mo - 1, d, 12, 0, 0)
  if (dt.getTime() > Date.now() + 86_400_000) return undefined
  return dt.getTime()
}

const CATEGORY_WORDS: Record<string, RegExp> = {
  Groceries: /grocer|market|mart|supermarket|fresh|bazaar|dmart|reliance|big ?basket|whole foods|kirana|provision/i,
  Dining: /cafe|coffee|restaurant|pizza|burger|kitchen|bakery|biryani|dhaba|hotel|bar\b|diner|swiggy|zomato|starbucks/i,
  Transport: /fuel|petrol|diesel|gas station|uber|ola\b|metro|transit|taxi|parking|irctc|rail|bus/i,
  Utilities: /electric|power|water|broadband|internet|recharge|airtel|jio|bsnl|gas bill|utility|edison/i,
  Home: /hardware|depot|furnit|ikea|home|paint|plumb/i,
  Health: /pharma|medical|clinic|hospital|apollo|medplus|chemist|drug|lab\b/i,
  Shopping: /store|retail|fashion|apparel|mall|amazon|flipkart|electronics|mobile/i,
}

export function guessCategory(text: string): string {
  for (const c of CATEGORIES) if (CATEGORY_WORDS[c]?.test(text)) return c
  return 'Other'
}

export function parseReceipt(raw: string): Parsed {
  const lines = raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)

  // Merchant: first line in the top 6 that is mostly letters
  let merchant = ''
  for (const l of lines.slice(0, 6)) {
    const letters = (l.match(/[A-Za-z]/g) ?? []).length
    if (letters >= 3 && letters / l.length > 0.55 && !/^(tax invoice|invoice|receipt|cash memo|bill|welcome|gstin|tel|ph|store\s*#?\s*\d|shop\s*#?\s*\d|branch|outlet|order|date|duplicate|copy)/i.test(l)) {
      merchant = l.replace(/[^A-Za-z0-9&'.,\- ]/g, '').trim()
      break
    }
  }

  // Total
  let total: number | undefined
  const totalLines = lines.filter((l) => /(grand\s*total|total\s*(amount|due|payable)?|amount\s*(due|payable)|net\s*(amount|payable)|balance\s*due|\bamt\b)/i.test(l) && !/sub\s*-?\s*total|total\s*(items?|qty|saving|discount)|tax/i.test(l))
  for (const l of totalLines.reverse()) {
    const a = amountsIn(l)
    if (a.length) {
      total = Math.max(...a)
      break
    }
  }
  const all = lines.flatMap(amountsIn)
  if (total === undefined && all.length) total = Math.max(...all)

  // Tax
  let tax: number | undefined
  for (const l of lines) {
    if (/(gst|vat|sales\s*tax|\btax\b|cgst|sgst)/i.test(l) && !/total/i.test(l)) {
      const a = amountsIn(l)
      if (a.length) tax = (tax ?? 0) + a[a.length - 1]
    }
  }
  if (tax !== undefined && total !== undefined && tax >= total) tax = undefined

  return { merchant, total, tax, ts: parseDate(raw), category: guessCategory(raw) }
}
