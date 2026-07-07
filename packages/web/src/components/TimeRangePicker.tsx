import { useState } from 'react'

export interface TimeRangePickerProps {
  /** 选中的时间范围 [开始时间戳, 结束时间戳]（毫秒）；null 表示已清空 */
  value: [number, number] | null
  /** 范围变化时回调；只有开始与结束都选中时才发出 [start, end]，清空时发出 null */
  onChange: (value: [number, number] | null) => void
  /** 是否包含时分选择：true=日期时间，false=仅日期。默认 true（时间选择可选） */
  showTime?: boolean
  /** 是否展示「清空」按钮。默认 true（清空可选） */
  clearable?: boolean
  startPlaceholder?: string
  endPlaceholder?: string
  className?: string
  disabled?: boolean
}

// 时间戳 → 输入框本地字符串；withTime=true 为 YYYY-MM-DDTHH:mm，否则 YYYY-MM-DD
function toLocalValue(ts: number, withTime: boolean): string {
  const d = new Date(ts)
  const p = (n: number) => String(n).padStart(2, '0')
  const date = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
  return withTime ? `${date}T${p(d.getHours())}:${p(d.getMinutes())}` : date
}

// 输入框字符串 → 时间戳（毫秒）；日期模式补 T00:00:00 按本地时间解析，避免时区偏移
function fromLocalValue(str: string, withTime: boolean): number {
  return new Date(withTime ? str : `${str}T00:00:00`).getTime()
}

export default function TimeRangePicker({
  value,
  onChange,
  showTime = true,
  clearable = true,
  startPlaceholder = '开始时间',
  endPlaceholder = '结束时间',
  className = '',
  disabled = false,
}: TimeRangePickerProps) {
  // 受控 value 的稳定 key（含 showTime 模式），用于外部变更时同步本地输入
  const valueKey = `${value ? `${value[0]}|${value[1]}` : 'null'}|${showTime ? 't' : 'd'}`
  const [trackedKey, setTrackedKey] = useState(valueKey)
  const [startStr, setStartStr] = useState(() => (value ? toLocalValue(value[0], showTime) : ''))
  const [endStr, setEndStr] = useState(() => (value ? toLocalValue(value[1], showTime) : ''))

  // 外部 value 或模式变化时重置本地输入（React 推荐的「渲染期调整 state」，避免 effect 级联渲染）
  if (valueKey !== trackedKey) {
    setTrackedKey(valueKey)
    setStartStr(value ? toLocalValue(value[0], showTime) : '')
    setEndStr(value ? toLocalValue(value[1], showTime) : '')
  }

  const hasValue = Boolean(startStr || endStr)

  // 只有开始 + 结束都选中才发出范围，并归一化为 start <= end
  const emit = (nextStart: string, nextEnd: string) => {
    if (nextStart && nextEnd) {
      const s = fromLocalValue(nextStart, showTime)
      const e = fromLocalValue(nextEnd, showTime)
      if (Number.isNaN(s) || Number.isNaN(e)) return
      onChange([Math.min(s, e), Math.max(s, e)])
    }
  }

  const handleStart = (v: string) => {
    setStartStr(v)
    emit(v, endStr)
  }

  const handleEnd = (v: string) => {
    setEndStr(v)
    emit(startStr, v)
  }

  const handleClear = () => {
    setStartStr('')
    setEndStr('')
    onChange(null)
  }

  const inputType = showTime ? 'datetime-local' : 'date'

  return (
    <div
      className={`group inline-flex items-center border border-gray-300 rounded-md bg-white focus-within:ring-2 focus-within:ring-blue-500 ${disabled ? 'opacity-50' : ''} ${className}`}
    >
      <input
        type={inputType}
        value={startStr}
        onChange={(e) => handleStart(e.target.value)}
        placeholder={startPlaceholder}
        disabled={disabled}
        aria-label={startPlaceholder}
        className="bg-transparent px-2.5 py-2 text-sm outline-none flex-auto min-w-0"
      />
      <span className="px-0.5 text-gray-400 text-sm select-none">～</span>
      <input
        type={inputType}
        value={endStr}
        onChange={(e) => handleEnd(e.target.value)}
        placeholder={endPlaceholder}
        disabled={disabled}
        aria-label={endPlaceholder}
        className="bg-transparent px-2.5 py-2 text-sm outline-none flex-auto min-w-0"
      />
      {clearable && (
        <button
          type="button"
          onClick={handleClear}
          disabled={disabled}
          aria-label="清除时间范围"
          className={`flex items-center justify-center w-7 h-7 mr-1 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-opacity ${
            hasValue && !disabled ? 'opacity-0 group-hover:opacity-100 group-focus-within:opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          ✕
        </button>
      )}
    </div>
  )
}
