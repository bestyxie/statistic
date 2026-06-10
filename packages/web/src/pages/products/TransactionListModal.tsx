import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../lib/api'
import type { Product } from '@statistic/shared'

interface Props {
  product: Product | null
  onClose: () => void
}

export default function TransactionListModal({ product, onClose }: Props) {
  const navigate = useNavigate()
  const [list, setList] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!product) return
    setLoading(true)
    api.getTransactions({ product_id: product.id, limit: 50 })
      .then((res) => setList(res.items || []))
      .catch(() => setList([]))
      .finally(() => setLoading(false))
  }, [product])

  if (!product) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4" onClick={onClose}>
      <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-6 max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h2 className="text-sm sm:text-lg font-semibold max-w-[250px] sm:max-w-[400px] truncate" title={product.description || product.sku}>成交记录 — {product.description || product.sku}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-4 mb-3 sm:mb-4 text-xs sm:text-sm text-gray-600">
          <span>共 {list.length} 条成交记录</span>
          <span>总数量: {list.reduce((sum, tx) => sum + (tx.quantity || 0), 0)}</span>
          <span className="text-red-600">已退: {list.reduce((sum, tx) => sum + (tx.refund_quantity || 0), 0)}</span>
          <span className="text-orange-600 font-medium">
            总金额: ¥{list.reduce((sum, tx) => sum + parseFloat(tx.price || '0') * (tx.quantity || 0), 0).toFixed(0)}
          </span>
        </div>

        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="text-center py-12 text-gray-400">加载中...</div>
          ) : list.length === 0 ? (
            <div className="text-center py-12 text-gray-400">暂无成交记录</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">日期</th>
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">商品</th>
                  <th className="text-right py-3 px-4 text-gray-500 font-medium">成交价</th>
                  <th className="text-right py-3 px-4 text-gray-500 font-medium">数量</th>
                  <th className="text-right py-3 px-4 text-gray-500 font-medium">金额</th>
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">备注</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {list.map((tx) => {
                  const hasRefund = (tx.refund_count || 0) > 0
                  const refundQuantity = tx.refund_quantity || 0
                  const remainingQuantity = tx.quantity - refundQuantity
                  const isFullyRefunded = remainingQuantity <= 0

                  return (
                    <tr key={tx.id} className={`hover:bg-gray-50 ${isFullyRefunded ? 'bg-red-50/50' : ''}`}>
                      <td className="py-3 px-4 text-gray-600">{tx.date}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {tx.image_url && <img src={tx.image_url} alt="" className="w-8 h-8 rounded object-cover bg-gray-100" />}
                          <div className="flex items-center gap-2">
                            <span className={`text-gray-800 max-w-[150px] truncate block ${isFullyRefunded ? 'line-through text-gray-400' : ''}`} title={tx.description || tx.product_name}>{tx.description || tx.product_name}</span>
                            {hasRefund && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                已退{refundQuantity}件
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-medium">¥{tx.price}</td>
                      <td className="py-3 px-4 text-right">
                        <span className={isFullyRefunded ? 'text-gray-400 line-through' : ''}>{tx.quantity}</span>
                        {hasRefund && <span className="text-xs text-red-600 ml-1">(剩{remainingQuantity})</span>}
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-orange-600">¥{(parseFloat(tx.price) * tx.quantity).toFixed(0)}</td>
                      <td className="py-3 px-4 text-gray-500 max-w-[100px] truncate" title={tx.note}>{tx.note || '-'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        <div className="flex gap-2 pt-4 border-t border-gray-200 mt-4">
          <button onClick={() => navigate(`/transactions?product_id=${product.id}`)} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm">查看完整成交明细</button>
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50">关闭</button>
        </div>
      </div>
    </div>
  )
}
