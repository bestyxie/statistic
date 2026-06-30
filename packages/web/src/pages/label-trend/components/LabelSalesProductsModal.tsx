import { useState, useEffect } from 'react'
import { api } from '../../../lib/api'
import { useImagePreview } from '../../../components/mobile/MobileImagePreview'
import type { LabelSalesProduct } from '@statistic/shared'

export interface LabelSalesProductsTarget {
  label_id: string
  label_name: string
  start: string // '' = 全部时间
  end: string
}

interface Props {
  target: LabelSalesProductsTarget | null
  onClose: () => void
}

export default function LabelSalesProductsModal({ target, onClose }: Props) {
  const [products, setProducts] = useState<LabelSalesProduct[]>([])
  const [loading, setLoading] = useState(false)
  const { show: showImage } = useImagePreview()

  useEffect(() => {
    if (!target) return
    let cancelled = false
    setLoading(true)
    api.getLabelSalesProducts(target.label_id, target.start || undefined, target.end || undefined)
      .then((res) => {
        if (cancelled) return
        setProducts(res.items || [])
      })
      .catch(() => {
        if (cancelled) return
        setProducts([])
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

  const rangeLabel = target.start || target.end
    ? `${target.start || '不限'} ~ ${target.end || '不限'}`
    : '全部时间'

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-2 sm:p-4" onClick={onClose}>
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* 头部 */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 border-b border-gray-200 shrink-0">
          <div className="min-w-0">
            <h3 className="text-base sm:text-lg font-semibold text-gray-800 truncate">{target.label_name} · 销售商品</h3>
            <p className="text-xs text-gray-500">{rangeLabel}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 shrink-0 ml-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* 商品列表 */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5">
          {loading ? (
            <p className="text-center text-gray-400 py-12">加载中...</p>
          ) : products.length === 0 ? (
            <p className="text-center text-gray-400 py-12 text-sm">该品牌在该区间无销售商品</p>
          ) : (
            <div className="space-y-3">
              {products.map((p) => (
                <div key={p.id} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                  {p.image_url ? (
                    <img
                      src={p.image_url}
                      alt=""
                      title="点击查看大图"
                      onClick={() => showImage(p.image_url)}
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded object-cover bg-gray-100 shrink-0 cursor-zoom-in"
                    />
                  ) : (
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded bg-gray-100 flex items-center justify-center text-gray-300 text-xs shrink-0">无图</div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-gray-800 break-words line-clamp-3">{p.description || p.name || '无描述'}</p>
                    {p.sku && <p className="text-xs text-gray-500 font-mono mt-1">SKU: {p.sku}</p>}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-base font-semibold text-orange-600">{p.tx_quantity}</p>
                    <p className="text-xs text-gray-500">销量</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
