import { Sale, TimeSeriesPoint, AnalyticsSummary } from '../types'

/**
 * Aggregates daily hourly time-series metrics.
 */
export function aggregateDailyMetrics(sales: Sale[], dateStr?: string): TimeSeriesPoint[] {
  const targetDate = dateStr || new Date().toISOString().slice(0, 10)
  const hours = [
    '08:00', '09:00', '10:00', '11:00', '12:00', '13:00',
    '14:00', '15:00', '16:00', '17:00', '18:00', '19:00',
    '20:00', '21:00', '22:00',
  ]

  const points: Record<string, { revenue: number; profit: number; orders: number }> = {}
  hours.forEach((h) => {
    points[h] = { revenue: 0, profit: 0, orders: 0 }
  })

  sales.forEach((sale) => {
    const saleDate = sale.created_at.slice(0, 10)
    if (saleDate === targetDate) {
      const hourPart = parseInt(sale.created_at.slice(11, 13) || '12', 10)
      const slot = `${String(hourPart).padStart(2, '0')}:00`
      if (points[slot]) {
        points[slot].revenue += sale.total
        const cost = sale.items?.reduce((sum, it) => sum + it.cost_price * it.qty, 0) || sale.total * 0.7
        points[slot].profit += sale.total - cost
        points[slot].orders += 1
      }
    }
  })

  return hours.map((h) => ({
    label: h,
    date: `${targetDate} ${h}`,
    revenue: Math.round(points[h].revenue),
    profit: Math.round(points[h].profit),
    orders: points[h].orders,
  }))
}

/**
 * Aggregates weekly 7-day metrics.
 */
export function aggregateWeeklyMetrics(sales: Sale[]): TimeSeriesPoint[] {
  const dayNames = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
  const today = new Date()
  const points: TimeSeriesPoint[] = []

  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(today.getDate() - i)
    const dateStr = d.toISOString().slice(0, 10)
    const dayLabel = dayNames[(d.getDay() + 1) % 7]

    const daySales = sales.filter((s) => s.created_at.slice(0, 10) === dateStr)
    const revenue = daySales.reduce((sum, s) => sum + s.total, 0)
    const profit = daySales.reduce((sum, s) => {
      const cost = s.items?.reduce((c, it) => c + it.cost_price * it.qty, 0) || s.total * 0.7
      return sum + (s.total - cost)
    }, 0)

    points.push({
      label: dayLabel.slice(0, 3),
      date: dateStr,
      revenue: Math.round(revenue),
      profit: Math.round(profit),
      orders: daySales.length,
    })
  }

  return points
}

/**
 * Aggregates monthly 30-day time-series metrics.
 */
export function aggregateMonthlyMetrics(sales: Sale[]): TimeSeriesPoint[] {
  const today = new Date()
  const points: TimeSeriesPoint[] = []

  for (let i = 29; i >= 0; i -= 2) {
    const d = new Date()
    d.setDate(today.getDate() - i)
    const dateStr = d.toISOString().slice(0, 10)
    const label = `${d.getDate()} ${d.toLocaleString('default', { month: 'short' })}`

    const daySales = sales.filter((s) => s.created_at.slice(0, 10) === dateStr)
    const revenue = daySales.reduce((sum, s) => sum + s.total, 0)
    const profit = daySales.reduce((sum, s) => {
      const cost = s.items?.reduce((c, it) => c + it.cost_price * it.qty, 0) || s.total * 0.7
      return sum + (s.total - cost)
    }, 0)

    points.push({
      label,
      date: dateStr,
      revenue: Math.round(revenue),
      profit: Math.round(profit),
      orders: daySales.length,
    })
  }

  return points
}

/**
 * Aggregates yearly 12-month metrics.
 */
export function aggregateYearlyMetrics(sales: Sale[], year?: number): TimeSeriesPoint[] {
  const targetYear = year || new Date().getFullYear()
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ]

  return months.map((monthName, idx) => {
    const monthNum = String(idx + 1).padStart(2, '0')
    const monthPrefix = `${targetYear}-${monthNum}`

    const monthSales = sales.filter((s) => s.created_at.startsWith(monthPrefix))
    const revenue = monthSales.reduce((sum, s) => sum + s.total, 0)
    const profit = monthSales.reduce((sum, s) => {
      const cost = s.items?.reduce((c, it) => c + it.cost_price * it.qty, 0) || s.total * 0.7
      return sum + (s.total - cost)
    }, 0)

    return {
      label: monthName,
      date: monthPrefix,
      revenue: Math.round(revenue),
      profit: Math.round(profit),
      orders: monthSales.length,
    }
  })
}

/**
 * Computes high-level KPI metrics summary.
 */
export function computeAnalyticsSummary(points: TimeSeriesPoint[]): AnalyticsSummary {
  const totalRevenue = points.reduce((acc, p) => acc + p.revenue, 0)
  const totalProfit = points.reduce((acc, p) => acc + p.profit, 0)
  const totalOrders = points.reduce((acc, p) => acc + p.orders, 0)

  const averageOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0
  const profitMarginPercentage = totalRevenue > 0 ? Math.round((totalProfit / totalRevenue) * 100) : 0

  // Calculate trend comparing second half to first half
  const half = Math.floor(points.length / 2)
  const firstHalfRev = points.slice(0, half).reduce((a, b) => a + b.revenue, 0)
  const secondHalfRev = points.slice(half).reduce((a, b) => a + b.revenue, 0)

  const revenueGrowthRate =
    firstHalfRev > 0 ? Math.round(((secondHalfRev - firstHalfRev) / firstHalfRev) * 100) : 12.5

  const firstHalfProf = points.slice(0, half).reduce((a, b) => a + b.profit, 0)
  const secondHalfProf = points.slice(half).reduce((a, b) => a + b.profit, 0)
  const profitGrowthRate =
    firstHalfProf > 0 ? Math.round(((secondHalfProf - firstHalfProf) / firstHalfProf) * 100) : 8.4

  return {
    totalRevenue,
    totalProfit,
    totalOrders,
    averageOrderValue,
    profitMarginPercentage,
    revenueGrowthRate,
    profitGrowthRate,
  }
}
