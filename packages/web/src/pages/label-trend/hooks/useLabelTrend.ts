import { useEffect, useMemo, useState } from 'react'
import { api } from '../../../lib/api'
import type { LabelSalesItem, LabelTrendItem, LabelTxTrendItem, ProductLabel } from '@statistic/shared'

export type LabelMetric = 'visitor_count' | 'view_count'
export type LabelTxMetric = 'tx_count' | 'tx_amount'

export interface LabelChartSeries {
  label_id: string
  label_name: string
  color: string
}

export interface LabelChartRow {
  date: string
  [labelId: string]: string | number
}

export interface LabelSalesRow {
  label_id: string
  label_name: string
  tx_quantity: number
  color: string
}

interface UseLabelTrendReturn {
  labels: ProductLabel[]
  labelsLoading: boolean
  selectedIds: Set<string>
  setSelectedIds: (next: Set<string>) => void
  clearLabels: () => void
  start: string
  setStart: (v: string) => void
  end: string
  setEnd: (v: string) => void
  metric: LabelMetric
  setMetric: (m: LabelMetric) => void
  chartData: LabelChartRow[]
  txMetric: LabelTxMetric
  setTxMetric: (m: LabelTxMetric) => void
  txChartData: LabelChartRow[]
  series: LabelChartSeries[]
  loading: boolean
  error: string | null
  salesStart: string
  setSalesStart: (v: string) => void
  salesEnd: string
  setSalesEnd: (v: string) => void
  labelSalesRows: LabelSalesRow[]
  salesLoading: boolean
}

const DEFAULT_DAYS = 30
const DEFAULT_SELECT_COUNT = 5

function defaultRange(): { start: string; end: string } {
  const end = new Date()
  const start = new Date(Date.now() - (DEFAULT_DAYS - 1) * 86400000)
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  }
}

function colorFor(index: number): string {
  return `hsl(${index * 60}, 70%, 50%)`
}

export function useLabelTrend(): UseLabelTrendReturn {
  const [labels, setLabels] = useState<ProductLabel[]>([])
  const [labelsLoading, setLabelsLoading] = useState(true)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const init = defaultRange()
  const [start, setStart] = useState(init.start)
  const [end, setEnd] = useState(init.end)
  const [metric, setMetric] = useState<LabelMetric>('visitor_count')
  const [txMetric, setTxMetric] = useState<LabelTxMetric>('tx_count')
  const [items, setItems] = useState<LabelTrendItem[]>([])
  const [txItems, setTxItems] = useState<LabelTxTrendItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [salesStart, setSalesStart] = useState('')
  const [salesEnd, setSalesEnd] = useState('')
  const [labelSales, setLabelSales] = useState<LabelSalesItem[]>([])
  const [salesLoading, setSalesLoading] = useState(false)

  // 拉标签列表，默认勾选前 N 个（按 sort 升序，对齐 /labels 接口排序）
  useEffect(() => {
    let cancelled = false
    setLabelsLoading(true)
    api.getLabels()
      .then((list) => {
        if (cancelled) return
        setLabels(list)
        setSelectedIds(new Set(list.slice(0, DEFAULT_SELECT_COUNT).map((l) => l.label_id)))
      })
      .catch((err: unknown) => {
        if (cancelled) return
        const message = err instanceof Error ? err.message : '加载标签失败'
        setError(message)
      })
      .finally(() => {
        if (cancelled) return
        setLabelsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  // 选中标签 + 日期变化时同时拉访客趋势和成交趋势
  const labelKey = [...selectedIds].sort().join(',')
  useEffect(() => {
    if (selectedIds.size === 0 || !start || !end) {
      setItems([])
      setTxItems([])
      setError(null)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    const ids = [...selectedIds]
    Promise.all([
      api.getLabelTrend(ids, start, end),
      api.getLabelTxTrend(ids, start, end),
    ])
      .then(([visitorRes, txRes]) => {
        if (cancelled) return
        setItems(visitorRes.items || [])
        setTxItems(txRes.items || [])
      })
      .catch((err: unknown) => {
        if (cancelled) return
        const message = err instanceof Error ? err.message : '加载趋势失败'
        setError(message)
        setItems([])
        setTxItems([])
      })
      .finally(() => {
        if (cancelled) return
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
    // selectedIds 通过 labelKey 参与依赖（避免数组引用变更触发死循环）
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [labelKey, start, end])

  // 销量排行：独立时间范围（留空 = 全部时间），不受上方趋势的品牌选择与日期影响
  useEffect(() => {
    let cancelled = false
    setSalesLoading(true)
    api.getLabelSales(salesStart || undefined, salesEnd || undefined)
      .then((res) => {
        if (cancelled) return
        setLabelSales(res.items || [])
      })
      .catch(() => {
        if (cancelled) return
        setLabelSales([])
      })
      .finally(() => {
        if (cancelled) return
        setSalesLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [salesStart, salesEnd])

  const clearLabels = () => setSelectedIds(new Set())

  // 折线图 series：按 labels 数组顺序（sort 升序）展示，颜色稳定
  const series = useMemo<LabelChartSeries[]>(() => {
    return labels
      .filter((l) => selectedIds.has(l.label_id))
      .map((l, i) => ({
        label_id: l.label_id,
        label_name: l.label_name,
        color: colorFor(i),
      }))
  }, [labels, selectedIds])

  // pivot：把 items 整理成 recharts 需要的 {date, [label_id]: value} 行
  const chartData = useMemo<LabelChartRow[]>(() => {
    const byDate = new Map<string, LabelChartRow>()
    for (const item of items) {
      if (!byDate.has(item.date)) {
        byDate.set(item.date, { date: item.date })
      }
      const row = byDate.get(item.date)!
      row[item.label_id] = metric === 'visitor_count' ? item.visitor_count : item.view_count
    }
    return [...byDate.values()].sort((a, b) => (a.date as string).localeCompare(b.date as string))
  }, [items, metric])

  const txChartData = useMemo<LabelChartRow[]>(() => {
    const byDate = new Map<string, LabelChartRow>()
    for (const item of txItems) {
      if (!byDate.has(item.date)) {
        byDate.set(item.date, { date: item.date })
      }
      const row = byDate.get(item.date)!
      row[item.label_id] = txMetric === 'tx_count' ? item.tx_count : item.tx_amount
    }
    return [...byDate.values()].sort((a, b) => (a.date as string).localeCompare(b.date as string))
  }, [txItems, txMetric])

  // 销量排行展示行：用全量 labels 的下标着色，与趋势图颜色一致
  const labelSalesRows = useMemo<LabelSalesRow[]>(() => {
    const colorById = new Map(labels.map((l, i) => [l.label_id, colorFor(i)]))
    return labelSales.map((s) => ({ ...s, color: colorById.get(s.label_id) ?? '#9ca3af' }))
  }, [labelSales, labels])

  return {
    labels,
    labelsLoading,
    selectedIds,
    setSelectedIds,
    clearLabels,
    start,
    setStart,
    end,
    setEnd,
    metric,
    setMetric,
    chartData,
    txMetric,
    setTxMetric,
    txChartData,
    series,
    loading,
    error,
    salesStart,
    setSalesStart,
    salesEnd,
    setSalesEnd,
    labelSalesRows,
    salesLoading,
  }
}
