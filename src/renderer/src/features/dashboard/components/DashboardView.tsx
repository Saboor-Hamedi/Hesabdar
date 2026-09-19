import { useTranslation } from 'react-i18next'
import { DollarSign, TrendingUp, ShoppingBag, Percent, ArrowUpRight, LayoutDashboard } from 'lucide-react'
import { useDashboardData } from '../hooks/useDashboardData'
import { PageHeader } from '../../../components/layout/PageHeader'
import { StatsGrid } from '../../../components/ui/StatCard'
import { MetricCard } from './MetricCard'
import { GraphHeader } from './graphs/GraphHeader'
import { DailyGraph } from './graphs/DailyGraph'
import { WeeklyGraph } from './graphs/WeeklyGraph'
import { MonthlyGraph } from './graphs/MonthlyGraph'
import { YearlyGraph } from './graphs/YearlyGraph'
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
    <div className="flex flex-col h-full min-h-0 gap-2 max-w-7xl mx-auto w-full select-none overflow-y-auto pr-1">
      {/* Unified Page Header */}
      <PageHeader
        title={t('nav.dashboard', 'Business Analytics')}
        subtitle={t('dashboard.performanceTrends', 'Live performance trends, sales metrics, and profit margins')}
        icon={LayoutDashboard}
      />

      {/* 4 Primary Standardized KPI Summary Metric Cards (Compact) */}
      <StatsGrid className="gap-2">
        <MetricCard
          title={t('dashboard.totalRevenue')}
          value={formatCurrency(summary.totalRevenue)}
          trendPercentage={summary.revenueGrowthRate}
          subtitle={t('dashboard.acrossTimeframe', { period: t(`graphs.${period}`) })}
          icon={<DollarSign className="w-3.5 h-3.5 text-emerald-600" />}
        />
        <MetricCard
          title={t('dashboard.netProfit')}
          value={formatCurrency(summary.totalProfit)}
          trendPercentage={summary.profitGrowthRate}
          subtitle={t('dashboard.revenueMinusCosts')}
          icon={<TrendingUp className="w-3.5 h-3.5 text-amber-600" />}
        />
        <MetricCard
          title={t('dashboard.totalOrders')}
          value={formatNumber(summary.totalOrders)}
          subtitle={t('dashboard.avgPerOrder', { amount: formatCurrency(summary.averageOrderValue) })}
          icon={<ShoppingBag className="w-3.5 h-3.5 text-blue-600" />}
        />
        <MetricCard
          title={t('dashboard.profitMargin')}
          value={`${summary.profitMarginPercentage}%`}
          subtitle={t('dashboard.netReturn')}
          icon={<Percent className="w-3.5 h-3.5 text-purple-600" />}
        />
      </StatsGrid>

      {/* Main Chart Container with Compact Period Switcher & Height */}
      <div className="bg-white dark:bg-slate-900 border border-gray-200/80 dark:border-slate-800 rounded-xl p-2 shadow-xs">
        <GraphHeader period={period} onChangePeriod={setPeriod} title={t('dashboard.performanceTrends')} />

        {/* Separated Graphs rendered according to active period with compact 115px height */}
        <div className="pt-0.5">
          {period === 'daily' && <DailyGraph data={dailyData} height={115} />}
          {period === 'weekly' && <WeeklyGraph data={weeklyData} height={115} />}
          {period === 'monthly' && <MonthlyGraph data={monthlyData} height={115} />}
          {period === 'yearly' && <YearlyGraph data={yearlyData} height={115} />}
        </div>
      </div>

      {/* Analytics Breakdown & Sales Distribution (Pushed Up & Fully Visible) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pb-1">
        {/* 1. Payment Distribution */}
        <div className="bg-white dark:bg-slate-900 border border-gray-200/80 dark:border-slate-800 rounded-xl p-2.5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-1.5 mb-1.5">
            <div>
              <h3 className="text-xs font-semibold text-gray-800 dark:text-slate-100">Payment Distribution</h3>
              <p className="text-[10px] text-gray-400 dark:text-slate-400">Cash vs Credit debt</p>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600 dark:text-slate-300 flex items-center gap-1.5 font-medium">
                <span className="w-2 h-2 rounded-full bg-[#2D7A66]" />
                Cash ({cashSales.length} {cashSales.length === 1 ? 'order' : 'orders'})
              </span>
              <span className="font-mono font-bold text-gray-900 dark:text-slate-100">{formatCurrency(cashTotal)} AFN</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600 dark:text-slate-300 flex items-center gap-1.5 font-medium">
                <span className="w-2 h-2 rounded-full bg-[#D97706]" />
                Credit ({creditSales.length} {creditSales.length === 1 ? 'order' : 'orders'})
              </span>
              <span className="font-mono font-bold text-gray-900 dark:text-slate-100">{formatCurrency(creditTotal)} AFN</span>
            </div>

            {/* Proportion Bar */}
            {(() => {
              const totalAmount = cashTotal + creditTotal
              const cashPct = totalAmount > 0 ? Math.round((cashTotal / totalAmount) * 100) : 100
              const creditPct = 100 - cashPct
              return (
                <div className="mt-0.5">
                  <div className="w-full h-1.5 rounded-full bg-gray-100 dark:bg-slate-800 flex overflow-hidden">
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
                  <div className="flex items-center justify-between mt-1 text-[9.5px] text-gray-400 dark:text-slate-400 font-medium">
                    <span className="text-[#2D7A66] font-semibold">{cashPct}% Cash Dominance</span>
                    <span className="text-gray-400 dark:text-slate-400">{creditPct}% Credit Tab</span>
                  </div>
                </div>
              )
            })()}
          </div>
        </div>

        {/* 2. Average Order Value (AOV) */}
        <div className="bg-white dark:bg-slate-900 border border-gray-200/80 dark:border-slate-800 rounded-xl p-2.5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-1.5 mb-1.5">
            <div>
              <h3 className="text-xs font-semibold text-gray-800 dark:text-slate-100">Average Order Value</h3>
              <p className="text-[10px] text-gray-400 dark:text-slate-400">Basket size per customer</p>
            </div>
            <span className="text-[10px] text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/70 dark:border-emerald-800/50 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1 shadow-2xs">
              <ArrowUpRight className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> Normal
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-lg font-mono font-bold text-gray-900 dark:text-slate-100">
              {formatCurrency(summary.averageOrderValue)} <span className="text-xs font-semibold text-gray-400 dark:text-slate-400">AFN</span>
            </span>
            <p className="text-[10px] text-gray-400 dark:text-slate-400 font-medium">
              Validated across {sales.length} orders (typical basket spend)
            </p>
          </div>
        </div>

        {/* 3. Trading Activity */}
        <div className="bg-white dark:bg-slate-900 border border-gray-200/80 dark:border-slate-800 rounded-xl p-2.5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-1.5 mb-1.5">
            <div>
              <h3 className="text-xs font-semibold text-gray-800 dark:text-slate-100">Trading Activity</h3>
              <p className="text-[10px] text-gray-400 dark:text-slate-400">Sales volume in system</p>
            </div>
            <span className="text-[10px] text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/70 dark:border-emerald-800/50 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1.5 shadow-2xs">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
              </span>
              Live
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-lg font-mono font-bold text-gray-900 dark:text-slate-100">
              {sales.length} <span className="text-xs font-semibold text-gray-400 dark:text-slate-400">Invoices</span>
            </span>
            <p className="text-[10px] text-gray-400 dark:text-slate-400 font-medium">
              Real-time ledger transactions recorded
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardView
