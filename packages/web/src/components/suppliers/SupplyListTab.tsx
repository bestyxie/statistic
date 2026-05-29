import { useState, useEffect, useCallback } from 'react'
import { supplierApi, type ProductSupplierWithInfo } from '../../lib/supplierApi'
import { api } from '../../lib/api'
import type { Supplier, Product, Shop } from '@statistic/shared'
import SupplierForm from './SupplierForm'
import HoverPopup from '../HoverPopup'

type AddMode = 'none' | 'link' | 'curl'

export default function SupplyListTab() {
  const [links, setLinks] = useState<ProductSupplierWithInfo[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterSupplier, setFilterSupplier] = useState('')

  // 添加/编辑模式
  const [addMode, setAddMode] = useState<AddMode>('none')
  const [editingLink, setEditingLink] = useState<ProductSupplierWithInfo | null>(null)
  const [editPrice, setEditPrice] = useState('')
  const [editNote, setEditNote] = useState('')
  const [editSupplierId, setEditSupplierId] = useState('')

  // 关联商品
  const [catalogProducts, setCatalogProducts] = useState<Product[]>([])
  const [catalogSearch, setCatalogSearch] = useState('')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [linkSupplierId, setLinkSupplierId] = useState('')
  const [linkPrice, setLinkPrice] = useState('')

  // cURL 解析 → 创建商品 + 关联
  const [curlInput, setCurlInput] = useState('')
  const [curlLoading, setCurlLoading] = useState(false)
  const [curlError, setCurlError] = useState('')
  const [curlParsed, setCurlParsed] = useState<{ image_url: string; description: string; price: string; product_code: string } | null>(null)
  const [curlSupplierId, setCurlSupplierId] = useState('')
  const [curlShopId, setCurlShopId] = useState('')
  const [curlSupplyPrice, setCurlSupplyPrice] = useState('')

  // 供应商弹窗
  const [showSupplierForm, setShowSupplierForm] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)

  const loadLinks = useCallback(() => {
    setLoading(true)
    supplierApi.getAllProducts({ search, supplier_id: filterSupplier })
      .then(setLinks)
      .finally(() => setLoading(false))
  }, [search, filterSupplier])

  const [shops, setShops] = useState<Shop[]>([])

  const loadSuppliers = () => {
    supplierApi.getSuppliers().then(setSuppliers)
  }

  const loadShops = () => {
    api.getShops().then(setShops)
  }

  useEffect(() => { loadSuppliers(); loadShops() }, [])
  useEffect(() => { loadLinks() }, [loadLinks])

  const loadCatalog = async (q: string) => {
    const res = await api.getProducts(undefined, 1, 20, undefined, q)
    setCatalogProducts(res.items)
  }

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
    loadLinks()
  }

  // 关联商品
  const handleLinkProduct = async () => {
    if (!selectedProduct || !linkSupplierId) return
    await supplierApi.linkProduct({
      product_id: selectedProduct.id,
      supplier_id: linkSupplierId,
      price: linkPrice || selectedProduct.price,
    })
    setAddMode('none')
    setSelectedProduct(null)
    setLinkPrice('')
    loadLinks()
  }

  // 编辑关联
  const handleEditLink = async () => {
    if (!editingLink) return
    await supplierApi.updateLink(editingLink.id, { price: editPrice, note: editNote, supplier_id: editSupplierId })
    setEditingLink(null)
    loadLinks()
  }

  // 删除关联
  const handleDeleteLink = async (link: ProductSupplierWithInfo) => {
    if (!confirm('确定解除此关联？')) return
    await supplierApi.unlinkProduct(link.id)
    loadLinks()
  }

  // cURL 解析 → 先创建商品，再关联
  const handleParseCurl = async () => {
    if (!curlInput.trim()) return
    setCurlLoading(true)
    setCurlError('')
    setCurlParsed(null)
    try {
      const result = await supplierApi.parseCurl(curlInput)
      if (result.success && result.data) {
        setCurlParsed(result.data)
      } else {
        setCurlError(result.error || '解析失败')
      }
    } catch (err: any) {
      setCurlError(err.message)
    } finally {
      setCurlLoading(false)
    }
  }

  const handleCurlSave = async () => {
    if (!curlParsed || !curlSupplierId || !curlShopId) return
    // 先创建商品
    const product = await api.createProduct({
      shop_id: curlShopId,
      name: curlParsed.description || '未命名商品',
      image_url: curlParsed.image_url,
      sku: curlParsed.product_code,
      price: curlParsed.price,
    })
    // 再关联供应商
    await supplierApi.linkProduct({
      product_id: product.id,
      supplier_id: curlSupplierId,
      price: curlSupplyPrice || curlParsed.price,
    })
    setAddMode('none')
    setCurlInput('')
    setCurlParsed(null)
    loadLinks()
  }

  const closeDialog = () => {
    setAddMode('none')
    setSelectedProduct(null)
    setCurlInput('')
    setCurlParsed(null)
    setCurlError('')
    setCurlSupplyPrice('')
  }

  return (
    <div className="space-y-4">
      {/* 搜索栏 */}
      <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4">
        <div className="flex flex-wrap gap-2 sm:gap-3 items-end">
          <div className="flex-1 min-w-[140px]">
            <label className="block text-xs text-gray-500 mb-1">搜索</label>
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="供应商 / 商品编号 / 商品描述" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="w-full sm:w-48">
            <label className="block text-xs text-gray-500 mb-1">按供应商筛选</label>
            <select value={filterSupplier} onChange={(e) => setFilterSupplier(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">全部供应商</option>
              {suppliers.map((s) => <option key={s.id} value={s.id}>{s.wechat_nickname}</option>)}
            </select>
          </div>
          <div className="flex gap-2">
            <button onClick={() => { setAddMode('link'); setLinkSupplierId(filterSupplier || suppliers[0]?.id || '') }} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm">关联商品</button>
            <button onClick={() => { setAddMode('curl'); setCurlSupplierId(filterSupplier || suppliers[0]?.id || '') }} className="px-4 py-2 border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50 text-sm">cURL 录入</button>
            <button onClick={() => { setShowSupplierForm(true); setEditingSupplier(null) }} className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm">管理供应商</button>
          </div>
        </div>
      </div>

      {/* 供应商弹窗 */}
      {showSupplierForm && (
        <SupplierForm supplier={editingSupplier} onSubmit={handleSupplierSubmit} onCancel={() => { setShowSupplierForm(false); setEditingSupplier(null) }} />
      )}

      {/* 关联商品弹窗 */}
      {addMode === 'link' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={closeDialog} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 p-6 max-h-[80vh] flex flex-col">
            <h3 className="text-lg font-semibold mb-4">关联商品</h3>
            <div className="space-y-3 flex-1 overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">供应商</label>
                <select value={linkSupplierId} onChange={(e) => setLinkSupplierId(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">请选择供应商</option>
                  {suppliers.map((s) => <option key={s.id} value={s.id}>{s.wechat_nickname}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">搜索商品</label>
                <input type="text" value={catalogSearch} onChange={(e) => { setCatalogSearch(e.target.value); loadCatalog(e.target.value) }} placeholder="商品名称或 SKU" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              {catalogProducts.length > 0 && (
                <div className="border border-gray-200 rounded-lg max-h-48 overflow-y-auto">
                  {catalogProducts.map((p) => (
                    <div key={p.id} onClick={() => { setSelectedProduct(p); setLinkPrice(p.price) }} className={`px-3 py-2 cursor-pointer flex items-center gap-3 hover:bg-gray-50 ${selectedProduct?.id === p.id ? 'bg-blue-50 border-l-2 border-blue-500' : ''}`}>
                      {p.image_url ? (
                        <HoverPopup popup={<div className="w-48 h-48"><img src={p.image_url} alt="" className="w-full h-full rounded object-cover" /></div>}>
                          <img src={p.image_url} alt="" className="w-8 h-8 rounded object-cover bg-gray-100 flex-shrink-0" />
                        </HoverPopup>
                      ) : (
                        <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center text-gray-300 text-xs flex-shrink-0">无</div>
                      )}
                      <div className="min-w-0 flex-1">
                        <HoverPopup offset="left-0" popup={<div className="p-3 max-w-sm text-sm text-gray-700 whitespace-normal break-all select-text">{p.description || p.name}</div>}>
                          <p className="text-sm text-gray-800 truncate block">{p.description || p.name}</p>
                        </HoverPopup>
                        <p className="text-xs text-gray-400">{p.sku || '-'} · ¥{p.price || '-'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {selectedProduct && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center gap-3">
                    {selectedProduct.image_url && <img src={selectedProduct.image_url} alt="" className="w-12 h-12 rounded object-cover" />}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-800">{selectedProduct.description || selectedProduct.name}</p>
                      <p className="text-xs text-gray-400">SKU: {selectedProduct.sku || '-'} · 售价: ¥{selectedProduct.price || '-'}</p>
                    </div>
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">供货价</label>
                <input type="text" value={linkPrice} onChange={(e) => setLinkPrice(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="该供应商的供货价格" />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t border-gray-100 mt-4">
              <button onClick={closeDialog} className="px-4 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50">取消</button>
              <button onClick={handleLinkProduct} disabled={!selectedProduct || !linkSupplierId} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm disabled:bg-gray-300 disabled:cursor-not-allowed">确认关联</button>
            </div>
          </div>
        </div>
      )}

      {/* cURL 录入弹窗 */}
      {addMode === 'curl' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={closeDialog} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 p-6 max-h-[80vh] flex flex-col">
            <h3 className="text-lg font-semibold mb-4">cURL 录入商品</h3>
            <div className="space-y-3 flex-1 overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">店铺</label>
                  <select value={curlShopId} onChange={(e) => setCurlShopId(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">请选择店铺</option>
                    {shops.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">供应商</label>
                  <select value={curlSupplierId} onChange={(e) => setCurlSupplierId(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">请选择供应商</option>
                    {suppliers.map((s) => <option key={s.id} value={s.id}>{s.wechat_nickname}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">粘贴 cURL 命令</label>
                <textarea value={curlInput} onChange={(e) => setCurlInput(e.target.value)} rows={6} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" placeholder="curl 'https://...' -H 'cookie: ...' ..." />
              </div>
              <button onClick={handleParseCurl} disabled={curlLoading || !curlInput.trim()} className="w-full px-4 py-2 bg-gray-100 border border-gray-200 rounded-md text-sm hover:bg-gray-200 disabled:opacity-50">{curlLoading ? '解析中...' : '解析 cURL'}</button>
              {curlError && <p className="text-red-500 text-sm">{curlError}</p>}
              {curlParsed && (
                <div className="bg-gray-50 rounded-lg p-3 space-y-3">
                  <p className="text-xs text-green-600 font-medium">解析成功，确认后将创建商品并关联供应商：</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">商品描述</label>
                      <input type="text" value={curlParsed.description} onChange={(e) => setCurlParsed({ ...curlParsed, description: e.target.value })} className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">编号</label>
                      <input type="text" value={curlParsed.product_code} onChange={(e) => setCurlParsed({ ...curlParsed, product_code: e.target.value })} className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">售价</label>
                      <input type="text" value={curlParsed.price} onChange={(e) => setCurlParsed({ ...curlParsed, price: e.target.value })} className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">进货价</label>
                      <input type="text" value={curlSupplyPrice} onChange={(e) => setCurlSupplyPrice(e.target.value)} placeholder={curlParsed.price || '进货价'} className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs text-gray-500 mb-1">图片 URL</label>
                      <input type="text" value={curlParsed.image_url} onChange={(e) => setCurlParsed({ ...curlParsed, image_url: e.target.value })} className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </div>
                  {curlParsed.image_url && <img src={curlParsed.image_url} alt="预览" className="w-16 h-16 rounded object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />}
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t border-gray-100 mt-4">
              <button onClick={closeDialog} className="px-4 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50">取消</button>
              <button onClick={handleCurlSave} disabled={!curlParsed || !curlSupplierId || !curlShopId} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm disabled:bg-gray-300 disabled:cursor-not-allowed">确认添加</button>
            </div>
          </div>
        </div>
      )}

      {/* 编辑关联弹窗 */}
      {editingLink && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setEditingLink(null)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 p-6">
            <h3 className="text-lg font-semibold mb-4">编辑进货信息</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                {editingLink.product_image && <img src={editingLink.product_image} alt="" className="w-10 h-10 rounded object-cover" />}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-800 truncate">{editingLink.product_description || editingLink.product_name}</p>
                  <p className="text-xs text-gray-400">{editingLink.product_sku || '-'}</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">供应商</label>
                <select value={editSupplierId} onChange={(e) => setEditSupplierId(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {suppliers.map((s) => <option key={s.id} value={s.id}>{s.wechat_nickname}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">进货价格</label>
                <input type="text" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
                <input type="text" value={editNote} onChange={(e) => setEditNote(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t border-gray-100 mt-4">
              <button onClick={() => setEditingLink(null)} className="px-4 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50">取消</button>
              <button onClick={handleEditLink} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm">保存</button>
            </div>
          </div>
        </div>
      )}

      {/* 关联列表表格 */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {loading ? (
          <p className="text-center py-12 text-gray-400 text-sm">加载中...</p>
        ) : links.length === 0 ? (
          <p className="text-center py-12 text-gray-400 text-sm">暂无供货关联</p>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left py-3 px-5 text-gray-500 font-medium">商品</th>
                <th className="text-left py-3 px-5 text-gray-500 font-medium">供应商</th>
                <th className="text-left py-3 px-5 text-gray-500 font-medium">编号</th>
                <th className="text-right py-3 px-5 text-gray-500 font-medium">进货价</th>
                <th className="text-right py-3 px-5 text-gray-500 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {links.map((l) => (
                <tr key={l.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-5">
                    <div className="flex items-center gap-2">
                      {l.product_image ? (
                        <HoverPopup popup={<div className="w-48 h-48"><img src={l.product_image} alt="" className="w-full h-full rounded object-cover" /></div>}>
                          <img src={l.product_image} alt="" className="w-10 h-10 rounded object-cover bg-gray-100" />
                        </HoverPopup>
                      ) : (
                        <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center text-gray-300 text-xs">无</div>
                      )}
                      <HoverPopup offset="left-0" popup={<div className="p-3 max-w-sm text-sm text-gray-700 whitespace-normal break-all select-text">{l.product_description || l.product_name}</div>}>
                        <span className="text-gray-800 max-w-[160px] truncate block">{l.product_description || l.product_name}</span>
                      </HoverPopup>
                    </div>
                  </td>
                  <td className="py-3 px-5 text-gray-700">{l.supplier_name}</td>
                  <td className="py-3 px-5 text-gray-500 font-mono text-xs">{l.product_sku || '-'}</td>
                  <td className="py-3 px-5 text-right text-orange-600 font-medium">¥{l.price || '-'}</td>
                  <td className="py-3 px-5 text-right">
                    <button onClick={() => { setEditingLink(l); setEditPrice(l.price); setEditNote(l.note); setEditSupplierId(l.supplier_id) }} className="text-blue-600 hover:text-blue-800 text-xs mr-2">编辑</button>
                    <button onClick={() => handleDeleteLink(l)} className="text-red-500 hover:text-red-700 text-xs">解除</button>
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
