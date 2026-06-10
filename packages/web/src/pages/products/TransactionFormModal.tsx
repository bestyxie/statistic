import { useState } from 'react'
import { api } from '../../lib/api'
import type { Product } from '@statistic/shared'

interface Props {
  product: Product | null
  onClose: () => void
}

export default function TransactionFormModal({ product, onClose }: Props) {
  const [price, setPrice] = useState(product?.price || '')
  const [quantity, setQuantity] = useState('1')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [note, setNote] = useState('')

  if (!product) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.createTransaction({
        product_id: product.id,
        shop_id: product.shop_id,
        price,
        quantity: parseInt(quantity) || 1,
        date,
        note,
      })
      onClose()
    } catch (err: any) {
      alert(err.message)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 max-w-md w-full">
        <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">录入成交 — {product.description?.slice(0, 30) || product.sku}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">成交价</label>
            <input type="text" value={price} onChange={(e) => setPrice(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">数量</label>
              <input type="number" min={1} value={quantity} onChange={(e) => setQuantity(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">日期</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
            <input type="text" value={note} onChange={(e) => setNote(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="可选" />
          </div>
          <div className="flex gap-2 pt-2">
            <button type="submit" className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 text-sm">确认成交</button>
            <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50">取消</button>
          </div>
        </form>
      </div>
    </div>
  )
}
