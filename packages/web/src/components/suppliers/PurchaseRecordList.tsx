import { useState } from 'react'
import type { PurchaseRecord } from '@statistic/shared'
import type { ProductSupplierWithInfo, PurchaseWithProduct } from '../../lib/supplierApi'
import PurchaseRecordForm from './PurchaseRecordForm'

interface Props {
  purchases: PurchaseWithProduct[]
  supplierProducts: ProductSupplierWithInfo[]
  onSave: (data: { product_supplier_id: string; price: string; quantity: number; purchase_date: string; note: string }, editingId?: string) => Promise<void>
  onDelete: (id: string) => void
}

export default function PurchaseRecordList({ purchases, supplierProducts, onSave, onDelete }: Props) {
  const [showForm, setShowForm] = useState(false)
  const [editingPurchase, setEditingPurchase] = useState<PurchaseWithProduct | null>(null)

  const handleSubmit = async (data: { product_supplier_id: string; price: string; quantity: number; purchase_date: string; note: string }) => {
    await onSave(data, editingPurchase?.id)
    setShowForm(false)
    setEditingPurchase(null)
  }

  const handleEdit = (purchase: PurchaseWithProduct) => {
    setEditingPurchase(purchase)
    setShowForm(true)
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingPurchase(null)
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="px-5 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
        <h3 className="font-medium text-gray-700 text-sm">拿货记录</h3>
        <button
          onClick={() => { setShowForm(true); setEditingPurchase(null) }}
          disabled={supplierProducts.length === 0}
          className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          添加拿货
        </button>
      </div>

      {showForm && (
        <PurchaseRecordForm
          supplierProducts={supplierProducts}
          purchase={editingPurchase}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      )}

      {purchases.length === 0 ? (
        <p className="text-center py-8 text-gray-400 text-sm">暂无拿货记录</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left py-3 px-5 text-gray-500 font-medium text-xs">日期</th>
              <th className="text-left py-3 px-5 text-gray-500 font-medium text-xs">商品</th>
              <th className="text-right py-3 px-5 text-gray-500 font-medium text-xs">价格</th>
              <th className="text-right py-3 px-5 text-gray-500 font-medium text-xs">数量</th>
              <th className="text-left py-3 px-5 text-gray-500 font-medium text-xs">备注</th>
              <th className="text-right py-3 px-5 text-gray-500 font-medium text-xs">操作</th>
            </tr>
          </thead>
          <tbody>
            {purchases.map((p) => (
              <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-2.5 px-5 text-gray-600 text-xs">{p.purchase_date}</td>
                <td className="py-2.5 px-5">
                  <div className="flex items-center gap-2">
                    {p.product_image && (
                      <img src={p.product_image} alt="" className="w-8 h-8 rounded object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                    )}
                    <span className="text-gray-800 text-xs truncate max-w-[120px]" title={p.product_description || p.product_name}>
                      {p.product_description || p.product_name || '-'}
                    </span>
                  </div>
                </td>
                <td className="py-2.5 px-5 text-right text-orange-600 font-medium text-xs">¥{p.price}</td>
                <td className="py-2.5 px-5 text-right text-gray-600 text-xs">{p.quantity}</td>
                <td className="py-2.5 px-5 text-gray-400 text-xs max-w-[100px] truncate">{p.note || '-'}</td>
                <td className="py-2.5 px-5 text-right">
                  <button onClick={() => handleEdit(p)} className="text-blue-600 hover:text-blue-800 text-xs mr-2">编辑</button>
                  <button onClick={() => onDelete(p.id)} className="text-red-500 hover:text-red-700 text-xs">删除</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
