import { useState } from 'react'
import type { SupplierProduct } from '@statistic/shared'

interface Props {
  product?: SupplierProduct | null
  onSubmit: (data: { product_code: string; price: string; image_url: string; description: string }) => Promise<void>
  onCancel: () => void
}

export default function SupplierProductForm({ product, onSubmit, onCancel }: Props) {
  const [form, setForm] = useState({
    product_code: product?.product_code || '',
    price: product?.price || '',
    image_url: product?.image_url || '',
    description: product?.description || '',
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
      <h4 className="font-medium text-sm mb-3">{product ? '编辑商品' : '添加商品'}</h4>
      <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">商品编号</label>
          <input
            type="text"
            value={form.product_code}
            onChange={(e) => setForm({ ...form, product_code: e.target.value })}
            className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="编号"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">价格</label>
          <input
            type="text"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="价格"
          />
        </div>
        <div className="col-span-2">
          <label className="block text-xs text-gray-500 mb-1">图片 URL</label>
          <input
            type="text"
            value={form.image_url}
            onChange={(e) => setForm({ ...form, image_url: e.target.value })}
            className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="图片链接"
          />
        </div>
        <div className="col-span-2">
          <label className="block text-xs text-gray-500 mb-1">商品描述</label>
          <input
            type="text"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="商品描述"
          />
        </div>
        {error && <p className="col-span-2 text-red-500 text-xs">{error}</p>}
        <div className="col-span-2 flex gap-2">
          <button type="submit" className="px-3 py-1.5 bg-blue-600 text-white rounded text-xs hover:bg-blue-700">
            {product ? '保存' : '添加'}
          </button>
          <button type="button" onClick={onCancel} className="px-3 py-1.5 border border-gray-300 rounded text-xs hover:bg-gray-50">
            取消
          </button>
        </div>
      </form>
    </div>
  )
}
