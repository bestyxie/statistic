import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import type { Shop } from '@statistic/shared'

// 时间戳 → 后端日期参数 YYYY-MM-DD（按本地日期）
function tsToDateStr(ts: number): string {
  const d = new Date(ts)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

// 默认时间范围：最近 30 天（含今日）
function defaultRange(): [number, number] {
  const now = new Date()
  const s = new Date(now); s.setHours(0, 0, 0, 0); s.setDate(s.getDate() - 29)
  const e = new Date(now); e.setHours(23, 59, 59, 999)
  return [s.getTime(), e.getTime()]
}

interface UseStatsReturn {
  navigate: ReturnType<typeof useNavigate>
  shops: Shop[]
  selectedShop: string
  setSelectedShop: (shopId: string) => void
  drawerId: string | null
  setDrawerId: (id: string | null) => void
  range: [number, number] | null
  setRange: (v: [number, number] | null) => void
  start: string
  end: string
  loading: boolean
  shopTrend: Record<string, any>[]
  productChartData: Record<string, any>[]
  topProducts: Record<string, any>[]
  txTrend: Record<string, any>[]
  txList: Record<string, any>[]
  txTotal: number
  handleQuery: () => Promise<void>
}

export function useStats(): UseStatsReturn {
  const navigate = useNavigate()
  const [shops, setShops] = useState<Shop[]>([])
  const [selectedShop, setSelectedShop] = useState('')
  const [drawerId, setDrawerId] = useState<string | null>(null)
  const [range, setRange] = useState<[number, number] | null>(defaultRange)
  const [loading, setLoading] = useState(false)
  const [shopTrend, setShopTrend] = useState<Record<string, any>[]>([])
  const [productTrend, setProductTrend] = useState<Record<string, any>[]>([])
  const [topProducts, setTopProducts] = useState<Record<string, any>[]>([])
  const [txTrend, setTxTrend] = useState<Record<string, any>[]>([])
  const [txList, setTxList] = useState<Record<string, any>[]>([])
  const [txTotal, setTxTotal] = useState(0)

  useEffect(() => { api.getShops().then(setShops) }, [])

  // 从 range 派生后端所需的起止日期字符串
  const start = range ? tsToDateStr(range[0]) : ''
  const end = range ? tsToDateStr(range[1]) : ''

  const handleQuery = async () => {
    setLoading(true)
    try {
      const [trendRes, topRes, txTrendRes, txListRes] = await Promise.all([
        api.getTrend(start, end, selectedShop || undefined),
        api.getTopProducts(start, end, selectedShop || undefined),
        api.getTransactionTrend(start, end, selectedShop || undefined),
        api.getTransactions({ shop_id: selectedShop || undefined, start, end, page: 1, limit: 30 }),
      ])
      setShopTrend(trendRes.shopTrend || [])
      setProductTrend(trendRes.productTrend || [])
      setTopProducts(topRes || [])
      setTxTrend(txTrendRes || [])
      setTxList(txListRes.items || [])
      setTxTotal(txListRes.total || 0)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '查询失败'
      alert(message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { handleQuery() }, [])

  // Aggregate product trend by date for chart
  const productChartData = Object.values(
    productTrend.reduce((acc: Record<string, Record<string, any>>, item: Record<string, any>) => {
      if (!acc[item.date]) {
        acc[item.date] = { date: item.date, views: 0, visitors: 0 }
      }
      acc[item.date].views += item.view_count || 0
      return acc
    }, {})
  ).sort((a: Record<string, any>, b: Record<string, any>) => a.date.localeCompare(b.date))

  // Merge shop visitor count (deduplicated) into product chart data
  const shopVisitorMap = shopTrend.reduce((acc: Record<string, number>, s: Record<string, any>) => {
    acc[s.date] = s.visitor_count
    return acc
  }, {})
  productChartData.forEach((d: Record<string, any>) => {
    d.visitors = shopVisitorMap[d.date] || 0
  })

  // Pad txTrend with zero-count dates to show continuous trend
  const txTrendPadded = (() => {
    if (!start || !end) return txTrend
    const map = new Map(txTrend.map((d: Record<string, any>) => [d.date, d]))
    const result: Record<string, any>[] = []
    const cur = new Date(start)
    const last = new Date(end)
    while (cur <= last) {
      const ds = cur.toISOString().slice(0, 10)
      result.push(map.get(ds) || { date: ds, tx_count: 0, tx_amount: 0 })
      cur.setDate(cur.getDate() + 1)
    }
    return result
  })()

  return {
    navigate,
    shops,
    selectedShop,
    setSelectedShop,
    drawerId,
    setDrawerId,
    range,
    setRange,
    start,
    end,
    loading,
    shopTrend,
    productChartData,
    topProducts,
    txTrend: txTrendPadded,
    txList,
    txTotal,
    handleQuery,
  }
}
