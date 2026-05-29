import { useState } from 'react'

interface Props {
  children: React.ReactNode
  popup: React.ReactNode
  offset?: string
}

export default function HoverPopup({ children, popup, offset = 'left-14' }: Props) {
  const [show, setShow] = useState(false)

  return (
    <div
      className="relative"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onClick={(e) => { e.stopPropagation(); setShow(!show) }}
    >
      {children}
      {show && (
        <div className={`absolute z-50 top-0 ${offset} bg-white rounded-lg shadow-xl border border-gray-200`}>
          {popup}
        </div>
      )}
    </div>
  )
}
