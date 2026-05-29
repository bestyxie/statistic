import { useState } from 'react'
import { useProducts } from '../../hooks/useProducts'
import MobilePageHeader from '../../components/mobile/MobilePageHeader'
import MobileFilter from '../../components/mobile/MobileFilter'
import MobileCard, { MobileCardActions } from '../../components/mobile/MobileCard'
import MobilePagination from '../../components/mobile/MobilePagination'
import ProductDetailDrawer from '../../components/ProductDetailDrawer'

export default function MobileProducts() {
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const {
    products,
    shops,
    total,
    totalPages,
    loading,
    // Filters
    selectedShop,
    setSelectedShop,
    page,
    setPage,
    visitDate,
    setVisitDate,
    searchInput,
    setSearchInput,
    doSearch,
    // Selection
    selectedIds,
    toggleSelect,
    handleRefresh,
    refreshing,
    // Sort
    sortBy,
    toggleSort,
    getSortIcon,
    // Product form
    showForm,
    setShowForm,
    editing,
    form,
    setForm,
    error,
    showFullDesc,
    setShowFullDesc,
    handleSubmit,
    handleEdit,
    cancelForm,
    // Transaction form
    showTxForm,
    setShowTxForm,
    txProduct,
    txForm,
    setTxForm,
    handleTxSubmit,
    // Product transaction list
    showProductTx,
    setShowProductTx,
    productTxProduct,
    productTxList,
    productTxLoading,
    openTxForm,
    openProductTx,
    goToFullTransactions,
    // Actions
    handleDelete,
    // Drawer
    drawerId,
    setDrawerId,
    // Navigation
    navigate,
  } = useProducts()

  const filterSummary = [
    searchInput && `搜索: ${searchInput}`,
    selectedShop && shops.find((s) => s.id === selectedShop)?.name,
    visitDate && visitDate.slice(5),
  ]
    .filter(Boolean)
    .join(' · ') || undefined

  return (
    <div className="space-y-3">
      {/* Header */}
      <MobilePageHeader
        title="商品管理"
        actions={
          <div className="flex gap-2">
            <button
              onClick={() => navigate('/product-ranking')}
              className="px-3 py-1.5 border border-blue-600 text-blue-600 rounded-md text-sm"
            >
              排行榜
            </button>
            <button
              onClick={() => {
                setForm({ shop_id: '', name: '', image_url: '', sku: '', price: '' })
                setShowForm(true)
              }}
              className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm"
            >
              添加
            </button>
          </div>
        }
      />

      {/* Filter */}
      <MobileFilter summary={filterSummary}>
        <input
          type="text"
          placeholder="搜索商品描述..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && doSearch()}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <select
          value={selectedShop}
          onChange={(e) => setSelectedShop(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">全部店铺</option>
          {shops.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={visitDate}
          onChange={(e) => setVisitDate(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <button
          onClick={doSearch}
          className="w-full px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
        >
          搜索
        </button>
      </MobileFilter>

      {/* Sort bar */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500">排序:</span>
        <button
          onClick={() => toggleSort('visitors')}
          className={`px-3 py-1.5 text-sm rounded-md border ${sortBy === 'visitors' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'border-gray-200 text-gray-600'}`}
        >
          访客{getSortIcon('visitors')}
        </button>
        <button
          onClick={() => toggleSort('transactions')}
          className={`px-3 py-1.5 text-sm rounded-md border ${sortBy === 'transactions' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'border-gray-200 text-gray-600'}`}
        >
          成交{getSortIcon('transactions')}
        </button>
      </div>

      {/* Batch actions */}
      {selectedIds.size > 0 && (
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="w-full px-4 py-2 bg-orange-600 text-white rounded-md text-sm hover:bg-orange-700 disabled:opacity-50"
        >
          {refreshing ? '刷新中...' : `刷新选中 (${selectedIds.size})`}
        </button>
      )}

      {/* Product cards */}
      {loading ? (
        <div className="text-center py-10 text-gray-500">加载中...</div>
      ) : products.length === 0 ? (
        <div className="text-center py-10 text-gray-500">暂无商品</div>
      ) : (
        <div className="space-y-2">
          {products.map((p) => (
            <MobileCard key={p.id}>
              {/* Top row: checkbox + image + description */}
              <div className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={selectedIds.has(p.id)}
                  onChange={() => toggleSelect(p.id)}
                  className="rounded border-gray-300 shrink-0"
                />
                {p.image_url ? (
                  <img
                    src={p.image_url}
                    alt=""
                    className="w-16 h-16 rounded object-cover bg-gray-100 shrink-0 cursor-pointer"
                    onClick={() => setPreviewImage(p.image_url!)}
                  />
                ) : (
                  <div className="w-16 h-16 rounded bg-gray-100 shrink-0 flex items-center justify-center text-gray-300 text-xs">
                    无图
                  </div>
                )}
                <p className="text-sm font-medium text-gray-800 line-clamp-2 flex-1">
                  {p.description || p.name || '-'}
                </p>
              </div>

              {/* Info row */}
              <div className="mt-1.5 flex items-center gap-2 text-xs text-gray-500 pl-[4.25rem]">
                {p.shop_name && (
                  <>
                    <span>{p.shop_name}</span>
                    <span className="text-gray-300">·</span>
                  </>
                )}
                {p.price && (
                  <>
                    <span>{p.price}</span>
                    <span className="text-gray-300">·</span>
                  </>
                )}
                <span className="font-medium">{(p as any).yesterday_visitors || 0} 访客</span>
                <span className="text-gray-300">·</span>
                <button
                  onClick={() => {
                    if ((p as any).transaction_count > 0) openProductTx(p)
                  }}
                  className={`font-medium ${
                    (p as any).transaction_count > 0
                      ? 'text-orange-600 hover:text-orange-700'
                      : 'text-gray-400 hover:text-gray-500'
                  }`}
                >
                  {(p as any).transaction_count || 0} 成交
                </button>
              </div>

              {/* Actions */}
              <MobileCardActions>
                <button
                  onClick={() => handleEdit(p)}
                  className="text-blue-600 text-sm"
                >
                  编辑
                </button>
                <button
                  onClick={() => setDrawerId(p.id)}
                  className="text-green-600 text-sm"
                >
                  统计
                </button>
                <button
                  onClick={() => openTxForm(p)}
                  className="text-orange-600 text-sm"
                >
                  成交
                </button>
                <button
                  onClick={() => handleDelete(p.id)}
                  className="text-red-500 text-sm"
                >
                  删除
                </button>
              </MobileCardActions>
            </MobileCard>
          ))}
        </div>
      )}

      {/* Pagination */}
      <MobilePagination
        page={page}
        totalPages={totalPages}
        total={total}
        onPageChange={setPage}
      />

      {/* Add/edit form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-base font-semibold mb-3">
              {editing ? '编辑商品' : '添加商品'}
            </h2>

            {/* Editing: show image and description */}
            {editing && (
              <div className="flex gap-3 mb-3 p-3 bg-gray-50 rounded-lg">
                <div className="shrink-0">
                  {editing.image_url ? (
                    <img
                      src={editing.image_url}
                      alt="商品图片"
                      className="w-16 h-16 rounded object-cover bg-gray-100"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded bg-gray-100 flex items-center justify-center text-gray-300 text-xs">
                      无图
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs text-gray-500">描述</p>
                    {editing.description && editing.description.length > 100 && (
                      <button
                        type="button"
                        onClick={() => setShowFullDesc(!showFullDesc)}
                        className="text-xs text-blue-600"
                      >
                        {showFullDesc ? '收起' : '显示全部'}
                      </button>
                    )}
                  </div>
                  <p
                    className={`text-sm text-gray-700 ${
                      showFullDesc ? '' : 'line-clamp-4'
                    } overflow-y-auto`}
                  >
                    {editing.description || '暂无描述'}
                  </p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              {!editing && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    所属店铺
                  </label>
                  <select
                    value={form.shop_id}
                    onChange={(e) => setForm({ ...form, shop_id: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">请选择店铺</option>
                    {shops.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  商品名称
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="商品名称"
                />
              </div>
              {!editing && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    图片 URL
                  </label>
                  <input
                    type="url"
                    value={form.image_url}
                    onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://example.com/image.jpg"
                  />
                  {form.image_url && (
                    <img
                      src={form.image_url}
                      alt="预览"
                      className="mt-2 w-20 h-20 rounded object-cover bg-gray-100"
                    />
                  )}
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    SKU
                  </label>
                  <input
                    type="text"
                    value={form.sku}
                    onChange={(e) => setForm({ ...form, sku: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="可选"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    价格
                  </label>
                  <input
                    type="text"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="可选"
                  />
                </div>
              </div>
              {error && <p className="text-red-500 text-xs">{error}</p>}
              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
                >
                  {editing ? '保存' : '添加'}
                </button>
                <button
                  type="button"
                  onClick={cancelForm}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50"
                >
                  取消
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transaction form modal */}
      {showTxForm && txProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-4">
            <h2 className="text-base font-semibold mb-3">
              录入成交 —{' '}
              {txProduct.description?.slice(0, 30) || txProduct.sku}
            </h2>
            <form onSubmit={handleTxSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  成交价
                </label>
                <input
                  type="text"
                  value={txForm.price}
                  onChange={(e) => setTxForm({ ...txForm, price: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    数量
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={txForm.quantity}
                    onChange={(e) =>
                      setTxForm({ ...txForm, quantity: e.target.value })
                    }
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    日期
                  </label>
                  <input
                    type="date"
                    value={txForm.date}
                    onChange={(e) =>
                      setTxForm({ ...txForm, date: e.target.value })
                    }
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  备注
                </label>
                <input
                  type="text"
                  value={txForm.note}
                  onChange={(e) => setTxForm({ ...txForm, note: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="可选"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-600 text-white rounded-md text-sm hover:bg-orange-700"
                >
                  确认成交
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowTxForm(false)
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50"
                >
                  取消
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Product transaction list modal (card-based for mobile) */}
      {showProductTx && productTxProduct && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowProductTx(false)}
        >
          <div
            className="bg-white rounded-lg max-w-lg w-full p-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <h2
                className="text-sm font-semibold truncate flex-1 mr-2"
                title={productTxProduct.description || productTxProduct.sku}
              >
                成交记录 —{' '}
                {productTxProduct.description || productTxProduct.sku}
              </h2>
              <button
                onClick={() => setShowProductTx(false)}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none shrink-0"
              >
                &times;
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2 mb-3 text-xs text-gray-600">
              <span>共 {productTxList.length} 条</span>
              <span className="text-gray-300">|</span>
              <span>
                总数量:{' '}
                {productTxList.reduce(
                  (sum, tx) => sum + (tx.quantity || 0),
                  0,
                )}
              </span>
              <span className="text-gray-300">|</span>
              <span className="text-red-600">
                已退:{' '}
                {productTxList.reduce(
                  (sum, tx) => sum + (tx.refund_quantity || 0),
                  0,
                )}
              </span>
              <span className="text-gray-300">|</span>
              <span className="text-orange-600 font-medium">
                总金额: ¥
                {productTxList
                  .reduce(
                    (sum, tx) =>
                      sum + parseFloat(tx.price || '0') * (tx.quantity || 0),
                    0,
                  )
                  .toFixed(0)}
              </span>
            </div>

            {productTxLoading ? (
              <div className="text-center py-10 text-gray-400">加载中...</div>
            ) : productTxList.length === 0 ? (
              <div className="text-center py-10 text-gray-400">暂无成交记录</div>
            ) : (
              <div className="space-y-2">
                {productTxList.map((tx) => {
                  const hasRefund = (tx.refund_count || 0) > 0
                  const refundQuantity = tx.refund_quantity || 0
                  const remainingQuantity = tx.quantity - refundQuantity
                  const isFullyRefunded = remainingQuantity <= 0

                  return (
                    <div
                      key={tx.id}
                      className={`rounded-lg border p-3 ${
                        isFullyRefunded
                          ? 'bg-red-50/50 border-red-100'
                          : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          {tx.image_url && (
                            <img
                              src={tx.image_url}
                              alt=""
                              className="w-8 h-8 rounded object-cover bg-gray-100 shrink-0"
                            />
                          )}
                          <span
                            className={`text-sm truncate ${
                              isFullyRefunded
                                ? 'line-through text-gray-400'
                                : 'text-gray-800'
                            }`}
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
                      <div className="mt-1.5 flex items-center gap-3 text-xs text-gray-500">
                        <span>{tx.date}</span>
                        <span className="font-medium text-gray-700">
                          ¥{tx.price}
                        </span>
                        <span>
                          x{' '}
                          <span
                            className={
                              isFullyRefunded
                                ? 'line-through text-gray-400'
                                : ''
                            }
                          >
                            {tx.quantity}
                          </span>
                          {hasRefund && (
                            <span className="text-red-600 ml-1">
                              (剩{remainingQuantity})
                            </span>
                          )}
                        </span>
                        <span className="text-orange-600 font-medium">
                          = ¥{(parseFloat(tx.price) * tx.quantity).toFixed(0)}
                        </span>
                      </div>
                      {tx.note && (
                        <p className="mt-1 text-xs text-gray-400 truncate">
                          {tx.note}
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            <div className="flex gap-2 pt-3 mt-3 border-t border-gray-200">
              <button
                onClick={goToFullTransactions}
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
              >
                查看完整成交明细
              </button>
              <button
                onClick={() => setShowProductTx(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image preview */}
      {previewImage && (
        <div
          className="fixed inset-0 z-[70] bg-black/80 flex items-center justify-center"
          onClick={() => setPreviewImage(null)}
        >
          <img
            src={previewImage}
            alt=""
            className="max-w-[90vw] max-h-[85vh] object-contain rounded"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={() => setPreviewImage(null)}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/20 text-white text-lg"
          >
            &times;
          </button>
        </div>
      )}

      {/* Product detail drawer */}
      <ProductDetailDrawer
        productId={drawerId}
        onClose={() => setDrawerId(null)}
      />
    </div>
  )
}
