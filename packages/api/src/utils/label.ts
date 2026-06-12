const LABEL_API = 'https://yxcapp.cn/personProduct/findLabelByCode.action'
const LABEL_API_HEADERS: Record<string, string> = {
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

  // 已有关联则跳过
  const existing = await db
    .prepare('SELECT id FROM product_label_relations WHERE product_id = ? LIMIT 1')
    .bind(productId)
    .first()
  if (existing) return

  // 调用外部 API
  let labels: LabelResult[]
  try {
    const resp = await fetch(LABEL_API, {
      method: 'POST',
      headers: LABEL_API_HEADERS,
      body: JSON.stringify({ code: sku }),
    })
    const json = await resp.json<{ data: LabelResult[]; success: boolean }>()
    if (!json?.success || !json.data?.length) return
    labels = json.data
  } catch {
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
