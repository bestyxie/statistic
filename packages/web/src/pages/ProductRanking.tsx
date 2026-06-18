import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../lib/api'
import HoverPopup from '../components/HoverPopup'
import ProductDetailDrawer from '../components/ProductDetailDrawer'
import type { Shop } from '@statistic/shared'

export default function ProductRanking() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [shops, setShops] = useState<Shop[]>([])
  const [drawerId, setDrawerId] = useState<string | null>(null)
  const [selectedShop, setSelectedShop] = useState(searchParams.get('shop') || '')
  const [searchText, setSearchText] = useState(searchParams.get('search') || '')
  const [ranking, setRanking] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const pageSize = 20
  const page = parseInt(searchParams.get('page') || '1')
  const search = searchParams.get('search') || ''
  const setPage = (p: number) => setSearchParams((prev) => { prev.set('page', String(p)); return prev })

  // 多选
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => { api.getShops().then(setShops) }, [])

  useEffect(() => {
    setLoading(true)
    api.getProductRanking(7, selectedShop || undefined, page, pageSize, search || undefined)
      .then((res) => {
        setRanking(res.items)
        setTotal(res.total)
      })
      .finally(() => setLoading(false))
  }, [selectedShop, page, search])

  const handleShopChange = (v: string) => {
    setSelectedShop(v)
    setSelectedIds(new Set())
    setSearchParams((prev) => {
      prev.delete('page')
      if (v) prev.set('shop', v); else prev.delete('shop')
      return prev
    })
  }

  const handleSearch = () => {
    setSelectedIds(new Set())
    setSearchParams((prev) => {
      prev.delete('page')
      if (searchText) prev.set('search', searchText); else prev.delete('search')
      return prev
    })
  }

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const toggleSelectAll = useCallback(() => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      const pageIds = ranking.map((p) => p.id)
      const allSelected = pageIds.every((id) => next.has(id))
      for (const id of pageIds) {
        if (allSelected) next.delete(id); else next.add(id)
      }
      return next
    })
  }, [ranking])

  const handleRefresh = async () => {
    if (selectedIds.size === 0) return
    setRefreshing(true)
    try {
      const res = await api.refreshProducts([...selectedIds])
      alert(`刷新成功，共刷新 ${res.count} 个商品`)
      setSelectedIds(new Set())
      // 重新加载当前页
      setLoading(true)
      api.getProductRanking(7, selectedShop || undefined, page, pageSize, search || undefined)
        .then((r) => { setRanking(r.items); setTotal(r.total) })
        .finally(() => setLoading(false))
    } catch (err: any) {
      alert(err.message || '刷新失败')
    } finally {
      setRefreshing(false)
    }
  }

  const rankBase = (page - 1) * pageSize

  return (
    <>
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">7日访问量排行榜</h1>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
          {selectedIds.size > 0 && (
            <button onClick={handleRefresh} disabled={refreshing} className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 text-sm disabled:opacity-50">
              {refreshing ? '刷新中...' : `刷新选中 (${selectedIds.size})`}
            </button>
          )}
          <select
            value={selectedShop}
            onChange={(e) => handleShopChange(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">全部店铺</option>
            {shops.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <div className="flex items-center gap-1 flex-1 sm:flex-none">
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSearch() }}
              placeholder="搜索描述..."
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-44"
            />
            <button onClick={handleSearch} className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm shrink-0">搜索</button>
            {search && (
              <button onClick={() => { setSearchText(''); setSearchParams((prev) => { prev.delete('search'); prev.delete('page'); return prev }) }} className="px-2 py-2 text-gray-400 hover:text-gray-600 text-sm shrink-0">清除</button>
            )}
          </div>
          <button onClick={() => navigate('/products')} className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm">返回商品管理</button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">加载中...</div>
      ) : ranking.length === 0 ? (
        <div className="text-center py-12 text-gray-500">暂无数据</div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-center py-3 px-3 w-10">
                  <input
                    type="checkbox"
                    checked={ranking.length > 0 && ranking.every((p) => selectedIds.has(p.id))}
                    onChange={toggleSelectAll}
                    className="rounded border-gray-300"
                  />
                </th>
                <th className="text-center py-3 px-5 text-gray-500 font-medium w-16">排名</th>
                <th className="text-left py-3 px-5 text-gray-500 font-medium">商品</th>
                <th className="text-left py-3 px-5 text-gray-500 font-medium">编号</th>
                <th className="text-right py-3 px-5 text-gray-500 font-medium">浏览次数</th>
                <th className="text-right py-3 px-5 text-gray-500 font-medium">浏览人数</th>
                <th className="text-right py-3 px-5 text-gray-500 font-medium">成交数量</th>
                <th className="text-right py-3 px-5 text-gray-500 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {ranking.map((p, i) => {
                const rank = rankBase + i + 1
                return (
                  <tr key={p.id} className={`border-b border-gray-100 hover:bg-gray-50 ${selectedIds.has(p.id) ? 'bg-blue-50' : ''}`}>
                    <td className="py-3 px-3 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(p.id)}
                        onChange={() => toggleSelect(p.id)}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="py-3 px-5 text-center">
                      {rank <= 3 ? (
                        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-white text-xs font-bold ${rank === 1 ? 'bg-yellow-500' : rank === 2 ? 'bg-gray-400' : 'bg-orange-400'}`}>{rank}</span>
                      ) : (
                        <span className="text-gray-400 font-medium">{rank}</span>
                      )}
                    </td>
                    <td className="py-3 px-5">
                      <div className="flex items-center gap-3">
                        {p.image_url ? (
                          <HoverPopup popup={<div className="w-48 h-48"><img src={p.image_url} alt="" className="w-full h-full rounded object-cover" /></div>}>
                            <img src={p.image_url} alt="" className="w-10 h-10 rounded object-cover bg-gray-100" />
                          </HoverPopup>
                        ) : (
                          <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center text-gray-300 text-xs">无</div>
                        )}
                        <HoverPopup side="overlay" popup={<div className="p-3 max-w-sm text-sm text-gray-700 whitespace-normal break-all select-text">{p.description || p.name}</div>}>
                          <span className="font-medium text-gray-800 max-w-[200px] truncate block">{p.description || p.name}</span>
                        </HoverPopup>
                      </div>
                    </td>
                    <td className="py-3 px-5 text-gray-400 font-mono text-xs">{p.sku || '-'}</td>
                    <td className="py-3 px-5 text-right font-bold text-blue-600">{p.total_views}</td>
                    <td className="py-3 px-5 text-right font-bold text-green-600">{p.total_viewers}</td>
                    <td className="py-3 px-5 text-right font-bold text-orange-600">{p.total_tx_count}</td>
                    <td className="py-3 px-5 text-right">
                      <button onClick={() => setDrawerId(p.id)} className="text-green-600 hover:text-green-800 text-sm">统计</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          </div>
          {total > pageSize && (() => {
            const totalPages = Math.ceil(total / pageSize)
            const pages: (number | '...')[] = []
            if (totalPages <= 7) {
              for (let i = 1; i <= totalPages; i++) pages.push(i)
            } else {
              pages.push(1)
              if (page > 3) pages.push('...')
              for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i)
              if (page < totalPages - 2) pages.push('...')
              pages.push(totalPages)
            }
            return (
              <div className="flex flex-col sm:flex-row items-center justify-between px-3 sm:px-5 py-3 border-t border-gray-200 gap-2">
                <span className="text-xs sm:text-sm text-gray-500">共 {total} 条，第 {page}/{totalPages} 页</span>
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
                    disabled={page >= totalPages}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >下一页</button>
                  <span className="hidden sm:inline mx-2 text-gray-400">|</span>
                  <span className="hidden sm:inline text-sm text-gray-500">跳至</span>
                  <input
                    type="number"
                    min={1}
                    max={totalPages}
                    className="hidden sm:block w-14 px-2 py-1 text-sm border border-gray-300 rounded-md text-center"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const v = parseInt((e.target as HTMLInputElement).value)
                        if (v >= 1 && v <= totalPages) setPage(v)
                      }
                    }}
                  />
                  <span className="hidden sm:inline text-sm text-gray-500">页</span>
                </div>
              </div>
            )
          })()}
        </div>
      )}
    </div>

    <ProductDetailDrawer productId={drawerId} onClose={() => setDrawerId(null)} />
    </>
  )
}
