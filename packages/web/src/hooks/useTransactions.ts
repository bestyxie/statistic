import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api } from '../lib/api'
import type { ProductLabel } from '@statistic/shared'
import type { Transaction } from '../lib/api'

// 时间戳 → 后端日期参数 YYYY-MM-DD（按本地日期）
function tsToDateStr(ts: number): string {
  const d = new Date(ts)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

// 当月范围（默认时间范围）：[本月 1 日 00:00, 今天 23:59:59]
function currentMonthRange(): [number, number] {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1).getTime()
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).getTime()
  return [start, end]
}

export function useTransactions() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [items, setItems] = useState<Transaction[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [labels, setLabels] = useState<ProductLabel[]>([])
  const [refundModal, setRefundModal] = useState<Transaction | null>(null)
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

  const search = searchParams.get('search') || ''
  const labelId = searchParams.get('label') || ''

  const [searchInput, setSearchInput] = useState(search)

  // 时间范围 [开始, 结束] 时间戳；默认当月（URL 带 start/end 时取 URL，便于分享/刷新保持）。
  // null = 全部时间（清除后生效）。用本地状态承载默认值，避免 URL 种子导致的重复请求与竞态。
  const [range, setRangeState] = useState<[number, number] | null>(() => {
    const s = searchParams.get('start')
    const e = searchParams.get('end')
    if (s && e) return [new Date(`${s}T00:00:00`).getTime(), new Date(`${e}T00:00:00`).getTime()]
    return currentMonthRange()
  })
  const setRange = (next: [number, number] | null) => {
    setRangeState(next)
    setSearchParams((prev) => {
      prev.delete('page')
      if (next) {
        prev.set('start', tsToDateStr(next[0]))
        prev.set('end', tsToDateStr(next[1]))
      } else {
        prev.delete('start')
        prev.delete('end')
      }
      return prev
    })
  }
  const start = range ? tsToDateStr(range[0]) : ''
  const end = range ? tsToDateStr(range[1]) : ''

  const doSearch = () =>
    setSearchParams((prev) => {
      prev.delete('page')
      if (searchInput) prev.set('search', searchInput)
      else prev.delete('search')
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
    } catch (e: unknown) {
      console.error('加载失败:', e instanceof Error ? e.message : e)
    } finally {
      setLoading(false)
    }
  }, [page, start, end, search, labelId])

  useEffect(() => {
    const load = async () => {
      await loadTransactions()
    }
    load()
  }, [loadTransactions])

  useEffect(() => { api.getLabels().then(setLabels).catch(() => {}) }, [])

  const handleLabelChange = (v: string) =>
    setSearchParams((prev) => {
      prev.delete('page')
      if (v) prev.set('label', v)
      else prev.delete('label')
      return prev
    })

  // URL 搜索变化时同步输入框（渲染期调整 state，避免 effect 级联渲染）
  const [lastUrlSearch, setLastUrlSearch] = useState(search)
  if (search !== lastUrlSearch) {
    setLastUrlSearch(search)
    setSearchInput(search)
  }

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
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : '操作失败')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除此成交记录？关联的退款也会被删除。')) return
    try {
      await api.deleteTransaction(id)
      loadTransactions()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : '操作失败')
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
    range,
    setRange,
    search,
    labels,
    labelId,
    handleLabelChange,
    searchInput,
    setSearchInput,
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
