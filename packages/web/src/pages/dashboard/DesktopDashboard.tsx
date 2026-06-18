import { useDashboard } from '../../hooks/useDashboard'
import HoverPopup from '../../components/HoverPopup'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function DesktopDashboard() {
  const { data, shops, selectedShop, setSelectedShop, refundData, loading, changePercent } = useDashboard()

  if (loading || !data) {
    return <div className="text-center py-12 text-gray-500">加载中...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-gray-800">仪表盘</h1>
        <select value={selectedShop} onChange={(e) => setSelectedShop(e.target.value)} className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">全部店铺</option>
          {shops.map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-7 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-5"><p className="text-sm text-gray-500">今日访客</p><p className="text-3xl font-bold text-gray-800 mt-1">{data.today}</p></div>
        <div className="bg-white rounded-lg border border-gray-200 p-5"><p className="text-sm text-gray-500">昨日访客</p><p className="text-3xl font-bold text-gray-800 mt-1">{data.yesterday}</p></div>
        <div className="bg-white rounded-lg border border-gray-200 p-5"><p className="text-sm text-gray-500">日环比</p><p className={`text-3xl font-bold mt-1 ${Number(changePercent) >= 0 ? 'text-green-600' : 'text-red-600'}`}>{changePercent === '-' ? '-' : `${Number(changePercent) >= 0 ? '+' : ''}${changePercent}%`}</p></div>
        <div className="bg-white rounded-lg border border-gray-200 p-5"><p className="text-sm text-gray-500">今日成交</p><p className="text-3xl font-bold text-orange-600 mt-1">{(data as any).todayTxCount || 0}</p><p className="text-xs text-gray-400 mt-1">金额 ¥{((data as any).todayTxAmount || 0).toFixed(0)}</p></div>
        <div className="bg-white rounded-lg border border-gray-200 p-5"><p className="text-sm text-gray-500">昨日成交</p><p className="text-3xl font-bold text-orange-600 mt-1">{(data as any).yesterdayTxCount || 0}</p><p className="text-xs text-gray-400 mt-1">金额 ¥{((data as any).yesterdayTxAmount || 0).toFixed(0)}</p></div>
        <div className="bg-white rounded-lg border border-gray-200 p-5"><p className="text-sm text-gray-500">今日退款</p><p className="text-3xl font-bold text-red-500 mt-1">{refundData?.todayRefundCount || 0}</p><p className="text-xs text-gray-400 mt-1">金额 ¥{(refundData?.todayRefundAmount || 0).toFixed(0)}</p></div>
        <div className="bg-white rounded-lg border border-gray-200 p-5"><p className="text-sm text-gray-500">昨日退款</p><p className="text-3xl font-bold text-red-500 mt-1">{refundData?.yesterdayRefundCount || 0}</p><p className="text-xs text-gray-400 mt-1">金额 ¥{(refundData?.yesterdayRefundAmount || 0).toFixed(0)}</p></div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">近7天访客趋势</h2>
        {data.trend.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.trend}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" tick={{ fontSize: 12 }} /><YAxis tick={{ fontSize: 12 }} /><Tooltip /><Line type="monotone" dataKey="visitors" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} name="访客数" /></LineChart>
          </ResponsiveContainer>
        ) : (<p className="text-center text-gray-400 py-12">暂无数据</p>)}
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">热门商品 TOP 10</h2>
        {data.topProducts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200"><th className="text-left py-3 px-2 text-gray-500 font-medium">排名</th><th className="text-left py-3 px-2 text-gray-500 font-medium">商品</th><th className="text-right py-3 px-2 text-gray-500 font-medium">浏览次数</th><th className="text-right py-3 px-2 text-gray-500 font-medium">浏览人数</th></tr>
              </thead>
              <tbody>
                {data.topProducts.map((p, i) => (
                  <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-2 font-medium text-gray-400">{i + 1}</td>
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-3">
                        {p.image_url && (<HoverPopup popup={<div className="w-48 h-48"><img src={p.image_url} alt="" className="w-full h-full rounded object-cover" /></div>}><img src={p.image_url} alt="" className="w-10 h-10 rounded object-cover bg-gray-100" /></HoverPopup>)}
                        <HoverPopup side="overlay" popup={<div className="p-3 max-w-sm text-sm text-gray-700 whitespace-normal break-all select-text">{p.name}</div>}><span className="text-gray-800 truncate max-w-[200px] block">{p.name}</span></HoverPopup>
                      </div>
                    </td>
                    <td className="py-3 px-2 text-right font-medium">{p.total_views}</td>
                    <td className="py-3 px-2 text-right font-medium">{p.total_viewers}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (<p className="text-center text-gray-400 py-12">暂无数据</p>)}
      </div>
    </div>
  )
}
