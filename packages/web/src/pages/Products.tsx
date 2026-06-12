import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../lib/api'
import ProductDetailDrawer from '../components/ProductDetailDrawer'
import ProductFormModal from './products/ProductFormModal'
import TransactionFormModal from './products/TransactionFormModal'
import TransactionListModal from './products/TransactionListModal'
import ProductSuppliersModal from './products/ProductSuppliersModal'
import AddSupplierModal from './products/AddSupplierModal'
import type { Product, Shop, ProductLabel } from '@statistic/shared'

export default function Products() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [products, setProducts] = useState<Product[]>([])
  const [drawerId, setDrawerId] = useState<string | null>(null)
  const [shops, setShops] = useState<Shop[]>([])
  const selectedShop = searchParams.get('shop') || ''
  const setSelectedShop = (v: string) => setSearchParams((p) => { p.delete('page'); if (v) p.set('shop', v); else p.delete('shop'); return p })
  const page = parseInt(searchParams.get('page') || '1')
  const setPage = (p: number) => setSearchParams((prev) => { prev.set('page', String(p)); return prev })
  const visitDate = searchParams.get('date') || ''
  const setVisitDate = (v: string) => setSearchParams((prev) => { prev.delete('page'); if (v) prev.set('date', v); else prev.delete('date'); return prev })
  const search = searchParams.get('search') || ''
  const [searchInput, setSearchInput] = useState(search)
  const doSearch = () => setSearchParams((prev) => { prev.delete('page'); if (searchInput) prev.set('search', searchInput); else prev.delete('search'); return prev })
  const sortBy = searchParams.get('sort_by') || 'created_at'
  const sortOrder = searchParams.get('sort_order') || 'desc'
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const pageSize = 30
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [refreshing, setRefreshing] = useState(false)
  const labelId = searchParams.get('label') || ''
  const setLabelId = (v: string) => setSearchParams((prev) => { prev.delete('page'); if (v) prev.set('label', v); else prev.delete('label'); return prev })
  const [labels, setLabels] = useState<ProductLabel[]>([])
  const [syncingLabels, setSyncingLabels] = useState(false)
  const [syncProgress, setSyncProgress] = useState('')
  const abortSyncRef = useRef(false)

  // modal triggers: null = hidden, value = shown
  const [formTarget, setFormTarget] = useState<Product | null | 'new'>(null)
  const [txProduct, setTxProduct] = useState<Product | null>(null)
  const [txListProduct, setTxListProduct] = useState<Product | null>(null)
  const [suppliersProduct, setSuppliersProduct] = useState<Product | null>(null)
  const [addSupplierProduct, setAddSupplierProduct] = useState<Product | null>(null)

  const load = () => {
    setLoading(true)
    api.getProducts(selectedShop || undefined, page, pageSize, visitDate || undefined, search || undefined, sortBy, sortOrder, labelId || undefined).then((res) => {
      setProducts(res.items)
      setTotal(res.total)
    }).finally(() => setLoading(false))
  }

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      const pageIds = products.map((p) => p.id)
      const allSelected = pageIds.every((id) => next.has(id))
      for (const id of pageIds) {
        if (allSelected) next.delete(id); else next.add(id)
      }
      return next
    })
  }

  const handleRefresh = async () => {
    if (selectedIds.size === 0) return
    setRefreshing(true)
    try {
      const res = await api.refreshProducts([...selectedIds])
      alert(`刷新成功，共刷新 ${res.count} 个商品`)
      setSelectedIds(new Set())
      load()
    } catch (err: any) {
      alert(err.message || '刷新失败')
    } finally {
      setRefreshing(false)
    }
  }

  const toggleSort = (field: string) => {
    let newSortBy = field
    let newSortOrder = 'desc'
    if (sortBy === field) {
      if (sortOrder === 'desc') {
        newSortOrder = 'asc'
      } else {
        newSortBy = 'created_at'
        newSortOrder = 'desc'
      }
    }
    setSearchParams((prev) => {
      prev.delete('page')
      if (newSortBy !== 'created_at') {
        prev.set('sort_by', newSortBy)
        prev.set('sort_order', newSortOrder)
      } else {
        prev.delete('sort_by')
        prev.delete('sort_order')
      }
      return prev
    })
  }

  const getSortIcon = (field: string) => {
    if (sortBy !== field) return ' ⇅'
    return sortOrder === 'asc' ? ' ↑' : ' ↓'
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

  useEffect(() => { api.getShops().then(setShops) }, [])
  useEffect(() => { api.getLabels().then(setLabels).catch(() => {}) }, [])
  useEffect(() => { load() }, [selectedShop, page, visitDate, search, sortBy, sortOrder, labelId])
  useEffect(() => { setSearchInput(search) }, [search])

  const runLabelSync = async () => {
    setSyncingLabels(true)
    setSyncProgress('导入标签...')
    abortSyncRef.current = false
    try {
      await api.importLabels()
      let synced = 0
      while (!abortSyncRef.current) {
        const res = await api.syncProductLabels(20)
        synced += res.synced
        setSyncProgress(`同步中 ${synced}/${synced + res.remaining}`)
        if (res.remaining === 0 || res.stalled) break
      }
      if (abortSyncRef.current) {
        setSyncProgress(`已暂停 (${synced} 已同步)`)
      } else {
        setSyncProgress(`完成，共同步 ${synced} 个商品`)
      }
      api.getLabels().then(setLabels).catch(() => {})
      load()
    } catch (err: any) {
      setSyncProgress(`同步失败: ${err.message}`)
    } finally {
      setSyncingLabels(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">商品管理</h1>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <input
              type="text"
              placeholder="搜索商品描述..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && doSearch()}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-40 pr-7"
            />
            {searchInput && (
              <button type="button" onClick={() => { setSearchInput(''); setSearchParams((prev) => { prev.delete('search'); prev.delete('page'); return prev }) }} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs">&#x2715;</button>
            )}
          </div>
          <button onClick={doSearch} className="px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700">搜索</button>
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
          <div className="relative">
            <input
              type="date"
              value={visitDate}
              onChange={(e) => setVisitDate(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 pr-7"
            />
            {visitDate && (
              <button type="button" onClick={() => setVisitDate('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs">&#x2715;</button>
            )}
          </div>
          <select
            value={labelId}
            onChange={(e) => setLabelId(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">全部标签</option>
            {labels.map((l) => (
              <option key={l.label_id} value={l.label_id}>{l.label_name}</option>
            ))}
          </select>
          {syncingLabels ? (
            <button onClick={() => { abortSyncRef.current = true }} className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 text-sm">
              暂停 {syncProgress}
            </button>
          ) : syncProgress ? (
            <button onClick={runLabelSync} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm">
              继续同步 {syncProgress}
            </button>
          ) : (
            <button onClick={runLabelSync} className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm">
              同步标签
            </button>
          )}
          {formTarget === null && (
            <button
              onClick={() => setFormTarget('new')}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
            >
              添加商品
            </button>
          )}
          {selectedIds.size > 0 && (
            <button onClick={handleRefresh} disabled={refreshing} className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 text-sm disabled:opacity-50">
              {refreshing ? '刷新中...' : `刷新选中 (${selectedIds.size})`}
            </button>
          )}
          <button onClick={() => navigate('/product-ranking')} className="px-4 py-2 border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50 text-sm">7日排行榜</button>
        </div>
      </div>

      <ProductFormModal
        product={formTarget}
        shops={shops}
        onClose={() => setFormTarget(null)}
        onSaved={() => { setFormTarget(null); load() }}
      />
      <TransactionFormModal product={txProduct} onClose={() => setTxProduct(null)} />
      <TransactionListModal product={txListProduct} onClose={() => setTxListProduct(null)} />
      <ProductSuppliersModal product={suppliersProduct} onClose={() => setSuppliersProduct(null)} />
      <AddSupplierModal product={addSupplierProduct} onClose={() => setAddSupplierProduct(null)} />

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
                    <th className="text-center py-3 px-3 w-10">
                      <input
                        type="checkbox"
                        checked={products.length > 0 && products.every((p) => selectedIds.has(p.id))}
                        onChange={toggleSelectAll}
                        className="rounded border-gray-300"
                      />
                    </th>
                    <th className="text-left py-3 px-5 text-gray-500 font-medium">图片</th>
                    <th className="text-left py-3 px-5 text-gray-500 font-medium">商品描述</th>
                    <th className="text-left py-3 px-5 text-gray-500 font-medium">店铺</th>
                    <th className="text-left py-3 px-5 text-gray-500 font-medium">价格</th>
                    <th
                      className="text-right py-3 px-5 text-gray-500 font-medium cursor-pointer hover:bg-gray-100"
                      onClick={() => toggleSort('visitors')}
                    >
                      {visitDate ? `${visitDate.slice(5)} 访客` : '昨日访客'}{getSortIcon('visitors')}
                    </th>
                    <th
                      className="text-right py-3 px-5 text-gray-500 font-medium cursor-pointer hover:bg-gray-100"
                      onClick={() => toggleSort('transactions')}
                    >
                      成交数{getSortIcon('transactions')}
                    </th>
                    <th className="text-right py-3 px-5 text-gray-500 font-medium">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr key={p.id} className={`border-b border-gray-100 hover:bg-gray-50 ${selectedIds.has(p.id) ? 'bg-blue-50' : ''}`}>
                      <td className="py-3 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(p.id)}
                          onChange={() => toggleSelect(p.id)}
                          className="rounded border-gray-300"
                        />
                      </td>
                      <td className="py-3 px-5">
                        {p.image_url ? (
                          <div className="relative group">
                            <img src={p.image_url} alt="" className="w-12 h-12 rounded object-cover bg-gray-100 cursor-pointer" />
                            <div className="hidden group-hover:block absolute z-50 top-0 left-14 w-48 h-48 bg-white rounded-lg shadow-xl border border-gray-200 p-1">
                              <img src={p.image_url} alt="" className="w-full h-full rounded object-cover" />
                            </div>
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded bg-gray-100 flex items-center justify-center text-gray-300 text-xs">无图</div>
                        )}
                      </td>
                      <td className="py-3 px-5">
                        <div className="relative group/desc">
                          <p className="font-medium text-gray-800 max-w-xs truncate">{p.description || '-'}</p>
                          {p.description && (
                            <div className="hidden group-hover/desc:block absolute z-50 top-0 left-0 min-w-48 max-w-sm bg-white rounded-lg shadow-xl border border-gray-200 p-3 text-sm font-normal text-gray-700 whitespace-normal break-all select-text">
                              {p.description}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-5 text-gray-600">{p.shop_name}</td>
                      <td className="py-3 px-5 text-gray-600">{p.price || '-'}</td>
                      <td className="py-3 px-5 text-right font-medium">{(p as any).yesterday_visitors || 0}</td>
                      <td className="py-3 px-5 text-right">
                        <button
                          onClick={() => setTxListProduct(p)}
                          className={`font-medium cursor-pointer hover:underline ${(p as any).transaction_count > 0 ? 'text-orange-600 hover:text-orange-700' : 'text-gray-400 hover:text-gray-500'}`}
                        >
                          {(p as any).transaction_count || 0}
                        </button>
                      </td>
                      <td className="py-3 px-5 text-right whitespace-nowrap">
                        <button onClick={() => setDrawerId(p.id)} className="text-green-600 hover:text-green-800 mr-3">统计</button>
                        <button onClick={() => setTxProduct(p)} className="text-orange-600 hover:text-orange-800 mr-3">成交</button>
                        <div className="relative inline-block group/other">
                          <button className="text-gray-500 hover:text-gray-700 pb-2">更多 ▾</button>
                          <div className="hidden group-hover/other:flex absolute right-0 top-full bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-50 min-w-[80px] flex-col">
                            <button onClick={() => setSuppliersProduct(p)} className="text-left px-3 py-1.5 text-sm text-purple-600 hover:bg-gray-50 whitespace-nowrap">供应商</button>
                            <button onClick={() => setAddSupplierProduct(p)} className="text-left px-3 py-1.5 text-sm text-purple-600 hover:bg-gray-50 whitespace-nowrap">添加供应商</button>
                            <button onClick={() => setFormTarget(p)} className="text-left px-3 py-1.5 text-sm text-blue-600 hover:bg-gray-50 whitespace-nowrap">编辑</button>
                            <button onClick={() => handleDelete(p.id)} className="text-left px-3 py-1.5 text-sm text-red-500 hover:bg-gray-50 whitespace-nowrap">删除</button>
                          </div>
                        </div>
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
                <div className="flex flex-col sm:flex-row items-center justify-between px-3 sm:px-5 py-3 border-t border-gray-200 gap-2">
                  <span className="text-xs sm:text-sm text-gray-500">
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
                    <span className="hidden sm:inline mx-2 text-gray-400">|</span>
                    <span className="hidden sm:inline text-sm text-gray-500">跳至</span>
                    <input
                      type="number"
                      min={1}
                      max={totalPages}
                      className="hidden sm:block w-14 px-2 py-1 text-sm border border-gray-300 rounded-md text-center"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const v = parseInt((e.target as HTMLInputElement).value)
                          if (v >= 1 && v <= totalPages) setPage(v)
                        }
                      }}
                    />
                    <span className="hidden sm:inline text-sm text-gray-500">页</span>
                  </div>
                </div>
              )
            })()}
          </>
        )}
      </div>

      <ProductDetailDrawer productId={drawerId} onClose={() => setDrawerId(null)} />
    </div>
  )
}
