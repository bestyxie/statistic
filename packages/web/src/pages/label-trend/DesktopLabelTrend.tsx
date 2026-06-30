import { useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import LabelMultiSelect from './components/LabelMultiSelect'
import MetricToggle from './components/MetricToggle'
import LabelTrendDot from './components/LabelTrendDot'
import LabelProductDrawer, { type LabelProductDrawerTarget } from './components/LabelProductDrawer'
import LabelSalesProductsModal, { type LabelSalesProductsTarget } from './components/LabelSalesProductsModal'
import { useLabelTrend } from './hooks/useLabelTrend'
import type { LabelMetric, LabelTxMetric } from './hooks/useLabelTrend'

const VISITOR_METRICS: readonly { value: LabelMetric; label: string }[] = [
  { value: 'visitor_count', label: '访客数' },
  { value: 'view_count', label: '访问量' },
]

const TX_METRICS: readonly { value: LabelTxMetric; label: string }[] = [
  { value: 'tx_count', label: '笔数' },
  { value: 'tx_amount', label: '金额' },
]

export default function DesktopLabelTrend() {
  const {
    labels,
    labelsLoading,
    selectedIds,
    setSelectedIds,
    start,
    setStart,
    end,
    setEnd,
    metric,
    setMetric,
    chartData,
    txMetric,
    setTxMetric,
    txChartData,
    series,
    loading,
    error,
    salesStart,
    setSalesStart,
    salesEnd,
    setSalesEnd,
    labelSalesRows,
    salesLoading,
  } = useLabelTrend()

  const [drawerTarget, setDrawerTarget] = useState<LabelProductDrawerTarget | null>(null)
  const [salesModalTarget, setSalesModalTarget] = useState<LabelSalesProductsTarget | null>(null)
  const handlePointClick = (date: string | undefined, labelId: string, labelName: string) => {
    if (!date) return
    setDrawerTarget({ label_id: labelId, label_name: labelName, date })
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-800">品牌访客追踪</h1>

      {/* 顶部过滤栏：日期 + 品牌多选（指标在每个图表卡片里切换） */}
      <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-5">
        <div className="flex flex-wrap gap-3 sm:gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">开始日期</label>
            <input
              type="date"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">结束日期</label>
            <input
              type="date"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              品牌 <span className="text-xs font-normal text-gray-500">已选 {selectedIds.size} / {labels.length}</span>
            </label>
            {labelsLoading ? (
              <p className="text-sm text-gray-400 py-2">加载标签中...</p>
            ) : (
              <LabelMultiSelect labels={labels} selectedIds={selectedIds} onChange={setSelectedIds} />
            )}
          </div>
        </div>
      </div>

      {/* 访客趋势图 */}
      <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-5">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h2 className="text-base sm:text-lg font-semibold text-gray-800">每日访客趋势</h2>
          <MetricToggle value={metric} options={VISITOR_METRICS} onChange={setMetric} />
        </div>
        {error ? (
          <p className="text-center text-red-500 py-12 text-sm">{error}</p>
        ) : series.length === 0 ? (
          <p className="text-center text-gray-400 py-12 text-sm">请至少选择一个品牌</p>
        ) : chartData.length === 0 && !loading ? (
          <p className="text-center text-gray-400 py-12 text-sm">所选区间无数据</p>
        ) : (
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
              <Tooltip />
              <Legend />
              {series.map((s) => (
                <Line
                  key={s.label_id}
                  type="monotone"
                  dataKey={s.label_id}
                  name={s.label_name}
                  stroke={s.color}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={
                    <LabelTrendDot
                      color={s.color}
                      labelId={s.label_id}
                      labelName={s.label_name}
                      onPointClick={handlePointClick}
                    />
                  }
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* 成交趋势图 */}
      <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-5">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h2 className="text-base sm:text-lg font-semibold text-gray-800">每日成交趋势</h2>
          <MetricToggle value={txMetric} options={TX_METRICS} onChange={setTxMetric} />
        </div>
        {error ? (
          <p className="text-center text-red-500 py-12 text-sm">{error}</p>
        ) : series.length === 0 ? (
          <p className="text-center text-gray-400 py-12 text-sm">请至少选择一个品牌</p>
        ) : txChartData.length === 0 && !loading ? (
          <p className="text-center text-gray-400 py-12 text-sm">所选区间无成交数据</p>
        ) : (
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={txChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
              <Tooltip />
              <Legend />
              {series.map((s) => (
                <Line
                  key={s.label_id}
                  type="monotone"
                  dataKey={s.label_id}
                  name={s.label_name}
                  stroke={s.color}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* 品牌销量排行：独立时间范围（留空 = 全部时间），展示所有品牌 */}
      <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3 sm:mb-4">
          <h2 className="text-base sm:text-lg font-semibold text-gray-800">品牌销量排行</h2>
          <div className="flex flex-wrap items-end gap-2 sm:gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">开始日期</label>
              <input
                type="date"
                value={salesStart}
                onChange={(e) => setSalesStart(e.target.value)}
                className="border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">结束日期</label>
              <input
                type="date"
                value={salesEnd}
                onChange={(e) => setSalesEnd(e.target.value)}
                className="border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={() => { setSalesStart(''); setSalesEnd('') }}
              className="px-3 py-1.5 border border-gray-300 rounded-md text-sm hover:bg-gray-50"
            >
              清空
            </button>
            <span className="text-xs text-gray-400">留空汇总全部销量</span>
          </div>
        </div>
        {salesLoading ? (
          <p className="text-center text-gray-400 py-12 text-sm">加载中...</p>
        ) : labelSalesRows.length === 0 ? (
          <p className="text-center text-gray-400 py-12 text-sm">暂无品牌</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-center py-2 px-3 text-gray-500 font-medium w-16">排名</th>
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">品牌</th>
                  <th className="text-right py-2 px-3 text-gray-500 font-medium">销售数量</th>
                  <th className="text-right py-2 px-3 text-gray-500 font-medium">详情</th>
                </tr>
              </thead>
              <tbody>
                {labelSalesRows.map((row, i) => (
                  <tr key={row.label_id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-2 px-3 text-center text-gray-500">{i + 1}</td>
                    <td className="py-2 px-3 text-gray-800">
                      <span className="inline-flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: row.color }} />
                        {row.label_name}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right font-medium text-orange-600">{row.tx_quantity}</td>
                    <td className="py-2 px-3 text-right">
                      <button
                        onClick={() => setSalesModalTarget({ label_id: row.label_id, label_name: row.label_name, start: salesStart, end: salesEnd })}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        详情
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <LabelProductDrawer target={drawerTarget} onClose={() => setDrawerTarget(null)} />
      <LabelSalesProductsModal target={salesModalTarget} onClose={() => setSalesModalTarget(null)} />
    </div>
  )
}
