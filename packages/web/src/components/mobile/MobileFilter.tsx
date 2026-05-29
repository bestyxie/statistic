import { useState, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  summary?: string
}

export default function MobileFilter({ children, summary }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2.5 text-sm"
      >
        <span className="text-gray-700 font-medium">
          {open ? '收起筛选' : summary || '筛选'}
        </span>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="px-3 pb-3 space-y-2">
          {children}
        </div>
      )}
    </div>
  )
}
