import { useState, useEffect, useCallback } from 'react'
import { api } from '../lib/api'
import type { DashboardData, Shop } from '@statistic/shared'

interface RefundSummary {
  todayRefundCount: number
  todayRefundAmount: number
  yesterdayRefundCount: number
  yesterdayRefundAmount: number
}

interface UseDashboardReturn {
  data: DashboardData | null
  shops: Shop[]
  selectedShop: string
  setSelectedShop: (shopId: string) => void
  refundData: RefundSummary | null
  loading: boolean
  changePercent: string
}

export function useDashboard(): UseDashboardReturn {
  const [data, setData] = useState<DashboardData | null>(null)
  const [shops, setShops] = useState<Shop[]>([])
  const [selectedShop, setSelectedShop] = useState('')
  const [refundData, setRefundData] = useState<RefundSummary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getShops().then(setShops)
  }, [])

  const loadDashboard = useCallback(() => {
    setLoading(true)
    Promise.all([
      api.getDashboard(selectedShop || undefined),
      api.getDashboardRefunds(selectedShop || undefined),
    ]).then(([d, r]) => {
      setData(d)
      setRefundData(r)
    }).finally(() => setLoading(false))
  }, [selectedShop])

  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

  const changePercent: string =
    data !== null && data.yesterday > 0
      ? (((data.today - data.yesterday) / data.yesterday) * 100).toFixed(1)
      : '-'

  return { data, shops, selectedShop, setSelectedShop, refundData, loading, changePercent }
}
