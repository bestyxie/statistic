import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import type { Shop } from '@statistic/shared'

interface UseStatsReturn {
  navigate: ReturnType<typeof useNavigate>
  shops: Shop[]
  selectedShop: string
  setSelectedShop: (shopId: string) => void
  drawerId: string | null
  setDrawerId: (id: string | null) => void
  start: string
  setStart: (start: string) => void
  end: string
  setEnd: (end: string) => void
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
  const [start, setStart] = useState(new Date(Date.now() - 29 * 86400000).toISOString().slice(0, 10))
  const [end, setEnd] = useState(new Date().toISOString().slice(0, 10))
  const [loading, setLoading] = useState(false)
  const [shopTrend, setShopTrend] = useState<Record<string, any>[]>([])
  const [productTrend, setProductTrend] = useState<Record<string, any>[]>([])
  const [topProducts, setTopProducts] = useState<Record<string, any>[]>([])
  const [txTrend, setTxTrend] = useState<Record<string, any>[]>([])
  const [txList, setTxList] = useState<Record<string, any>[]>([])
  const [txTotal, setTxTotal] = useState(0)

  useEffect(() => { api.getShops().then(setShops) }, [])

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

  return {
    navigate,
    shops,
    selectedShop,
    setSelectedShop,
    drawerId,
    setDrawerId,
    start,
    setStart,
    end,
    setEnd,
    loading,
    shopTrend,
    productChartData,
    topProducts,
    txTrend,
    txList,
    txTotal,
    handleQuery,
  }
}
