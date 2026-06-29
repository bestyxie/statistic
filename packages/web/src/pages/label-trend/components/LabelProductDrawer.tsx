import { useState, useEffect } from 'react'
import { api } from '../../../lib/api'
import ProductDetailDrawer from '../../../components/ProductDetailDrawer'
import type { LabelProductStat } from '@statistic/shared'

export interface LabelProductDrawerTarget {
  label_id: string
  label_name: string
  date: string
}

interface Props {
  target: LabelProductDrawerTarget | null
  onClose: () => void
}

export default function LabelProductDrawer({ target, onClose }: Props) {
  const [products, setProducts] = useState<LabelProductStat[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)

  useEffect(() => {
    if (!target) return
    let cancelled = false
    setLoading(true)
    setError(null)
    api.getLabelProducts(target.label_id, target.date)
      .then((res) => {
        if (cancelled) return
        setProducts(res.items || [])
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : '加载失败')
      })
      .finally(() => {
        if (cancelled) return
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [target])

  // 打开时锁定背景滚动
  useEffect(() => {
    if (!target) return
    const original = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = original
    }
  }, [target])

  if (!target) return null

  const totalVisitors = products.reduce((sum, p) => sum + p.visitor_count, 0)
  const totalViews = products.reduce((sum, p) => sum + p.view_count, 0)

  return (
    <div className="fixed inset-0 z-40">
      {/* 遮罩 */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* 抽屉（z-40，低于 ProductDetailDrawer 的 z-50，便于点击商品后在其上叠加）*/}
      <div className="absolute inset-y-0 right-0 sm:w-[90vw] sm:max-w-[560px] w-full bg-gray-50 shadow-xl overflow-hidden flex flex-col">
        {/* 头部 */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 bg-white shrink-0">
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-bold text-gray-800 truncate">{target.label_name}</h1>
            <p className="text-xs text-gray-500">{target.date} 商品浏览记录</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 shrink-0 ml-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* 内容 */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-4">
          {/* 汇总 */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4">
              <p className="text-xs sm:text-sm text-gray-500">访客数</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-800 mt-1">{totalVisitors.toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4">
              <p className="text-xs sm:text-sm text-gray-500">浏览次数</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-800 mt-1">{totalViews.toLocaleString()}</p>
            </div>
          </div>

          {/* 商品列表（按 visitor_count 降序，后端已排序）*/}
          {loading ? (
            <p className="text-center text-gray-400 py-12">加载中...</p>
          ) : error ? (
            <p className="text-center text-red-500 py-12 text-sm">{error}</p>
          ) : products.length === 0 ? (
            <p className="text-center text-gray-400 py-12 text-sm">该品牌当日无浏览记录</p>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
              {products.map((p, idx) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedProductId(p.id)}
                  className="w-full flex items-center gap-3 p-3 sm:p-4 text-left hover:bg-gray-50"
                >
                  <span className="text-xs text-gray-400 w-5 text-center shrink-0">{idx + 1}</span>
                  {p.image_url ? (
                    <img src={p.image_url} alt="" className="w-10 h-10 sm:w-12 sm:h-12 rounded object-cover bg-gray-100 shrink-0" />
                  ) : (
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded bg-gray-100 flex items-center justify-center text-gray-300 text-xs shrink-0">无图</div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">{p.name || '未命名商品'}</p>
                    {p.sku && <p className="text-xs text-gray-500 font-mono truncate">SKU: {p.sku}</p>}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-gray-800">{p.visitor_count} 访客</p>
                    <p className="text-xs text-gray-500">{p.view_count} 次浏览</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 点击单个商品 → 复用已有商品详情抽屉（z-50，叠在本抽屉之上）*/}
      <ProductDetailDrawer productId={selectedProductId} onClose={() => setSelectedProductId(null)} />
    </div>
  )
}
