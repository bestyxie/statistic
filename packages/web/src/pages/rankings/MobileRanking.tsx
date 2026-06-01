import { useProductRanking } from '../../hooks/useProductRanking'
import MobilePageHeader from '../../components/mobile/MobilePageHeader'
import MobileFilter from '../../components/mobile/MobileFilter'
import MobileCard, { MobileCardActions } from '../../components/mobile/MobileCard'
import MobilePagination from '../../components/mobile/MobilePagination'
import { useImagePreview } from '../../components/mobile/MobileImagePreview'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import ProductDetailDrawer from '../../components/ProductDetailDrawer'

export default function MobileRanking() {
  const navigate = useNavigate()
  const {
    shops, selectedShop, handleShopChange,
    searchText, setSearchText, handleSearch, clearSearch, search,
    ranking, total, page, setPage, totalPages, rankBase,
    loading, selectedIds, toggleSelect, refreshing, handleRefresh,
  } = useProductRanking()

  const [drawerId, setDrawerId] = useState<string | null>(null)
  const { show: showImage } = useImagePreview()

  return (
    <div className="space-y-4">
      <MobilePageHeader title="7日排行榜" actions={
        <button onClick={() => navigate('/products')} className="text-sm text-blue-600">返回</button>
      } />

      <MobileFilter summary={search ? `搜索: ${search}` : '筛选'}>
        <select
          value={selectedShop}
          onChange={(e) => handleShopChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
        >
          <option value="">全部店铺</option>
          {shops.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        <div className="flex gap-2">
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="搜索描述..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
          />
          <button onClick={handleSearch} className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm shrink-0">搜索</button>
        </div>
        {search && (
          <button onClick={clearSearch} className="text-sm text-gray-500">清除搜索</button>
        )}
      </MobileFilter>

      {selectedIds.size > 0 && (
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="w-full px-3 py-2 bg-orange-600 text-white rounded-md text-sm disabled:opacity-50"
        >
          {refreshing ? '刷新中...' : `刷新选中 (${selectedIds.size})`}
        </button>
      )}

      {loading ? (
        <p className="text-center py-12 text-gray-400 text-sm">加载中...</p>
      ) : ranking.length === 0 ? (
        <p className="text-center py-12 text-gray-400 text-sm">暂无数据</p>
      ) : (
        <>
          <div className="space-y-2">
            {ranking.map((p, i) => {
              const rank = rankBase + i + 1
              return (
                <MobileCard key={p.id}>
                  <div className="flex items-start gap-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(p.id)}
                        onChange={() => toggleSelect(p.id)}
                        className="rounded border-gray-300 shrink-0"
                      />
                      {rank <= 3 ? (
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-white text-xs font-bold shrink-0 ${rank === 1 ? 'bg-yellow-500' : rank === 2 ? 'bg-gray-400' : 'bg-orange-400'}`}>
                          {rank}
                        </span>
                      ) : (
                        <span className="text-gray-400 font-medium text-sm w-6 text-center shrink-0">{rank}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {p.image_url ? (
                          <img src={p.image_url} alt="" className="w-14 h-14 rounded object-cover bg-gray-100 shrink-0 cursor-pointer" onClick={() => showImage(p.image_url!)} />
                        ) : (
                          <div className="w-14 h-14 rounded bg-gray-100 flex items-center justify-center text-gray-300 text-xs shrink-0">无</div>
                        )}
                        <p className="text-sm font-medium text-gray-800 truncate">{p.description || p.name}</p>
                      </div>
                      <div className="flex items-center gap-3 mt-1.5 text-xs">
                        <span className="text-blue-600 font-medium">{p.total_views} 浏览</span>
                        <span className="text-green-600 font-medium">{p.total_viewers} 访客</span>
                        {p.total_tx_count > 0 && (
                          <span className="text-orange-600 font-medium">{p.total_tx_count} 成交</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <MobileCardActions>
                    <button onClick={() => setDrawerId(p.id)} className="text-green-600 text-sm">查看统计</button>
                  </MobileCardActions>
                </MobileCard>
              )
            })}
          </div>
          <MobilePagination page={page} totalPages={totalPages} total={total} onPageChange={setPage} />
        </>
      )}

      <ProductDetailDrawer productId={drawerId} onClose={() => setDrawerId(null)} />
    </div>
  )
}
