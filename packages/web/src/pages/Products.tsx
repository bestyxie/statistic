import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import type { Product, Shop } from '@statistic/shared'

export default function Products() {
  const [products, setProducts] = useState<Product[]>([])
  const [shops, setShops] = useState<Shop[]>([])
  const [selectedShop, setSelectedShop] = useState('')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [form, setForm] = useState({ shop_id: '', name: '', image_url: '', sku: '', price: '' })
  const [error, setError] = useState('')

  const load = () => {
    setLoading(true)
    api.getProducts(selectedShop || undefined).then(setProducts).finally(() => setLoading(false))
  }

  useEffect(() => { api.getShops().then(setShops) }, [])
  useEffect(() => { load() }, [selectedShop])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      if (editing) {
        await api.updateProduct(editing.id, { name: form.name, image_url: form.image_url, sku: form.sku, price: form.price })
      } else {
        await api.createProduct(form)
      }
      setShowForm(false)
      setEditing(null)
      setForm({ shop_id: '', name: '', image_url: '', sku: '', price: '' })
      load()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleEdit = (product: Product) => {
    setEditing(product)
    setForm({
      shop_id: product.shop_id,
      name: product.name,
      image_url: product.image_url,
      sku: product.sku,
      price: product.price,
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除此商品？关联的统计数据也会被删除。')) return
    try {
      await api.deleteProduct(id)
      load()
    } catch (err: any) {
      alert(err.message)
    }
  }

  const cancelForm = () => {
    setShowForm(false)
    setEditing(null)
    setForm({ shop_id: '', name: '', image_url: '', sku: '', price: '' })
    setError('')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-gray-800">商品管理</h1>
        <div className="flex gap-2">
          <select
            value={selectedShop}
            onChange={(e) => setSelectedShop(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">全部店铺</option>
            {shops.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
            >
              添加商品
            </button>
          )}
        </div>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h2 className="text-lg font-semibold mb-4">{editing ? '编辑商品' : '添加商品'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
            {!editing && (
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
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="商品名称"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">图片 URL</label>
              <input
                type="url"
                value={form.image_url}
                onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://example.com/image.jpg"
              />
              {form.image_url && (
                <img src={form.image_url} alt="预览" className="mt-2 w-20 h-20 rounded object-cover bg-gray-100" />
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
                <input
                  type="text"
                  value={form.sku}
                  onChange={(e) => setForm({ ...form, sku: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="可选"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">价格</label>
                <input
                  type="text"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="可选"
                />
              </div>
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <div className="flex gap-2">
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm">
                {editing ? '保存' : '添加'}
              </button>
              <button type="button" onClick={cancelForm} className="px-4 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50">
                取消
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {loading ? (
          <p className="text-center py-12 text-gray-400">加载中...</p>
        ) : products.length === 0 ? (
          <p className="text-center py-12 text-gray-400">暂无商品</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left py-3 px-5 text-gray-500 font-medium">图片</th>
                  <th className="text-left py-3 px-5 text-gray-500 font-medium">商品描述</th>
                  <th className="text-left py-3 px-5 text-gray-500 font-medium">店铺</th>
                  <th className="text-left py-3 px-5 text-gray-500 font-medium">价格</th>
                  <th className="text-right py-3 px-5 text-gray-500 font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-5">
                      {p.image_url ? (
                        <img src={p.image_url} alt="" className="w-12 h-12 rounded object-cover bg-gray-100" />
                      ) : (
                        <div className="w-12 h-12 rounded bg-gray-100 flex items-center justify-center text-gray-300 text-xs">无图</div>
                      )}
                    </td>
                    <td className="py-3 px-5 font-medium text-gray-800 max-w-xs truncate">{p.description || '-'}</td>
                    <td className="py-3 px-5 text-gray-600">{p.shop_name}</td>
                    <td className="py-3 px-5 text-gray-600">{p.price || '-'}</td>
                    <td className="py-3 px-5 text-right">
                      <button onClick={() => handleEdit(p)} className="text-blue-600 hover:text-blue-800 mr-3">编辑</button>
                      <button onClick={() => handleDelete(p.id)} className="text-red-500 hover:text-red-700">删除</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
