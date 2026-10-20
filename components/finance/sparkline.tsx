export function Sparkline({
  data,
  positive,
  width = 72,
  height = 28,
}: {
  data?: number[]
  positive: boolean
  width?: number
  height?: number
}) {
  if (!data || data.length < 2) return <svg width={width} height={height} aria-hidden="true" />
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * width
      const y = height - 2 - ((v - min) / range) * (height - 4)
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true" className="overflow-visible">
      <polyline
        points={points}
        fill="none"
        strokeWidth={1}
        strokeLinejoin="round"
        strokeLinecap="round"
        className={positive ? 'stroke-positive' : 'stroke-muted-foreground'}
      />
    </svg>
  )
}
