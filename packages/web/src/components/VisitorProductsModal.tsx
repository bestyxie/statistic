import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import HoverPopup from './HoverPopup'
import type { Visitor, VisitorProduct } from '@statistic/shared'

interface Props {
  visitor: Visitor | null
  onClose: () => void
}

export default function VisitorProductsModal({ visitor, onClose }: Props) {
  const [products, setProducts] = useState<VisitorProduct[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!visitor) {
      setProducts([])
      return
    }
    setLoading(true)
    api.getVisitorProducts(visitor.id)
      .then((res) => setProducts(res))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false))
  }, [visitor])

  if (!visitor) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-2 sm:p-4" onClick={onClose}>
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[85vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-3 sm:px-5 py-3 sm:py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <img
              src={visitor.icon_url || ''}
              alt={visitor.nick_name}
              className="w-8 h-8 rounded-full object-cover bg-gray-200"
              onError={(e) => { (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect fill="%23e5e7eb" width="40" height="40"/><text x="50%" y="55%" text-anchor="middle" fill="%239ca3af" font-size="16">?</text></svg>' }}
            />
            <div>
              <h3 className="text-lg font-semibold text-gray-800">{visitor.nick_name || '未知'}</h3>
              <p className="text-xs text-gray-500">浏览过的商品</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        <div className="overflow-y-auto max-h-[calc(80vh-64px)]">
          {loading ? (
            <p className="text-center text-gray-400 py-12">加载中...</p>
          ) : products.length === 0 ? (
            <p className="text-center text-gray-400 py-12">暂无浏览记录</p>
          ) : (
            <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-4 text-gray-500 font-medium">图片</th>
                  <th className="text-left py-2 px-4 text-gray-500 font-medium">商品</th>
                  <th className="text-left py-2 px-4 text-gray-500 font-medium">价格</th>
                  <th className="text-right py-2 px-4 text-gray-500 font-medium">日期</th>
                  <th className="text-right py-2 px-4 text-gray-500 font-medium">访问次数</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p, i) => (
                  <tr key={`${p.id}-${p.date}-${i}`} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-2 px-4">
                      {p.image_url ? (
                        <HoverPopup popup={<div className="w-48 h-48"><img src={p.image_url} alt="" className="w-full h-full rounded object-cover" /></div>}>
                          <img src={p.image_url} alt="" className="w-10 h-10 rounded object-cover bg-gray-100" />
                        </HoverPopup>
                      ) : (
                        <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center text-gray-300 text-xs">无图</div>
                      )}
                    </td>
                    <td className="py-2 px-4">
                      <HoverPopup offset="left-0" popup={<div className="p-3 max-w-sm text-sm text-gray-700 whitespace-normal break-all select-text">{p.description || p.name || '-'}</div>}>
                        <span className="text-gray-800 max-w-[200px] truncate block">{p.description || p.name || '-'}</span>
                      </HoverPopup>
                    </td>
                    <td className="py-2 px-4 text-gray-600">{p.price || '-'}</td>
                    <td className="py-2 px-4 text-right text-gray-500">{p.date}</td>
                    <td className="py-2 px-4 text-right font-medium">{p.visit_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
