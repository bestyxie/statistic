import { useState, useRef, useLayoutEffect, type ReactNode, type CSSProperties } from 'react'

type Side = 'right' | 'overlay' | 'bottom-right' | 'bottom-left'

interface Props {
  children: ReactNode
  popup: ReactNode
  side?: Side
  popupClassName?: string
  interactive?: boolean
}

const GAP = 8
const VIEWPORT_PAD = 8
const CLOSE_DELAY_MS = 120

export default function HoverPopup({ children, popup, side = 'right', popupClassName = '', interactive = false }: Props) {
  const [show, setShow] = useState(false)
  const [style, setStyle] = useState<CSSProperties>({ top: 0, left: -9999 })
  const wrapRef = useRef<HTMLSpanElement>(null)
  const popupRef = useRef<HTMLDivElement>(null)
  const closeTimer = useRef<number | null>(null)

  const cancelClose = () => {
    if (closeTimer.current !== null) {
      window.clearTimeout(closeTimer.current)
      closeTimer.current = null
    }
  }

  const compute = () => {
    const wrap = wrapRef.current
    if (!wrap) return
    const tr = wrap.getBoundingClientRect()
    const pw = popupRef.current?.offsetWidth || 0
    const ph = popupRef.current?.offsetHeight || 0
    const vw = window.innerWidth
    const vh = window.innerHeight

    let top: number
    let left: number

    switch (side) {
      case 'overlay':
        top = tr.top
        left = tr.left
        break
      case 'bottom-right':
        top = tr.bottom + GAP
        left = tr.right - pw
        break
      case 'bottom-left':
        top = tr.bottom + GAP
        left = tr.left
        break
      case 'right':
      default:
        top = tr.top
        left = tr.right + GAP
        break
    }

    if (side === 'right' && left + pw > vw - VIEWPORT_PAD) {
      left = tr.left - pw - GAP
    }
    if ((side === 'bottom-right' || side === 'bottom-left') && top + ph > vh - VIEWPORT_PAD) {
      top = tr.top - ph - GAP
    }

    top = Math.max(VIEWPORT_PAD, Math.min(top, vh - ph - VIEWPORT_PAD))
    left = Math.max(VIEWPORT_PAD, Math.min(left, vw - pw - VIEWPORT_PAD))

    setStyle({ top, left })
  }

  useLayoutEffect(() => {
    if (!show) return
    compute()
    const handler = () => compute()
    window.addEventListener('scroll', handler, true)
    window.addEventListener('resize', handler)
    return () => {
      window.removeEventListener('scroll', handler, true)
      window.removeEventListener('resize', handler)
    }
  }, [show])

  useLayoutEffect(() => () => cancelClose(), [])

  const handleEnter = () => {
    cancelClose()
    setShow(true)
  }

  const handleLeave = () => {
    if (interactive) {
      cancelClose()
      closeTimer.current = window.setTimeout(() => setShow(false), CLOSE_DELAY_MS)
    } else {
      setShow(false)
    }
  }

  return (
    <span
      ref={wrapRef}
      className="inline-block"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      onClick={(e) => { e.stopPropagation(); cancelClose(); setShow((s) => !s) }}
    >
      {children}
      {show && (
        <div
          ref={popupRef}
          className={`fixed z-[80] bg-white rounded-lg shadow-xl border border-gray-200 ${popupClassName}`}
          style={style}
          onMouseEnter={handleEnter}
          onMouseLeave={handleLeave}
        >
          {popup}
        </div>
      )}
    </span>
  )
}
