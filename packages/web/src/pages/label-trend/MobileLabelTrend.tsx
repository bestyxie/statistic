import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import MobilePageHeader from '../../components/mobile/MobilePageHeader'
import MobileFilter from '../../components/mobile/MobileFilter'
import MobileCard from '../../components/mobile/MobileCard'
import LabelMultiSelect from './components/LabelMultiSelect'
import { useLabelTrend } from './hooks/useLabelTrend'
import type { LabelMetric } from './hooks/useLabelTrend'

export default function MobileLabelTrend() {
  const {
    labels,
    labelsLoading,
    selectedIds,
    setSelectedIds,
    clearLabels,
    start,
    setStart,
    end,
    setEnd,
    metric,
    setMetric,
    chartData,
    series,
    loading,
    error,
  } = useLabelTrend()

  return (
    <div className="space-y-4">
      <MobilePageHeader title="品牌访客追踪" />

      <MobileFilter summary={`${start} ~ ${end} · ${metric === 'visitor_count' ? '访客数' : '访问量'}`}>
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
          <label className="block text-xs text-gray-500 mb-1">指标</label>
          <div className="flex border border-gray-300 rounded-md overflow-hidden">
            {(['visitor_count', 'view_count'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMetric(m as LabelMetric)}
                className={`flex-1 px-3 py-2 text-sm ${
                  metric === m
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-600'
                }`}
              >
                {m === 'visitor_count' ? '访客数' : '访问量'}
              </button>
            ))}
          </div>
        </div>
      </MobileFilter>

      <MobileCard>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-800">
            选择品牌 <span className="text-xs font-normal text-gray-500">已选 {selectedIds.size} / {labels.length}</span>
          </h2>
          {selectedIds.size > 0 && (
            <button
              type="button"
              onClick={clearLabels}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              清空
            </button>
          )}
        </div>
        {labelsLoading ? (
          <p className="text-sm text-gray-400 py-2">加载标签中...</p>
        ) : (
          <LabelMultiSelect labels={labels} selectedIds={selectedIds} onChange={setSelectedIds} />
        )}
      </MobileCard>

      <MobileCard>
        <h2 className="text-sm font-semibold text-gray-800 mb-3">
          每日{metric === 'visitor_count' ? '访客数' : '访问量'}趋势
        </h2>
        {error ? (
          <p className="text-center text-red-500 py-8 text-sm">{error}</p>
        ) : series.length === 0 ? (
          <p className="text-center text-gray-400 py-8 text-sm">请至少选择一个 Label</p>
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
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </MobileCard>
    </div>
  )
}
