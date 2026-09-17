import { useState, useMemo, useEffect } from 'react'
import type { GraphPeriod, Sale, TimeSeriesPoint } from '../../../core/types'
import {
  aggregateDailyMetrics,
  aggregateWeeklyMetrics,
  aggregateMonthlyMetrics,
  aggregateYearlyMetrics,
  computeAnalyticsSummary,
} from '../../../core/analytics/engine'
import { getSales, onStoreChange } from '../../../core/store'

/**
 * Hook providing dashboard data, real sales aggregation, and metrics calculation.
 * All dummy data removed; computes live from real transactions.
 */
export function useDashboardData() {
  const [period, setPeriod] = useState<GraphPeriod>('weekly')
  const [sales, setSales] = useState<Sale[]>(() => getSales())

  // Subscribe to live sales recorded in POS
  useEffect(() => {
    setSales(getSales())
    const unsubscribe = onStoreChange(() => {
      setSales(getSales())
    })
    return unsubscribe
  }, [])

  // Aggregate time-series based on current period from REAL sales
  const dailyData: TimeSeriesPoint[] = useMemo(() => aggregateDailyMetrics(sales), [sales])
  const weeklyData: TimeSeriesPoint[] = useMemo(() => aggregateWeeklyMetrics(sales), [sales])
  const monthlyData: TimeSeriesPoint[] = useMemo(() => aggregateMonthlyMetrics(sales), [sales])
  const yearlyData: TimeSeriesPoint[] = useMemo(() => aggregateYearlyMetrics(sales), [sales])

  // Current active series
  const activeSeries = useMemo(() => {
    switch (period) {
      case 'daily':
        return dailyData
      case 'weekly':
        return weeklyData
      case 'monthly':
        return monthlyData
      case 'yearly':
        return yearlyData
    }
  }, [period, dailyData, weeklyData, monthlyData, yearlyData])

  // High-level KPI summary
  const summary = useMemo(() => computeAnalyticsSummary(activeSeries), [activeSeries])

  return {
    period,
    setPeriod,
    dailyData,
    weeklyData,
    monthlyData,
    yearlyData,
    activeSeries,
    summary,
    sales,
  }
}
