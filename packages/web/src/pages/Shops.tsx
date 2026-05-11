import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import type { Shop } from '@statistic/shared'

export default function Shops() {
  const [shops, setShops] = useState<Shop[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Shop | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', platform: '' })
  const [error, setError] = useState('')

  const load = () => {
    setLoading(true)
    api.getShops().then(setShops).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      if (editing) {
        await api.updateShop(editing.id, form.name, form.platform)
      } else {
        await api.createShop(form.name, form.platform)
      }
      setShowForm(false)
      setEditing(null)
      setForm({ name: '', platform: '' })
      load()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleEdit = (shop: Shop) => {
    setEditing(shop)
    setForm({ name: shop.name, platform: shop.platform })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除此店铺？关联的商品和统计数据也会被删除。')) return
    try {
      await api.deleteShop(id)
      load()
    } catch (err: any) {
      alert(err.message)
    }
  }

  const cancelForm = () => {
    setShowForm(false)
    setEditing(null)
    setForm({ name: '', platform: '' })
    setError('')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">店铺管理</h1>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
          >
            添加店铺
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h2 className="text-lg font-semibold mb-4">{editing ? '编辑店铺' : '添加店铺'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">店铺名称</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="例如：XX旗舰店"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">所属平台</label>
              <select
                value={form.platform}
                onChange={(e) => setForm({ ...form, platform: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">请选择</option>
                <option value="淘宝">淘宝</option>
                <option value="天猫">天猫</option>
                <option value="拼多多">拼多多</option>
                <option value="京东">京东</option>
                <option value="1688">1688</option>
                <option value="抖音">抖音</option>
                <option value="其他">其他</option>
              </select>
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
        ) : shops.length === 0 ? (
          <p className="text-center py-12 text-gray-400">暂无店铺，请点击上方按钮添加</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left py-3 px-5 text-gray-500 font-medium">店铺名称</th>
                <th className="text-left py-3 px-5 text-gray-500 font-medium">平台</th>
                <th className="text-left py-3 px-5 text-gray-500 font-medium">创建时间</th>
                <th className="text-right py-3 px-5 text-gray-500 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {shops.map((shop) => (
                <tr key={shop.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-5 font-medium text-gray-800">{shop.name}</td>
                  <td className="py-3 px-5 text-gray-600">{shop.platform || '-'}</td>
                  <td className="py-3 px-5 text-gray-400">{shop.created_at?.slice(0, 10)}</td>
                  <td className="py-3 px-5 text-right">
                    <button onClick={() => handleEdit(shop)} className="text-blue-600 hover:text-blue-800 mr-3">编辑</button>
                    <button onClick={() => handleDelete(shop.id)} className="text-red-500 hover:text-red-700">删除</button>
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
