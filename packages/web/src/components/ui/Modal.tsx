import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useScrollLock } from '../../hooks/useScrollLock'

/** 退出动画时长（ms），与 index.css 里 fade-out/scale-out/slide-out 的 duration 一致 */
const EXIT_MS = 100

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
  // 动画状态机：closed → open（进场）→ exiting（退出窗口，动画放完才卸载）。
  // 退出期间重新打开则取消卸载，回到进场态
  const [mounted, setMounted] = useState(open)
  const [exiting, setExiting] = useState(false)
  // 退出动画期间冻结内容：业务惯例是 onClose 同时清数据（setProduct(null)），
  // children 会立刻拿到空 props，淡出中闪成空白。存下最后一次 open 的
  // children（ReactNode 是不可变描述，重渲染旧元素即以旧 props 渲染），
  // 退出窗口内渲染快照。150ms 内旧闭包的 handler 无实质影响
  const lastOpenChildren = useRef<ReactNode>(children)
  if (open && !exiting) lastOpenChildren.current = children
  const childrenToShow = exiting ? lastOpenChildren.current : children
  useScrollLock(open)

  useEffect(() => {
    if (open) {
      // 重开：取消挂起的卸载，回到进场态
      setExiting(false)
      setMounted(true)
      return
    }
    if (!mounted) return
    // 关闭：进入退出窗口，动画放完再卸载
    setExiting(true)
    const t = setTimeout(() => {
      setMounted(false)
      setExiting(false)
    }, EXIT_MS)
    return () => clearTimeout(t)
  }, [open, mounted])

  useEffect(() => {
    // 挂载条件用 mounted 而非 open：退出动画窗口内弹窗仍可见，Esc/顶层
    // 注册保持响应（业务在 onClose 里把 open 翻回 true 可取消关闭）
    if (!mounted) return
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
  }, [mounted, disableClose, onClose, depth])

  if (!mounted) return null

  const isDrawer = variant === 'drawer'
  const rootAnim = isDrawer
    ? ''
    : exiting ? 'animate-modal-fade-out' : 'animate-modal-fade-in'
  const panelAnim = isDrawer
    ? exiting ? 'animate-drawer-slide-out' : 'animate-drawer-slide-in'
    : exiting ? 'animate-modal-scale-out' : 'animate-modal-scale-in'
  const panelClass = isDrawer
    ? `absolute inset-y-0 right-0 w-full sm:w-[90vw] sm:max-w-[1200px] bg-white shadow-xl flex flex-col ${panelAnim} ${panelClassName}`
    : `bg-white rounded-lg border border-gray-200 w-full ${SIZES[size]} max-h-[85vh] ${panelAnim} ${panelClassName}`

  return createPortal(
    <div
      ref={rootRef}
      className={
        isDrawer
          ? 'fixed inset-0 z-50'
          : `fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4 ${rootAnim}`
      }
      onClick={disableClose ? undefined : onClose}
    >
      {isDrawer && (
        <div
          className={`absolute inset-0 bg-black/50 ${exiting ? 'animate-modal-fade-out' : 'animate-modal-fade-in'}`}
          onClick={disableClose ? undefined : onClose}
        />
      )}
      <div className={panelClass} onClick={(e) => e.stopPropagation()}>
        <ModalDepthContext.Provider value={depth + 1}>{childrenToShow}</ModalDepthContext.Provider>
      </div>
    </div>,
    document.body,
  )
}
