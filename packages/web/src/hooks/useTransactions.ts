import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api } from '../lib/api'
import type { ProductLabel } from '@statistic/shared'

export function useTransactions() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [items, setItems] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [labels, setLabels] = useState<ProductLabel[]>([])
  const [refundModal, setRefundModal] = useState<any>(null)
  const [refundForm, setRefundForm] = useState({
    price: '',
    quantity: '1',
    date: new Date().toISOString().slice(0, 10),
    note: '退款',
  })

  const limit = 30

  const page = parseInt(searchParams.get('page') || '1')
  const setPage = (p: number) =>
    setSearchParams((prev) => {
      prev.set('page', String(p))
      return prev
    })

  const start = searchParams.get('start') || ''
  const end = searchParams.get('end') || ''
  const search = searchParams.get('search') || ''
  const labelId = searchParams.get('label') || ''

  const [searchInput, setSearchInput] = useState(search)
  const [startInput, setStartInput] = useState(start)
  const [endInput, setEndInput] = useState(end)

  const doSearch = () =>
    setSearchParams((prev) => {
      prev.delete('page')
      if (searchInput) prev.set('search', searchInput)
      else prev.delete('search')
      if (startInput) prev.set('start', startInput)
      else prev.delete('start')
      if (endInput) prev.set('end', endInput)
      else prev.delete('end')
      return prev
    })

  const loadTransactions = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.getTransactions({
        start: start || undefined,
        end: end || undefined,
        search: search || undefined,
        label_id: labelId || undefined,
        page,
        limit,
      })
      setItems(res.items || [])
      setTotal(res.total || 0)
    } catch (e: any) {
      console.error('加载失败:', e.message)
    } finally {
      setLoading(false)
    }
  }, [page, start, end, search, labelId])

  useEffect(() => {
    loadTransactions()
  }, [loadTransactions])

  useEffect(() => { api.getLabels().then(setLabels).catch(() => {}) }, [])

  const handleLabelChange = (v: string) =>
    setSearchParams((prev) => {
      prev.delete('page')
      if (v) prev.set('label', v)
      else prev.delete('label')
      return prev
    })

  useEffect(() => {
    setSearchInput(search)
    setStartInput(start)
    setEndInput(end)
  }, [search, start, end])

  const handleRefund = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!refundModal) return
    try {
      await api.createRefund({
        transaction_id: refundModal.id,
        price: refundForm.price,
        quantity: parseInt(refundForm.quantity) || 1,
        date: refundForm.date,
        note: refundForm.note,
      })
      setRefundModal(null)
      loadTransactions()
    } catch (err: any) {
      alert(err.message)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除此成交记录？关联的退款也会被删除。')) return
    try {
      await api.deleteTransaction(id)
      loadTransactions()
    } catch (err: any) {
      alert(err.message)
    }
  }

  const totalPages = Math.ceil(total / limit)
  const totalAmount = items.reduce(
    (s, t) => s + parseFloat(t.price || '0') * (t.quantity || 0),
    0
  )
  const totalQty = items.reduce((s, t) => s + (t.quantity || 0), 0)
  const totalRefundQty = items.reduce(
    (s, t) => s + (t.refund_quantity || 0),
    0
  )
  const totalRefundCount = items.reduce(
    (s, t) => s + (t.refund_count || 0),
    0
  )

  return {
    // Data
    items,
    total,
    loading,
    // Pagination
    page,
    setPage,
    totalPages,
    limit,
    // Filters
    start,
    end,
    search,
    labels,
    labelId,
    handleLabelChange,
    searchInput,
    setSearchInput,
    startInput,
    setStartInput,
    endInput,
    setEndInput,
    doSearch,
    setSearchParams,
    // Refund
    refundModal,
    setRefundModal,
    refundForm,
    setRefundForm,
    handleRefund,
    // Delete
    handleDelete,
    // Computed
    totalAmount,
    totalQty,
    totalRefundQty,
    totalRefundCount,
    // Reload
    loadTransactions,
  }
}
