export const LABEL_API = 'https://yxcapp.cn/personProduct/findLabelByCode.action'
export const LABEL_API_HEADERS: Record<string, string> = {
  'Accept': 'application/json, text/plain, */*',
  'Content-Type': 'application/json;charset=UTF-8',
  'Origin': 'https://pc.yxcapp.cn',
  'Referer': 'https://pc.yxcapp.cn/',
  'Cookie': 'SameSite=None; JSESSIONID=dbb7b807-a2f0-48f4-a92b-9b54736fdcc6; SameSite=None',
}

interface LabelResult {
  id: string
  uid: string | null
  label_name: string
  label_url: string | null
  sort: number
  productCount: number
}

/**
 * 为单个商品同步 label：调用外部 API 获取 label，写入 product_labels + product_label_relations。
 * 如果商品已有 label 关联则跳过（避免重复请求外部 API）。
 */
export async function syncProductLabel(db: D1Database, productId: string, sku: string): Promise<void> {
  if (!sku) return

  // 已有真实 label 关联（排除哨兵）则跳过
  const existing = await db
    .prepare("SELECT id FROM product_label_relations WHERE product_id = ? AND label_id != '__NONE__' LIMIT 1")
    .bind(productId)
    .first()
  if (existing) return

  // 有哨兵记录且未超过 7 天 → 跳过，不重复查询
  const sentinel = await db
    .prepare("SELECT created_at FROM product_label_relations WHERE product_id = ? AND label_id = '__NONE__' LIMIT 1")
    .bind(productId)
    .first<{ created_at: string }>()
  if (sentinel) {
    const age = Date.now() - new Date(sentinel.created_at + 'Z').getTime()
    if (age < 86400000) return
    // 超过 7 天，清除哨兵重新查询
    await db.prepare("DELETE FROM product_label_relations WHERE product_id = ? AND label_id = '__NONE__'")
      .bind(productId).run()
  }

  // 调用外部 API（5 秒超时）
  let labels: LabelResult[]
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 5000)
    const resp = await fetch(LABEL_API, {
      method: 'POST',
      headers: LABEL_API_HEADERS,
      body: JSON.stringify({ code: sku }),
      signal: controller.signal,
    })
    clearTimeout(timer)
    const json = await resp.json<{ data: LabelResult[]; success: boolean }>()
    console.log('[syncProductLabel] fetch ok', { sku, productId, respStatus: resp.status, success: json?.success, dataLen: json?.data?.length })
    if (!json?.success || !json.data?.length) {
      // 外部确认无 label，标记哨兵记录避免重复查询
      await db.prepare(
        "INSERT OR IGNORE INTO product_label_relations (id, product_id, label_id) VALUES (?, ?, '__NONE__')"
      ).bind(crypto.randomUUID(), productId).run()
      console.log('[syncProductLabel] sentinel inserted for', productId)
      return
    }
    labels = json.data
  } catch (err) {
    console.log('[syncProductLabel] fetch failed', { sku, productId, err: err instanceof Error ? err.message : String(err) })
    return
  }

  for (const label of labels) {
    if (!label.id) continue

    // Upsert label 定义
    await db.prepare(
      `INSERT INTO product_labels (label_id, label_name, sort, uid, product_count)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(label_id) DO UPDATE SET label_name = ?, sort = ?, product_count = ?, updated_at = datetime('now')`
    ).bind(
      label.id, label.label_name, label.sort || 0, label.uid || '', label.productCount || 0,
      label.label_name, label.sort || 0, label.productCount || 0,
    ).run()

    // 插入关联（忽略重复）
    await db.prepare(
      'INSERT OR IGNORE INTO product_label_relations (id, product_id, label_id) VALUES (?, ?, ?)'
    ).bind(crypto.randomUUID(), productId, label.id).run()
  }
}
