import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api } from '../lib/api'
import type { Visitor } from '@statistic/shared'

type VisitorRow = Visitor & { visit_count: number }

interface VisitorProduct {
  id: string
  name: string
  image_url: string
  sku: string
  price: string
  description: string
  date: string
  visit_count: number
}

export default function Visitors() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [visitors, setVisitors] = useState<VisitorRow[]>([])
  const [total, setTotal] = useState(0)
  const page = parseInt(searchParams.get('page') || '1')
  const setPage = (p: number) => setSearchParams((prev) => { prev.set('page', String(p)); return prev })
  const search = searchParams.get('search') || ''
  const setSearch = (v: string) => setSearchParams((prev) => { if (v) prev.set('search', v); else prev.delete('search'); return prev })
  const [loading, setLoading] = useState(true)
  const [productModal, setProductModal] = useState<{ visitor: VisitorRow | null; products: VisitorProduct[]; loading: boolean }>({ visitor: null, products: [], loading: false })
  const limit = 30

  useEffect(() => {
    loadVisitors()
  }, [page, search])

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
  }

  async function showVisitorProducts(visitor: VisitorRow) {
    setProductModal({ visitor, products: [], loading: true })
    try {
      const products = await api.getVisitorProducts(visitor.id)
      setProductModal({ visitor, products, loading: false })
    } catch {
      setProductModal({ visitor, products: [], loading: false })
    }
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
                        onClick={() => showVisitorProducts(v)}
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

      {/* 访客商品弹窗 */}
      {productModal.visitor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setProductModal({ visitor: null, products: [], loading: false })}>
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <img
                  src={productModal.visitor.icon_url || ''}
                  alt={productModal.visitor.nick_name}
                  className="w-8 h-8 rounded-full object-cover bg-gray-200"
                  onError={(e) => { (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect fill="%23e5e7eb" width="40" height="40"/><text x="50%" y="55%" text-anchor="middle" fill="%239ca3af" font-size="16">?</text></svg>' }}
                />
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">{productModal.visitor.nick_name || '未知'}</h3>
                  <p className="text-xs text-gray-500">浏览过的商品</p>
                </div>
              </div>
              <button onClick={() => setProductModal({ visitor: null, products: [], loading: false })} className="text-gray-400 hover:text-gray-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            <div className="overflow-y-auto max-h-[calc(80vh-64px)]">
              {productModal.loading ? (
                <p className="text-center text-gray-400 py-12">加载中...</p>
              ) : productModal.products.length === 0 ? (
                <p className="text-center text-gray-400 py-12">暂无浏览记录</p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 px-4 text-gray-500 font-medium">图片</th>
                      <th className="text-left py-2 px-4 text-gray-500 font-medium">商品</th>
                      <th className="text-left py-2 px-4 text-gray-500 font-medium">价格</th>
                      <th className="text-right py-2 px-4 text-gray-500 font-medium">日期</th>
                      <th className="text-right py-2 px-4 text-gray-500 font-medium">访问次数</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productModal.products.map((p, i) => (
                      <tr key={`${p.id}-${p.date}-${i}`} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-2 px-4">
                          {p.image_url ? (
                            <img src={p.image_url} alt="" className="w-10 h-10 rounded object-cover bg-gray-100" />
                          ) : (
                            <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center text-gray-300 text-xs">无图</div>
                          )}
                        </td>
                        <td className="py-2 px-4 text-gray-800 max-w-[200px] truncate">{p.description || p.name || '-'}</td>
                        <td className="py-2 px-4 text-gray-600">{p.price || '-'}</td>
                        <td className="py-2 px-4 text-right text-gray-500">{p.date}</td>
                        <td className="py-2 px-4 text-right font-medium">{p.visit_count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
