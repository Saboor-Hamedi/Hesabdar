import { useTranslation } from 'react-i18next'
import { DollarSign, TrendingUp, ShoppingBag, Percent, ArrowUpRight, BarChart2 } from 'lucide-react'
import { useDashboardData } from '../hooks/useDashboardData'
import { MetricCard } from './MetricCard'
import { GraphHeader } from './graphs/GraphHeader'
import { DailyGraph } from './graphs/DailyGraph'
import { WeeklyGraph } from './graphs/WeeklyGraph'
import { MonthlyGraph } from './graphs/MonthlyGraph'
import { YearlyGraph } from './graphs/YearlyGraph'
import { Card } from '../../../components/ui/Card'
import { formatCurrency, formatNumber } from '../../../core/utils/formatters'

/**
 * DashboardView: Analytical command center with separated Daily/Weekly/Monthly/Yearly graphs
 * and primary KPI business metrics. All completed invoices are now managed in SoldView.
 */
export function DashboardView() {
  const { t } = useTranslation()
  const {
    period,
    setPeriod,
    dailyData,
    weeklyData,
    monthlyData,
    yearlyData,
    summary,
    sales,
  } = useDashboardData()

  // Cash vs Credit breakdown
  const cashSales = sales.filter((s) => s.payment_mode === 'cash')
  const creditSales = sales.filter((s) => s.payment_mode === 'credit')
  const cashTotal = cashSales.reduce((sum, s) => sum + s.total, 0)
  const creditTotal = creditSales.reduce((sum, s) => sum + s.total, 0)

  return (
    <div className="flex flex-col gap-4 max-w-7xl mx-auto select-none">
      {/* 4 Primary KPI Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard
          title={t('dashboard.totalRevenue')}
          value={formatCurrency(summary.totalRevenue)}
          trendPercentage={summary.revenueGrowthRate}
          subtitle={t('dashboard.acrossTimeframe', { period: t(`graphs.${period}`) })}
          icon={<DollarSign className="w-4 h-4 text-emerald-600" />}
        />
        <MetricCard
          title={t('dashboard.netProfit')}
          value={formatCurrency(summary.totalProfit)}
          trendPercentage={summary.profitGrowthRate}
          subtitle={t('dashboard.revenueMinusCosts')}
          icon={<TrendingUp className="w-4 h-4 text-amber-600" />}
        />
        <MetricCard
          title={t('dashboard.totalOrders')}
          value={formatNumber(summary.totalOrders)}
          subtitle={t('dashboard.avgPerOrder', { amount: formatCurrency(summary.averageOrderValue) })}
          icon={<ShoppingBag className="w-4 h-4 text-blue-600" />}
        />
        <MetricCard
          title={t('dashboard.profitMargin')}
          value={`${summary.profitMarginPercentage}%`}
          subtitle={t('dashboard.netReturn')}
          icon={<Percent className="w-4 h-4 text-purple-600" />}
        />
      </div>

      {/* Main Chart Container with Period Switcher */}
      <div className="bg-white border border-gray-200/90 rounded-[5px] p-3 shadow-xs">
        <GraphHeader period={period} onChangePeriod={setPeriod} title={t('dashboard.performanceTrends')} />

        {/* Separated Graphs rendered according to active period */}
        <div className="pt-2">
          {period === 'daily' && <DailyGraph data={dailyData} height={250} />}
          {period === 'weekly' && <WeeklyGraph data={weeklyData} height={250} />}
          {period === 'monthly' && <MonthlyGraph data={monthlyData} height={250} />}
          {period === 'yearly' && <YearlyGraph data={yearlyData} height={250} />}
        </div>
      </div>

      {/* Analytics Breakdown & Sales Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card title="Payment Distribution" subtitle="Cash transactions vs Credit debt">
          <div className="flex flex-col gap-2 pt-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600 flex items-center gap-1.5 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Cash ({cashSales.length})
              </span>
              <span className="font-mono font-semibold text-gray-800">{formatCurrency(cashTotal)}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600 flex items-center gap-1.5 font-medium">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                Credit ({creditSales.length})
              </span>
              <span className="font-mono font-semibold text-gray-800">{formatCurrency(creditTotal)}</span>
            </div>
          </div>
        </Card>

        <Card title="Average Order Value" subtitle="Basket size per customer">
          <div className="flex items-baseline justify-between pt-1">
            <span className="text-lg font-mono font-bold text-gray-900">
              {formatCurrency(summary.averageOrderValue)}
            </span>
            <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-[5px] font-medium flex items-center gap-0.5">
              <ArrowUpRight className="w-2.5 h-2.5" /> Normal
            </span>
          </div>
        </Card>

        <Card title="Trading Activity" subtitle="Sales volume in system">
          <div className="flex items-baseline justify-between pt-1">
            <span className="text-lg font-mono font-bold text-gray-900">
              {sales.length} Invoices
            </span>
            <span className="text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-[5px] font-medium flex items-center gap-0.5">
              <BarChart2 className="w-2.5 h-2.5" /> Live
            </span>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default DashboardView
