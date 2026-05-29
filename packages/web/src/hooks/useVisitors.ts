import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api } from '../lib/api'
import type { Visitor } from '@statistic/shared'

type VisitorRow = Visitor & { visit_count: number }

export function useVisitors() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [visitors, setVisitors] = useState<VisitorRow[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  const limit = 30

  const page = parseInt(searchParams.get('page') || '1')
  const setPage = (p: number) =>
    setSearchParams((prev) => {
      prev.set('page', String(p))
      return prev
    })

  const search = searchParams.get('search') || ''
  const visitDate = searchParams.get('date') || ''

  const [searchInput, setSearchInput] = useState(search)
  const [dateInput, setDateInput] = useState(visitDate)

  const doSearch = () =>
    setSearchParams((prev) => {
      prev.delete('page')
      if (searchInput) prev.set('search', searchInput)
      else prev.delete('search')
      if (dateInput) prev.set('date', dateInput)
      else prev.delete('date')
      return prev
    })

  const clearSearch = () =>
    setSearchParams((prev) => {
      prev.delete('search')
      prev.delete('page')
      return prev
    })

  const clearDate = () =>
    setSearchParams((prev) => {
      prev.delete('date')
      prev.delete('page')
      return prev
    })

  const loadVisitors = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.getVisitors(page, limit, search || undefined, visitDate || undefined)
      setVisitors(res.visitors as VisitorRow[])
      setTotal(res.total)
    } catch (e: any) {
      console.error('加载访客列表失败:', e.message)
    } finally {
      setLoading(false)
    }
  }, [page, search, visitDate])

  useEffect(() => {
    loadVisitors()
  }, [loadVisitors])

  useEffect(() => {
    setSearchInput(search)
    setDateInput(visitDate)
  }, [search, visitDate])

  return {
    visitors,
    total,
    page,
    setPage,
    search,
    visitDate,
    searchInput,
    dateInput,
    setSearchInput,
    setDateInput,
    doSearch,
    clearSearch,
    clearDate,
    loading,
    limit,
  }
}
