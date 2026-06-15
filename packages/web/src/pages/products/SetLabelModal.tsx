import { useState, useEffect } from 'react'
import { api } from '../../lib/api'
import type { Product, ProductLabel } from '@statistic/shared'

interface Props {
  product: Product | null
  onClose: () => void
}

export default function SetLabelModal({ product, onClose }: Props) {
  const [allLabels, setAllLabels] = useState<ProductLabel[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [debugResult, setDebugResult] = useState<string>('')
  const [testing, setTesting] = useState(false)

  useEffect(() => {
    if (!product) return
    setLoading(true)
    setDebugResult('')
    Promise.all([
      api.getLabels(),
      api.getProductLabels(product.id),
    ]).then(([labels, current]) => {
      setAllLabels(labels)
      setSelectedIds(new Set(current.map((l) => l.label_id)))
    }).catch(() => {}).finally(() => setLoading(false))
  }, [product])

  if (!product) return null

  const toggle = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleSubmit = async () => {
    try {
      await api.setProductLabels(product.id, [...selectedIds])
      onClose()
    } catch (err: any) {
      alert(err.message || '设置失败')
    }
  }

  const handleTest = async () => {
    if (!product.sku) {
      setDebugResult('该商品没有 SKU')
      return
    }
    setTesting(true)
    setDebugResult('')
    try {
      const res = await api.testLabelSku(product.sku) as { sku: string; http_status: number; duration_ms: number; json: any; error?: string; raw_text_preview?: string }
      setDebugResult(`SKU: ${res.sku}\nHTTP ${res.http_status} · ${res.duration_ms}ms\n\n${JSON.stringify(res.json ?? res.raw_text_preview ?? res.error, null, 2)}`)
    } catch (err: any) {
      setDebugResult(`请求失败: ${err.message}`)
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4" onClick={onClose}>
      <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 max-w-md w-full max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-base sm:text-lg font-semibold mb-4">设置标签 — {(product.description || product.sku).slice(0, 30)}</h2>
        {loading ? (
          <p className="text-gray-400 text-sm py-4">加载中...</p>
        ) : allLabels.length === 0 ? (
          <p className="text-gray-400 text-sm py-4">暂无标签，请先导入标签</p>
        ) : (
          <div className="space-y-1 overflow-y-auto flex-1 mb-4">
            {allLabels.map((l) => (
              <label key={l.label_id} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedIds.has(l.label_id)}
                  onChange={() => toggle(l.label_id)}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">{l.label_name}</span>
              </label>
            ))}
          </div>
        )}
        {debugResult && (
          <pre className="bg-gray-50 border border-gray-200 rounded p-2 text-xs text-gray-700 max-h-40 overflow-auto whitespace-pre-wrap">{debugResult}</pre>
        )}
        <div className="flex gap-2 pt-2 border-t border-gray-100">
          <button onClick={handleSubmit} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm disabled:opacity-50">确认</button>
          <button onClick={handleTest} disabled={testing} className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm disabled:opacity-50">
            {testing ? '测试中...' : '调试此 SKU'}
          </button>
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50 ml-auto">取消</button>
        </div>
      </div>
    </div>
  )
}
