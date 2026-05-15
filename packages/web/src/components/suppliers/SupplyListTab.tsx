import { useState, useEffect, useCallback } from 'react'
import { supplierApi } from '../../lib/supplierApi'
import type { Supplier, SupplierProduct } from '@statistic/shared'
import SupplierForm from './SupplierForm'
import SupplierProductForm from './SupplierProductForm'

type ProductWithSupplier = SupplierProduct & { supplier_name: string }

export default function SupplyListTab() {
  const [products, setProducts] = useState<ProductWithSupplier[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterSupplier, setFilterSupplier] = useState('')

  // 商品表单
  const [showProductForm, setShowProductForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<ProductWithSupplier | null>(null)
  const [productFormSupplierId, setProductFormSupplierId] = useState('')

  // 供应商表单
  const [showSupplierForm, setShowSupplierForm] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)

  const loadProducts = useCallback(() => {
    setLoading(true)
    supplierApi.getAllProducts({ search, supplier_id: filterSupplier })
      .then((data) => setProducts(data as ProductWithSupplier[]))
      .finally(() => setLoading(false))
  }, [search, filterSupplier])

  const loadSuppliers = () => {
    supplierApi.getSuppliers().then(setSuppliers)
  }

  useEffect(() => { loadSuppliers() }, [])
  useEffect(() => { loadProducts() }, [loadProducts])

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
    loadProducts()
  }

  const handleDeleteSupplier = async (id: string) => {
    if (!confirm('确定删除此供应商？关联的供货商品和拿货记录也会被删除。')) return
    await supplierApi.deleteSupplier(id)
    loadSuppliers()
    loadProducts()
  }

  // 商品操作
  const handleProductSave = async (data: { product_code: string; price: string; image_url: string; description: string }) => {
    if (editingProduct) {
      await supplierApi.updateSupplierProduct(editingProduct.supplier_id, editingProduct.id, data)
    } else {
      await supplierApi.createSupplierProduct(productFormSupplierId, data)
    }
    setShowProductForm(false)
    setEditingProduct(null)
    loadProducts()
  }

  const handleDeleteProduct = async (p: ProductWithSupplier) => {
    if (!confirm('确定删除此商品？关联的拿货记录也会被删除。')) return
    await supplierApi.deleteSupplierProduct(p.supplier_id, p.id)
    loadProducts()
  }

  return (
    <div className="space-y-4">
      {/* 搜索栏 */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs text-gray-500 mb-1">搜索</label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="供应商昵称 / 商品编号 / 商品描述"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="w-48">
            <label className="block text-xs text-gray-500 mb-1">按供应商筛选</label>
            <select
              value={filterSupplier}
              onChange={(e) => setFilterSupplier(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">全部供应商</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>{s.wechat_nickname}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                const supplierId = filterSupplier || suppliers[0]?.id || ''
                if (!supplierId) {
                  alert('请先添加供应商')
                  return
                }
                setProductFormSupplierId(supplierId)
                setEditingProduct(null)
                setShowProductForm(true)
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
            >
              添加商品
            </button>
            <button
              onClick={() => { setShowSupplierForm(true); setEditingSupplier(null) }}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm"
            >
              管理供应商
            </button>
          </div>
        </div>
      </div>

      {/* 供应商表单 */}
      {showSupplierForm && (
        <SupplierForm
          supplier={editingSupplier}
          onSubmit={handleSupplierSubmit}
          onCancel={() => { setShowSupplierForm(false); setEditingSupplier(null) }}
        />
      )}

      {/* 商品表单 */}
      {showProductForm && (
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-sm">{editingProduct ? '编辑商品' : '添加商品'}</h3>
            <select
              value={editingProduct ? editingProduct.supplier_id : productFormSupplierId}
              onChange={(e) => setProductFormSupplierId(e.target.value)}
              disabled={!!editingProduct}
              className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            >
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>{s.wechat_nickname}</option>
              ))}
            </select>
          </div>
          <SupplierProductForm
            product={editingProduct}
            onSubmit={handleProductSave}
            onCancel={() => { setShowProductForm(false); setEditingProduct(null) }}
          />
        </div>
      )}

      {/* 商品表格 */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {loading ? (
          <p className="text-center py-12 text-gray-400 text-sm">加载中...</p>
        ) : products.length === 0 ? (
          <p className="text-center py-12 text-gray-400 text-sm">暂无供货商品</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left py-3 px-5 text-gray-500 font-medium">图片</th>
                <th className="text-left py-3 px-5 text-gray-500 font-medium">供应商</th>
                <th className="text-left py-3 px-5 text-gray-500 font-medium">编号</th>
                <th className="text-left py-3 px-5 text-gray-500 font-medium">描述</th>
                <th className="text-right py-3 px-5 text-gray-500 font-medium">价格</th>
                <th className="text-right py-3 px-5 text-gray-500 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-5">
                    {p.image_url ? (
                      <img src={p.image_url} alt="" className="w-10 h-10 rounded object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                    ) : (
                      <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center text-gray-300 text-xs">无</div>
                    )}
                  </td>
                  <td className="py-3 px-5 text-gray-700">{p.supplier_name}</td>
                  <td className="py-3 px-5 text-gray-500 font-mono text-xs">{p.product_code || '-'}</td>
                  <td className="py-3 px-5 text-gray-800 max-w-[200px] truncate" title={p.description}>{p.description || '-'}</td>
                  <td className="py-3 px-5 text-right text-orange-600 font-medium">¥{p.price || '-'}</td>
                  <td className="py-3 px-5 text-right">
                    <button onClick={() => { setEditingProduct(p); setShowProductForm(true) }} className="text-blue-600 hover:text-blue-800 text-xs mr-2">编辑</button>
                    <button onClick={() => handleDeleteProduct(p)} className="text-red-500 hover:text-red-700 text-xs">删除</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
