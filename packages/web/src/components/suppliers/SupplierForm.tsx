import { useState } from 'react'
import type { Supplier } from '@statistic/shared'

interface Props {
  supplier?: Supplier | null
  onSubmit: (data: { wechat_nickname: string; wechat_id: string; remark: string }) => Promise<void>
  onCancel: () => void
}

export default function SupplierForm({ supplier, onSubmit, onCancel }: Props) {
  const [form, setForm] = useState({
    wechat_nickname: supplier?.wechat_nickname || '',
    wechat_id: supplier?.wechat_id || '',
    remark: supplier?.remark || '',
  })
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      await onSubmit(form)
    } catch (err: any) {
      setError(err.message)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 遮罩 */}
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      {/* 弹窗 */}
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
        <h2 className="text-lg font-semibold mb-5">{supplier ? '编辑供应商' : '添加供应商'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">微信昵称</label>
            <input
              type="text"
              value={form.wechat_nickname}
              onChange={(e) => setForm({ ...form, wechat_nickname: e.target.value })}
              required
              autoFocus
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="微信昵称"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">微信 ID</label>
            <input
              type="text"
              value={form.wechat_id}
              onChange={(e) => { setForm({ ...form, wechat_id: e.target.value }); setError('') }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="微信号 / wxid"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
            <input
              type="text"
              value={form.remark}
              onChange={(e) => setForm({ ...form, remark: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="备注信息"
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onCancel} className="px-4 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50">
              取消
            </button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm">
              {supplier ? '保存' : '添加'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
