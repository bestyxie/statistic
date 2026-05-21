import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api } from '../lib/api'

export default function Transactions() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [items, setItems] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const page = parseInt(searchParams.get('page') || '1')
  const setPage = (p: number) => setSearchParams((prev) => { prev.set('page', String(p)); return prev })
  const start = searchParams.get('start') || ''
  const end = searchParams.get('end') || ''
  const search = searchParams.get('search') || ''
  const [searchInput, setSearchInput] = useState(search)
  const [startInput, setStartInput] = useState(start)
  const [endInput, setEndInput] = useState(end)
  const doSearch = () => setSearchParams((prev) => {
    prev.delete('page')
    if (searchInput) prev.set('search', searchInput); else prev.delete('search')
    if (startInput) prev.set('start', startInput); else prev.delete('start')
    if (endInput) prev.set('end', endInput); else prev.delete('end')
    return prev
  })
  const [loading, setLoading] = useState(true)
  const [refundModal, setRefundModal] = useState<any>(null)
  const [refundForm, setRefundForm] = useState({ price: '', quantity: '1', date: new Date().toISOString().slice(0, 10), note: '退款' })
  const limit = 30

  useEffect(() => { loadTransactions() }, [page, start, end, search])
  useEffect(() => { setSearchInput(search); setStartInput(start); setEndInput(end) }, [search, start, end])

  async function loadTransactions() {
    setLoading(true)
    try {
      const res = await api.getTransactions({
        start: start || undefined,
        end: end || undefined,
        search: search || undefined,
        page,
        limit,
      })
      setItems(res.items || [])
      setTotal(res.total || 0)
    } catch (e: any) {
      console.error('加载失败:', e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleRefund = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!refundModal) return
    try {
      await api.createRefund({
        transaction_id: refundModal.id,
        price: refundForm.price,
        quantity: parseInt(refundForm.quantity) || 1,
        date: refundForm.date,
        note: refundForm.note,
      })
      setRefundModal(null)
      loadTransactions()
    } catch (err: any) {
      alert(err.message)
    }
  }

  const totalPages = Math.ceil(total / limit)

  // 汇总
  const totalAmount = items.reduce((s, t) => s + parseFloat(t.price || '0') * (t.quantity || 0), 0)
  const totalQty = items.reduce((s, t) => s + (t.quantity || 0), 0)
  const totalRefundQty = items.reduce((s, t) => s + (t.refund_quantity || 0), 0)
  const totalRefundCount = items.reduce((s, t) => s + (t.refund_count || 0), 0)

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-900">成交明细</h1>
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <span>共 {total} 笔</span>
          <span>合计 {totalQty} 件</span>
          {totalRefundCount > 0 && (
            <span className="text-red-600">已退 {totalRefundQty} 件</span>
          )}
          <span className="text-orange-600 font-medium">¥{totalAmount.toFixed(0)}</span>
        </div>
      </div>

      {/* 筛选 */}
      <div className="flex gap-2 mb-6">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="搜索商品描述..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && doSearch()}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 pr-7"
          />
          {searchInput && (
            <button type="button" onClick={() => { setSearchInput(''); setSearchParams((prev) => { prev.delete('search'); prev.delete('page'); return prev }) }} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs">&#x2715;</button>
          )}
        </div>
        <div className="relative">
          <input
            type="date"
            value={startInput}
            onChange={(e) => setStartInput(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 pr-7"
          />
          {startInput && (
            <button type="button" onClick={() => { setStartInput(''); setSearchParams((prev) => { prev.delete('start'); prev.delete('page'); return prev }) }} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs">&#x2715;</button>
          )}
        </div>
        <div className="relative">
          <input
            type="date"
            value={endInput}
            onChange={(e) => setEndInput(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 pr-7"
          />
          {endInput && (
            <button type="button" onClick={() => { setEndInput(''); setSearchParams((prev) => { prev.delete('end'); prev.delete('page'); return prev }) }} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs">&#x2715;</button>
          )}
        </div>
        <button onClick={doSearch} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700">搜索</button>
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-500">加载中...</div>
      ) : items.length === 0 ? (
        <div className="text-center py-10 text-gray-500">暂无成交数据</div>
      ) : (
        <>
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">日期</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">商品</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">店铺</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">成交价</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">数量</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">金额</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">备注</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {items.map((tx) => {
                  const hasRefund = (tx.refund_count || 0) > 0
                  const refundQuantity = tx.refund_quantity || 0
                  const remainingQuantity = tx.quantity - refundQuantity
                  const isFullyRefunded = remainingQuantity <= 0

                  return (
                    <tr key={tx.id} className={`hover:bg-gray-50 ${isFullyRefunded ? 'bg-red-50/50' : ''}`}>
                      <td className="px-4 py-3 text-sm text-gray-500">{tx.date}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {tx.image_url && <img src={tx.image_url} alt="" className="w-8 h-8 rounded object-cover bg-gray-100" />}
                          <div className="flex items-center gap-2">
                            <span className={`text-sm max-w-[200px] truncate block ${isFullyRefunded ? 'text-gray-400 line-through' : 'text-gray-800'}`} title={tx.description || tx.product_name}>{tx.description || tx.product_name}</span>
                            {hasRefund && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                已退{refundQuantity}件
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">{tx.shop_name || '-'}</td>
                      <td className="px-4 py-3 text-sm text-right font-medium">¥{tx.price}</td>
                      <td className="px-4 py-3 text-sm text-right">
                        <span className={isFullyRefunded ? 'text-gray-400 line-through' : ''}>{tx.quantity}</span>
                        {hasRefund && (
                          <span className="text-xs text-red-600 ml-1">
                            (剩{remainingQuantity})
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-medium text-orange-600">¥{(parseFloat(tx.price) * tx.quantity).toFixed(0)}</td>
                      <td className="px-4 py-3 text-sm text-gray-500 max-w-[120px] truncate" title={tx.note}>{tx.note || '-'}</td>
                      <td className="px-4 py-3 text-right">
                        {!isFullyRefunded && (
                          <button
                            onClick={() => { setRefundModal(tx); setRefundForm({ price: tx.price, quantity: String(remainingQuantity), date: new Date().toISOString().slice(0, 10), note: '退款' }) }}
                            className="text-red-500 hover:text-red-700 text-sm"
                          >
                            退款
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* 分页 */}
          {total > limit && (() => {
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
              <div className="flex items-center justify-between px-4 py-3 mt-4">
                <span className="text-sm text-gray-500">共 {total} 条，第 {page}/{totalPages} 页</span>
                <div className="flex items-center gap-1">
                  <button onClick={() => setPage(page - 1)} disabled={page <= 1} className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">上一页</button>
                  {pages.map((p, i) =>
                    p === '...' ? (
                      <span key={`dots-${i}`} className="px-2 text-gray-400">...</span>
                    ) : (
                      <button key={p} onClick={() => setPage(p)} className={`px-3 py-1 text-sm rounded-md border ${p === page ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 hover:bg-gray-50'}`}>{p}</button>
                    )
                  )}
                  <button onClick={() => setPage(page + 1)} disabled={page >= totalPages} className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">下一页</button>
                  <span className="mx-2 text-gray-400">|</span>
                  <span className="text-sm text-gray-500">跳至</span>
                  <input type="number" min={1} max={totalPages} className="w-14 px-2 py-1 text-sm border border-gray-300 rounded-md text-center" onKeyDown={(e) => { if (e.key === 'Enter') { const v = parseInt((e.target as HTMLInputElement).value); if (v >= 1 && v <= totalPages) setPage(v) } }} />
                  <span className="text-sm text-gray-500">页</span>
                </div>
              </div>
            )
          })()}
        </>
      )}

      {/* 退款弹窗 */}
      {refundModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setRefundModal(null)}>
          <div className="bg-white rounded-lg max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">录入退款</h3>
            <div className="mb-4 p-3 bg-gray-50 rounded-md">
              <p className="text-sm text-gray-700">原成交：<span className="font-medium max-w-[280px] truncate inline-block" title={refundModal.description || refundModal.product_name}>{refundModal.description || refundModal.product_name}</span></p>
              <p className="text-sm text-gray-600 mt-1">¥{refundModal.price} x {refundModal.quantity}</p>
              {(refundModal.refund_quantity || 0) > 0 && (
                <p className="text-sm text-red-600 mt-1">
                  已退 <span className="font-medium">{refundModal.refund_quantity}</span> 件，
                  剩余 <span className="font-medium">{refundModal.quantity - (refundModal.refund_quantity || 0)}</span> 件
                </p>
              )}
            </div>
            <form onSubmit={handleRefund} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">退款价</label>
                  <input type="text" value={refundForm.price} onChange={(e) => setRefundForm({ ...refundForm, price: e.target.value })} required className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">数量</label>
                  <input
                    type="number"
                    min={1}
                    max={refundModal.quantity - (refundModal.refund_quantity || 0)}
                    value={refundForm.quantity}
                    onChange={(e) => setRefundForm({ ...refundForm, quantity: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">最多可退 {refundModal.quantity - (refundModal.refund_quantity || 0)} 件</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">退款日期</label>
                <input type="date" value={refundForm.date} onChange={(e) => setRefundForm({ ...refundForm, date: e.target.value })} required className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
                <input type="text" value={refundForm.note} onChange={(e) => setRefundForm({ ...refundForm, note: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 text-sm">确认退款</button>
                <button type="button" onClick={() => setRefundModal(null)} className="px-4 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50">取消</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
