import { useState, useEffect } from 'react'
import { api, decryptData } from '../lib/api'
import type { Shop, ExternalProduct, ExternalData } from '@statistic/shared'

export default function DataEntry() {
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

    if (!selectedShop) {
      setError('请先选择店铺')
      return
    }
    if (!date) {
      setError('请选择日期')
      return
    }
    if (!encryptedText.trim()) {
      setError('请粘贴数据')
      return
    }

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

  const reset = () => {
    setEncryptedText('')
    setPreview([])
    setParsedData(null)
    setError('')
    setSuccess('')
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">数据录入</h1>

      <div className="bg-white rounded-lg border border-gray-200 p-5 space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-1">粘贴数据</h2>
          <p className="text-sm text-gray-500">将客户提供的数据文本粘贴到下方，选择店铺和日期后解析导入</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">选择店铺</label>
            <select
              value={selectedShop}
              onChange={(e) => setSelectedShop(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">请选择店铺</option>
              {shops.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">数据日期</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <textarea
          value={encryptedText}
          onChange={(e) => setEncryptedText(e.target.value)}
          rows={8}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
          placeholder="粘贴加密数据文本..."
        />

        <div className="flex gap-2">
          <button
            onClick={handleParse}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm disabled:opacity-50"
          >
            {loading ? '解析中...' : '解析数据'}
          </button>
          {encryptedText && (
            <button onClick={reset} className="px-4 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50">
              清空
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">{error}</div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-700 text-sm">{success}</div>
      )}

      {preview.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">数据预览</h2>
            <div className="text-sm text-gray-500">
              共 <span className="font-medium text-gray-800">{preview.length}</span> 个商品，
              总访客 <span className="font-medium text-gray-800">{totalVisitors}</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">图片</th>
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">货号</th>
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">描述</th>
                  <th className="text-right py-2 px-3 text-gray-500 font-medium">访客数</th>
                </tr>
              </thead>
              <tbody>
                {preview.map((item) => (
                  <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-2 px-3">
                      {item.picUrl ? (
                        <img src={item.picUrl} alt="" className="w-12 h-12 rounded object-cover bg-gray-100" />
                      ) : (
                        <div className="w-12 h-12 rounded bg-gray-100 flex items-center justify-center text-gray-300 text-xs">无图</div>
                      )}
                    </td>
                    <td className="py-2 px-3 font-mono text-gray-800">{item.code}</td>
                    <td className="py-2 px-3 text-gray-600 max-w-xs truncate">{item.description}</td>
                    <td className="py-2 px-3 text-right font-medium">{item.productVisitorNum}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex gap-2">
            <button
              onClick={handleImport}
              disabled={loading}
              className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm disabled:opacity-50"
            >
              {loading ? '导入中...' : '确认导入'}
            </button>
            <button
              onClick={() => setPreview([])}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50"
            >
              取消
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
