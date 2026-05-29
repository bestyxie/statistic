import { useState, useEffect, useCallback } from 'react'
import { api, decryptData } from '../lib/api'
import type { Shop, ExternalProduct, ExternalData } from '@statistic/shared'

export function useDataEntry() {
  const [shops, setShops] = useState<Shop[]>([])
  const [selectedShop, setSelectedShop] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [encryptedText, setEncryptedText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [preview, setPreview] = useState<ExternalProduct[]>([])
  const [totalVisitors, setTotalVisitors] = useState(0)
  const [parsedData, setParsedData] = useState<ExternalData | null>(null)

  useEffect(() => { api.getShops().then(setShops) }, [])

  const handleParse = async () => {
    setError('')
    setPreview([])
    setSuccess('')

    if (!selectedShop) { setError('请先选择店铺'); return }
    if (!date) { setError('请选择日期'); return }
    if (!encryptedText.trim()) { setError('请粘贴数据'); return }

    setLoading(true)
    try {
      const res = await decryptData(encryptedText)
      setPreview(res.vroList)
      setTotalVisitors(res.totalVisitors)
      setParsedData(res.raw)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleImport = async () => {
    if (!preview.length || !parsedData) return
    setLoading(true)
    setError('')
    try {
      const res = await api.importData(parsedData, selectedShop, date)
      setSuccess(`导入成功！共导入 ${res.imported_products} 个商品，总访客数 ${res.total_visitors}`)
      setPreview([])
      setParsedData(null)
      setEncryptedText('')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const reset = useCallback(() => {
    setEncryptedText('')
    setPreview([])
    setParsedData(null)
    setError('')
    setSuccess('')
  }, [])

  return {
    shops, selectedShop, setSelectedShop, date, setDate,
    encryptedText, setEncryptedText, loading, error, success,
    preview, totalVisitors, parsedData,
    handleParse, handleImport, reset,
  }
}
