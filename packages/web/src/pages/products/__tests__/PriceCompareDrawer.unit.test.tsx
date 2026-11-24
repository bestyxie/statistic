import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Product, PriceCompareResult } from '@statistic/shared'

vi.mock('../../../lib/api', () => ({
  api: { priceCompare: vi.fn() },
}))

const { api } = await import('../../../lib/api')
const PriceCompareDrawer = (await import('../PriceCompareDrawer')).default

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

const product: Product = {
  id: 'p-1',
  shop_id: 'shop-1',
  name: '测试商品',
  image_url: 'http://img.example.com/cover.jpg',
  description: '腰带',
  sku: 'SKU-1',
  price: '160',
  created_at: '2026-01-01',
  updated_at: '2026-01-01',
}

// 顺序同接口原样返回（不排序）：贵在前、最低价在中间
const result: PriceCompareResult = {
  myPrice: 160,
  items: [
    { title: '贵同款', merchant: '档口乙', price: 300, imageUrl: 'http://img.example.com/2.jpg' },
    { title: '便宜同款', merchant: '档口甲', price: 80, imageUrl: 'http://img.example.com/1.jpg' },
    { title: '无价同款', merchant: '档口丙', price: null, imageUrl: 'http://img.example.com/3.jpg' },
  ],
}

describe('PriceCompareDrawer', () => {
  beforeEach(() => {
    vi.mocked(api.priceCompare).mockResolvedValue(result)
  })

  it('打开时请求比价接口并展示加载态', async () => {
    let resolve!: (v: PriceCompareResult) => void
    vi.mocked(api.priceCompare).mockReturnValue(new Promise<PriceCompareResult>((r) => { resolve = r }))
    render(<PriceCompareDrawer product={product} onClose={() => {}} />)
    expect(api.priceCompare).toHaveBeenCalledWith('p-1')
    expect(screen.getByText('比价中...')).toBeInTheDocument()
    resolve(result)
    await waitFor(() => expect(screen.getByText('档口甲')).toBeInTheDocument())
  })

  it('渲染结果列表：低价红色高亮、统计行、本店价格', async () => {
    render(<PriceCompareDrawer product={product} onClose={() => {}} />)
    await waitFor(() => expect(screen.getByText('档口甲')).toBeInTheDocument())

    // 统计行：3 家、最低 80、低于本店 1 家（null 价不计）——最低价在嵌套 span 里，断整段 textContent
    const stats = screen.getByText(/共 3 家/)
    expect(stats.textContent).toContain('最低')
    expect(stats.textContent).toContain('¥80')
    expect(stats.textContent).toContain('低于本店 1 家')

    // 本店价格
    expect(screen.getAllByText('¥160').length).toBeGreaterThan(0)

    // 低于本店价 → 红色（统计行最低价与列表项两处）；高于 → 灰色；null → 占位符
    for (const el of screen.getAllByText('¥80')) {
      expect(el.className).toContain('text-red-600')
    }
    const expensive = screen.getByText('¥300')
    expect(expensive.className).toContain('text-gray-500')
    expect(screen.getByText('—')).toBeInTheDocument()
  })

  it('请求失败显示错误与重试按钮，重试成功后渲染结果', async () => {
    vi.mocked(api.priceCompare)
      .mockRejectedValueOnce(new Error('比价服务暂不可用'))
      .mockResolvedValueOnce(result)
    render(<PriceCompareDrawer product={product} onClose={() => {}} />)

    await waitFor(() => expect(screen.getByText('比价服务暂不可用')).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: '重试' }))
    await waitFor(() => expect(screen.getByText('档口甲')).toBeInTheDocument())
    expect(api.priceCompare).toHaveBeenCalledTimes(2)
  })

  it('product 为空时不请求、不渲染面板内容', () => {
    render(<PriceCompareDrawer product={null} onClose={() => {}} />)
    expect(api.priceCompare).not.toHaveBeenCalled()
    expect(screen.queryByText('比价中...')).toBeNull()
  })
})
