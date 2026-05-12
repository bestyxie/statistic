import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import type { Visitor } from '@statistic/shared'

type VisitorRow = Visitor & { visit_count: number }

export default function Visitors() {
  const [visitors, setVisitors] = useState<VisitorRow[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const limit = 30

  useEffect(() => {
    loadVisitors()
  }, [page])

  async function loadVisitors() {
    setLoading(true)
    try {
      const res = await api.getVisitors(page, limit, search || undefined)
      setVisitors(res.visitors as VisitorRow[])
      setTotal(res.total)
    } catch (e: any) {
      console.error('加载访客列表失败:', e.message)
    } finally {
      setLoading(false)
    }
  }

  function handleSearch() {
    setPage(1)
    loadVisitors()
  }

  const totalPages = Math.ceil(total / limit)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">访客列表</h1>
        <span className="text-sm text-gray-500">共 {total} 位访客</span>
      </div>

      {/* 搜索 */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="搜索昵称、描述、城市..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <button
          onClick={handleSearch}
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
        >
          搜索
        </button>
      </div>

      {/* 列表 */}
      {loading ? (
        <div className="text-center py-10 text-gray-500">加载中...</div>
      ) : visitors.length === 0 ? (
        <div className="text-center py-10 text-gray-500">暂无访客数据</div>
      ) : (
        <>
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">头像</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">昵称</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">城市</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">描述</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">访问次数</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">首次发现</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {visitors.map((v) => (
                  <tr key={v.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <img
                        src={v.icon_url || '/default-avatar.png'}
                        alt={v.nick_name}
                        className="w-8 h-8 rounded-full object-cover bg-gray-100"
                        onError={(e) => { (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect fill="%23e5e7eb" width="40" height="40"/><text x="50%" y="55%" text-anchor="middle" fill="%239ca3af" font-size="16">?</text></svg>' }}
                      />
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{v.nick_name || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{v.city_name || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">{v.description || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 font-medium">{v.visit_count}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{v.first_seen_at?.slice(0, 10)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 分页 */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page <= 1}
                className="px-3 py-1 text-sm border rounded-md disabled:opacity-50 hover:bg-gray-50"
              >
                上一页
              </button>
              <span className="text-sm text-gray-600">{page} / {totalPages}</span>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1 text-sm border rounded-md disabled:opacity-50 hover:bg-gray-50"
              >
                下一页
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
