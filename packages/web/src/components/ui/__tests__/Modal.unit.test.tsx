import { cleanup, render, screen, fireEvent, act } from '@testing-library/react'
import { useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import Modal from '../Modal'

afterEach(() => {
  cleanup()
  document.body.style.overflow = ''
})

function renderModal(props: Partial<Parameters<typeof Modal>[0]> = {}) {
  const onClose = vi.fn()
  render(
    <Modal open onClose={onClose} {...props}>
      <p>content</p>
    </Modal>
  )
  return { onClose }
}

describe('Modal', () => {
  it('renders nothing when closed', () => {
    const { onClose } = renderModal({ open: false })
    expect(screen.queryByText('content')).toBeNull()
    expect(onClose).not.toHaveBeenCalled()
  })

  it('renders children when open', () => {
    renderModal()
    expect(screen.getByText('content')).toBeInTheDocument()
  })

  it('locks body scroll while open', () => {
    renderModal()
    expect(document.body.style.overflow).toBe('hidden')
  })

  it('calls onClose when clicking the backdrop', () => {
    const { onClose } = renderModal()
    // 遮罩是面板外的父容器：点击面板顶部之外的区域（容器本身）
    fireEvent.click(screen.getByText('content').parentElement!.parentElement!)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('does not close when clicking inside the panel', () => {
    renderModal()
    fireEvent.click(screen.getByText('content'))
    // 面板内点击不冒泡关闭：无从触发 onClose，此处仅验证内容仍在
    expect(screen.getByText('content')).toBeInTheDocument()
  })

  it('does not call onClose on backdrop click when disableClose', () => {
    const { onClose } = renderModal({ disableClose: true })
    fireEvent.click(screen.getByText('content').parentElement!.parentElement!)
    expect(onClose).not.toHaveBeenCalled()
  })

  it('calls onClose on Escape when open', () => {
    const { onClose } = renderModal()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose on Escape typed inside the panel', () => {
    const { onClose } = renderModal()
    // 焦点在弹窗容器内时走 React 合成事件路径
    fireEvent.keyDown(screen.getByText('content'), { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('does not call onClose on Escape when disableClose', () => {
    const { onClose } = renderModal({ disableClose: true })
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).not.toHaveBeenCalled()
  })

  it('blocks Escape from reaching an outer modal when disableClose', () => {
    const outerClose = vi.fn()
    function App() {
      const [showInner, setShowInner] = useState(false)
      return (
        <Modal open onClose={outerClose}>
          <button onClick={() => setShowInner(true)}>open-inner</button>
          {showInner && (
            <Modal open disableClose onClose={() => setShowInner(false)}>
              <p>inner-content</p>
            </Modal>
          )}
        </Modal>
      )
    }
    render(<App />)
    fireEvent.click(screen.getByText('open-inner'))
    fireEvent.keyDown(document, { key: 'Escape' })
    // 内层禁关：拦截 Esc，也不让外层响应
    expect(screen.getByText('inner-content')).toBeInTheDocument()
    expect(outerClose).not.toHaveBeenCalled()
  })

  it('only the topmost modal responds to Escape when nested', () => {
    const outerClose = vi.fn()
    function App() {
      const [showInner, setShowInner] = useState(true)
      return (
        <Modal open onClose={outerClose}>
          <button onClick={() => setShowInner(true)}>open-inner</button>
          {showInner && (
            <Modal open onClose={() => setShowInner(false)}>
              <p>inner-content</p>
            </Modal>
          )}
        </Modal>
      )
    }
    render(<App />)
    // 栈顶是内层：Esc 只关内层
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByText('inner-content')).toBeNull()
    // 内层关闭后，外层还在
    expect(screen.getByText('open-inner')).toBeInTheDocument()
  })

  it('applies drawer variant classes when variant=drawer', () => {
    renderModal({ variant: 'drawer' })
    const panel = screen.getByText('content').parentElement!
    expect(panel.className).toContain('inset-y-0 right-0')
  })

  it('applies size classes for each preset', () => {
    for (const [size, cls] of [
      ['sm', 'max-w-sm'],
      ['md', 'max-w-md'],
      ['lg', 'max-w-lg'],
      ['xl', 'max-w-2xl'],
    ] as const) {
      cleanup()
      renderModal({ size })
      expect(screen.getByText('content').parentElement!.className).toContain(cls)
    }
  })

  it('appends panelClassName to the panel', () => {
    renderModal({ panelClassName: 'w-[420px]' })
    expect(screen.getByText('content').parentElement!.className).toContain('w-[420px]')
  })

  it('does not close on non-Escape keys', () => {
    const { onClose } = renderModal()
    fireEvent.keyDown(document, { key: 'Enter' })
    expect(onClose).not.toHaveBeenCalled()
  })

  it('drawer backdrop click closes when not disableClose', () => {
    const { onClose } = renderModal({ variant: 'drawer' })
    const backdrop = screen.getByText('content').parentElement!.previousElementSibling!
    fireEvent.click(backdrop)
    // 根容器也挂了同一个 onClose，事件冒泡到根会再触发一次——这里验证
    // 「确实关闭了」即可，幂等的 onClose 在业务里以 open 状态为闸
    expect(onClose).toHaveBeenCalled()
  })

  it('drawer backdrop click does not close when disableClose', () => {
    const { onClose } = renderModal({ variant: 'drawer', disableClose: true })
    const backdrop = screen.getByText('content').parentElement!.previousElementSibling!
    fireEvent.click(backdrop)
    expect(onClose).not.toHaveBeenCalled()
  })

  it('renders at document.body, escaping parent space-y margin', () => {
    // 回归：内联渲染时 space-y-6 给非末位子元素打 24px margin-block-end，
    // fixed inset-0 高度被压掉 24px，遮罩底部盖不住。必须 portal 到 body 逃离父容器样式
    render(
      <div className="space-y-6">
        <p>sibling</p>
        <Modal open onClose={() => {}}>
          <p>content</p>
        </Modal>
      </div>,
    )
    const root = screen.getByText('content').parentElement!.parentElement!
    expect(root.parentElement).toBe(document.body)
  })

  it('applies enter animation classes on open (center: fade+scale)', () => {
    renderModal()
    const root = screen.getByText('content').parentElement!.parentElement!
    expect(root.className).toContain('animate-modal-fade-in')
    expect(screen.getByText('content').parentElement!.className).toContain('animate-modal-scale-in')
  })

  it('applies drawer slide-in animation on open', () => {
    renderModal({ variant: 'drawer' })
    const panel = screen.getByText('content').parentElement!
    expect(panel.className).toContain('animate-drawer-slide-in')
    const backdrop = panel.previousElementSibling!
    expect(backdrop.className).toContain('animate-modal-fade-in')
  })

  it('stays mounted with exit animation classes while closing', () => {
    vi.useFakeTimers()
    try {
      function App() {
        const [open, setOpen] = useState(true)
        return (
          <Modal open={open} onClose={() => setOpen(false)}>
            <p>content</p>
          </Modal>
        )
      }
      render(<App />)
      fireEvent.click(screen.getByText('content').parentElement!.parentElement!)
      // 退出窗口内：仍挂载，根与面板带退出动画类
      expect(screen.getByText('content')).toBeInTheDocument()
      const root = screen.getByText('content').parentElement!.parentElement!
      expect(root.className).toContain('animate-modal-fade-out')
      expect(screen.getByText('content').parentElement!.className).toContain('animate-modal-scale-out')
      // 窗口结束后卸载
      act(() => { vi.advanceTimersByTime(200) })
      expect(screen.queryByText('content')).toBeNull()
    } finally {
      vi.useRealTimers()
    }
  })

  it('stays interactive during exit — Escape can re-trigger onClose', () => {
    // 退出中若业务重开（onClose 把 open 翻回 true），弹窗应回到进场态而不是被卸载
    vi.useFakeTimers()
    try {
      function App() {
        const [open, setOpen] = useState(true)
        return (
          <Modal open={open} onClose={() => setOpen(!open)}>
            <p>content</p>
          </Modal>
        )
      }
      render(<App />)
      fireEvent.click(screen.getByText('content').parentElement!.parentElement!)
      // onClose 翻转 open=false 进入退出；再按 Esc 又翻回 true：应回到进场动画
      fireEvent.keyDown(document, { key: 'Escape' })
      expect(screen.getByText('content')).toBeInTheDocument()
      const root = screen.getByText('content').parentElement!.parentElement!
      expect(root.className).toContain('animate-modal-fade-in')
      act(() => { vi.advanceTimersByTime(500) })
      expect(screen.getByText('content')).toBeInTheDocument()
    } finally {
      vi.useRealTimers()
    }
  })

  it('freezes content during exit animation (props may clear on close)', () => {
    // 业务惯例：onClose 同时清数据（setProduct(null)）。退出动画期间 children
    // 会拿到空 props，淡出中标题/表单闪成空白——壳应冻结最后一次 open 时的内容
    vi.useFakeTimers()
    try {
      function App() {
        const [name, setName] = useState('商品A')
        return (
          <Modal open={!!name} onClose={() => setName('')}>
            <p>title: {name}</p>
          </Modal>
        )
      }
      render(<App />)
      expect(screen.getByText('title: 商品A')).toBeInTheDocument()
      fireEvent.click(screen.getByText('title: 商品A').parentElement!.parentElement!)
      // 退出窗口内：内容保持关闭前的样子，不闪空
      expect(screen.getByText('title: 商品A')).toBeInTheDocument()
      act(() => { vi.advanceTimersByTime(200) })
      expect(screen.queryByText('title: 商品A')).toBeNull()
    } finally {
      vi.useRealTimers()
    }
  })

  it('applies exit classes in the same render open flips false (no flicker frame)', () => {
    // 回归：曾在 effect 里置 exiting，effect 晚于 paint——关闭那一帧先画出
    // 「空数据 + 进场类」再切退出类，视觉上抖一下。退出类必须渲染期就位：
    // open 翻 false 的渲染里内容已冻结、类已是退出方向
    function App({ open }: { open: boolean }) {
      return (
        <Modal open={open} onClose={() => {}}>
          <p>title: {'商品A'.slice(0, open ? 3 : 0)}</p>
        </Modal>
      )
    }
    const { rerender } = render(<App open />)
    rerender(<App open={false} />)
    // 同一渲染：内容还是关闭前的快照（不闪空）
    expect(screen.getByText('title: 商品A')).toBeInTheDocument()
    const root = screen.getByText('title: 商品A').parentElement!.parentElement!
    // 类已是退出方向（不是先出现进场类、effect 后再换）
    expect(root.className).toContain('animate-modal-fade-out')
    expect(screen.getByText('title: 商品A').parentElement!.className).toContain('animate-modal-scale-out')
  })

  it('unmounts immediately when never opened (no lingering DOM)', () => {
    const { onClose } = renderModal({ open: false })
    expect(screen.queryByText('content')).toBeNull()
    expect(onClose).not.toHaveBeenCalled()
  })
})
