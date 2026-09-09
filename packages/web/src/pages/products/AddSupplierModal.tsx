import { useState, useEffect } from 'react'
import { supplierApi } from '../../lib/supplierApi'
import SearchableSelect from '../../components/SearchableSelect'
import Modal from '../../components/ui/Modal'
import type { Product, Supplier } from '@statistic/shared'

interface Props {
  product: Pick<Product, 'id' | 'sku' | 'description' | 'price'> | null
  onClose: () => void
}

export default function AddSupplierModal({ product, onClose }: Props) {
  const [supplierId, setSupplierId] = useState('')
  const [price, setPrice] = useState(product?.price || '')
  const [note, setNote] = useState('')
  const [suppliers, setSuppliers] = useState<Supplier[]>([])

  useEffect(() => {
    supplierApi.getSuppliers().then(setSuppliers).catch(() => {})
  }, [])

  const handleSubmit = async () => {
    if (!supplierId || !product) return
    try {
      await supplierApi.linkProduct({
        product_id: product.id,
        supplier_id: supplierId,
        price,
        note,
      })
      onClose()
    } catch (err: any) {
      alert(err.message || '添加失败')
    }
  }

  return (
    <Modal open={!!product} onClose={onClose} disableClose size="md">
      <div className="p-4 sm:p-6">
        <h2 className="text-base sm:text-lg font-semibold mb-4">添加供应商 — {product ? (product.description || product.sku).slice(0, 30) : ''}</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">选择供应商</label>
            <SearchableSelect
              options={suppliers.map((s) => ({ value: s.id, label: s.wechat_nickname + (s.remark ? ` (${s.remark})` : '') }))}
              value={supplierId}
              onChange={setSupplierId}
              placeholder="请选择供应商"
              searchPlaceholder="搜索供应商..."
              emptyText="无匹配供应商"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">供货价</label>
            <input type="text" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="可选" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
            <input type="text" value={note} onChange={(e) => setNote(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="可选" />
          </div>
          <div className="flex gap-2 pt-2">
            <button onClick={handleSubmit} className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm">确认添加</button>
            <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50">取消</button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
