export type Quote = {
  name: string
  price: number
  prevClose: number
  change: number
  dayHigh?: number
  dayLow?: number
  volume?: number
  week52Low?: number
  week52High?: number
  series: number[]
}

const HOSTS = ['query1.finance.yahoo.com', 'query2.finance.yahoo.com']

// In the Android app, Capacitor's native HTTP layer (enabled in capacitor.config.ts) bypasses CORS,
// so this works from the WebView. Returns null if offline / unknown symbol.
export async function fetchQuote(symbol: string): Promise<Quote | null> {
  for (const host of HOSTS) {
    try {
      const ctl = new AbortController()
      const timer = setTimeout(() => ctl.abort(), 8000)
      const res = await fetch(`https://${host}/v8/finance/chart/${encodeURIComponent(symbol)}?range=1mo&interval=1d`, {
        signal: ctl.signal,
      })
      clearTimeout(timer)
      if (!res.ok) continue
      const json = await res.json()
      const r = json?.chart?.result?.[0]
      const m = r?.meta
      if (!m || typeof m.regularMarketPrice !== 'number') continue
      const closes: number[] = (r.indicators?.quote?.[0]?.close ?? []).filter((v: unknown) => typeof v === 'number')
      const series = [...closes.slice(-10)]
      if (series.length && series[series.length - 1] !== m.regularMarketPrice) series.push(m.regularMarketPrice)
      const prev = m.chartPreviousClose ?? m.previousClose ?? closes[closes.length - 2] ?? m.regularMarketPrice
      return {
        name: m.shortName || m.longName || symbol,
        price: m.regularMarketPrice,
        prevClose: prev,
        change: prev ? ((m.regularMarketPrice - prev) / prev) * 100 : 0,
        dayHigh: m.regularMarketDayHigh,
        dayLow: m.regularMarketDayLow,
        volume: m.regularMarketVolume,
        week52Low: m.fiftyTwoWeekLow,
        week52High: m.fiftyTwoWeekHigh,
        series,
      }
    } catch {
      /* try next host */
    }
  }
  return null
}
