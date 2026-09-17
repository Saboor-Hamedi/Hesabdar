import { useTranslation } from 'react-i18next'
import { DollarSign, TrendingUp, ShoppingBag, Percent, ArrowUpRight } from 'lucide-react'
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
      <div className="bg-white border border-gray-200/80 rounded-[8px] p-3.5 shadow-xs">
        <GraphHeader period={period} onChangePeriod={setPeriod} title={t('dashboard.performanceTrends')} />

        {/* Separated Graphs rendered according to active period */}
        <div className="pt-2">
          {period === 'daily' && <DailyGraph data={dailyData} height={250} />}
          {period === 'weekly' && <WeeklyGraph data={weeklyData} height={250} />}
          {period === 'monthly' && <MonthlyGraph data={monthlyData} height={250} />}
          {period === 'yearly' && <YearlyGraph data={yearlyData} height={250} />}
        </div>
      </div>

      {/* Analytics Breakdown & Sales Distribution per suggestion.md */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {/* 1. Payment Distribution */}
        <Card title="Payment Distribution" subtitle="Cash transactions vs Credit debt">
          <div className="flex flex-col gap-2 pt-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600 flex items-center gap-1.5 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-[#2D7A66]" />
                Cash ({cashSales.length} {cashSales.length === 1 ? 'order' : 'orders'})
              </span>
              <span className="font-mono font-bold text-gray-900">{formatCurrency(cashTotal)} AFN</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600 flex items-center gap-1.5 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-[#D97706]" />
                Credit ({creditSales.length} {creditSales.length === 1 ? 'order' : 'orders'})
              </span>
              <span className="font-mono font-bold text-gray-900">{formatCurrency(creditTotal)} AFN</span>
            </div>

            {/* Proportion Bar */}
            {(() => {
              const totalAmount = cashTotal + creditTotal
              const cashPct = totalAmount > 0 ? Math.round((cashTotal / totalAmount) * 100) : 100
              const creditPct = 100 - cashPct
              return (
                <div className="mt-1">
                  <div className="w-full h-2 rounded-full bg-gray-100 flex overflow-hidden">
                    <div
                      style={{ width: `${cashPct}%` }}
                      className="bg-[#2D7A66] h-full transition-all duration-300"
                      title={`Cash: ${cashPct}%`}
                    />
                    <div
                      style={{ width: `${creditPct}%` }}
                      className="bg-[#D97706] h-full transition-all duration-300"
                      title={`Credit: ${creditPct}%`}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-1 text-[10px] text-gray-400 font-medium">
                    <span className="text-[#2D7A66] font-semibold">{cashPct}% Cash Dominance</span>
                    <span className="text-gray-400">{creditPct}% Credit Tab</span>
                  </div>
                </div>
              )
            })()}
          </div>
        </Card>

        {/* 2. Average Order Value (AOV) */}
        <Card title="Average Order Value" subtitle="Basket size per customer">
          <div className="flex flex-col gap-2 pt-1">
            <div className="flex items-baseline justify-between">
              <span className="text-xl font-mono font-bold text-gray-900">
                {formatCurrency(summary.averageOrderValue)} <span className="text-xs font-semibold text-gray-400">AFN</span>
              </span>
              <span className="text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-200/70 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1 shadow-2xs">
                <ArrowUpRight className="w-3 h-3 text-emerald-600" /> Normal
              </span>
            </div>
            <p className="text-[11px] text-gray-400 mt-1 font-medium">
              Validated across {sales.length} orders (typical basket spend)
            </p>
          </div>
        </Card>

        {/* 3. Trading Activity */}
        <Card title="Trading Activity" subtitle="Sales volume in system">
          <div className="flex flex-col gap-2 pt-1">
            <div className="flex items-baseline justify-between">
              <span className="text-xl font-mono font-bold text-gray-900">
                {sales.length} <span className="text-xs font-semibold text-gray-400">Invoices</span>
              </span>
              <span className="text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-200/70 px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1.5 shadow-2xs">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                Live
              </span>
            </div>
            <p className="text-[11px] text-gray-400 mt-1 font-medium">
              Real-time ledger transactions recorded
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default DashboardView
