import { useState, useMemo } from 'react'
import type { TimeSeriesPoint } from '../../../../core/types'
import { GraphTooltip } from './GraphTooltip'

export interface DailyGraphProps {
  data: TimeSeriesPoint[]
  height?: number
}

/**
 * DailyGraph: Visualizes today's hourly revenue and profit distribution.
 * Rendered using lightweight native SVG vector paths with hover tooltip.
 */
export function DailyGraph({ data, height = 220 }: DailyGraphProps) {
  const [hoveredPoint, setHoveredPoint] = useState<{ point: TimeSeriesPoint; x: number; y: number } | null>(null)

  // Calculate coordinate ranges
  const maxVal = useMemo(() => {
    const max = Math.max(...data.map((d) => Math.max(d.revenue, d.profit, 100)), 1000)
    return Math.ceil(max * 1.15)
  }, [data])

  const padding = { top: 20, right: 20, bottom: 30, left: 45 }
  const width = 600

  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom

  // Map data to SVG coordinates
  const coords = useMemo(() => {
    if (data.length <= 1) return []
    return data.map((d, i) => {
      const x = padding.left + (i / (data.length - 1)) * chartWidth
      const yRev = padding.top + chartHeight - (d.revenue / maxVal) * chartHeight
      const yProf = padding.top + chartHeight - (d.profit / maxVal) * chartHeight
      return { x, yRev, yProf, data: d }
    })
  }, [data, maxVal, chartWidth, chartHeight, padding.left, padding.top])

  // Build SVG path strings
  const revenueLinePath = useMemo(() => {
    if (coords.length === 0) return ''
    return coords.reduce((acc, c, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${c.x} ${c.yRev}`, '')
  }, [coords])

  const revenueAreaPath = useMemo(() => {
    if (coords.length === 0) return ''
    const base = padding.top + chartHeight
    return `${revenueLinePath} L ${coords[coords.length - 1].x} ${base} L ${coords[0].x} ${base} Z`
  }, [revenueLinePath, coords, padding.top, chartHeight])

  const profitLinePath = useMemo(() => {
    if (coords.length === 0) return ''
    return coords.reduce((acc, c, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${c.x} ${c.yProf}`, '')
  }, [coords])

  return (
    <div className="relative w-full overflow-hidden select-none">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto overflow-visible"
      >
        <defs>
          {/* Revenue gradient fill */}
          <linearGradient id="dailyRevGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2D7A66" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#2D7A66" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Horizontal grid guide lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
          const y = padding.top + chartHeight * (1 - ratio)
          return (
            <g key={idx}>
              <line
                x1={padding.left}
                y1={y}
                x2={width - padding.right}
                y2={y}
                stroke="#f3f4f6"
                strokeWidth="1"
                strokeDasharray={ratio === 0 ? 'none' : '3 3'}
              />
              <text
                x={padding.left - 8}
                y={y + 3}
                textAnchor="end"
                className="text-[9px] fill-gray-400 font-mono"
              >
                {Math.round(maxVal * ratio)}
              </text>
            </g>
          )
        })}

        {/* Area and Line for Revenue */}
        <path d={revenueAreaPath} fill="url(#dailyRevGradient)" />
        <path d={revenueLinePath} fill="none" stroke="#2D7A66" strokeWidth="2.5" strokeLinecap="round" />

        {/* Line for Profit */}
        <path d={profitLinePath} fill="none" stroke="#D97706" strokeWidth="2" strokeDasharray="4 3" />

        {/* Data points & X axis hour labels */}
        {coords.map((c, i) => (
          <g key={i}>
            {/* X-axis tick label */}
            {i % 2 === 0 && (
              <text
                x={c.x}
                y={height - 10}
                textAnchor="middle"
                className="text-[9px] fill-gray-400 font-mono"
              >
                {c.data.label}
              </text>
            )}

            {/* Interactive hover trigger */}
            <circle
              cx={c.x}
              cy={c.yRev}
              r={hoveredPoint?.point === c.data ? 5 : 3.5}
              fill="#ffffff"
              stroke="#2D7A66"
              strokeWidth="2.5"
              className="cursor-pointer transition-all duration-100"
              onMouseEnter={(e) => {
                const rect = e.currentTarget.getBoundingClientRect()
                setHoveredPoint({ point: c.data, x: rect.left + rect.width / 2, y: rect.top })
              }}
              onMouseLeave={() => setHoveredPoint(null)}
            />
          </g>
        ))}
      </svg>

      {/* Hover tooltip */}
      {hoveredPoint && (
        <GraphTooltip point={hoveredPoint.point} x={hoveredPoint.x} y={hoveredPoint.y} />
      )}
    </div>
  )
}
