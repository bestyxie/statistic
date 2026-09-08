import { useState } from 'react'
import { api } from '../lib/api'
import Modal from './ui/Modal'

interface ProductRef {
  id: string
  name?: string
  description?: string
}

interface Props {
  product: ProductRef | null
  onClose: () => void
  /** 添加成功后回调（父组件可据此刷新列表里的「最近备注」） */
  onChanged?: () => void
}

export default function ProductNotesAddModal({ product, onClose, onChanged }: Props) {
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!product) return
    const text = content.trim()
    if (!text) return
    setSubmitting(true)
    try {
      await api.addProductNote(product.id, text)
      onChanged?.()
      onClose()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : '添加失败')
    } finally {
      setSubmitting(false)
    }
  }

  const title = product ? (product.description || product.name || product.id).slice(0, 30) : ''

  return (
    <Modal open={!!product} onClose={onClose} disableClose size="md">
      <form
        className="p-4 sm:p-6 flex flex-col"
        onSubmit={handleSubmit}
      >
        <h2 className="text-base sm:text-lg font-semibold mb-4">添加备注 — {title}</h2>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="输入备注内容..."
          rows={4}
          autoFocus
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none mb-4"
        />
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50">取消</button>
          <button type="submit" disabled={submitting || !content.trim()} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm disabled:opacity-50">
            {submitting ? '添加中...' : '添加'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
