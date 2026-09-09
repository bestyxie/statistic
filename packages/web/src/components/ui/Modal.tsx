import { createContext, useContext, useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
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

// Esc 只响应最内层弹窗。不能用 DOM 顺序：portal 到 body 后插入顺序取决于
// commit 顺序，嵌套弹窗同一次 commit 挂载时是子先父后（内层先插入 body），
// DOM 顺序与嵌套关系相反。改用 React 树深度（context 传递）判定：
// 嵌套更深者更内层；同层则更晚注册（更近打开）者为顶层。
const ModalDepthContext = createContext(0)

interface OpenModal {
  root: HTMLElement
  depth: number
}
const openModals: OpenModal[] = []

/** self 是否是当前打开弹窗中的最顶层（最内层） */
function isTopmost(self: HTMLElement): boolean {
  const me = openModals.find((m) => m.root === self)
  if (!me) return false
  const meIdx = openModals.indexOf(me)
  return openModals.every(
    (m, i) => m === me || m.depth < me.depth || (m.depth === me.depth && i < meIdx),
  )
}

/**
 * 通用弹窗外壳：只负责遮罩/定位/关闭与滚动锁定。
 * 头部标题、关闭按钮、内部滚动结构由 children 自带。
 *
 * 必须用 createPortal 挂到 document.body：页面根容器普遍是 space-y-*，
 * Tailwind v4 会给非末位子元素打 margin-block-end，fixed inset-0 的遮罩
 * 高度会被 margin 压短（底部盖不住）。portal 让弹窗逃离宿主页面的布局样式。
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
  const depth = useContext(ModalDepthContext)
  useScrollLock(open)

  useEffect(() => {
    if (!open) return
    const root = rootRef.current
    if (!root) return
    openModals.push({ root, depth })
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (!isTopmost(root)) return
      if (disableClose) return
      onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      const i = openModals.findIndex((m) => m.root === root)
      if (i !== -1) openModals.splice(i, 1)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, disableClose, onClose, depth])

  if (!open) return null

  const isDrawer = variant === 'drawer'
  const panelClass = isDrawer
    ? `absolute inset-y-0 right-0 w-full sm:w-[90vw] sm:max-w-[1200px] bg-white shadow-xl flex flex-col ${panelClassName}`
    : `bg-white rounded-lg border border-gray-200 w-full ${SIZES[size]} max-h-[85vh] ${panelClassName}`

  return createPortal(
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
        <ModalDepthContext.Provider value={depth + 1}>{children}</ModalDepthContext.Provider>
      </div>
    </div>,
    document.body,
  )
}
