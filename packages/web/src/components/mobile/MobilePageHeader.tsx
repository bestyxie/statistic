import type { ReactNode } from 'react'

interface Props {
  title: string
  actions?: ReactNode
}

export default function MobilePageHeader({ title, actions }: Props) {
  return (
    <div className="flex items-center justify-between gap-3 mb-4">
      <h1 className="text-lg font-bold text-gray-800">{title}</h1>
      {actions && <div className="flex gap-2 shrink-0">{actions}</div>}
    </div>
  )
}
