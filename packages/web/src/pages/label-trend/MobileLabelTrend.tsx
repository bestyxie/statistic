import { useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import MobilePageHeader from '../../components/mobile/MobilePageHeader'
import MobileFilter from '../../components/mobile/MobileFilter'
import MobileCard from '../../components/mobile/MobileCard'
import LabelMultiSelect from './components/LabelMultiSelect'
import MetricToggle from './components/MetricToggle'
import LabelTrendDot from './components/LabelTrendDot'
import LabelProductDrawer, { type LabelProductDrawerTarget } from './components/LabelProductDrawer'
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

export default function MobileLabelTrend() {
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
  } = useLabelTrend()

  const [drawerTarget, setDrawerTarget] = useState<LabelProductDrawerTarget | null>(null)
  const handlePointClick = (date: string | undefined, labelId: string, labelName: string) => {
    if (!date) return
    setDrawerTarget({ label_id: labelId, label_name: labelName, date })
  }

  return (
    <div className="space-y-4">
      <MobilePageHeader title="品牌访客追踪" />

      <MobileFilter summary={`${start} ~ ${end} · 已选 ${selectedIds.size}`}>
        <div>
          <label className="block text-xs text-gray-500 mb-1">开始日期</label>
          <input
            type="date"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">结束日期</label>
          <input
            type="date"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">
            品牌 <span className="text-gray-400">已选 {selectedIds.size} / {labels.length}</span>
          </label>
          {labelsLoading ? (
            <p className="text-sm text-gray-400 py-2">加载标签中...</p>
          ) : (
            <LabelMultiSelect labels={labels} selectedIds={selectedIds} onChange={setSelectedIds} />
          )}
        </div>
      </MobileFilter>

      <MobileCard>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-800">每日访客趋势</h2>
          <MetricToggle value={metric} options={VISITOR_METRICS} onChange={setMetric} />
        </div>
        {error ? (
          <p className="text-center text-red-500 py-8 text-sm">{error}</p>
        ) : series.length === 0 ? (
          <p className="text-center text-gray-400 py-8 text-sm">请至少选择一个品牌</p>
        ) : chartData.length === 0 && !loading ? (
          <p className="text-center text-gray-400 py-8 text-sm">所选区间无数据</p>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis width={32} tick={{ fontSize: 11 }} allowDecimals={false} />
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
      </MobileCard>

      <MobileCard>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-800">每日成交趋势</h2>
          <MetricToggle value={txMetric} options={TX_METRICS} onChange={setTxMetric} />
        </div>
        {error ? (
          <p className="text-center text-red-500 py-8 text-sm">{error}</p>
        ) : series.length === 0 ? (
          <p className="text-center text-gray-400 py-8 text-sm">请至少选择一个品牌</p>
        ) : txChartData.length === 0 && !loading ? (
          <p className="text-center text-gray-400 py-8 text-sm">所选区间无成交数据</p>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={txChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis width={32} tick={{ fontSize: 11 }} allowDecimals={false} />
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
      </MobileCard>

      <LabelProductDrawer target={drawerTarget} onClose={() => setDrawerTarget(null)} />
    </div>
  )
}
