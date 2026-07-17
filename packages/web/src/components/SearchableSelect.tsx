import { useState, useRef, useEffect } from 'react'

export interface SearchableSelectOption {
  value: string
  label: string
  image?: string
}

interface Props {
  options: SearchableSelectOption[]
  value: string
  onChange: (value: string) => void
  /** 异步搜索：传入后不再客户端过滤，改为用户输入时回调，由调用方获取 options */
  onSearch?: (query: string) => void
  loading?: boolean
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  required?: boolean
  className?: string
}

// 可搜索的自定义下拉选择：选项可带图片（图片在左、文案在右）。
// - 默认客户端过滤静态 options
// - 传入 onSearch 后切换为异步模式：初始化无数据，用户输入时回调由调用方搜索
// 开关、搜索、点击外部/Esc 关闭均内聚在组件内，调用方只传 options/value/onChange。
export default function SearchableSelect({
  options,
  value,
  onChange,
  onSearch,
  loading = false,
  placeholder = '请选择',
  searchPlaceholder = '搜索...',
  emptyText = '无匹配项',
  required = false,
  className = '',
}: Props) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  // 记住已选项：异步模式下 options 随搜索变化，已选可能不在当前 options 里，
  // 用 picked 兜底展示，避免触发器在再次搜索时丢失文案。
  const [picked, setPicked] = useState<SearchableSelectOption | null>(() => options.find((o) => o.value === value) ?? null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const isAsync = !!onSearch
  const q = query.trim().toLowerCase()
  const filtered = isAsync ? options : q ? options.filter((o) => o.label.toLowerCase().includes(q)) : options
  const selected = options.find((o) => o.value === value) ?? picked

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      const target = e.target
      if (target instanceof Node && wrapRef.current && !wrapRef.current.contains(target)) {
        setOpen(false)
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    inputRef.current?.focus()
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const handleSearchChange = (v: string) => {
    setQuery(v)
    if (onSearch) onSearch(v)
  }

  const handleSelect = (o: SearchableSelectOption) => {
    setPicked(o)
    onChange(o.value)
    setQuery('')
    setOpen(false)
  }

  const emptyMessage = isAsync && !query.trim() ? '输入关键词搜索' : emptyText

  return (
    <div ref={wrapRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        title={selected?.label}
        className="w-full flex items-center gap-2 px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-left"
      >
        {selected ? (
          <>
            {selected.image && <img src={selected.image} alt="" className="w-6 h-6 rounded object-cover bg-gray-100 shrink-0" />}
            <span className="flex-1 truncate text-gray-800">{selected.label}</span>
          </>
        ) : (
          <span className="flex-1 text-gray-400">{placeholder}</span>
        )}
        <span className="text-gray-400 shrink-0">▾</span>
      </button>

      {open && (
        <div className="absolute z-50 top-full mt-1 left-0 w-full bg-white border border-gray-200 rounded shadow-lg flex flex-col max-h-60">
          <div className="p-2 border-b border-gray-100">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="overflow-y-auto">
            {loading ? (
              <p className="text-center py-3 text-gray-400 text-xs">搜索中...</p>
            ) : filtered.length === 0 ? (
              <p className="text-center py-3 text-gray-400 text-xs">{emptyMessage}</p>
            ) : (
              filtered.map((o) => (
                <button
                  type="button"
                  key={o.value}
                  onClick={() => handleSelect(o)}
                  title={o.label}
                  className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm text-left ${o.value === value ? 'bg-blue-50 text-blue-700' : 'text-gray-800 hover:bg-blue-50'}`}
                >
                  {o.image ? (
                    <img src={o.image} alt="" className="w-6 h-6 rounded object-cover bg-gray-100 shrink-0" />
                  ) : (
                    <span className="w-6 h-6 rounded bg-gray-100 shrink-0" />
                  )}
                  <span className="flex-1 truncate">{o.label}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* 配合表单原生 required 校验：value 为空时阻止提交 */}
      {required && <input type="hidden" required value={value} />}
    </div>
  )
}
