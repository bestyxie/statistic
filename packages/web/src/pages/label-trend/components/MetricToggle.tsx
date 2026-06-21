interface Option<T extends string> {
  value: T
  label: string
}

interface Props<T extends string> {
  value: T
  options: readonly Option<T>[]
  onChange: (next: T) => void
  block?: boolean
}

export default function MetricToggle<T extends string>({ value, options, onChange, block = false }: Props<T>) {
  return (
    <div className={`flex border border-gray-300 rounded-md overflow-hidden ${block ? 'w-full' : ''}`}>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`${block ? 'flex-1' : ''} px-3 py-1 text-xs ${
            value === opt.value
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-600 hover:bg-gray-50'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
