import { useState } from 'react'
import type { SupplierProduct } from '@statistic/shared'
import SupplierProductForm from './SupplierProductForm'

interface Props {
  products: SupplierProduct[]
  supplierName: string
  onSave: (data: { product_code: string; price: string; image_url: string; description: string }, editingId?: string) => Promise<void>
  onDelete: (id: string) => void
}

export default function SupplierProductList({ products, supplierName, onSave, onDelete }: Props) {
  const [showForm, setShowForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<SupplierProduct | null>(null)

  const handleSubmit = async (data: { product_code: string; price: string; image_url: string; description: string }) => {
    await onSave(data, editingProduct?.id)
    setShowForm(false)
    setEditingProduct(null)
  }

  const handleEdit = (product: SupplierProduct) => {
    setEditingProduct(product)
    setShowForm(true)
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingProduct(null)
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="px-5 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
        <h3 className="font-medium text-gray-700 text-sm">供货商品（{supplierName}）</h3>
        <button
          onClick={() => { setShowForm(true); setEditingProduct(null) }}
          className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
        >
          添加商品
        </button>
      </div>

      {showForm && (
        <SupplierProductForm
          product={editingProduct}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      )}

      {products.length === 0 ? (
        <p className="text-center py-8 text-gray-400 text-sm">暂无供货商品</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5">
          {products.map((p) => (
            <div key={p.id} className="border border-gray-200 rounded-lg p-3 hover:shadow-sm transition-shadow">
              <div className="flex gap-3">
                {p.image_url && (
                  <img
                    src={p.image_url}
                    alt={p.description}
                    className="w-16 h-16 rounded object-cover flex-shrink-0"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-800 truncate" title={p.description}>{p.description || '无描述'}</p>
                  <p className="text-xs text-gray-400 mt-1">编号：{p.product_code || '-'}</p>
                  <p className="text-sm text-orange-600 font-medium mt-1">¥{p.price || '-'}</p>
                </div>
                <div className="flex flex-col gap-1 flex-shrink-0">
                  <button onClick={() => handleEdit(p)} className="text-blue-600 hover:text-blue-800 text-xs">编辑</button>
                  <button onClick={() => onDelete(p.id)} className="text-red-500 hover:text-red-700 text-xs">删除</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
