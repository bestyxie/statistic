import { useState, useEffect, useCallback } from 'react'
import { supplierApi } from '../../lib/supplierApi'
import type { Product } from '@statistic/shared'
import type { ProductSupplierWithInfo } from '../../lib/supplierApi'

interface Props {
  product: Product | null
  onClose: () => void
}

export default function ProductSuppliersModal({ product, onClose }: Props) {
  const [list, setList] = useState<ProductSupplierWithInfo[]>([])
  const [loading, setLoading] = useState(false)

  const fetchList = useCallback(async () => {
    if (!product) return
    setLoading(true)
    try {
      const result = await supplierApi.getAllProducts({ product_id: product.id })
      setList(result)
    } catch { setList([]) }
    finally { setLoading(false) }
  }, [product])

  useEffect(() => { fetchList() }, [fetchList])

  const handleUnlink = async (linkId: string) => {
    await supplierApi.unlinkProduct(linkId)
    fetchList()
  }

  if (!product) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4" onClick={onClose}>
      <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm sm:text-lg font-semibold truncate" title={product.description || product.sku}>供应商 — {product.description || product.sku}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>
        {loading ? (
          <div className="text-center py-8 text-gray-400">加载中...</div>
        ) : list.length === 0 ? (
          <div className="text-center py-8 text-gray-400">暂无关联供应商</div>
        ) : (
          <div className="overflow-auto flex-1">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">供应商</th>
                  <th className="text-right py-2 px-3 text-gray-500 font-medium">供货价</th>
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">备注</th>
                  <th className="text-right py-2 px-3 text-gray-500 font-medium">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {list.map((ps) => (
                  <tr key={ps.id} className="hover:bg-gray-50">
                    <td className="py-2 px-3 text-gray-800">{ps.supplier_name}</td>
                    <td className="py-2 px-3 text-right font-medium">{ps.price || '-'}</td>
                    <td className="py-2 px-3 text-gray-500 max-w-[150px] truncate" title={ps.note}>{ps.note || '-'}</td>
                    <td className="py-2 px-3 text-right">
                      <button onClick={() => handleUnlink(ps.id)} className="text-red-500 hover:text-red-700 text-sm">移除</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
