import MobilePageHeader from '../../components/mobile/MobilePageHeader'
import MobileFilter from '../../components/mobile/MobileFilter'
import MobileCard, { MobileCardActions } from '../../components/mobile/MobileCard'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar } from 'recharts'
import { useStats } from '../../hooks/useStats'
import ProductDetailDrawer from '../../components/ProductDetailDrawer'

export default function MobileStats() {
  const {
    navigate,
    shops,
    selectedShop,
    setSelectedShop,
    drawerId,
    setDrawerId,
    start,
    setStart,
    end,
    setEnd,
    loading,
    shopTrend,
    productChartData,
    topProducts,
    txTrend,
    txList,
    txTotal,
    handleQuery,
  } = useStats()

  return (
    <div className="space-y-4">
      <MobilePageHeader title="数据查询" />

      {/* Filter */}
      <MobileFilter summary={`${start} ~ ${end}`}>
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
          <label className="block text-xs text-gray-500 mb-1">店铺</label>
          <select
            value={selectedShop}
            onChange={(e) => setSelectedShop(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">全部店铺</option>
            {shops.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        <button
          onClick={handleQuery}
          disabled={loading}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm disabled:opacity-50"
        >
          {loading ? '查询中...' : '查询'}
        </button>
      </MobileFilter>

      {/* Shop visitor trend */}
      <MobileCard>
        <h2 className="text-sm font-semibold text-gray-800 mb-3">店铺访客趋势</h2>
        {shopTrend.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={shopTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis width={32} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              {shops.length > 1 && !selectedShop ? (
                [...new Set(shopTrend.map((s) => s.shop_name))].map((name, i) => (
                  <Line
                    key={name}
                    type="monotone"
                    dataKey="visitor_count"
                    data={shopTrend.filter((s) => s.shop_name === name)}
                    name={name}
                    stroke={`hsl(${i * 60}, 70%, 50%)`}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                ))
              ) : (
                <Line type="monotone" dataKey="visitor_count" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} name="访客数" />
              )}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-center text-gray-400 py-8 text-sm">暂无数据</p>
        )}
      </MobileCard>

      {/* Product views trend */}
      <MobileCard>
        <h2 className="text-sm font-semibold text-gray-800 mb-3">商品浏览趋势</h2>
        {productChartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={productChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis width={32} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="views" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} name="浏览次数" />
              <Line type="monotone" dataKey="visitors" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} name="独立访客数" />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-center text-gray-400 py-8 text-sm">暂无数据</p>
        )}
      </MobileCard>

      {/* Top products card list */}
      <MobileCard>
        <h2 className="text-sm font-semibold text-gray-800 mb-3">热门商品排行</h2>
        {topProducts.length > 0 ? (
          <div className="space-y-2">
            {topProducts.map((p, i) => (
              <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-b-0">
                <span className="text-xs font-medium text-gray-400 w-5 shrink-0 text-center">{i + 1}</span>
                {p.image_url && (
                  <img src={p.image_url} alt="" className="w-9 h-9 rounded object-cover bg-gray-100 shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800 truncate">{p.description || p.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    浏览 {p.total_views} 次 / {p.total_viewers} 人
                  </p>
                </div>
                <MobileCardActions>
                  <button
                    onClick={() => setDrawerId(p.id)}
                    className="text-green-600 hover:text-green-800 text-xs font-medium"
                  >
                    统计
                  </button>
                </MobileCardActions>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-400 py-8 text-sm">暂无数据</p>
        )}
      </MobileCard>

      {/* Transaction trend bar chart */}
      <MobileCard>
        <h2 className="text-sm font-semibold text-gray-800 mb-3">成交趋势</h2>
        {txTrend.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={txTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="left" width={32} tick={{ fontSize: 11 }} />
              <YAxis yAxisId="right" orientation="right" width={32} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Bar yAxisId="left" dataKey="tx_count" fill="#f97316" name="成交笔数" />
              <Line yAxisId="right" type="monotone" dataKey="tx_amount" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} name="成交金额" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-center text-gray-400 py-8 text-sm">暂无成交数据</p>
        )}
      </MobileCard>

      {/* Transaction list card list */}
      <MobileCard>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-800">
            成交明细 <span className="text-xs font-normal text-gray-500">(共 {txTotal} 条)</span>
          </h2>
        </div>
        {txList.length > 0 ? (
          <div className="space-y-2">
            {txList.slice(0, 10).map((tx) => (
              <div key={tx.id} className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-b-0">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800 truncate">{tx.description || tx.product_name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{tx.date}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-medium text-gray-800">&yen;{tx.price} &times; {tx.quantity}</p>
                  <p className="text-xs font-medium text-orange-600">&yen;{(parseFloat(tx.price) * tx.quantity).toFixed(0)}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-400 py-8 text-sm">暂无成交数据</p>
        )}
      </MobileCard>

      {/* Link to full transactions */}
      <button
        onClick={() => navigate('/transactions')}
        className="w-full py-3 text-center text-blue-600 hover:text-blue-800 text-sm font-medium bg-white rounded-lg border border-gray-200"
      >
        查看全部 &rarr;
      </button>

      <ProductDetailDrawer productId={drawerId} onClose={() => setDrawerId(null)} />
    </div>
  )
}
