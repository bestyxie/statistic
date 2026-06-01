import { createContext, useContext, useState, type ReactNode } from 'react'

const PreviewContext = createContext<{
  url: string | null
  show: (url: string) => void
  close: () => void
}>({ url: null, show: () => {}, close: () => {} })

export function useImagePreview() {
  return useContext(PreviewContext)
}

export function ImagePreviewProvider({ children }: { children: ReactNode }) {
  const [url, setUrl] = useState<string | null>(null)
  return (
    <PreviewContext.Provider value={{ url, show: setUrl, close: () => setUrl(null) }}>
      {children}
      {url && (
        <div className="fixed inset-0 z-[70] bg-black/80 flex items-center justify-center" onClick={() => setUrl(null)}>
          <img src={url} alt="" className="max-w-[90vw] max-h-[85vh] object-contain rounded" onClick={(e) => e.stopPropagation()} />
          <button onClick={() => setUrl(null)} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/20 text-white text-lg">&times;</button>
        </div>
      )}
    </PreviewContext.Provider>
  )
}
