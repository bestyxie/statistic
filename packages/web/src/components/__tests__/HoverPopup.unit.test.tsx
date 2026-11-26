import { cleanup, fireEvent, render } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import HoverPopup from '../HoverPopup'

afterEach(cleanup)

/** 找到渲染出来的弹层节点（fixed z-[80] 的那个） */
function findPopup(): HTMLElement | null {
  return document.querySelector('div[class*="z-[80]"]')
}

describe('HoverPopup', () => {
  it('悬停显示弹层，且弹层 portal 到 body（不受宿主容器 transform 影响定位）', () => {
    // 模拟弹窗面板：动画结束后残留 transform（fill-mode both），
    // fixed 子元素会被它劫持为包含块，必须 portal 到 body 才能按视口定位
    const { container } = render(
      <div style={{ transform: 'scale(1)' }}>
        <HoverPopup popup={<div>大图</div>}>
          <img src="http://img.example.com/t.jpg" alt="" />
        </HoverPopup>
      </div>,
    )

    fireEvent.mouseEnter(container.querySelector('span')!)

    const popup = findPopup()
    expect(popup).not.toBeNull()
    expect(popup?.textContent).toBe('大图')
    // 关键断言：弹层挂在 document.body 下，而不是宿主 span 内
    expect(popup?.parentElement).toBe(document.body)
  })

  it('移开后弹层卸载', () => {
    const { container } = render(
      <HoverPopup popup={<div>大图</div>}>
        <span>缩略图</span>
      </HoverPopup>,
    )

    const span = container.querySelector('span')!
    fireEvent.mouseEnter(span)
    expect(document.querySelectorAll('div[class*="z-[80]"]').length).toBe(1)

    fireEvent.mouseLeave(span)
    expect(document.querySelectorAll('div[class*="z-[80]"]').length).toBe(0)
  })
})
