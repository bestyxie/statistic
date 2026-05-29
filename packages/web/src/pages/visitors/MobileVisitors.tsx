import { useState } from 'react'
import MobilePageHeader from '../../components/mobile/MobilePageHeader'
import MobileCard, { MobileCardActions } from '../../components/mobile/MobileCard'
import MobileFilter from '../../components/mobile/MobileFilter'
import MobilePagination from '../../components/mobile/MobilePagination'
import VisitorProductsModal from '../../components/VisitorProductsModal'
import { useVisitors } from '../../hooks/useVisitors'

export default function MobileVisitors() {
  const {
    visitors,
    total,
    page,
    setPage,
    search,
    visitDate,
    searchInput,
    dateInput,
    setSearchInput,
    setDateInput,
    doSearch,
    loading,
    limit,
  } = useVisitors()

  const [modalVisitor, setModalVisitor] = useState<Parameters<typeof VisitorProductsModal>[0]['visitor']>(null)

  const totalPages = Math.ceil(total / limit)

  const filterSummary = [
    search && `搜索: ${search}`,
    visitDate && `日期: ${visitDate}`,
  ].filter(Boolean).join(' · ') || undefined

  return (
    <div>
      <MobilePageHeader
        title="访客列表"
        actions={
          <span className="text-xs text-gray-500">共 {total} 人</span>
        }
      />

      <MobileFilter summary={filterSummary}>
        <input
          type="text"
          placeholder="搜索昵称..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && doSearch()}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <input
          type="date"
          value={dateInput}
          onChange={(e) => setDateInput(e.target.value)}
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
      ) : visitors.length === 0 ? (
        <div className="text-center py-10 text-gray-500">暂无访客数据</div>
      ) : (
        <div className="space-y-2 mt-3">
          {visitors.map((v) => (
            <MobileCard key={v.id}>
              <div className="flex items-center gap-2.5">
                <img
                  src={v.icon_url || ''}
                  alt={v.nick_name}
                  className="w-10 h-10 rounded-full object-cover bg-gray-200 shrink-0"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect fill="%23e5e7eb" width="40" height="40"/><text x="50%" y="55%" text-anchor="middle" fill="%239ca3af" font-size="16">?</text></svg>'
                  }}
                />
                <span className="text-sm font-medium text-gray-800 truncate">
                  {v.nick_name || '未知'}
                </span>
                {v.city_name && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 shrink-0">
                    {v.city_name}
                  </span>
                )}
              </div>

              {v.description && (
                <p className="mt-1.5 text-xs text-gray-500 truncate">{v.description}</p>
              )}

              <div className="mt-1.5 flex items-center gap-3 text-xs text-gray-500">
                <span>访问 {v.visit_count} 次</span>
                <span className="text-gray-300">|</span>
                <span>首次 {v.first_seen_at?.slice(0, 10)}</span>
              </div>

              <MobileCardActions>
                <button
                  onClick={() => setModalVisitor(v)}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  查看商品
                </button>
              </MobileCardActions>
            </MobileCard>
          ))}
        </div>
      )}

      <MobilePagination
        page={page}
        totalPages={totalPages}
        total={total}
        onPageChange={setPage}
      />

      <VisitorProductsModal
        visitor={modalVisitor}
        onClose={() => setModalVisitor(null)}
      />
    </div>
  )
}
