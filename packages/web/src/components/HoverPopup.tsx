interface Props {
  children: React.ReactNode
  popup: React.ReactNode
  offset?: string
}

export default function HoverPopup({ children, popup, offset = 'left-14' }: Props) {
  return (
    <div className="relative group">
      {children}
      <div className={`hidden group-hover:block absolute z-50 top-0 ${offset} bg-white rounded-lg shadow-xl border border-gray-200`}>
        {popup}
      </div>
    </div>
  )
}
