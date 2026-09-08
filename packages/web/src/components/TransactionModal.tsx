import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import { supplierApi, type ProductSupplierWithInfo } from '../lib/supplierApi'
import SearchableSelect from './SearchableSelect'
import Modal from './ui/Modal'
import type { Product } from '@statistic/shared'
import type { Transaction } from '../lib/api'

interface Props {
  /** 创建模式：传入商品 */
  product?: Product | null
  /** 编辑模式：传入成交记录 */
  transaction?: Transaction | null
  onClose: () => void
  onSaved?: () => void
}

// 成交录入/编辑统一弹窗。传 transaction 走编辑（updateTransaction），否则用 product 走
// 创建（createTransaction）。两种模式字段一致：供应商 / 拿货价 / 成交价 / 数量 / 日期 / 备注。
// 选中供应商时，两种模式都会为该供应商创建一条拿货记录（拿货价为空则用其默认供货价）。
export default function TransactionModal({ product, transaction, onClose, onSaved }: Props) {
  const isEdit = !!transaction
  const productId = transaction?.product_id || product?.id || ''
  const shopId = transaction?.shop_id || product?.shop_id || ''
  const productLabel = transaction
    ? (transaction.description || transaction.product_name)
    : (product?.description || product?.sku || '')

  const [price, setPrice] = useState(transaction?.price || product?.price || '')
  const [quantity, setQuantity] = useState(transaction ? String(transaction.quantity) : '1')
  const [date, setDate] = useState(transaction?.date || new Date().toISOString().slice(0, 10))
  const [note, setNote] = useState(transaction?.note || '')
  const [productSuppliers, setProductSuppliers] = useState<ProductSupplierWithInfo[]>([])
  const [selectedPsId, setSelectedPsId] = useState('')
  const [purchasePrice, setPurchasePrice] = useState(transaction?.purchase_price || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // 拉取该商品的供应商列表（用于「供应商」下拉与「拿货价」自动填充）
  useEffect(() => {
    if (!productId) {
      setProductSuppliers([])
      return
    }
    supplierApi.getAllProducts({ product_id: productId }).then(setProductSuppliers).catch(() => setProductSuppliers([]))
  }, [productId])

  // 选择供应商：若有供货价则自动填入拿货价（拿货价本身独立于供应商，可单独编辑/留空）
  const handleSelectSupplier = (psId: string) => {
    setSelectedPsId(psId)
    const ps = productSuppliers.find((p) => p.id === psId)
    if (ps?.price) setPurchasePrice(ps.price)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    const qty = parseInt(quantity) || 1
    try {
      // 拿货价独立于供应商，始终随成交保存
      const txPayload = { price, quantity: qty, date, note, purchase_price: purchasePrice }
      if (isEdit && transaction) {
        await api.updateTransaction(transaction.id, txPayload)
      } else {
        await api.createTransaction({ product_id: productId, shop_id: shopId, ...txPayload })
      }
      // 选中供应商 → 额外记录一条拿货记录
      if (selectedPsId) {
        const ps = productSuppliers.find((p) => p.id === selectedPsId)
        if (ps) {
          try {
            await supplierApi.createPurchaseRecord(ps.supplier_id, {
              product_supplier_id: ps.id,
              price: purchasePrice || ps.price,
              quantity: qty,
              purchase_date: date,
            })
          } catch {
            alert(isEdit ? '成交已保存，但拿货记录创建失败，请到供应商页补录' : '成交已记录，但拿货记录创建失败，请到供应商页补录')
          }
        }
      }
      onSaved?.()
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '保存失败')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={!!(product || transaction)} onClose={onClose} disableClose size="md">
      <div className="p-4 sm:p-6">
        <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">{isEdit ? '编辑成交' : '录入成交'} — {productLabel.slice(0, 30)}</h2>
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
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="flex gap-2 pt-2">
            <button type="submit" disabled={saving} className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 text-sm disabled:opacity-50">{saving ? '保存中...' : isEdit ? '保存' : '确认成交'}</button>
            <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50">取消</button>
          </div>
        </form>
      </div>
    </Modal>
  )
}
