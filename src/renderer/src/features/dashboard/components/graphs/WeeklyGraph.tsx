import { useState, useMemo } from 'react'
import { BarChart3, LineChart } from 'lucide-react'
import type { TimeSeriesPoint } from '../../../../core/types'
import { GraphTooltip } from './GraphTooltip'

export interface WeeklyGraphProps {
  data: TimeSeriesPoint[]
  height?: number
}

/**
 * WeeklyGraph: 7-day comparative performance graph for daily revenue and profit.
 * Features dual representation (Bars vs Smooth Trend) to address single-day spikes (e.g. Thursday),
 * minimum visible bar heights to prevent zero flatlining, and colorblind-accessible Sage Teal / Deep Amber palette.
 */
export function WeeklyGraph({ data, height = 240 }: WeeklyGraphProps) {
  const [hoveredPoint, setHoveredPoint] = useState<{ point: TimeSeriesPoint; x: number; y: number } | null>(null)
  const [viewType, setViewType] = useState<'bars' | 'trend'>('bars')

  const maxVal = useMemo(() => {
    const max = Math.max(...data.map((d) => Math.max(d.revenue, d.profit, 100)), 500)
    return Math.ceil(max * 1.15)
  }, [data])

  const padding = { top: 25, right: 20, bottom: 35, left: 55 }
  const width = 600

  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom

  const slotWidth = chartWidth / Math.max(data.length, 1)
  const barWidth = Math.min(slotWidth * 0.32, 20)

  // Coordinates for Trendline mode
  const trendCoords = useMemo(() => {
    if (data.length <= 1) return []
    return data.map((d, i) => {
      const x = padding.left + i * slotWidth + slotWidth / 2
      const yRev = padding.top + chartHeight - (d.revenue / maxVal) * chartHeight
      const yProf = padding.top + chartHeight - (d.profit / maxVal) * chartHeight
      return { x, yRev, yProf, data: d }
    })
  }, [data, maxVal, slotWidth, chartHeight, padding.left, padding.top])

  const revLinePath = useMemo(() => {
    if (trendCoords.length === 0) return ''
    return trendCoords.reduce((acc, c, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${c.x} ${c.yRev}`, '')
  }, [trendCoords])

  const revAreaPath = useMemo(() => {
    if (trendCoords.length === 0) return ''
    const base = padding.top + chartHeight
    return `${revLinePath} L ${trendCoords[trendCoords.length - 1].x} ${base} L ${trendCoords[0].x} ${base} Z`
  }, [revLinePath, trendCoords, padding.top, chartHeight])

  const profLinePath = useMemo(() => {
    if (trendCoords.length === 0) return ''
    return trendCoords.reduce((acc, c, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${c.x} ${c.yProf}`, '')
  }, [trendCoords])

  return (
    <div className="relative w-full overflow-hidden select-none">
      {/* View Mode Switcher (Bars vs Trendline) */}
      <div className="flex justify-end mb-1 px-1">
        <div className="inline-flex items-center p-0.5 bg-gray-100 rounded-[6px] border border-gray-200/70 text-[10px]">
          <button
            type="button"
            onClick={() => setViewType('bars')}
            className={`flex items-center gap-1 px-2 py-0.5 rounded-[4px] font-medium transition-all ${
              viewType === 'bars'
                ? 'bg-white text-gray-900 shadow-2xs font-semibold'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <BarChart3 className="w-3 h-3 text-[#2D7A66]" />
            Bars
          </button>
          <button
            type="button"
            onClick={() => setViewType('trend')}
            className={`flex items-center gap-1 px-2 py-0.5 rounded-[4px] font-medium transition-all ${
              viewType === 'trend'
                ? 'bg-white text-gray-900 shadow-2xs font-semibold'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <LineChart className="w-3 h-3 text-[#D97706]" />
            Trend
          </button>
        </div>
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto overflow-visible"
      >
        <defs>
          <linearGradient id="weeklyRevGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2D7A66" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#2D7A66" stopOpacity="0.02" />
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
                {Math.round(maxVal * ratio) > 1000
                  ? `${Math.round((maxVal * ratio) / 1000)}k`
                  : Math.round(maxVal * ratio)}
              </text>
            </g>
          )
        })}

        {/* Trend Area & Lines Mode */}
        {viewType === 'trend' ? (
          <>
            <path d={revAreaPath} fill="url(#weeklyRevGrad)" />
            <path d={revLinePath} fill="none" stroke="#2D7A66" strokeWidth="2.5" strokeLinecap="round" />
            <path d={profLinePath} fill="none" stroke="#D97706" strokeWidth="2" strokeDasharray="4 3" strokeLinecap="round" />

            {trendCoords.map((c, i) => (
              <g key={i}>
                <text
                  x={c.x}
                  y={height - 12}
                  textAnchor="middle"
                  className="text-[10px] fill-gray-500 font-semibold"
                >
                  {c.data.label}
                </text>

                {/* Revenue circle indicator */}
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

                {/* Profit circle indicator */}
                <circle
                  cx={c.x}
                  cy={c.yProf}
                  r={hoveredPoint?.point === c.data ? 4.5 : 3}
                  fill="#ffffff"
                  stroke="#D97706"
                  strokeWidth="2"
                  className="cursor-pointer transition-all duration-100"
                  onMouseEnter={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect()
                    setHoveredPoint({ point: c.data, x: rect.left + rect.width / 2, y: rect.top })
                  }}
                  onMouseLeave={() => setHoveredPoint(null)}
                />
              </g>
            ))}
          </>
        ) : (
          /* Grouped Dual Bar Mode with minimum visible height for non-zero days */
          data.map((d, i) => {
            const groupCenter = padding.left + i * slotWidth + slotWidth / 2
            // Ensure any non-zero day gets at least 5px minimum height to prevent visual dead space/flatline
            const rawRevHeight = (d.revenue / maxVal) * chartHeight
            const revHeight = d.revenue > 0 ? Math.max(rawRevHeight, 5) : 0

            const rawProfHeight = (d.profit / maxVal) * chartHeight
            const profHeight = d.profit > 0 ? Math.max(rawProfHeight, 4) : 0

            const revY = padding.top + chartHeight - revHeight
            const profY = padding.top + chartHeight - profHeight

            const revX = groupCenter - barWidth - 2
            const profX = groupCenter + 2

            return (
              <g key={i}>
                {/* Day of week text label */}
                <text
                  x={groupCenter}
                  y={height - 12}
                  textAnchor="middle"
                  className="text-[10px] fill-gray-500 font-semibold"
                >
                  {d.label}
                </text>

                {/* Revenue bar with 6px top radius and accessible Sage Teal #2D7A66 */}
                <rect
                  x={revX}
                  y={revY}
                  width={barWidth}
                  height={revHeight}
                  rx="4"
                  ry="4"
                  fill="#2D7A66"
                  className="cursor-pointer hover:fill-[#246252] transition-colors"
                  onMouseEnter={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect()
                    setHoveredPoint({ point: d, x: rect.left + rect.width / 2, y: rect.top })
                  }}
                  onMouseLeave={() => setHoveredPoint(null)}
                />

                {/* Profit bar with 6px top radius and accessible Deep Amber #D97706 */}
                <rect
                  x={profX}
                  y={profY}
                  width={barWidth}
                  height={profHeight}
                  rx="4"
                  ry="4"
                  fill="#D97706"
                  className="cursor-pointer hover:fill-[#B45309] transition-colors"
                  onMouseEnter={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect()
                    setHoveredPoint({ point: d, x: rect.left + rect.width / 2, y: rect.top })
                  }}
                  onMouseLeave={() => setHoveredPoint(null)}
                />
              </g>
            )
          })
        )}
      </svg>

      {/* Floating tooltip */}
      {hoveredPoint && (
        <GraphTooltip point={hoveredPoint.point} x={hoveredPoint.x} y={hoveredPoint.y} />
      )}
    </div>
  )
}
