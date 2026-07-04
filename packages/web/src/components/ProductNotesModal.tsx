import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import type { ProductNote } from '@statistic/shared'

interface ProductRef {
  id: string
  name?: string
  description?: string
}

interface Props {
  product: ProductRef | null
  onClose: () => void
  /** 备注发生增删后回调（父组件可据此刷新列表里的「最近备注」） */
  onChanged?: () => void
}

// datetime('now') 形如 'YYYY-MM-DD HH:MM:SS'，取日期段
function fmtDate(s: string): string {
  return s ? s.slice(0, 10) : ''
}

export default function ProductNotesModal({ product, onClose, onChanged }: Props) {
  const [notes, setNotes] = useState<ProductNote[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!product) return
    const load = async () => {
      setLoading(true)
      try {
        const list = await api.getProductNotes(product.id)
        setNotes(list)
      } catch {
        setNotes([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [product])

  if (!product) return null

  const handleDelete = async (noteId: string) => {
    try {
      await api.deleteProductNote(product.id, noteId)
      setNotes((prev) => prev.filter((n) => n.id !== noteId))
      onChanged?.()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : '删除失败')
    }
  }

  const title = (product.description || product.name || product.id).slice(0, 30)

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4" onClick={onClose}>
      <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 max-w-md w-full max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-base sm:text-lg font-semibold mb-4">查看备注 — {title}</h2>
        {loading ? (
          <p className="text-gray-400 text-sm py-4">加载中...</p>
        ) : notes.length === 0 ? (
          <p className="text-gray-400 text-sm py-4">暂无备注</p>
        ) : (
          <div className="space-y-2 overflow-y-auto flex-1 mb-4">
            {notes.map((n) => (
              <div key={n.id} className="flex items-start gap-2 p-2 rounded bg-gray-50">
                <span className="text-xs text-gray-400 shrink-0 mt-0.5 w-20">{fmtDate(n.created_at)}</span>
                <span className="text-sm text-gray-700 flex-1 whitespace-pre-wrap break-all">{n.content}</span>
                <button type="button" onClick={() => handleDelete(n.id)} className="text-gray-400 hover:text-red-500 text-xs shrink-0">删除</button>
              </div>
            ))}
          </div>
        )}
        <div className="flex justify-end border-t border-gray-100 pt-3">
          <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50">关闭</button>
        </div>
      </div>
    </div>
  )
}
