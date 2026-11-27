import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ProductRankingItem } from '../../../lib/api'

vi.mock('../../../hooks/useProductRanking', () => ({
  useProductRanking: vi.fn(),
}))
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}))

// 桩掉比价抽屉，验证打开时机与传参即可
vi.mock('../../products/PriceCompareDrawer', () => ({
  default: ({ product }: { product: { id: string } | null }) =>
    product ? <div data-testid="compare-drawer">{product.id}</div> : null,
}))

const { useProductRanking } = await import('../../../hooks/useProductRanking')
const DesktopRanking = (await import('../DesktopRanking')).default

const item: ProductRankingItem = {
  id: 'p-1',
  name: '腰带',
  image_url: 'http://img.example.com/1.jpg',
  sku: 'SKU-1',
  price: '160',
  description: '牛皮腰带',
  total_views: 12,
  total_viewers: 5,
  total_tx_count: 2,
}

function mockHook(overrides: Record<string, unknown> = {}) {
  vi.mocked(useProductRanking).mockReturnValue({
    shops: [],
    selectedShop: '',
    handleShopChange: vi.fn(),
    labels: [],
    labelId: '',
    handleLabelChange: vi.fn(),
    range: null,
    setRange: vi.fn(),
    searchText: '',
    setSearchText: vi.fn(),
    handleSearch: vi.fn(),
    clearSearch: vi.fn(),
    search: '',
    ranking: [item],
    total: 1,
    page: 1,
    setPage: vi.fn(),
    totalPages: 1,
    pageSize: 20,
    rankBase: 0,
    sortBy: '',
    sortOrder: 'desc',
    toggleSort: vi.fn(),
    getSortIcon: vi.fn((): ' ⇅' => ' ⇅'),
    loading: false,
    selectedIds: new Set<string>(),
    toggleSelect: vi.fn(),
    refreshing: false,
    handleRefresh: vi.fn(),
    clearSelection: vi.fn(),
    ...overrides,
  })
}

describe('DesktopRanking', () => {
  beforeEach(() => {
    mockHook()
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('操作列有比价按钮，点击打开比价抽屉并传入对应商品', () => {
    render(<DesktopRanking />)

    fireEvent.click(screen.getByRole('button', { name: '比价' }))
    expect(screen.getByTestId('compare-drawer').textContent).toBe('p-1')
  })
})
