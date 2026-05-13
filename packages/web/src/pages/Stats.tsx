import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import type { Shop } from '@statistic/shared'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

export default function Stats() {
  const [shops, setShops] = useState<Shop[]>([])
  const [selectedShop, setSelectedShop] = useState('')
  const [start, setStart] = useState(new Date(Date.now() - 29 * 86400000).toISOString().slice(0, 10))
  const [end, setEnd] = useState(new Date().toISOString().slice(0, 10))
  const [loading, setLoading] = useState(false)
  const [shopTrend, setShopTrend] = useState<any[]>([])
  const [productTrend, setProductTrend] = useState<any[]>([])
  const [topProducts, setTopProducts] = useState<any[]>([])

  useEffect(() => { api.getShops().then(setShops) }, [])

  const handleQuery = async () => {
    setLoading(true)
    try {
      const [trendRes, topRes] = await Promise.all([
        api.getTrend(start, end, selectedShop || undefined),
        api.getTopProducts(start, end, selectedShop || undefined),
      ])
      setShopTrend(trendRes.shopTrend || [])
      setProductTrend(trendRes.productTrend || [])
      setTopProducts(topRes || [])
    } catch (err: any) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { handleQuery() }, [])

  // Aggregate product trend by date for chart
  const productChartData = Object.values(
    productTrend.reduce((acc: Record<string, any>, item: any) => {
      if (!acc[item.date]) {
        acc[item.date] = { date: item.date, views: 0, visitors: 0 }
      }
      acc[item.date].views += item.view_count || 0
      return acc
    }, {})
  ).sort((a: any, b: any) => a.date.localeCompare(b.date))

  // Merge shop visitor count (deduplicated) into product chart data
  const shopVisitorMap = shopTrend.reduce((acc: Record<string, number>, s: any) => {
    acc[s.date] = s.visitor_count
    return acc
  }, {})
  productChartData.forEach((d: any) => {
    d.visitors = shopVisitorMap[d.date] || 0
  })

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">数据查询</h1>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <div className="flex flex-wrap gap-4 items-end">
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
            <label className="block text-sm font-medium text-gray-700 mb-1">店铺</label>
            <select
              value={selectedShop}
              onChange={(e) => setSelectedShop(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm disabled:opacity-50"
          >
            {loading ? '查询中...' : '查询'}
          </button>
        </div>
      </div>

      {/* Shop visitor trend chart */}
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">店铺访客趋势</h2>
        {shopTrend.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={shopTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
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
          <p className="text-center text-gray-400 py-12">暂无数据</p>
        )}
      </div>

      {/* Product views trend chart */}
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">商品浏览趋势</h2>
        {productChartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={productChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="views" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} name="浏览次数" />
              <Line type="monotone" dataKey="visitors" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} name="独立访客数" />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-center text-gray-400 py-12">暂无数据</p>
        )}
      </div>

      {/* Top products table */}
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">热门商品排行</h2>
        {topProducts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left py-3 px-3 text-gray-500 font-medium">排名</th>
                  <th className="text-left py-3 px-3 text-gray-500 font-medium">商品</th>
                  <th className="text-left py-3 px-3 text-gray-500 font-medium">SKU</th>
                  <th className="text-right py-3 px-3 text-gray-500 font-medium">浏览次数</th>
                  <th className="text-right py-3 px-3 text-gray-500 font-medium">浏览人数</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.map((p, i) => (
                  <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-3 font-medium text-gray-400">{i + 1}</td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-3">
                        {p.image_url && <img src={p.image_url} alt="" className="w-10 h-10 rounded object-cover bg-gray-100" />}
                        <span className="font-medium text-gray-800">{p.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-gray-400">{p.sku || '-'}</td>
                    <td className="py-3 px-3 text-right font-medium">{p.total_views}</td>
                    <td className="py-3 px-3 text-right font-medium">{p.total_viewers}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center text-gray-400 py-12">暂无数据</p>
        )}
      </div>
    </div>
  )
}
