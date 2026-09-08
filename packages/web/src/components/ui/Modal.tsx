import { useEffect, useRef, type ReactNode } from 'react'
import { useScrollLock } from '../../hooks/useScrollLock'

const SIZES = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
} as const

type Size = keyof typeof SIZES

interface ModalProps {
  /** 由业务组件控制，通常传业务触发值是否非空 */
  open: boolean
  onClose: () => void
  /** 'center'（默认）居中弹窗；'drawer' 右侧滑出全高面板 */
  variant?: 'center' | 'drawer'
  /** 宽度档位，仅 center 变体生效 */
  size?: Size
  /** 表单类弹窗设 true：点遮罩/Esc 不关闭，防误触丢数据 */
  disableClose?: boolean
  /** 面板额外样式逃生口（个别特殊尺寸/结构） */
  panelClassName?: string
  children: ReactNode
}

// Esc 只响应最内层弹窗。不能用「数组尾=栈顶」：effect 执行顺序是子先父后，
// 与 DOM 嵌套顺序相反。以真实 DOM 顺序为准——记录每个打开弹窗的根节点，
// keydown 时比较 compareDocumentPosition，DOM 最靠后的（最内层）才响应。
const openRoots: HTMLElement[] = []

/** self 是否是 openRoots 中 DOM 顺序最靠后的（最内层弹窗） */
function isTopmost(self: HTMLElement): boolean {
  return openRoots.every(
    (root) => root === self || self.compareDocumentPosition(root) & Node.DOCUMENT_POSITION_PRECEDING
  )
}

/**
 * 通用弹窗外壳：只负责遮罩/定位/关闭与滚动锁定。
 * 头部标题、关闭按钮、内部滚动结构由 children 自带。
 */
export default function Modal({
  open,
  onClose,
  variant = 'center',
  size = 'md',
  disableClose = false,
  panelClassName = '',
  children,
}: ModalProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  useScrollLock(open)

  useEffect(() => {
    if (!open) return
    const root = rootRef.current
    if (!root) return
    openRoots.push(root)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (!isTopmost(root)) return
      if (disableClose) return
      onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      const i = openRoots.indexOf(root)
      if (i !== -1) openRoots.splice(i, 1)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, disableClose, onClose])

  if (!open) return null

  const isDrawer = variant === 'drawer'
  const panelClass = isDrawer
    ? `absolute inset-y-0 right-0 w-full sm:w-[90vw] sm:max-w-[1200px] bg-white shadow-xl flex flex-col ${panelClassName}`
    : `bg-white rounded-lg border border-gray-200 w-full ${SIZES[size]} max-h-[85vh] ${panelClassName}`

  return (
    <div
      ref={rootRef}
      className={
        isDrawer
          ? 'fixed inset-0 z-50'
          : 'fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4'
      }
      onClick={disableClose ? undefined : onClose}
    >
      {isDrawer && (
        <div className="absolute inset-0 bg-black/50" onClick={disableClose ? undefined : onClose} />
      )}
      <div className={panelClass} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  )
}
