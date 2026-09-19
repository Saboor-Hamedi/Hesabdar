import { useState, useMemo } from 'react'
import type { TimeSeriesPoint } from '../../../../core/types'
import { GraphTooltip } from './GraphTooltip'

export interface YearlyGraphProps {
  data: TimeSeriesPoint[]
  height?: number
}

/**
 * YearlyGraph: 12-month comparative performance bar chart.
 * Features 5px rounded bars, monthly trendline, and hover inspection.
 */
export function YearlyGraph({ data, height = 220 }: YearlyGraphProps) {
  const [hoveredPoint, setHoveredPoint] = useState<{ point: TimeSeriesPoint; x: number; y: number } | null>(null)

  const maxVal = useMemo(() => {
    const max = Math.max(...data.map((d) => Math.max(d.revenue, d.profit, 100)), 1000)
    return Math.ceil(max * 1.15)
  }, [data])

  const padding = { top: 20, right: 20, bottom: 30, left: 45 }
  const width = 600

  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom

  const slotWidth = chartWidth / Math.max(data.length, 1)
  const barWidth = Math.min(slotWidth * 0.42, 22)

  // Calculate coordinates for profit trendline overlay
  const profitCoords = useMemo(() => {
    return data.map((d, i) => {
      const x = padding.left + i * slotWidth + slotWidth / 2
      const y = padding.top + chartHeight - (d.profit / maxVal) * chartHeight
      return { x, y, data: d }
    })
  }, [data, maxVal, slotWidth, chartHeight, padding.left, padding.top])

  const profitLinePath = useMemo(() => {
    if (profitCoords.length === 0) return ''
    return profitCoords.reduce((acc, c, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`, '')
  }, [profitCoords])

  return (
    <div className="relative w-full overflow-hidden select-none">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto overflow-visible"
      >
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
                className="stroke-gray-100 dark:stroke-slate-800"
                strokeWidth="1"
                strokeDasharray={ratio === 0 ? 'none' : '3 3'}
              />
              <text
                x={padding.left - 8}
                y={y + 3}
                textAnchor="end"
                className="text-[9px] fill-gray-400 dark:fill-slate-500 font-mono"
              >
                {Math.round(maxVal * ratio)}
              </text>
            </g>
          )
        })}

        {/* 12 Monthly Bars */}
        {data.map((d, i) => {
          const xCenter = padding.left + i * slotWidth + slotWidth / 2
          const revHeight = (d.revenue / maxVal) * chartHeight
          const barY = padding.top + chartHeight - revHeight
          const barX = xCenter - barWidth / 2

          return (
            <g key={i}>
              {/* Month label */}
              <text
                x={xCenter}
                y={height - 10}
                textAnchor="middle"
                className="text-[9px] fill-gray-500 dark:fill-slate-400 font-medium"
              >
                {d.label}
              </text>

              {/* Revenue bar with 5px top radius */}
              <rect
                x={barX}
                y={barY}
                width={barWidth}
                height={Math.max(revHeight, 2)}
                rx="5"
                ry="5"
                fill="#2D7A66"
                className="cursor-pointer hover:fill-[#246252] transition-colors"
                onMouseEnter={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect()
                  setHoveredPoint({ point: d, x: rect.left + rect.width / 2, y: rect.top })
                }}
                onMouseLeave={() => setHoveredPoint(null)}
              />
            </g>
          )
        })}

        {/* Profit Trendline over bars */}
        <path d={profitLinePath} fill="none" stroke="#D97706" strokeWidth="2.5" strokeLinecap="round" />

        {/* Profit data points */}
        {profitCoords.map((c, i) => (
          <circle
            key={i}
            cx={c.x}
            cy={c.y}
            r={3.5}
            fill="#ffffff"
            stroke="#D97706"
            strokeWidth="2"
          />
        ))}
      </svg>

      {/* Floating tooltip */}
      {hoveredPoint && (
        <GraphTooltip point={hoveredPoint.point} x={hoveredPoint.x} y={hoveredPoint.y} />
      )}
    </div>
  )
}
