import { useState } from 'react'
import type { ProductSupplierWithInfo, PurchaseWithProduct } from '../../lib/supplierApi'

interface Props {
  supplierProducts: ProductSupplierWithInfo[]
  purchase?: PurchaseWithProduct | null
  onSubmit: (data: { product_supplier_id: string; price: string; quantity: number; purchase_date: string; note: string }) => Promise<void>
  onCancel: () => void
}

export default function PurchaseRecordForm({ supplierProducts, purchase, onSubmit, onCancel }: Props) {
  const [form, setForm] = useState({
    product_supplier_id: purchase?.product_supplier_id || supplierProducts[0]?.id || '',
    price: purchase?.price || '',
    quantity: purchase?.quantity || 1,
    purchase_date: purchase?.purchase_date || new Date().toISOString().slice(0, 10),
    note: purchase?.note || '',
  })
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      await onSubmit(form)
    } catch (err: any) {
      setError(err.message)
    }
  }

  return (
    <div className="p-5 border-b border-gray-200 bg-gray-50">
      <h4 className="font-medium text-sm mb-3">{purchase ? '编辑拿货' : '添加拿货'}</h4>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">选择商品</label>
          <select
            value={form.product_supplier_id}
            onChange={(e) => setForm({ ...form, product_supplier_id: e.target.value })}
            required
            className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">请选择</option>
            {supplierProducts.map((sp) => (
              <option key={sp.id} value={sp.id}>
                {sp.product_description || sp.product_name || sp.product_sku || sp.id.slice(0, 8)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">拿货价格</label>
          <input type="text" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="价格" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">数量</label>
          <input type="number" min={1} value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">拿货日期</label>
          <input type="date" value={form.purchase_date} onChange={(e) => setForm({ ...form, purchase_date: e.target.value })} required className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div className="col-span-2">
          <label className="block text-xs text-gray-500 mb-1">备注</label>
          <input type="text" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="备注" />
        </div>
        {error && <p className="col-span-2 text-red-500 text-xs">{error}</p>}
        <div className="col-span-2 flex gap-2">
          <button type="submit" className="px-3 py-1.5 bg-blue-600 text-white rounded text-xs hover:bg-blue-700">{purchase ? '保存' : '添加'}</button>
          <button type="button" onClick={onCancel} className="px-3 py-1.5 border border-gray-300 rounded text-xs hover:bg-gray-50">取消</button>
        </div>
      </form>
    </div>
  )
}
