import { useState, useEffect } from 'react'
import { supplierApi } from '../lib/supplierApi'
import type { Supplier, PurchaseRecord } from '@statistic/shared'
import SupplierForm from '../components/suppliers/SupplierForm'
import SupplierList from '../components/suppliers/SupplierList'
import SupplierProductList from '../components/suppliers/SupplierProductList'
import PurchaseRecordList from '../components/suppliers/PurchaseRecordList'

type PurchaseWithProduct = PurchaseRecord & {
  product_code: string
  description: string
  image_url: string
}

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)

  const [showSupplierForm, setShowSupplierForm] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)

  const [products, setProducts] = useState<SupplierProduct[]>([])
  const [purchases, setPurchases] = useState<PurchaseWithProduct[]>([])

  const loadSuppliers = () => {
    setLoading(true)
    supplierApi.getSuppliers().then(setSuppliers).finally(() => setLoading(false))
  }

  useEffect(() => { loadSuppliers() }, [])

  useEffect(() => {
    if (!selectedSupplier) return
    supplierApi.getSupplierProducts(selectedSupplier.id).then(setProducts)
    supplierApi.getPurchaseRecords(selectedSupplier.id).then(setPurchases)
  }, [selectedSupplier])

  // 供应商操作
  const handleSupplierSubmit = async (data: { wechat_nickname: string; wechat_id: string; remark: string }) => {
    if (editingSupplier) {
      await supplierApi.updateSupplier(editingSupplier.id, data)
    } else {
      await supplierApi.createSupplier(data)
    }
    setShowSupplierForm(false)
    setEditingSupplier(null)
    loadSuppliers()
  }

  const handleDeleteSupplier = async (id: string) => {
    if (!confirm('确定删除此供应商？关联的供货商品和拿货记录也会被删除。')) return
    await supplierApi.deleteSupplier(id)
    if (selectedSupplier?.id === id) setSelectedSupplier(null)
    loadSuppliers()
  }

  // 供货商品操作
  const handleProductSave = async (data: { product_code: string; price: string; image_url: string; description: string }, editingId?: string) => {
    if (!selectedSupplier) return
    if (editingId) {
      await supplierApi.updateSupplierProduct(selectedSupplier.id, editingId, data)
    } else {
      await supplierApi.createSupplierProduct(selectedSupplier.id, data)
    }
    supplierApi.getSupplierProducts(selectedSupplier.id).then(setProducts)
  }

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('确定删除此商品？关联的拿货记录也会被删除。')) return
    if (!selectedSupplier) return
    await supplierApi.deleteSupplierProduct(selectedSupplier.id, id)
    supplierApi.getSupplierProducts(selectedSupplier.id).then(setProducts)
    supplierApi.getPurchaseRecords(selectedSupplier.id).then(setPurchases)
  }

  // 拿货记录操作
  const handlePurchaseSave = async (data: { supplier_product_id: string; price: string; quantity: number; purchase_date: string; note: string }, editingId?: string) => {
    if (!selectedSupplier) return
    if (editingId) {
      await supplierApi.updatePurchaseRecord(selectedSupplier.id, editingId, data)
    } else {
      await supplierApi.createPurchaseRecord(selectedSupplier.id, data)
    }
    supplierApi.getPurchaseRecords(selectedSupplier.id).then(setPurchases)
  }

  const handleDeletePurchase = async (id: string) => {
    if (!confirm('确定删除此拿货记录？')) return
    if (!selectedSupplier) return
    await supplierApi.deletePurchaseRecord(selectedSupplier.id, id)
    supplierApi.getPurchaseRecords(selectedSupplier.id).then(setPurchases)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">供应商管理</h1>
        {!showSupplierForm && (
          <button
            onClick={() => { setShowSupplierForm(true); setEditingSupplier(null) }}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
          >
            添加供应商
          </button>
        )}
      </div>

      {showSupplierForm && (
        <SupplierForm
          supplier={editingSupplier}
          onSubmit={handleSupplierSubmit}
          onCancel={() => { setShowSupplierForm(false); setEditingSupplier(null) }}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <SupplierList
            suppliers={suppliers}
            selectedId={selectedSupplier?.id}
            loading={loading}
            onSelect={setSelectedSupplier}
            onEdit={(s) => { setEditingSupplier(s); setShowSupplierForm(true) }}
            onDelete={handleDeleteSupplier}
          />
        </div>

        <div className="lg:col-span-2 space-y-6">
          {!selectedSupplier ? (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center text-gray-400">
              请从左侧选择一个供应商查看详情
            </div>
          ) : (
            <>
              <SupplierProductList
                products={products}
                supplierName={selectedSupplier.wechat_nickname}
                onSave={handleProductSave}
                onDelete={handleDeleteProduct}
              />
              <PurchaseRecordList
                purchases={purchases}
                products={products}
                onSave={handlePurchaseSave}
                onDelete={handleDeletePurchase}
              />
            </>
          )}
        </div>
      </div>
    </div>
  )
}
