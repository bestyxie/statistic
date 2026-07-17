import { useProductRanking } from '../../hooks/useProductRanking'
import MobilePageHeader from '../../components/mobile/MobilePageHeader'
import MobileFilter from '../../components/mobile/MobileFilter'
import MobileCard, { MobileCardActions } from '../../components/mobile/MobileCard'
import MobilePagination from '../../components/mobile/MobilePagination'
import { useImagePreview } from '../../components/mobile/MobileImagePreview'
import TimeRangePicker from '../../components/TimeRangePicker'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import ProductDetailDrawer from '../../components/ProductDetailDrawer'
import ProductNotesModal from '../../components/ProductNotesModal'
import ProductNotesAddModal from '../../components/ProductNotesAddModal'
import BatchAddSupplierModal from '../products/BatchAddSupplierModal'
import AddSupplierModal from '../products/AddSupplierModal'
import ProductSuppliersModal from '../products/ProductSuppliersModal'
import type { ProductRankingItem } from '../../lib/api'

export default function MobileRanking() {
  const navigate = useNavigate()
  const {
    shops, selectedShop, handleShopChange,
    labels, labelId, handleLabelChange,
    range, setRange,
    searchText, setSearchText, handleSearch, clearSearch, search,
    ranking, total, page, setPage, totalPages, rankBase,
    sortBy, sortOrder, toggleSort, getSortIcon,
    loading, selectedIds, toggleSelect, refreshing, handleRefresh, clearSelection,
  } = useProductRanking()

  const [drawerId, setDrawerId] = useState<string | null>(null)
  const [notesProduct, setNotesProduct] = useState<ProductRankingItem | null>(null)
  const [addNoteProduct, setAddNoteProduct] = useState<ProductRankingItem | null>(null)
  const [batchSupplierIds, setBatchSupplierIds] = useState<string[] | null>(null)
  const [suppliersProduct, setSuppliersProduct] = useState<ProductRankingItem | null>(null)
  const [addSupplierProduct, setAddSupplierProduct] = useState<ProductRankingItem | null>(null)
  const { show: showImage } = useImagePreview()

  const fmtDate = (ts: number) => {
    const d = new Date(ts)
    const p = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
  }
  const rangeText = range ? `${fmtDate(range[0])}~${fmtDate(range[1])}` : '全部时间'
  const sortText = `${sortBy === 'viewers' ? '访客数' : '浏览次数'}${sortOrder === 'asc' ? '↑' : '↓'}`
  const summaryParts = [rangeText, sortText]
  if (labelId) summaryParts.push(labels.find((l) => l.label_id === labelId)?.label_name || '品牌')
  if (selectedShop) summaryParts.push(shops.find((s) => s.id === selectedShop)?.name || '店铺')
  if (search) summaryParts.push(`搜:${search}`)
  const summary = summaryParts.join(' · ')

  return (
    <div className="space-y-4">
      <MobilePageHeader title="访问量排行榜" actions={
        <button onClick={() => navigate('/products')} className="text-sm text-blue-600">返回</button>
      } />

      <MobileFilter summary={summary}>
        <div>
          <span className="block text-xs text-gray-500 mb-1">时间范围{!range && '（全部时间）'}</span>
          <TimeRangePicker value={range} onChange={setRange} showTime={false} className="w-full" />
        </div>
        <select
          value={labelId}
          onChange={(e) => handleLabelChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
        >
          <option value="">全部标签</option>
          {labels.map((l) => (
            <option key={l.label_id} value={l.label_id}>{l.label_name}</option>
          ))}
        </select>
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
        <div>
          <span className="block text-xs text-gray-500 mb-1">排序</span>
          <div className="flex gap-2">
            <button
              onClick={() => toggleSort('views')}
              className={`flex-1 px-3 py-1.5 text-sm rounded-md border ${sortBy === 'views' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'border-gray-200 text-gray-600'}`}
            >
              浏览次数{getSortIcon('views')}
            </button>
            <button
              onClick={() => toggleSort('viewers')}
              className={`flex-1 px-3 py-1.5 text-sm rounded-md border ${sortBy === 'viewers' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'border-gray-200 text-gray-600'}`}
            >
              浏览人数{getSortIcon('viewers')}
            </button>
          </div>
        </div>
      </MobileFilter>

      {selectedIds.size > 0 && (
        <div className="flex gap-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex-1 px-3 py-2 bg-orange-600 text-white rounded-md text-sm disabled:opacity-50"
          >
            {refreshing ? '刷新中...' : `刷新选中 (${selectedIds.size})`}
          </button>
          <button
            onClick={() => setBatchSupplierIds([...selectedIds])}
            className="flex-1 px-3 py-2 bg-purple-600 text-white rounded-md text-sm"
          >
            批量加供应商 ({selectedIds.size})
          </button>
        </div>
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
                      {p.latest_note_content && (
                        <p className="mt-1 text-xs text-gray-500 truncate" title={p.latest_note_content}>
                          备注：{p.latest_note_content}
                        </p>
                      )}
                    </div>
                  </div>
                  <MobileCardActions>
                    <button onClick={() => setDrawerId(p.id)} className="text-green-600 text-sm">查看统计</button>
                    <button onClick={() => setNotesProduct(p)} className="text-blue-600 text-sm">备注</button>
                    <button onClick={() => setAddNoteProduct(p)} className="text-blue-600 text-sm">添加备注</button>
                    <button onClick={() => setSuppliersProduct(p)} className="text-purple-600 text-sm">供应商</button>
                    <button onClick={() => setAddSupplierProduct(p)} className="text-purple-600 text-sm">添加供应商</button>
                  </MobileCardActions>
                </MobileCard>
              )
            })}
          </div>
          <MobilePagination page={page} totalPages={totalPages} total={total} onPageChange={setPage} />
        </>
      )}

      <ProductDetailDrawer productId={drawerId} onClose={() => setDrawerId(null)} />
      <BatchAddSupplierModal productIds={batchSupplierIds} onClose={() => setBatchSupplierIds(null)} onSuccess={clearSelection} />
      <ProductSuppliersModal product={suppliersProduct} onClose={() => setSuppliersProduct(null)} />
      <AddSupplierModal product={addSupplierProduct} onClose={() => setAddSupplierProduct(null)} />
      <ProductNotesModal product={notesProduct} onClose={() => setNotesProduct(null)} />
      <ProductNotesAddModal product={addNoteProduct} onClose={() => setAddNoteProduct(null)} />
    </div>
  )
}
