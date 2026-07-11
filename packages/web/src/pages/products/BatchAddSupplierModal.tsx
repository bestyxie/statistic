import { useState, useEffect } from 'react'
import { supplierApi } from '../../lib/supplierApi'
import type { Supplier } from '@statistic/shared'

interface Props {
  productIds: string[] | null
  onClose: () => void
  onSuccess?: () => void
}

// 批量给多个选中商品关联同一个供应商。调用方只传 productIds 触发值和关闭/成功回调，
// 供应商列表加载、表单与提交状态均内聚在组件内（遵循组件封装原则）。
export default function BatchAddSupplierModal({ productIds, onClose, onSuccess }: Props) {
  const [supplierId, setSupplierId] = useState('')
  const [price, setPrice] = useState('')
  const [note, setNote] = useState('')
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    supplierApi.getSuppliers().then(setSuppliers).catch(() => {})
  }, [])

  if (!productIds || productIds.length === 0) return null

  const handleSubmit = async () => {
    if (!supplierId) return
    setSubmitting(true)
    try {
      const res = await supplierApi.linkBatchProducts({
        product_ids: productIds,
        supplier_id: supplierId,
        price,
        note,
      })
      alert(`批量添加成功，共处理 ${res.count} 个商品`)
      onSuccess?.()
      onClose()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : '批量添加失败')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4" onClick={onClose}>
      <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-base sm:text-lg font-semibold mb-4">批量添加供应商 — 选中 {productIds.length} 个商品</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">选择供应商</label>
            <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">请选择供应商</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>{s.wechat_nickname}{s.remark ? ` (${s.remark})` : ''}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">供货价</label>
            <input type="text" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="可选，将应用到全部商品" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
            <input type="text" value={note} onChange={(e) => setNote(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="可选，将应用到全部商品" />
          </div>
          <div className="flex gap-2 pt-2">
            <button onClick={handleSubmit} disabled={!supplierId || submitting} className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm disabled:opacity-50">{submitting ? '提交中...' : '确认批量添加'}</button>
            <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50">取消</button>
          </div>
        </div>
      </div>
    </div>
  )
}
