import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api } from '../lib/api'
import type { Shop } from '@statistic/shared'

export function useProductRanking() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [shops, setShops] = useState<Shop[]>([])
  const [selectedShop, setSelectedShop] = useState(searchParams.get('shop') || '')
  const [searchText, setSearchText] = useState(searchParams.get('search') || '')
  const [ranking, setRanking] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const pageSize = 20
  const page = parseInt(searchParams.get('page') || '1')
  const search = searchParams.get('search') || ''

  const setPage = useCallback((p: number) => {
    setSearchParams((prev) => { prev.set('page', String(p)); return prev })
  }, [setSearchParams])

  useEffect(() => { api.getShops().then(setShops) }, [])

  useEffect(() => {
    setLoading(true)
    api.getProductRanking(7, selectedShop || undefined, page, pageSize, search || undefined)
      .then((res) => {
        setRanking(res.items)
        setTotal(res.total)
      })
      .finally(() => setLoading(false))
  }, [selectedShop, page, search])

  const handleShopChange = (v: string) => {
    setSelectedShop(v)
    setSelectedIds(new Set())
    setSearchParams((prev) => {
      prev.delete('page')
      if (v) prev.set('shop', v); else prev.delete('shop')
      return prev
    })
  }

  const handleSearch = () => {
    setSelectedIds(new Set())
    setSearchParams((prev) => {
      prev.delete('page')
      if (searchText) prev.set('search', searchText); else prev.delete('search')
      return prev
    })
  }

  const clearSearch = () => {
    setSearchText('')
    setSearchParams((prev) => { prev.delete('search'); prev.delete('page'); return prev })
  }

  // Multi-select
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [refreshing, setRefreshing] = useState(false)

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
      api.getProductRanking(7, selectedShop || undefined, page, pageSize, search || undefined)
        .then((r) => { setRanking(r.items); setTotal(r.total) })
        .finally(() => setLoading(false))
    } catch (err: any) {
      alert(err.message || '刷新失败')
    } finally {
      setRefreshing(false)
    }
  }

  const rankBase = (page - 1) * pageSize
  const totalPages = Math.ceil(total / pageSize)

  return {
    shops, selectedShop, handleShopChange,
    searchText, setSearchText, handleSearch, clearSearch, search,
    ranking, total, page, setPage, totalPages, pageSize, rankBase,
    loading, selectedIds, toggleSelect, refreshing, handleRefresh,
  }
}
