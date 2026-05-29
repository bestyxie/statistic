import { useState, useEffect } from 'react'
import { supplierApi, type PurchaseWithProduct, type ProductSupplierWithInfo } from '../../lib/supplierApi'
import type { Supplier } from '@statistic/shared'
import SupplierForm from './SupplierForm'
import SupplierList from './SupplierList'
import PurchaseRecordList from './PurchaseRecordList'

export default function PurchaseRecordsTab() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)

  const [showSupplierForm, setShowSupplierForm] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)

  const [supplierProducts, setSupplierProducts] = useState<ProductSupplierWithInfo[]>([])
  const [purchases, setPurchases] = useState<PurchaseWithProduct[]>([])

  const loadSuppliers = () => {
    setLoading(true)
    supplierApi.getSuppliers().then(setSuppliers).finally(() => setLoading(false))
  }

  useEffect(() => { loadSuppliers() }, [])

  useEffect(() => {
    if (!selectedSupplier) return
    supplierApi.getSupplierProducts(selectedSupplier.id).then(setSupplierProducts)
    supplierApi.getPurchaseRecords(selectedSupplier.id).then(setPurchases)
  }, [selectedSupplier])

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
    if (!confirm('确定删除此供应商？')) return
    await supplierApi.deleteSupplier(id)
    if (selectedSupplier?.id === id) setSelectedSupplier(null)
    loadSuppliers()
  }

  const handlePurchaseSave = async (data: { product_supplier_id: string; price: string; quantity: number; purchase_date: string; note: string }, editingId?: string) => {
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
    <div className="space-y-4">
      {showSupplierForm && (
        <SupplierForm supplier={editingSupplier} onSubmit={handleSupplierSubmit} onCancel={() => { setShowSupplierForm(false); setEditingSupplier(null) }} />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-1">
          <SupplierList
            suppliers={suppliers}
            selectedId={selectedSupplier?.id}
            loading={loading}
            onSelect={setSelectedSupplier}
            onAdd={() => { setEditingSupplier(null); setShowSupplierForm(true) }}
            onEdit={(s) => { setEditingSupplier(s); setShowSupplierForm(true) }}
            onDelete={handleDeleteSupplier}
          />
        </div>

        <div className="lg:col-span-2">
          {!selectedSupplier ? (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center text-gray-400">
              请从左侧选择一个供应商查看拿货记录
            </div>
          ) : (
            <PurchaseRecordList
              purchases={purchases}
              supplierProducts={supplierProducts}
              onSave={handlePurchaseSave}
              onDelete={handleDeletePurchase}
            />
          )}
        </div>
      </div>
    </div>
  )
}
