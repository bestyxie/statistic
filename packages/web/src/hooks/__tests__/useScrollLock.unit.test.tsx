import { render, renderHook, act, cleanup } from '@testing-library/react'
import { useState } from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import { useScrollLock } from '../useScrollLock'

afterEach(() => {
  // 未开 vitest globals 时 RTL 不会自动 cleanup，必须显式卸载，
  // 否则组件跨用例泄漏、useScrollLock 的模块级计数无法归零
  cleanup()
  // 每个用例自行恢复 body 状态，不共享状态
  document.body.style.overflow = ''
})

describe('useScrollLock', () => {
  it('locks body overflow while active', () => {
    const { rerender } = renderHook((active: boolean) => useScrollLock(active), {
      initialProps: true,
    })
    expect(document.body.style.overflow).toBe('hidden')
    rerender(true)
    expect(document.body.style.overflow).toBe('hidden')
  })

  it('does not touch body overflow when inactive', () => {
    document.body.style.overflow = 'scroll'
    renderHook(() => useScrollLock(false))
    expect(document.body.style.overflow).toBe('scroll')
  })

  it('restores original overflow when deactivated', () => {
    document.body.style.overflow = 'scroll'
    const { rerender } = renderHook((active: boolean) => useScrollLock(active), {
      initialProps: true,
    })
    rerender(false)
    expect(document.body.style.overflow).toBe('scroll')
  })

  it('keeps body locked while a nested consumer is still active', () => {
    function Nested() {
      const [inner, setInner] = useState(true)
      useScrollLock(true)
      useScrollLock(inner)
      return (
        <button onClick={() => setInner(false)}>
          {inner ? 'inner-open' : 'inner-closed'}
        </button>
      )
    }
    const { getByText } = render(<Nested />)
    act(() => getByText('inner-open').click())
    // 外层仍持有锁：body 保持锁定
    expect(document.body.style.overflow).toBe('hidden')
  })

  it('restores original overflow when the outer consumer unmounts first', () => {
    document.body.style.overflow = 'scroll'
    function Outer() {
      const [showInner, setShowInner] = useState(true)
      return (
        <div>
          <button onClick={() => setShowInner(false)}>toggle-inner</button>
          {showInner && <Inner />}
        </div>
      )
    }
    function Inner() {
      useScrollLock(true)
      return <p>inner</p>
    }
    const { unmount } = render(<Outer />)
    // 外层先卸载（模拟先关父）：恢复原始值
    unmount()
    expect(document.body.style.overflow).toBe('scroll')
  })

  it('unlocks after all consumers deactivate', () => {
    document.body.style.overflow = 'scroll'
    const { rerender, unmount } = renderHook(
      (active: boolean) => useScrollLock(active),
      { initialProps: true }
    )
    rerender(false)
    expect(document.body.style.overflow).toBe('scroll')
    // 再开关一次，确认无残留计数
    rerender(true)
    expect(document.body.style.overflow).toBe('hidden')
    unmount()
    expect(document.body.style.overflow).toBe('scroll')
  })
})
