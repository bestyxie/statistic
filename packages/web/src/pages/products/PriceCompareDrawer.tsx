import { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import Modal from '../../components/ui/Modal'
import { useImagePreview } from '../../components/mobile/MobileImagePreview'
import type { Product, PriceCompareItem, PriceCompareResult } from '@statistic/shared'

interface Props {
  product: Product | null
  onClose: () => void
}

/** 有报价的结果项（null 价已过滤，便于比较与取最低价） */
type PricedItem = PriceCompareItem & { price: number }

export default function PriceCompareDrawer({ product, onClose }: Props) {
  const { show: showImage } = useImagePreview()
  const [result, setResult] = useState<PriceCompareResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  // 重试计数：变更即重新请求
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    if (!product) return
    const run = async () => {
      setLoading(true)
      setError('')
      setResult(null)
      try {
        setResult(await api.priceCompare(product.id))
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : '比价失败')
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [product, retryCount])

  const items = result?.items ?? []
  const myPrice = result?.myPrice ?? null
  // 接口已按价格升序、null 价沉底，首个有价项即最低价
  const priced = items.filter((i): i is PricedItem => i.price !== null)
  const minPrice = priced.length > 0 ? priced[0].price : null
  const cheaperCount = myPrice !== null ? priced.filter((i) => i.price < myPrice).length : 0

  return (
    <Modal open={!!product} onClose={onClose} variant="drawer">
      <div className="p-3 sm:p-6 overflow-hidden flex flex-col">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h2 className="text-sm sm:text-lg font-semibold max-w-[250px] sm:max-w-[400px] truncate" title={product?.description || product?.sku}>比价 — {product?.description || product?.sku}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>

        {/* 本商品信息卡 */}
        <div className="flex items-center gap-3 p-2 sm:p-3 mb-3 bg-gray-50 rounded-lg">
          {product?.image_url ? (
            <img src={product.image_url} alt="" className="w-14 h-14 rounded object-cover bg-gray-100 shrink-0" />
          ) : (
            <div className="w-14 h-14 rounded bg-gray-200 flex items-center justify-center text-gray-400 text-xs shrink-0">无图</div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm text-gray-800 truncate">{product?.description || '-'}</p>
            <p className="text-sm text-gray-500 mt-1">
              本店价格 <span className="font-medium text-gray-700">{myPrice !== null ? `¥${myPrice}` : '—'}</span>
            </p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400">比价中...</div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-500 mb-3">{error}</p>
            <button onClick={() => setRetryCount((n) => n + 1)} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700">重试</button>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-12 text-gray-400">没有找到相似商品</div>
        ) : (
          <>
            <p className="text-xs sm:text-sm text-gray-500 mb-2 sm:mb-3">
              共 {items.length} 家{minPrice !== null && <> · 最低 <span className="text-red-600 font-medium">¥{minPrice}</span></>}{myPrice !== null && <> · 低于本店 {cheaperCount} 家</>}
            </p>
            <div className="flex-1 overflow-auto -mx-1 px-1">
              <ul className="divide-y divide-gray-100">
                {items.map((item) => {
                  const cheaper = item.price !== null && myPrice !== null && item.price < myPrice
                  return (
                    <li key={`${item.merchant}-${item.title}-${item.price}`} className="flex items-center gap-3 py-2.5">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt=""
                          loading="lazy"
                          onClick={() => showImage(item.imageUrl)}
                          className="w-16 h-16 rounded object-cover bg-gray-100 cursor-pointer shrink-0"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded bg-gray-100 shrink-0" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-gray-800 font-medium truncate">{item.merchant || '—'}</p>
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{item.title}</p>
                      </div>
                      <span className={`text-sm font-medium shrink-0 ${cheaper ? 'text-red-600' : 'text-gray-500'}`}>
                        {item.price !== null ? `¥${item.price}` : '—'}
                      </span>
                    </li>
                  )
                })}
              </ul>
            </div>
          </>
        )}
      </div>
    </Modal>
  )
}
