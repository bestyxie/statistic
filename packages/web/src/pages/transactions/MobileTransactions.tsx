import MobilePageHeader from '../../components/mobile/MobilePageHeader'
import MobileCard, { MobileCardActions } from '../../components/mobile/MobileCard'
import MobileFilter from '../../components/mobile/MobileFilter'
import MobilePagination from '../../components/mobile/MobilePagination'
import { useImagePreview } from '../../components/mobile/MobileImagePreview'
import { useTransactions } from '../../hooks/useTransactions'

export default function MobileTransactions() {
  const {
    items,
    total,
    loading,
    page,
    setPage,
    totalPages,
    start,
    end,
    search,
    searchInput,
    setSearchInput,
    startInput,
    setStartInput,
    endInput,
    setEndInput,
    doSearch,
    refundModal,
    setRefundModal,
    refundForm,
    setRefundForm,
    handleRefund,
    handleDelete,
    totalAmount,
    totalQty,
    totalRefundQty,
    totalRefundCount,
  } = useTransactions()

  const filterSummary = [search && `搜索: ${search}`, start && `从 ${start}`, end && `至 ${end}`].filter(Boolean).join(' · ') || undefined

  const { show: showImage } = useImagePreview()

  return (
    <div>
      <MobilePageHeader
        title="成交明细"
        actions={
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span>共 {total} 笔</span>
            <span>{totalQty} 件</span>
            {totalRefundCount > 0 && (
              <span className="text-red-600">已退 {totalRefundQty} 件</span>
            )}
            <span className="text-orange-600 font-medium">¥{totalAmount.toFixed(0)}</span>
          </div>
        }
      />

      <MobileFilter summary={filterSummary}>
        <input
          type="text"
          placeholder="搜索商品描述..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && doSearch()}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <input
          type="date"
          value={startInput}
          onChange={(e) => setStartInput(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <input
          type="date"
          value={endInput}
          onChange={(e) => setEndInput(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <button
          onClick={doSearch}
          className="w-full px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
        >
          搜索
        </button>
      </MobileFilter>

      {loading ? (
        <div className="text-center py-10 text-gray-500">加载中...</div>
      ) : items.length === 0 ? (
        <div className="text-center py-10 text-gray-500">暂无成交数据</div>
      ) : (
        <div className="space-y-2 mt-3">
          {items.map((tx) => {
            const hasRefund = (tx.refund_count || 0) > 0
            const refundQuantity = tx.refund_quantity || 0
            const remainingQuantity = tx.quantity - refundQuantity
            const isFullyRefunded = remainingQuantity <= 0

            return (
              <MobileCard key={tx.id}>
                <div className="flex items-start gap-2.5">
                  {tx.image_url ? (
                    <img
                      src={tx.image_url}
                      alt=""
                      className="w-14 h-14 rounded object-cover bg-gray-100 shrink-0 cursor-pointer"
                      onClick={() => showImage(tx.image_url!)}
                    />
                  ) : (
                    <div className="w-14 h-14 rounded bg-gray-100 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-sm truncate block ${isFullyRefunded ? 'text-gray-400 line-through' : 'text-gray-800'}`}
                        title={tx.description || tx.product_name}
                      >
                        {tx.description || tx.product_name}
                      </span>
                      {hasRefund && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 shrink-0">
                          已退{refundQuantity}件
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-1.5 flex items-center gap-2 text-xs text-gray-500">
                  <span>{tx.date}</span>
                  {tx.shop_name && (
                    <>
                      <span className="text-gray-300">|</span>
                      <span>{tx.shop_name}</span>
                    </>
                  )}
                </div>

                <div className="mt-1 text-sm">
                  <span className="text-gray-700">¥{tx.price}</span>
                  <span className="text-gray-400 mx-1">x</span>
                  <span className={isFullyRefunded ? 'text-gray-400 line-through' : 'text-gray-700'}>
                    {tx.quantity}
                  </span>
                  <span className="text-gray-400 mx-1">=</span>
                  <span className="text-orange-600 font-medium">
                    ¥{(parseFloat(tx.price) * tx.quantity).toFixed(0)}
                  </span>
                </div>

                <MobileCardActions>
                  {!isFullyRefunded && (
                    <button
                      onClick={() => {
                        setRefundModal(tx)
                        setRefundForm({
                          price: tx.price,
                          quantity: String(remainingQuantity),
                          date: new Date().toISOString().slice(0, 10),
                          note: '退款',
                        })
                      }}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      退款
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(tx.id)}
                    className="text-gray-500 hover:text-gray-700 text-sm"
                  >
                    删除
                  </button>
                </MobileCardActions>
              </MobileCard>
            )
          })}
        </div>
      )}

      <MobilePagination
        page={page}
        totalPages={totalPages}
        total={total}
        onPageChange={setPage}
      />

      {refundModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setRefundModal(null)}
        >
          <div
            className="bg-white rounded-lg max-w-md w-full p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-semibold mb-3">录入退款</h3>
            <div className="mb-4 p-3 bg-gray-50 rounded-md">
              <p className="text-sm text-gray-700">
                原成交：
                <span
                  className="font-medium truncate inline-block max-w-[220px] align-bottom"
                  title={refundModal.description || refundModal.product_name}
                >
                  {refundModal.description || refundModal.product_name}
                </span>
              </p>
              <p className="text-sm text-gray-600 mt-1">
                ¥{refundModal.price} x {refundModal.quantity}
              </p>
              {(refundModal.refund_quantity || 0) > 0 && (
                <p className="text-sm text-red-600 mt-1">
                  已退 <span className="font-medium">{refundModal.refund_quantity}</span> 件，
                  剩余 <span className="font-medium">{refundModal.quantity - (refundModal.refund_quantity || 0)}</span> 件
                </p>
              )}
            </div>
            <form onSubmit={handleRefund} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">退款价</label>
                  <input
                    type="text"
                    value={refundForm.price}
                    onChange={(e) => setRefundForm({ ...refundForm, price: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
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
                  <p className="text-xs text-gray-500 mt-1">
                    最多可退 {refundModal.quantity - (refundModal.refund_quantity || 0)} 件
                  </p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">退款日期</label>
                <input
                  type="date"
                  value={refundForm.date}
                  onChange={(e) => setRefundForm({ ...refundForm, date: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
                <input
                  type="text"
                  value={refundForm.note}
                  onChange={(e) => setRefundForm({ ...refundForm, note: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 text-sm"
                >
                  确认退款
                </button>
                <button
                  type="button"
                  onClick={() => setRefundModal(null)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50"
                >
                  取消
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
