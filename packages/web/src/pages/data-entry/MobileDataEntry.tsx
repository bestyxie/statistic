import { useDataEntry } from '../../hooks/useDataEntry'
import MobilePageHeader from '../../components/mobile/MobilePageHeader'
import MobileCard from '../../components/mobile/MobileCard'

export default function MobileDataEntry() {
  const {
    shops, selectedShop, setSelectedShop, date, setDate,
    encryptedText, setEncryptedText, loading, error, success,
    preview, totalVisitors, handleParse, handleImport, reset,
  } = useDataEntry()

  return (
    <div className="space-y-4">
      <MobilePageHeader title="数据录入" />

      <MobileCard>
        <p className="text-sm text-gray-700 font-medium mb-1">粘贴数据</p>
        <p className="text-xs text-gray-500 mb-3">选择店铺和日期，粘贴数据后解析导入</p>

        <div className="space-y-3">
          <select
            value={selectedShop}
            onChange={(e) => setSelectedShop(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="">选择店铺</option>
            {shops.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>

          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          />

          <textarea
            value={encryptedText}
            onChange={(e) => setEncryptedText(e.target.value)}
            rows={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm"
            placeholder="粘贴加密数据文本..."
          />

          <div className="flex gap-2">
            <button
              onClick={handleParse}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm disabled:opacity-50"
            >
              {loading ? '解析中...' : '解析数据'}
            </button>
            {encryptedText && (
              <button onClick={reset} className="px-4 py-2 border border-gray-300 rounded-md text-sm">
                清空
              </button>
            )}
          </div>
        </div>
      </MobileCard>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">{error}</div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-green-700 text-sm">{success}</div>
      )}

      {preview.length > 0 && (
        <MobileCard>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-gray-800">数据预览</p>
            <p className="text-xs text-gray-500">
              {preview.length} 商品 · {totalVisitors} 访客
            </p>
          </div>

          <div className="space-y-2">
            {preview.map((item) => (
              <div key={item.id} className="flex items-center gap-2 py-2 border-b border-gray-100 last:border-0">
                {item.picUrl ? (
                  <img src={item.picUrl} alt="" className="w-10 h-10 rounded object-cover bg-gray-100 shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center text-gray-300 text-xs shrink-0">无图</div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800 truncate">{item.description || item.code}</p>
                  <p className="text-xs text-gray-500">{item.code} · 访客 {item.productVisitorNum}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-2 mt-3">
            <button
              onClick={handleImport}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md text-sm disabled:opacity-50"
            >
              {loading ? '导入中...' : '确认导入'}
            </button>
            <button
              onClick={() => { reset() }}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm"
            >
              取消
            </button>
          </div>
        </MobileCard>
      )}
    </div>
  )
}
