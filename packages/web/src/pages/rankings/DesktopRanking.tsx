import { useProductRanking } from '../../hooks/useProductRanking'
import HoverPopup from '../../components/HoverPopup'
import ProductDetailDrawer from '../../components/ProductDetailDrawer'
import { useNavigate } from 'react-router-dom'
import { useState, useCallback } from 'react'

export default function DesktopRanking() {
  const navigate = useNavigate()
  const {
    shops, selectedShop, handleShopChange,
    labels, labelId, handleLabelChange,
    start, setStart, end, setEnd, clearDateRange,
    searchText, setSearchText, handleSearch, clearSearch, search,
    ranking, total, page, setPage, totalPages, pageSize, rankBase,
    sortBy, toggleSort, getSortIcon,
    loading, selectedIds, toggleSelect, refreshing, handleRefresh,
  } = useProductRanking()

  const [drawerId, setDrawerId] = useState<string | null>(null)

  const toggleSelectAll = useCallback(() => {
    const allSelected = ranking.every((p) => selectedIds.has(p.id))
    ranking.forEach((p) => {
      if (allSelected === selectedIds.has(p.id)) toggleSelect(p.id)
    })
  }, [ranking, selectedIds, toggleSelect])

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
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-2xl font-bold text-gray-800">访问量排行榜</h1>
          <div className="flex items-center gap-3">
            {selectedIds.size > 0 && (
              <button onClick={handleRefresh} disabled={refreshing} className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 text-sm disabled:opacity-50">
                {refreshing ? '刷新中...' : `刷新选中 (${selectedIds.size})`}
              </button>
            )}
            <button onClick={() => navigate('/products')} className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm">返回商品管理</button>
          </div>
        </div>

        {/* 筛选栏：日期范围（清空=全部时间）/ 品牌 / 店铺 / 描述搜索 */}
        <div className="flex flex-wrap items-end gap-3 bg-white rounded-lg border border-gray-200 p-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">开始日期</label>
            <input type="date" value={start} onChange={(e) => setStart(e.target.value)} className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">结束日期</label>
            <input type="date" value={end} onChange={(e) => setEnd(e.target.value)} className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          {(start || end) && (
            <button onClick={clearDateRange} className="px-3 py-2 text-gray-500 hover:text-gray-700 text-sm border border-gray-300 rounded-md">清空日期</button>
          )}
          {!start && !end && (
            <span className="px-3 py-2 text-xs text-gray-400">全部时间</span>
          )}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">品牌</label>
            <select value={labelId} onChange={(e) => handleLabelChange(e.target.value)} className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">全部标签</option>
              {labels.map((l) => (<option key={l.label_id} value={l.label_id}>{l.label_name}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">店铺</label>
            <select value={selectedShop} onChange={(e) => handleShopChange(e.target.value)} className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">全部店铺</option>
              {shops.map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-gray-500 mb-1">描述搜索</label>
            <div className="flex items-center gap-1">
              <input type="text" value={searchText} onChange={(e) => setSearchText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleSearch() }} placeholder="搜索描述..." className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1" />
              <button onClick={handleSearch} className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm shrink-0">搜索</button>
              {search && (<button onClick={clearSearch} className="px-2 py-2 text-gray-400 hover:text-gray-600 text-sm shrink-0">清除</button>)}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">加载中...</div>
        ) : ranking.length === 0 ? (
          <div className="text-center py-12 text-gray-500">暂无数据</div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-center py-3 px-3 w-10">
                    <input type="checkbox" checked={ranking.length > 0 && ranking.every((p) => selectedIds.has(p.id))} onChange={toggleSelectAll} className="rounded border-gray-300" />
                  </th>
                  <th className="text-center py-3 px-5 text-gray-500 font-medium w-16">排名</th>
                  <th className="text-left py-3 px-5 text-gray-500 font-medium">商品</th>
                  <th className="text-left py-3 px-5 text-gray-500 font-medium">编号</th>
                  <th onClick={() => toggleSort('views')} className={`text-right py-3 px-5 font-medium cursor-pointer select-none whitespace-nowrap ${sortBy === 'views' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>浏览次数{getSortIcon('views')}</th>
                  <th onClick={() => toggleSort('viewers')} className={`text-right py-3 px-5 font-medium cursor-pointer select-none whitespace-nowrap ${sortBy === 'viewers' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>浏览人数{getSortIcon('viewers')}</th>
                  <th className="text-right py-3 px-5 text-gray-500 font-medium">成交数量</th>
                  <th className="text-right py-3 px-5 text-gray-500 font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {ranking.map((p, i) => {
                  const rank = rankBase + i + 1
                  return (
                    <tr key={p.id} className={`border-b border-gray-100 hover:bg-gray-50 ${selectedIds.has(p.id) ? 'bg-blue-50' : ''}`}>
                      <td className="py-3 px-3 text-center"><input type="checkbox" checked={selectedIds.has(p.id)} onChange={() => toggleSelect(p.id)} className="rounded border-gray-300" /></td>
                      <td className="py-3 px-5 text-center">
                        {rank <= 3 ? (
                          <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-white text-xs font-bold ${rank === 1 ? 'bg-yellow-500' : rank === 2 ? 'bg-gray-400' : 'bg-orange-400'}`}>{rank}</span>
                        ) : (<span className="text-gray-400 font-medium">{rank}</span>)}
                      </td>
                      <td className="py-3 px-5">
                        <div className="flex items-center gap-3">
                          {p.image_url ? (
                            <HoverPopup popup={<div className="w-48 h-48"><img src={p.image_url} alt="" className="w-full h-full rounded object-cover" /></div>}>
                              <img src={p.image_url} alt="" className="w-10 h-10 rounded object-cover bg-gray-100" />
                            </HoverPopup>
                          ) : (<div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center text-gray-300 text-xs">无</div>)}
                          <HoverPopup side="overlay" popup={<div className="p-3 max-w-sm text-sm text-gray-700 whitespace-normal break-all select-text">{p.description || p.name}</div>}>
                            <span className="font-medium text-gray-800 max-w-[200px] truncate block">{p.description || p.name}</span>
                          </HoverPopup>
                        </div>
                      </td>
                      <td className="py-3 px-5 text-gray-400 font-mono text-xs">{p.sku || '-'}</td>
                      <td className="py-3 px-5 text-right font-bold text-blue-600">{p.total_views}</td>
                      <td className="py-3 px-5 text-right font-bold text-green-600">{p.total_viewers}</td>
                      <td className="py-3 px-5 text-right font-bold text-orange-600">{p.total_tx_count}</td>
                      <td className="py-3 px-5 text-right"><button onClick={() => setDrawerId(p.id)} className="text-green-600 hover:text-green-800 text-sm">统计</button></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {total > pageSize && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-gray-200">
                <span className="text-sm text-gray-500">共 {total} 条，第 {page}/{totalPages} 页</span>
                <div className="flex items-center gap-1">
                  <button onClick={() => setPage(page - 1)} disabled={page <= 1} className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-40">上一页</button>
                  {pages.map((p, i) => p === '...' ? <span key={`d-${i}`} className="px-2 text-gray-400">...</span> : <button key={p} onClick={() => setPage(p)} className={`px-3 py-1 text-sm rounded-md border ${p === page ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 hover:bg-gray-50'}`}>{p}</button>)}
                  <button onClick={() => setPage(page + 1)} disabled={page >= totalPages} className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-40">下一页</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      <ProductDetailDrawer productId={drawerId} onClose={() => setDrawerId(null)} />
    </>
  )
}
