import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import LabelMultiSelect from './components/LabelMultiSelect'
import { useLabelTrend } from './hooks/useLabelTrend'
import type { LabelMetric } from './hooks/useLabelTrend'

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
    series,
    loading,
    error,
  } = useLabelTrend()

  return (
    <div className="space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-800">品牌访客追踪</h1>

      {/* 顶部过滤栏：日期 + 指标 + 品牌多选 */}
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">指标</label>
            <div className="flex border border-gray-300 rounded-md overflow-hidden">
              {(['visitor_count', 'view_count'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMetric(m as LabelMetric)}
                  className={`px-3 py-2 text-sm ${
                    metric === m
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {m === 'visitor_count' ? '访客数' : '访问量'}
                </button>
              ))}
            </div>
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

      {/* 折线图 */}
      <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-5">
        <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4">
          每日{metric === 'visitor_count' ? '访客数' : '访问量'}趋势
        </h2>
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
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
