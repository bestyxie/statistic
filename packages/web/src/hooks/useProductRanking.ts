import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api } from '../lib/api'
import type { ProductRankingItem } from '../lib/api'
import type { Shop, ProductLabel } from '@statistic/shared'

const DEFAULT_SORT_BY = 'viewers'
const DEFAULT_SORT_ORDER = 'desc'

// 默认最近 7 天，且以昨天为终点：[今天-7, 今天-1]，对齐按昨日导入的数据节奏
function defaultRange(): { start: string; end: string } {
  const end = new Date(Date.now() - 86400000)
  const start = new Date(Date.now() - 7 * 86400000)
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  }
}

export function useProductRanking() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [shops, setShops] = useState<Shop[]>([])
  const [labels, setLabels] = useState<ProductLabel[]>([])
  const [searchText, setSearchText] = useState(searchParams.get('search') || '')
  const [ranking, setRanking] = useState<ProductRankingItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const pageSize = 20
  const page = parseInt(searchParams.get('page') || '1')
  const search = searchParams.get('search') || ''
  const selectedShop = searchParams.get('shop') || ''
  const labelId = searchParams.get('label') || ''
  const sortBy = searchParams.get('sort_by') || DEFAULT_SORT_BY
  const sortOrder = searchParams.get('sort_order') || DEFAULT_SORT_ORDER

  // 日期范围：本地 state（默认最近 7 天），清空后传 undefined = 全部时间
  const initRange = defaultRange()
  const [start, setStart] = useState(initRange.start)
  const [end, setEnd] = useState(initRange.end)

  // Multi-select（批量刷新）
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [refreshing, setRefreshing] = useState(false)

  const setPage = (p: number) => {
    setSearchParams((prev) => { prev.set('page', String(p)); return prev })
  }

  const clearDateRange = () => {
    setStart('')
    setEnd('')
  }

  useEffect(() => { api.getShops().then(setShops) }, [])
  useEffect(() => { api.getLabels().then(setLabels).catch(() => {}) }, [])

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      try {
        const res = await api.getProductRanking(
          start || undefined, end || undefined,
          selectedShop || undefined, labelId || undefined,
          page, pageSize, search || undefined,
          sortBy, sortOrder,
        )
        if (cancelled) return
        setRanking(res.items)
        setTotal(res.total)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [start, end, selectedShop, labelId, search, page, sortBy, sortOrder])

  const resetSelectionAndPage = (prev: URLSearchParams) => {
    setSelectedIds(new Set())
    prev.delete('page')
    return prev
  }

  const handleShopChange = (v: string) => {
    setSearchParams((prev) => {
      resetSelectionAndPage(prev)
      if (v) prev.set('shop', v); else prev.delete('shop')
      return prev
    })
  }

  const handleLabelChange = (v: string) => {
    setSearchParams((prev) => {
      resetSelectionAndPage(prev)
      if (v) prev.set('label', v); else prev.delete('label')
      return prev
    })
  }

  const handleSearch = () => {
    setSearchParams((prev) => {
      resetSelectionAndPage(prev)
      if (searchText) prev.set('search', searchText); else prev.delete('search')
      return prev
    })
  }

  const clearSearch = () => {
    setSearchText('')
    setSearchParams((prev) => { resetSelectionAndPage(prev); prev.delete('search'); return prev })
  }

  // 排序：点击非当前列 → 切到该列 desc；点击当前列 → 翻转升降序；与默认一致时清理 URL
  const toggleSort = (field: string) => {
    const newSortBy = field
    let newSortOrder = 'desc'
    if (sortBy === field) {
      newSortOrder = sortOrder === 'desc' ? 'asc' : 'desc'
    }
    setSearchParams((prev) => {
      prev.delete('page')
      if (newSortBy === DEFAULT_SORT_BY && newSortOrder === DEFAULT_SORT_ORDER) {
        prev.delete('sort_by')
        prev.delete('sort_order')
      } else {
        prev.set('sort_by', newSortBy)
        prev.set('sort_order', newSortOrder)
      }
      return prev
    })
  }

  const getSortIcon = (field: string) => {
    if (sortBy !== field) return ' ⇅'
    return sortOrder === 'asc' ? ' ↑' : ' ↓'
  }

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const handleRefresh = async () => {
    if (selectedIds.size === 0) return
    setRefreshing(true)
    try {
      const res = await api.refreshProducts([...selectedIds])
      alert(`刷新成功，共刷新 ${res.count} 个商品`)
      setSelectedIds(new Set())
      setLoading(true)
      api.getProductRanking(
        start || undefined, end || undefined,
        selectedShop || undefined, labelId || undefined,
        page, pageSize, search || undefined,
        sortBy, sortOrder,
      )
        .then((r) => { setRanking(r.items); setTotal(r.total) })
        .finally(() => setLoading(false))
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '刷新失败'
      alert(message)
    } finally {
      setRefreshing(false)
    }
  }

  const rankBase = (page - 1) * pageSize
  const totalPages = Math.ceil(total / pageSize)

  return {
    shops, selectedShop, handleShopChange,
    labels, labelId, handleLabelChange,
    start, setStart, end, setEnd, clearDateRange,
    searchText, setSearchText, handleSearch, clearSearch, search,
    ranking, total, page, setPage, totalPages, pageSize, rankBase,
    sortBy, sortOrder, toggleSort, getSortIcon,
    loading, selectedIds, toggleSelect, refreshing, handleRefresh,
  }
}
