import { useEffect, useState } from 'react'
import { api } from '../../../lib/api'
import { colorFor } from '../hooks/useLabelTrend'
import LabelProductDrawer, { type LabelProductDrawerTarget } from './LabelProductDrawer'
import type { ProductLabel } from '@statistic/shared'

interface Props {
  open: boolean
  labels: ProductLabel[]
  onClose: () => void
}

interface RankRow {
  label_id: string
  label_name: string
  visitor_count: number
  color: string
}

// 昨日本地日期（YYYY-MM-DD），用于后端 label-trend 查询
function yesterdayStr(): string {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - 1)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

export default function YesterdayVisitorRankDrawer({ open, labels, onClose }: Props) {
  const [rows, setRows] = useState<RankRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [productTarget, setProductTarget] = useState<LabelProductDrawerTarget | null>(null)

  const yesterday = yesterdayStr()

  // 打开时拉取全部品牌昨日的访客数（后端按 label × 日期补齐，单日即每个品牌的昨日总计）
  useEffect(() => {
    if (!open) return
    if (labels.length === 0) {
      setRows([])
      setError(null)
      return
    }
    let cancelled = false
    setLoading(true)
    setError(null)
    const ids = labels.map((l) => l.label_id)
    api
      .getLabelTrend(ids, yesterday, yesterday)
      .then((res) => {
        if (cancelled) return
        // 单日查询每个品牌只有一行，按 label_id 汇总做防御
        const visitorById = new Map<string, number>()
        for (const it of res.items || []) {
          visitorById.set(it.label_id, (visitorById.get(it.label_id) ?? 0) + it.visitor_count)
        }
        const colorById = new Map(labels.map((l, i) => [l.label_id, colorFor(i)]))
        const next: RankRow[] = labels.map((l) => ({
          label_id: l.label_id,
          label_name: l.label_name,
          visitor_count: visitorById.get(l.label_id) ?? 0,
          color: colorById.get(l.label_id) ?? '#9ca3af',
        }))
        next.sort((a, b) => b.visitor_count - a.visitor_count)
        setRows(next)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : '加载失败')
        setRows([])
      })
      .finally(() => {
        if (cancelled) return
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [open, labels, yesterday])

  // 打开时锁定背景滚动
  useEffect(() => {
    if (!open) return
    const original = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = original
    }
  }, [open])

  if (!open) return null

  const totalVisitors = rows.reduce((sum, r) => sum + r.visitor_count, 0)

  return (
    <div className="fixed inset-0 z-40">
      {/* 遮罩 */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* 抽屉（z-40，与 LabelProductDrawer 同级）*/}
      <div className="absolute inset-y-0 right-0 sm:w-[90vw] sm:max-w-[480px] w-full bg-gray-50 shadow-xl overflow-hidden flex flex-col">
        {/* 头部 */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 bg-white shrink-0">
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-bold text-gray-800 truncate">昨日访客排行</h1>
            <p className="text-xs text-gray-500">{yesterday} 各品牌访客数（降序）</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 shrink-0 ml-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* 内容 */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-4">
          {/* 汇总 */}
          <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4">
            <p className="text-xs sm:text-sm text-gray-500">昨日总访客数</p>
            <p className="text-xl sm:text-2xl font-bold text-gray-800 mt-1">{totalVisitors.toLocaleString()}</p>
          </div>

          {/* 排行表（按昨日访客数降序）*/}
          {loading ? (
            <p className="text-center text-gray-400 py-12">加载中...</p>
          ) : error ? (
            <p className="text-center text-red-500 py-12 text-sm">{error}</p>
          ) : rows.length === 0 ? (
            <p className="text-center text-gray-400 py-12 text-sm">暂无品牌</p>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-center py-2 px-3 text-gray-500 font-medium w-14">排名</th>
                    <th className="text-left py-2 px-3 text-gray-500 font-medium">品牌</th>
                    <th className="text-right py-2 px-3 text-gray-500 font-medium">昨日访客</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr
                      key={row.label_id}
                      onClick={() => setProductTarget({ label_id: row.label_id, label_name: row.label_name, date: yesterday })}
                      className="border-b border-gray-100 last:border-b-0 cursor-pointer hover:bg-blue-50"
                    >
                      <td className="py-2 px-3 text-center text-gray-500">{i + 1}</td>
                      <td className="py-2 px-3 text-gray-800">
                        <span className="inline-flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full inline-block shrink-0" style={{ backgroundColor: row.color }} />
                          <span className="truncate">{row.label_name}</span>
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right font-medium text-gray-800">
                        <span className="inline-flex items-center gap-1">
                          {row.visitor_count.toLocaleString()}
                          <span className="text-gray-300">›</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* 点击某品牌行 → 展示该品牌昨日的商品浏览记录（复用 LabelProductDrawer，z-40 同级、DOM 在后故叠在上层）*/}
      <LabelProductDrawer target={productTarget} onClose={() => setProductTarget(null)} />
    </div>
  )
}
