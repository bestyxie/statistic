interface Props {
  page: number
  totalPages: number
  total: number
  onPageChange: (page: number) => void
}

export default function MobilePagination({ page, totalPages, total, onPageChange }: Props) {
  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-between px-1 py-3">
      <span className="text-xs text-gray-500">
        {total} 条 · {page}/{totalPages}
      </span>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          上一页
        </button>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          下一页
        </button>
      </div>
    </div>
  )
}
