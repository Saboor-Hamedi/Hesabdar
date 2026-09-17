import { useState, useMemo } from 'react'
import type { TimeSeriesPoint } from '../../../../core/types'
import { GraphTooltip } from './GraphTooltip'

export interface WeeklyGraphProps {
  data: TimeSeriesPoint[]
  height?: number
}

/**
 * WeeklyGraph: 7-day comparative bar graph for daily revenue and profit.
 * Bars use 5px rounded top corners and support interactive hover tooltips.
 */
export function WeeklyGraph({ data, height = 220 }: WeeklyGraphProps) {
  const [hoveredPoint, setHoveredPoint] = useState<{ point: TimeSeriesPoint; x: number; y: number } | null>(null)

  const maxVal = useMemo(() => {
    const max = Math.max(...data.map((d) => Math.max(d.revenue, d.profit, 100)), 500)
    return Math.ceil(max * 1.15)
  }, [data])

  const padding = { top: 20, right: 20, bottom: 30, left: 45 }
  const width = 600

  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom

  const slotWidth = chartWidth / Math.max(data.length, 1)
  const barWidth = Math.min(slotWidth * 0.32, 18)

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

        {/* Render dual bars for each day */}
        {data.map((d, i) => {
          const groupCenter = padding.left + i * slotWidth + slotWidth / 2
          const revHeight = (d.revenue / maxVal) * chartHeight
          const profHeight = (d.profit / maxVal) * chartHeight

          const revY = padding.top + chartHeight - revHeight
          const profY = padding.top + chartHeight - profHeight

          const revX = groupCenter - barWidth - 2
          const profX = groupCenter + 2

          return (
            <g key={i}>
              {/* Day of week text label */}
              <text
                x={groupCenter}
                y={height - 10}
                textAnchor="middle"
                className="text-[10px] fill-gray-500 font-medium"
              >
                {d.label}
              </text>

              {/* Revenue bar with 5px top radius */}
              <rect
                x={revX}
                y={revY}
                width={barWidth}
                height={Math.max(revHeight, 2)}
                rx="5"
                ry="5"
                fill="#10b981"
                className="cursor-pointer hover:fill-[#059669] transition-colors"
                onMouseEnter={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect()
                  setHoveredPoint({ point: d, x: rect.left + rect.width / 2, y: rect.top })
                }}
                onMouseLeave={() => setHoveredPoint(null)}
              />

              {/* Profit bar with 5px top radius */}
              <rect
                x={profX}
                y={profY}
                width={barWidth}
                height={Math.max(profHeight, 2)}
                rx="5"
                ry="5"
                fill="#f59e0b"
                className="cursor-pointer hover:fill-[#d97706] transition-colors"
                onMouseEnter={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect()
                  setHoveredPoint({ point: d, x: rect.left + rect.width / 2, y: rect.top })
                }}
                onMouseLeave={() => setHoveredPoint(null)}
              />
            </g>
          )
        })}
      </svg>

      {/* Floating tooltip */}
      {hoveredPoint && (
        <GraphTooltip point={hoveredPoint.point} x={hoveredPoint.x} y={hoveredPoint.y} />
      )}
    </div>
  )
}
