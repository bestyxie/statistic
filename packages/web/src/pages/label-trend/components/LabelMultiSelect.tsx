import { useEffect, useRef, useState } from 'react'
import type { ProductLabel } from '@statistic/shared'

interface Props {
  labels: ProductLabel[]
  selectedIds: Set<string>
  onChange: (next: Set<string>) => void
  placeholder?: string
}

export default function LabelMultiSelect({
  labels,
  selectedIds,
  onChange,
  placeholder = '请选择品牌',
}: Props) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target
      if (target instanceof Node && containerRef.current && !containerRef.current.contains(target)) {
        setOpen(false)
      }
    }
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [open])

  const selectedLabels = labels.filter((l) => selectedIds.has(l.label_id))

  const toggle = (id: string) => {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    onChange(next)
  }

  const remove = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const next = new Set(selectedIds)
    next.delete(id)
    onChange(next)
  }

  const clearAll = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange(new Set())
  }

  return (
    <div ref={containerRef} className="relative">
      <div
        onClick={() => setOpen((v) => !v)}
        className="min-h-[38px] max-h-32 overflow-y-auto border border-gray-300 rounded-md px-2 py-1.5 flex flex-wrap gap-1 items-center cursor-pointer bg-white hover:border-gray-400"
      >
        {selectedLabels.length === 0 ? (
          <span className="text-gray-400 text-sm px-1">{placeholder}</span>
        ) : (
          selectedLabels.map((l) => (
            <span
              key={l.label_id}
              className="bg-blue-100 text-blue-700 rounded px-2 py-0.5 text-xs flex items-center gap-1 shrink-0"
            >
              {l.label_name}
              <button
                type="button"
                onClick={(e) => remove(l.label_id, e)}
                className="text-blue-400 hover:text-blue-900 leading-none"
                aria-label={`移除 ${l.label_name}`}
              >
                ×
              </button>
            </span>
          ))
        )}
        <div className="ml-auto flex items-center gap-1 shrink-0 pl-1">
          {selectedIds.size > 0 && (
            <button
              type="button"
              onClick={clearAll}
              className="text-gray-400 hover:text-gray-700 text-xs"
              aria-label="清空全部"
            >
              清空
            </button>
          )}
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {open && (
        <div className="absolute z-30 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
          {labels.length === 0 ? (
            <div className="p-3 text-sm text-gray-400">暂无标签，请先在数据录入中导入标签</div>
          ) : (
            labels.map((l) => {
              const active = selectedIds.has(l.label_id)
              return (
                <div
                  key={l.label_id}
                  onClick={() => toggle(l.label_id)}
                  className={`px-3 py-2 cursor-pointer flex items-center gap-2 text-sm ${
                    active ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                      active ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
                    }`}
                  >
                    {active && (
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </span>
                  <span className="flex-1 truncate">{l.label_name}</span>
                  {l.product_count > 0 && (
                    <span className="text-xs text-gray-400 shrink-0">({l.product_count})</span>
                  )}
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
