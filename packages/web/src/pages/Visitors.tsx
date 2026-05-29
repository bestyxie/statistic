import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api } from '../lib/api'
import VisitorProductsModal from '../components/VisitorProductsModal'
import type { Visitor } from '@statistic/shared'

type VisitorRow = Visitor & { visit_count: number }

export default function Visitors() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [visitors, setVisitors] = useState<VisitorRow[]>([])
  const [total, setTotal] = useState(0)
  const page = parseInt(searchParams.get('page') || '1')
  const setPage = (p: number) => setSearchParams((prev) => { prev.set('page', String(p)); return prev })
  const search = searchParams.get('search') || ''
  const visitDate = searchParams.get('date') || ''
  const [searchInput, setSearchInput] = useState(search)
  const [dateInput, setDateInput] = useState(visitDate)
  const doSearch = () => setSearchParams((prev) => {
    prev.delete('page')
    if (searchInput) prev.set('search', searchInput); else prev.delete('search')
    if (dateInput) prev.set('date', dateInput); else prev.delete('date')
    return prev
  })
  const [loading, setLoading] = useState(true)
  const [productModal, setProductModal] = useState<{ visitor: VisitorRow | null }>({ visitor: null })
  const limit = 30

  useEffect(() => {
    loadVisitors()
  }, [page, search, visitDate])

  useEffect(() => { setSearchInput(search); setDateInput(visitDate) }, [search, visitDate])

  async function loadVisitors() {
    setLoading(true)
    try {
      const res = await api.getVisitors(page, limit, search || undefined, visitDate || undefined)
      setVisitors(res.visitors as VisitorRow[])
      setTotal(res.total)
    } catch (e: any) {
      console.error('加载访客列表失败:', e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4 sm:mb-6 flex-wrap gap-2">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">访客列表</h1>
        <span className="text-xs sm:text-sm text-gray-500">共 {total} 位访客</span>
      </div>

      {/* 搜索 */}
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="relative flex-1 min-w-[140px]">
          <input
            type="text"
            placeholder="搜索昵称、描述、城市..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && doSearch()}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 pr-7"
          />
          {searchInput && (
            <button type="button" onClick={() => { setSearchInput(''); setSearchParams((prev) => { prev.delete('search'); prev.delete('page'); return prev }) }} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs">&#x2715;</button>
          )}
        </div>
        <div className="relative">
          <input
            type="date"
            value={dateInput}
            onChange={(e) => setDateInput(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 pr-7"
          />
          {dateInput && (
            <button type="button" onClick={() => { setDateInput(''); setSearchParams((prev) => { prev.delete('date'); prev.delete('page'); return prev }) }} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs">&#x2715;</button>
          )}
        </div>
        <button
          onClick={doSearch}
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
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
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
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setProductModal({ visitor: v })}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        查看商品
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 分页 */}
          {total > limit && (() => {
            const tp = Math.ceil(total / limit)
            const pages: (number | '...')[] = []
            if (tp <= 7) {
              for (let i = 1; i <= tp; i++) pages.push(i)
            } else {
              pages.push(1)
              if (page > 3) pages.push('...')
              for (let i = Math.max(2, page - 1); i <= Math.min(tp - 1, page + 1); i++) pages.push(i)
              if (page < tp - 2) pages.push('...')
              pages.push(tp)
            }
            return (
              <div className="flex flex-col sm:flex-row items-center justify-between px-3 sm:px-4 py-3 border-t border-gray-200 gap-2">
                <span className="text-xs sm:text-sm text-gray-500">共 {total} 条，第 {page}/{tp} 页</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage(page - 1)}
                    disabled={page <= 1}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >上一页</button>
                  {pages.map((p, i) =>
                    p === '...' ? (
                      <span key={`dots-${i}`} className="px-2 text-gray-400">...</span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={`px-3 py-1 text-sm rounded-md border ${p === page ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 hover:bg-gray-50'}`}
                      >{p}</button>
                    )
                  )}
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={page >= tp}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >下一页</button>
                  <span className="hidden sm:inline mx-2 text-gray-400">|</span>
                  <span className="hidden sm:inline text-sm text-gray-500">跳至</span>
                  <input
                    type="number"
                    min={1}
                    max={tp}
                    className="hidden sm:block w-14 px-2 py-1 text-sm border border-gray-300 rounded-md text-center"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const v = parseInt((e.target as HTMLInputElement).value)
                        if (v >= 1 && v <= tp) setPage(v)
                      }
                    }}
                  />
                  <span className="hidden sm:inline text-sm text-gray-500">页</span>
                </div>
              </div>
            )
          })()}
        </>
      )}

      {/* 访客商品弹窗 */}
      <VisitorProductsModal
        visitor={productModal.visitor}
        onClose={() => setProductModal({ visitor: null })}
      />
    </div>
  )
}
