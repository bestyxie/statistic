import { Hono } from 'hono'
import { syncProductLabel } from '../utils/label'

type Env = { DB: D1Database }

const LABELS_API = 'https://yxcapp.cn/productType/getUserlabelsWithProduct.action'
const LABELS_API_HEADERS: Record<string, string> = {
  'Accept': 'application/json, text/plain, */*',
  'Content-Type': 'application/json;charset=UTF-8',
  'Origin': 'https://pc.yxcapp.cn',
  'Referer': 'https://pc.yxcapp.cn/',
  'Cookie': 'SameSite=None; JSESSIONID=dbb7b807-a2f0-48f4-a92b-9b54736fdcc6; SameSite=None',
}

const labels = new Hono<{ Bindings: Env }>()

// 获取所有 label
labels.get('/', async (c) => {
  const db = c.env.DB
  const result = await db.prepare('SELECT * FROM product_labels ORDER BY sort ASC').all()
  return c.json(result.results)
})

// 从外部 API 导入所有 label 定义
labels.post('/import', async (c) => {
  const db = c.env.DB
  const uid = '79fdffdf554a48559b505e136a79d090'

  const resp = await fetch(LABELS_API, {
    method: 'POST',
    headers: LABELS_API_HEADERS,
    body: JSON.stringify({ uid }),
  })

  const json = await resp.json<{ data: { label_id: string; label_name: string; sort: number; uid: string; productCount: number }[]; success: boolean }>()
  if (!json?.success || !json.data?.length) {
    return c.json({ error: '导入失败：外部 API 无数据' }, 502)
  }

  let imported = 0
  for (const item of json.data) {
    if (!item.label_id) continue
    await db.prepare(
      `INSERT INTO product_labels (label_id, label_name, sort, uid, product_count)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(label_id) DO UPDATE SET label_name = ?, sort = ?, product_count = ?, updated_at = datetime('now')`
    ).bind(
      item.label_id, item.label_name, item.sort || 0, item.uid || uid, item.productCount || 0,
      item.label_name, item.sort || 0, item.productCount || 0,
    ).run()
    imported++
  }

  return c.json({ message: '导入成功', imported })
})

// 分批同步商品 label（每批 batch_size 个，默认 20）
labels.post('/sync-products', async (c) => {
  const db = c.env.DB
  const batchSize = Math.min(Math.max(parseInt(c.req.query('batch_size') || '20'), 1), 50)

  // 统计总数和未关联数
  const totalRes = await db
    .prepare('SELECT COUNT(*) as total FROM products WHERE sku != ""')
    .first<{ total: number }>()
  const total = totalRes?.total || 0

  // 取一批没有 label 关联的商品
  const products = await db.prepare(
    `SELECT p.id, p.sku FROM products p
     WHERE p.sku != '' AND p.id NOT IN (SELECT DISTINCT product_id FROM product_label_relations)
     LIMIT ?`
  ).bind(batchSize).all<{ id: string; sku: string }>()

  let synced = 0
  for (const p of products.results) {
    await syncProductLabel(db, p.id, p.sku)
    // 检查是否关联成功
    const linked = await db
      .prepare('SELECT id FROM product_label_relations WHERE product_id = ? LIMIT 1')
      .bind(p.id).first()
    if (linked) synced++
  }

  // 重新计算 remaining：还有多少无 label 关联的商品
  const remainRes = await db.prepare(
    `SELECT COUNT(*) as cnt FROM products p
     WHERE p.sku != '' AND p.id NOT IN (SELECT DISTINCT product_id FROM product_label_relations)`
  ).first<{ cnt: number }>()

  // 本批有商品但无任何同步成功 → 说明剩余商品都没有标签，标记 stalled 让前端终止
  const stalled = products.results.length > 0 && synced === 0

  return c.json({ synced, total, remaining: remainRes?.cnt || 0, stalled })
})

export default labels
