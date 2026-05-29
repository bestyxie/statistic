import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
  className?: string
}

export default function MobileCard({ children, className = '' }: Props) {
  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-3 ${className}`}>
      {children}
    </div>
  )
}

interface RowProps {
  label: string
  children: ReactNode
  className?: string
}

export function MobileCardRow({ label, children, className = '' }: RowProps) {
  return (
    <div className={`flex justify-between items-start gap-2 ${className}`}>
      <span className="text-xs text-gray-500 shrink-0 pt-0.5">{label}</span>
      <div className="text-sm text-gray-800 text-right">{children}</div>
    </div>
  )
}

export function MobileCardActions({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100 mt-2">
      {children}
    </div>
  )
}
