import { useEffect, useMemo, useState } from 'react'
import { api } from '../../../lib/api'
import type { LabelTrendItem, ProductLabel } from '@statistic/shared'

export type LabelMetric = 'visitor_count' | 'view_count'

export interface LabelChartSeries {
  label_id: string
  label_name: string
  color: string
}

export interface LabelChartRow {
  date: string
  [labelId: string]: string | number
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
  series: LabelChartSeries[]
  loading: boolean
  error: string | null
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
  const [items, setItems] = useState<LabelTrendItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

  // 选中标签 + 日期变化时拉趋势数据
  const labelKey = [...selectedIds].sort().join(',')
  useEffect(() => {
    if (selectedIds.size === 0 || !start || !end) {
      setItems([])
      setError(null)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    api.getLabelTrend([...selectedIds], start, end)
      .then((res) => {
        if (cancelled) return
        setItems(res.items || [])
      })
      .catch((err: unknown) => {
        if (cancelled) return
        const message = err instanceof Error ? err.message : '加载趋势失败'
        setError(message)
        setItems([])
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
    series,
    loading,
    error,
  }
}
