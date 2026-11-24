import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { LabelProductStat } from '@statistic/shared'

vi.mock('../../../../lib/api', () => ({
  api: { getLabelProducts: vi.fn() },
}))

// 桩掉两个子弹屉，只验证打开时机与传参
vi.mock('../../../../components/ProductDetailDrawer', () => ({
  default: ({ productId }: { productId: string | null }) =>
    productId ? <div data-testid="detail-drawer">{productId}</div> : null,
}))
vi.mock('../../../products/PriceCompareDrawer', () => ({
  default: ({ product }: { product: { id: string } | null }) =>
    product ? <div data-testid="compare-drawer">{product.id}</div> : null,
}))

const { api } = await import('../../../../lib/api')
const LabelProductDrawer = (await import('../LabelProductDrawer')).default

const items: LabelProductStat[] = [
  { id: 'p-1', name: '腰带', image_url: 'http://img.example.com/1.jpg', sku: 'SKU-1', price: '160', description: '牛皮腰带', shop_id: 'shop-1', view_count: 12, visitor_count: 5 },
  { id: 'p-2', name: '围巾', image_url: '', sku: 'SKU-2', price: '', description: '', shop_id: 'shop-1', view_count: 8, visitor_count: 3 },
]

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('LabelProductDrawer', () => {
  beforeEach(() => {
    vi.mocked(api.getLabelProducts).mockResolvedValue({ items })
  })

  it('点击商品行打开商品详情抽屉', async () => {
    render(<LabelProductDrawer target={{ label_id: 'l-1', label_name: '品牌甲', date: '2026-11-23' }} onClose={() => {}} />)
    await waitFor(() => expect(screen.getByText('腰带')).toBeInTheDocument())

    fireEvent.click(screen.getByText('腰带'))
    expect(screen.getByTestId('detail-drawer').textContent).toBe('p-1')
    expect(screen.queryByTestId('compare-drawer')).toBeNull()
  })

  it('行右侧有比价按钮，点击打开比价抽屉且不触发详情', async () => {
    render(<LabelProductDrawer target={{ label_id: 'l-1', label_name: '品牌甲', date: '2026-11-23' }} onClose={() => {}} />)
    await waitFor(() => expect(screen.getByText('围巾')).toBeInTheDocument())

    const compareButtons = screen.getAllByRole('button', { name: '比价' })
    expect(compareButtons).toHaveLength(2)

    fireEvent.click(compareButtons[1])
    expect(screen.getByTestId('compare-drawer').textContent).toBe('p-2')
    expect(screen.queryByTestId('detail-drawer')).toBeNull()
  })
})
