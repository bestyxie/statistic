import { useState, useEffect } from 'react'
import { api } from '../../lib/api'
import { supplierApi, type ProductSupplierWithInfo } from '../../lib/supplierApi'
import SearchableSelect from '../../components/SearchableSelect'
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
  const [productSuppliers, setProductSuppliers] = useState<ProductSupplierWithInfo[]>([])
  const [selectedPsId, setSelectedPsId] = useState('')
  const [purchasePrice, setPurchasePrice] = useState('')

  // 拉取该商品的供应商列表（用于「供应商」下拉与「拿货价」自动填充）
  useEffect(() => {
    if (!product) {
      setProductSuppliers([])
      return
    }
    supplierApi.getAllProducts({ product_id: product.id }).then(setProductSuppliers).catch(() => setProductSuppliers([]))
  }, [product])

  if (!product) return null

  // 选择供应商后自动填入该供应商对该商品的拿货价；选「不记录拿货」则清空
  const handleSelectSupplier = (psId: string) => {
    setSelectedPsId(psId)
    const ps = productSuppliers.find((p) => p.id === psId)
    setPurchasePrice(ps?.price ?? '')
  }

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
      // 可选：为选中供应商创建拿货记录（拿货价为空时用该供应商默认供货价）
      if (selectedPsId) {
        const ps = productSuppliers.find((p) => p.id === selectedPsId)
        if (ps) {
          try {
            await supplierApi.createPurchaseRecord(ps.supplier_id, {
              product_supplier_id: ps.id,
              price: purchasePrice || ps.price,
              quantity: parseInt(quantity) || 1,
              purchase_date: date,
            })
          } catch {
            alert('成交已记录，但拿货记录创建失败，请到供应商页补录')
          }
        }
      }
      onClose()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : '录入失败')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 max-w-md w-full">
        <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">录入成交 — {product.description?.slice(0, 30) || product.sku}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">供应商</label>
            <SearchableSelect
              options={[{ value: '', label: '不记录拿货' }, ...productSuppliers.map((ps) => ({ value: ps.id, label: ps.supplier_name }))]}
              value={selectedPsId}
              onChange={handleSelectSupplier}
              placeholder="选择供应商（可选）"
              searchPlaceholder="搜索供应商..."
              emptyText="该商品暂无供应商"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">拿货价</label>
            <input type="text" value={purchasePrice} onChange={(e) => setPurchasePrice(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="可选，选择供应商后自动填入" />
          </div>
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
