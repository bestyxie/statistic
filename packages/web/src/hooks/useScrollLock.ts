import { useEffect } from 'react'

// 弹窗滚动锁：模块级引用计数，支持弹窗嵌套（Drawer 里开 Modal、先关父再关子等
// 乱序场景），归零才恢复 body 原始 overflow，避免任一弹窗关闭就提前解锁。
let refCount = 0
let originalOverflow = ''

function acquire() {
  if (refCount === 0) originalOverflow = document.body.style.overflow
  refCount += 1
  document.body.style.overflow = 'hidden'
}

function release() {
  refCount = Math.max(0, refCount - 1)
  if (refCount === 0) document.body.style.overflow = originalOverflow
}

/** active 为 true 期间禁用页面（body）滚动 */
export function useScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return
    acquire()
    return release
  }, [active])
}
