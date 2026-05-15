import type { Supplier } from '@statistic/shared'

interface Props {
  suppliers: Supplier[]
  selectedId?: string | null
  loading: boolean
  onSelect: (supplier: Supplier) => void
  onEdit: (supplier: Supplier) => void
  onDelete: (id: string) => void
}

export default function SupplierList({ suppliers, selectedId, loading, onSelect, onEdit, onDelete }: Props) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <h3 className="px-5 py-3 bg-gray-50 border-b border-gray-200 font-medium text-gray-700 text-sm">供应商列表</h3>
      {loading ? (
        <p className="text-center py-8 text-gray-400 text-sm">加载中...</p>
      ) : suppliers.length === 0 ? (
        <p className="text-center py-8 text-gray-400 text-sm">暂无供应商</p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {suppliers.map((s) => (
            <li
              key={s.id}
              className={`px-5 py-3 cursor-pointer hover:bg-gray-50 ${selectedId === s.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''}`}
              onClick={() => onSelect(s)}
            >
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-800 text-sm truncate">{s.wechat_nickname}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{s.wechat_id || '未填微信号'}</p>
                </div>
                <div className="flex gap-2 ml-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => onEdit(s)} className="text-blue-600 hover:text-blue-800 text-xs">编辑</button>
                  <button onClick={() => onDelete(s.id)} className="text-red-500 hover:text-red-700 text-xs">删除</button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
