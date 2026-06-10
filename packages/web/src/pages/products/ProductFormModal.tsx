import { useState } from 'react'
import { api } from '../../lib/api'
import type { Product, Shop } from '@statistic/shared'

interface Props {
  product: Product | null | 'new'
  shops: Shop[]
  onClose: () => void
  onSaved: () => void
}

export default function ProductFormModal({ product, shops, onClose, onSaved }: Props) {
  if (product === null) return null
  const isEdit = product !== 'new'
  const editProduct = isEdit ? product as Product : null
  const initial = editProduct
    ? { shop_id: editProduct.shop_id, name: editProduct.name, image_url: editProduct.image_url, sku: editProduct.sku, price: editProduct.price }
    : { shop_id: '', name: '', image_url: '', sku: '', price: '' }
  const [form, setForm] = useState(initial)
  const [showFullDesc, setShowFullDesc] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      if (isEdit && editProduct) {
        await api.updateProduct(editProduct.id, {
          name: form.name,
          image_url: editProduct.image_url,
          description: editProduct.description,
          sku: form.sku,
          price: form.price,
        })
      } else {
        await api.createProduct(form)
      }
      onSaved()
    } catch (err: any) {
      setError(err.message)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">{isEdit ? '编辑商品' : '添加商品'}</h2>

        {isEdit && editProduct && (
          <div className="flex gap-3 sm:gap-4 mb-3 sm:mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex-shrink-0">
              {editProduct.image_url ? (
                <img src={editProduct.image_url} alt="商品图片" className="w-16 h-16 sm:w-24 sm:h-24 rounded object-cover bg-gray-100" />
              ) : (
                <div className="w-16 h-16 sm:w-24 sm:h-24 rounded bg-gray-100 flex items-center justify-center text-gray-300 text-xs">无图</div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-gray-500">描述</p>
                {editProduct.description && editProduct.description.length > 100 && (
                  <button type="button" onClick={() => setShowFullDesc(!showFullDesc)} className="text-xs text-blue-600 hover:text-blue-800">
                    {showFullDesc ? '收起' : '显示全部'}
                  </button>
                )}
              </div>
              <p className={`text-sm text-gray-700 ${showFullDesc ? '' : 'line-clamp-4'} overflow-y-auto`}>
                {editProduct.description || '暂无描述'}
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isEdit && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">所属店铺</label>
              <select
                value={form.shop_id}
                onChange={(e) => setForm({ ...form, shop_id: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">请选择店铺</option>
                {shops.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">商品名称</label>
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="商品名称" />
          </div>
          {!isEdit && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">图片 URL</label>
              <input type="url" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="https://example.com/image.jpg" />
              {form.image_url && <img src={form.image_url} alt="预览" className="mt-2 w-20 h-20 rounded object-cover bg-gray-100" />}
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
              <input type="text" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="可选" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">价格</label>
              <input type="text" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="可选" />
            </div>
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="flex gap-2 pt-2">
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm">{isEdit ? '保存' : '添加'}</button>
            <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50">取消</button>
          </div>
        </form>
      </div>
    </div>
  )
}
