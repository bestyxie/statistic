import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../lib/api'
import type { Product, Shop } from '@statistic/shared'

export default function Products() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [products, setProducts] = useState<Product[]>([])
  const [shops, setShops] = useState<Shop[]>([])
  const selectedShop = searchParams.get('shop') || ''
  const setSelectedShop = (v: string) => setSearchParams((p) => { p.delete('page'); if (v) p.set('shop', v); else p.delete('shop'); return p })
  const page = parseInt(searchParams.get('page') || '1')
  const setPage = (p: number) => setSearchParams((prev) => { prev.set('page', String(p)); return prev })
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [showFullDesc, setShowFullDesc] = useState(false)
  const [form, setForm] = useState({ shop_id: '', name: '', image_url: '', sku: '', price: '' })
  const [error, setError] = useState('')
  const [total, setTotal] = useState(0)
  const pageSize = 30

  const load = () => {
    setLoading(true)
    api.getProducts(selectedShop || undefined, page, pageSize).then((res) => {
      setProducts(res.items)
      setTotal(res.total)
    }).finally(() => setLoading(false))
  }

  useEffect(() => { api.getShops().then(setShops) }, [])
  useEffect(() => { load() }, [selectedShop, page])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      if (editing) {
        // 编辑模式下保留原始描述和图片 URL
        await api.updateProduct(editing.id, {
          name: form.name,
          image_url: editing.image_url,
          description: editing.description,
          sku: form.sku,
          price: form.price
        })
      } else {
        await api.createProduct(form)
      }
      setShowForm(false)
      setEditing(null)
      setShowFullDesc(false)
      setForm({ shop_id: '', name: '', image_url: '', sku: '', price: '' })
      load()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleEdit = (product: Product) => {
    setEditing(product)
    setShowFullDesc(false)
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
    setShowFullDesc(false)
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

      {/* 弹窗表单 */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg border border-gray-200 p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4">{editing ? '编辑商品' : '添加商品'}</h2>

            {/* 编辑模式：显示商品图片和描述 */}
            {editing && (
              <div className="flex gap-4 mb-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0">
                  {editing.image_url ? (
                    <img src={editing.image_url} alt="商品图片" className="w-24 h-24 rounded object-cover bg-gray-100" />
                  ) : (
                    <div className="w-24 h-24 rounded bg-gray-100 flex items-center justify-center text-gray-300 text-xs">无图</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs text-gray-500">描述</p>
                    {editing.description && editing.description.length > 100 && (
                      <button
                        type="button"
                        onClick={() => setShowFullDesc(!showFullDesc)}
                        className="text-xs text-blue-600 hover:text-blue-800"
                      >
                        {showFullDesc ? '收起' : '显示全部'}
                      </button>
                    )}
                  </div>
                  <p className={`text-sm text-gray-700 ${showFullDesc ? '' : 'line-clamp-4'} overflow-y-auto`}>
                    {editing.description || '暂无描述'}
                  </p>
                </div>
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
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
              {!editing && (
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
              )}
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
              <div className="flex gap-2 pt-2">
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm">
                  {editing ? '保存' : '添加'}
                </button>
                <button type="button" onClick={cancelForm} className="px-4 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50">
                  取消
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {loading ? (
          <p className="text-center py-12 text-gray-400">加载中...</p>
        ) : products.length === 0 ? (
          <p className="text-center py-12 text-gray-400">暂无商品</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left py-3 px-5 text-gray-500 font-medium">图片</th>
                    <th className="text-left py-3 px-5 text-gray-500 font-medium">商品描述</th>
                    <th className="text-left py-3 px-5 text-gray-500 font-medium">店铺</th>
                    <th className="text-left py-3 px-5 text-gray-500 font-medium">价格</th>
                    <th className="text-right py-3 px-5 text-gray-500 font-medium">昨日访客</th>
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
                      <td className="py-3 px-5 text-right font-medium">{(p as any).yesterday_visitors || 0}</td>
                      <td className="py-3 px-5 text-right">
                        <button onClick={() => handleEdit(p)} className="text-blue-600 hover:text-blue-800 mr-3">编辑</button>
                        <button onClick={() => navigate(`/products/${p.id}`)} className="text-green-600 hover:text-green-800 mr-3">统计</button>
                        <button onClick={() => handleDelete(p.id)} className="text-red-500 hover:text-red-700">删除</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {total > pageSize && (() => {
              const totalPages = Math.ceil(total / pageSize)
              const pages: (number | '...')[] = []
              if (totalPages <= 7) {
                for (let i = 1; i <= totalPages; i++) pages.push(i)
              } else {
                pages.push(1)
                if (page > 3) pages.push('...')
                for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i)
                if (page < totalPages - 2) pages.push('...')
                pages.push(totalPages)
              }
              return (
                <div className="flex items-center justify-between px-5 py-3 border-t border-gray-200">
                  <span className="text-sm text-gray-500">
                    共 {total} 条，第 {page}/{totalPages} 页
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setPage(page - 1)}
                      disabled={page <= 1}
                      className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                    >上一页</button>
                    {pages.map((p, i) =>
                      p === '...' ? (
                        <span key={`dots-${i}`} className="px-2 text-gray-400">...</span>
                      ) : (
                        <button
                          key={p}
                          onClick={() => setPage(p)}
                          className={`px-3 py-1 text-sm rounded-md border ${p === page ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 hover:bg-gray-50'}`}
                        >{p}</button>
                      )
                    )}
                    <button
                      onClick={() => setPage(page + 1)}
                      disabled={page >= totalPages}
                      className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                    >下一页</button>
                    <span className="mx-2 text-gray-400">|</span>
                    <span className="text-sm text-gray-500">跳至</span>
                    <input
                      type="number"
                      min={1}
                      max={totalPages}
                      className="w-14 px-2 py-1 text-sm border border-gray-300 rounded-md text-center"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const v = parseInt((e.target as HTMLInputElement).value)
                          if (v >= 1 && v <= totalPages) setPage(v)
                        }
                      }}
                    />
                    <span className="text-sm text-gray-500">页</span>
                  </div>
                </div>
              )
            })()}
          </>
        )}
      </div>
    </div>
  )
}
