import { useDashboard } from '../../hooks/useDashboard'
import MobilePageHeader from '../../components/mobile/MobilePageHeader'
import MobileCard from '../../components/mobile/MobileCard'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function MobileDashboard() {
  const { data, shops, selectedShop, setSelectedShop, refundData, loading, changePercent } = useDashboard()

  if (loading || !data) {
    return <div className="text-center py-12 text-gray-400 text-sm">加载中...</div>
  }

  return (
    <div className="space-y-4">
      <MobilePageHeader
        title="仪表盘"
        actions={
          <select
            value={selectedShop}
            onChange={(e) => setSelectedShop(e.target.value)}
            className="border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">全部店铺</option>
            {shops.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        }
      />

      {/* Stat cards - 2 column grid */}
      <div className="grid grid-cols-2 gap-2">
        <MobileCard>
          <p className="text-xs text-gray-500">今日访客</p>
          <p className="text-xl font-bold text-gray-800 mt-1">{data.today}</p>
        </MobileCard>
        <MobileCard>
          <p className="text-xs text-gray-500">昨日访客</p>
          <p className="text-xl font-bold text-gray-800 mt-1">{data.yesterday}</p>
        </MobileCard>
        <MobileCard>
          <p className="text-xs text-gray-500">日环比</p>
          <p className={`text-xl font-bold mt-1 ${Number(changePercent) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {changePercent === '-' ? '-' : `${Number(changePercent) >= 0 ? '+' : ''}${changePercent}%`}
          </p>
        </MobileCard>
        <MobileCard>
          <p className="text-xs text-gray-500">今日成交</p>
          <p className="text-xl font-bold text-orange-600 mt-1">{data.todayTxCount}</p>
          <p className="text-xs text-gray-400 mt-0.5">金额 ¥{data.todayTxAmount.toFixed(0)}</p>
        </MobileCard>
        <MobileCard>
          <p className="text-xs text-gray-500">今日退款</p>
          <p className="text-xl font-bold text-red-500 mt-1">{refundData?.todayRefundCount || 0}</p>
          <p className="text-xs text-gray-400 mt-0.5">金额 ¥{(refundData?.todayRefundAmount || 0).toFixed(0)}</p>
        </MobileCard>
      </div>

      {/* 7-day trend chart */}
      <MobileCard>
        <h2 className="text-sm font-semibold text-gray-800 mb-3">近7天访客趋势</h2>
        {data.trend.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={data.trend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis width={32} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="visitors" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} name="访客数" />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-center text-gray-400 py-8 text-sm">暂无数据</p>
        )}
      </MobileCard>

      {/* Top products - card list */}
      <MobileCard>
        <h2 className="text-sm font-semibold text-gray-800 mb-3">热门商品 TOP 10</h2>
        {data.topProducts.length > 0 ? (
          <div className="space-y-2">
            {data.topProducts.map((p, i) => (
              <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-b-0">
                <span className="text-xs font-medium text-gray-400 w-5 shrink-0 text-center">{i + 1}</span>
                {p.image_url && (
                  <img src={p.image_url} alt="" className="w-9 h-9 rounded object-cover bg-gray-100 shrink-0" />
                )}
                <span className="text-sm text-gray-800 truncate flex-1 min-w-0">{p.name}</span>
                <span className="text-xs text-gray-500 shrink-0">{p.total_views}次</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-400 py-8 text-sm">暂无数据</p>
        )}
      </MobileCard>
    </div>
  )
}
