import { useState, useMemo } from 'react'
import type { Supplier } from '@statistic/shared'

interface Props {
  suppliers: Supplier[]
  selectedId?: string | null
  loading: boolean
  onSelect: (supplier: Supplier) => void
  onAdd: () => void
  onEdit: (supplier: Supplier) => void
  onDelete: (id: string) => void
}

const AVATAR_COLORS = [
  'bg-blue-500', 'bg-green-500', 'bg-orange-500', 'bg-purple-500',
  'bg-pink-500', 'bg-teal-500', 'bg-red-500', 'bg-indigo-500',
]

function getAvatarColor(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

export default function SupplierList({ suppliers, selectedId, loading, onSelect, onAdd, onEdit, onDelete }: Props) {
  const [search, setSearch] = useState('')
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    if (!search.trim()) return suppliers
    const q = search.toLowerCase()
    return suppliers.filter(
      (s) =>
        s.wechat_nickname.toLowerCase().includes(q) ||
        s.wechat_id.toLowerCase().includes(q) ||
        s.remark.toLowerCase().includes(q)
    )
  }, [suppliers, search])

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden flex flex-col">
      {/* 顶部：搜索 + 添加 */}
      <div className="p-3 border-b border-gray-200 flex gap-2">
        <div className="flex-1 relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索供应商"
            className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white"
          />
        </div>
        <button
          onClick={onAdd}
          className="w-9 h-9 flex items-center justify-center rounded-lg bg-gray-50 border border-gray-200 hover:bg-blue-50 hover:border-blue-300 transition-colors flex-shrink-0"
          title="添加供应商"
        >
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      {/* 列表 */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <p className="text-center py-8 text-gray-400 text-sm">加载中...</p>
        ) : filtered.length === 0 ? (
          <p className="text-center py-8 text-gray-400 text-sm">{search ? '未找到匹配的供应商' : '暂无供应商'}</p>
        ) : (
          <ul>
            {filtered.map((s) => (
              <li
                key={s.id}
                className={`px-4 py-3 cursor-pointer transition-colors flex items-center gap-3 group ${
                  selectedId === s.id ? 'bg-blue-50' : 'hover:bg-gray-50'
                }`}
                onClick={() => onSelect(s)}
                onMouseEnter={() => setHoveredId(s.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                {/* 头像 */}
                <div className={`w-10 h-10 rounded-lg ${getAvatarColor(s.wechat_nickname)} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                  {s.wechat_nickname.charAt(0).toUpperCase()}
                </div>

                {/* 名称 + 副文本 */}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-800 truncate">{s.wechat_nickname}</p>
                  <p className="text-xs text-gray-400 truncate mt-0.5">
                    {s.remark || s.wechat_id || '未填微信号'}
                  </p>
                </div>

                {/* 操作按钮：hover 时显示 */}
                {hoveredId === s.id && (
                  <div className="flex gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => onEdit(s)}
                      className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-200 text-gray-400 hover:text-blue-600 transition-colors"
                      title="编辑"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => onDelete(s.id)}
                      className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-200 text-gray-400 hover:text-red-500 transition-colors"
                      title="删除"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
