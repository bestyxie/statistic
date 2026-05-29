import { useState } from 'react'
import MobilePageHeader from '../../components/mobile/MobilePageHeader'
import MobileCard, { MobileCardActions } from '../../components/mobile/MobileCard'
import MobileFilter from '../../components/mobile/MobileFilter'
import { supplierApi, type ProductSupplierWithInfo } from '../../lib/supplierApi'
import type { Supplier } from '@statistic/shared'

export default function MobileSuppliers() {
  const [activeTab, setActiveTab] = useState<'supply' | 'purchases'>('supply')

  return (
    <div className="space-y-4">
      <MobilePageHeader title="供应商管理" />

      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('supply')}
          className={`flex-1 pb-2.5 text-sm font-medium border-b-2 ${activeTab === 'supply' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'}`}
        >
          供货列表
        </button>
        <button
          onClick={() => setActiveTab('purchases')}
          className={`flex-1 pb-2.5 text-sm font-medium border-b-2 ${activeTab === 'purchases' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'}`}
        >
          拿货记录
        </button>
      </div>

      {activeTab === 'supply' && <MobileSupplyList />}
      {activeTab === 'purchases' && <MobilePurchaseRecords />}
    </div>
  )
}

function MobileSupplyList() {
  const [links, setLinks] = useState<ProductSupplierWithInfo[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterSupplier, setFilterSupplier] = useState('')
  const [showSupplierForm, setShowSupplierForm] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
  const [supplierForm, setSupplierForm] = useState({ wechat_nickname: '', wechat_id: '', remark: '' })

  const loadLinks = () => {
    setLoading(true)
    supplierApi.getAllProducts({ search, supplier_id: filterSupplier })
      .then(setLinks)
      .finally(() => setLoading(false))
  }

  const loadSuppliers = () => supplierApi.getSuppliers().then(setSuppliers)

  useState(() => { loadSuppliers(); loadLinks() })

  const handleSupplierSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingSupplier) {
        await supplierApi.updateSupplier(editingSupplier.id, supplierForm)
      } else {
        await supplierApi.createSupplier(supplierForm)
      }
      setShowSupplierForm(false)
      setEditingSupplier(null)
      loadSuppliers()
      loadLinks()
    } catch (err: any) {
      alert(err.message)
    }
  }

  const handleDeleteLink = async (link: ProductSupplierWithInfo) => {
    if (!confirm('确定解除此关联？')) return
    await supplierApi.unlinkProduct(link.id)
    loadLinks()
  }

  return (
    <div className="space-y-3">
      <MobileFilter summary={search || filterSupplier ? '已筛选' : '筛选'}>
        <input
          type="text" value={search} onChange={(e) => { setSearch(e.target.value); setTimeout(loadLinks, 300) }}
          placeholder="搜索供应商 / 商品" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
        />
        <select value={filterSupplier} onChange={(e) => { setFilterSupplier(e.target.value); setTimeout(loadLinks, 0) }} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm">
          <option value="">全部供应商</option>
          {suppliers.map((s) => <option key={s.id} value={s.id}>{s.wechat_nickname}</option>)}
        </select>
        <button onClick={() => setShowSupplierForm(true)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm">
          管理供应商
        </button>
      </MobileFilter>

      {showSupplierForm && (
        <MobileCard>
          <h3 className="text-sm font-semibold mb-3">{editingSupplier ? '编辑供应商' : '添加供应商'}</h3>
          <form onSubmit={handleSupplierSubmit} className="space-y-3">
            <input type="text" value={supplierForm.wechat_nickname} onChange={(e) => setSupplierForm({ ...supplierForm, wechat_nickname: e.target.value })} required placeholder="微信昵称" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
            <input type="text" value={supplierForm.wechat_id} onChange={(e) => setSupplierForm({ ...supplierForm, wechat_id: e.target.value })} placeholder="微信号" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
            <input type="text" value={supplierForm.remark} onChange={(e) => setSupplierForm({ ...supplierForm, remark: e.target.value })} placeholder="备注" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
            <div className="flex gap-2">
              <button type="submit" className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm">{editingSupplier ? '保存' : '添加'}</button>
              <button type="button" onClick={() => { setShowSupplierForm(false); setEditingSupplier(null) }} className="px-3 py-1.5 border border-gray-300 rounded-md text-sm">取消</button>
            </div>
          </form>
        </MobileCard>
      )}

      {loading ? (
        <p className="text-center py-8 text-gray-400 text-sm">加载中...</p>
      ) : links.length === 0 ? (
        <p className="text-center py-8 text-gray-400 text-sm">暂无供货关联</p>
      ) : (
        <div className="space-y-2">
          {links.map((l) => (
            <MobileCard key={l.id}>
              <div className="flex items-center gap-2">
                {l.product_image ? (
                  <img src={l.product_image} alt="" className="w-10 h-10 rounded object-cover bg-gray-100 shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center text-gray-300 text-xs shrink-0">无</div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{l.product_description || l.product_name}</p>
                  <p className="text-xs text-gray-500">{l.supplier_name} · {l.product_sku || '-'}</p>
                </div>
                <span className="text-orange-600 font-medium text-sm shrink-0">¥{l.price || '-'}</span>
              </div>
              <MobileCardActions>
                <button onClick={() => handleDeleteLink(l)} className="text-red-500 text-sm">解除关联</button>
              </MobileCardActions>
            </MobileCard>
          ))}
        </div>
      )}
    </div>
  )
}

function MobilePurchaseRecords() {
  // Simplified: just show supplier list + their purchase records
  return (
    <div className="space-y-3">
      <p className="text-center py-8 text-gray-400 text-sm">请在桌面端管理拿货记录</p>
    </div>
  )
}
