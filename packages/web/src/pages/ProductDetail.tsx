import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import type { Product, Visitor } from '@statistic/shared'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

interface DailyStat {
  date: string
  view_count: number
  viewer_count: number
  tx_count: number
}

type VisitorWithDate = Visitor & { date: string }

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [product, setProduct] = useState<Product | null>(null)
  const [stats, setStats] = useState<DailyStat[]>([])
  const [start, setStart] = useState(new Date(Date.now() - 29 * 86400000).toISOString().slice(0, 10))
  const [end, setEnd] = useState(new Date().toISOString().slice(0, 10))
  const [loading, setLoading] = useState(true)
  const [visitorModal, setVisitorModal] = useState<{ open: boolean; date: string; visitors: VisitorWithDate[]; loading: boolean }>({ open: false, date: '', visitors: [], loading: false })

  const fetchData = async () => {
    if (!id) return
    setLoading(true)
    try {
      const res = await api.getProductStats(id, start, end)
      setProduct(res.product as Product)
      setStats(res.stats)
    } catch (err: any) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [id])

  const totalViews = stats.reduce((sum, s) => sum + s.view_count, 0)
  const totalViewers = stats.reduce((sum, s) => sum + s.viewer_count, 0)
  const totalTx = stats.reduce((sum, s) => sum + (s.tx_count || 0), 0)

  const fetchVisitors = async (date: string) => {
    if (!id) return
    setVisitorModal({ open: true, date, visitors: [], loading: true })
    try {
      const visitors = await api.getProductVisitors(id, date)
      setVisitorModal({ open: true, date, visitors: visitors as VisitorWithDate[], loading: false })
    } catch {
      setVisitorModal({ open: true, date, visitors: [], loading: false })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-600">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
        </button>
        <h1 className="text-2xl font-bold text-gray-800">商品统计</h1>
      </div>

      {loading && !product ? (
        <p className="text-gray-400 text-center py-12">加载中...</p>
      ) : product ? (
        <>
          {/* Product info */}
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <div className="flex items-center gap-4">
              {product.image_url ? (
                <img src={product.image_url} alt="" className="w-16 h-16 rounded-lg object-cover bg-gray-100" />
              ) : (
                <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center text-gray-300 text-xs">无图</div>
              )}
              <div>
                <h2 className="text-lg font-semibold text-gray-800">{product.description || product.name}</h2>
                {product.sku && <p className="text-sm text-gray-500 font-mono">SKU: {product.sku}</p>}
              </div>
            </div>
          </div>

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
              <button
                onClick={fetchData}
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm disabled:opacity-50"
              >
                {loading ? '查询中...' : '查询'}
              </button>
            </div>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <p className="text-sm text-gray-500">总浏览次数</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">{totalViews.toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <p className="text-sm text-gray-500">总访客数</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">{totalViewers.toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <p className="text-sm text-gray-500">总成交数</p>
              <p className="text-2xl font-bold text-orange-600 mt-1">{totalTx.toLocaleString()}</p>
            </div>
          </div>

          {/* Trend chart */}
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">每日趋势</h2>
            {stats.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={stats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="view_count" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} name="浏览次数" />
                  <Line type="monotone" dataKey="viewer_count" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} name="访客数" />
                  <Line type="monotone" dataKey="tx_count" stroke="#f97316" strokeWidth={2} dot={{ r: 3 }} name="成交数" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-gray-400 py-12">暂无数据</p>
            )}
          </div>

          {/* Daily data table */}
          {stats.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">每日明细</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="text-left py-2 px-3 text-gray-500 font-medium">日期</th>
                      <th className="text-right py-2 px-3 text-gray-500 font-medium">浏览次数</th>
                      <th className="text-right py-2 px-3 text-gray-500 font-medium">访客数</th>
                      <th className="text-right py-2 px-3 text-gray-500 font-medium">成交数</th>
                      <th className="text-right py-2 px-3 text-gray-500 font-medium">访客列表</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...stats].reverse().map((s) => (
                      <tr key={s.date} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-2 px-3 text-gray-800">{s.date}</td>
                        <td className="py-2 px-3 text-right font-medium">{s.view_count}</td>
                        <td className="py-2 px-3 text-right font-medium">{s.viewer_count}</td>
                        <td className="py-2 px-3 text-right font-medium text-orange-600">{s.tx_count || 0}</td>
                        <td className="py-2 px-3 text-right">
                          <button
                            onClick={() => fetchVisitors(s.date)}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            查看访客
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Visitor modal */}
          {visitorModal.open && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setVisitorModal({ ...visitorModal, open: false })}>
              <div className="bg-white rounded-lg max-w-lg w-full max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-800">{visitorModal.date} 访客列表</h3>
                  <button onClick={() => setVisitorModal({ ...visitorModal, open: false })} className="text-gray-400 hover:text-gray-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
                <div className="p-5 overflow-y-auto max-h-[60vh]">
                  {visitorModal.loading ? (
                    <p className="text-center text-gray-400 py-8">加载中...</p>
                  ) : visitorModal.visitors.length === 0 ? (
                    <p className="text-center text-gray-400 py-8">暂无访客记录</p>
                  ) : (
                    <div className="space-y-3">
                      {visitorModal.visitors.map((v) => (
                        <div key={v.id} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                          <img
                            src={v.icon_url || ''}
                            alt={v.nick_name}
                            className="w-10 h-10 rounded-full object-cover bg-gray-200 shrink-0"
                            onError={(e) => { (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect fill="%23e5e7eb" width="40" height="40"/><text x="50%" y="55%" text-anchor="middle" fill="%239ca3af" font-size="16">?</text></svg>' }}
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900 truncate">{v.nick_name || '未知'}</p>
                            <p className="text-xs text-gray-500 truncate">
                              {v.city_name ? `${v.city_name} · ` : ''}{v.description || ''}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <p className="text-center text-gray-400 py-12">商品不存在</p>
      )}
    </div>
  )
}
