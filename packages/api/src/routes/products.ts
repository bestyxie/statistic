import { Hono } from 'hono'
import { getPriceWithFallback } from '../utils/price'

type Env = { DB: D1Database }

const products = new Hono<{ Bindings: Env }>()

products.get('/', async (c) => {
  const shopId = c.req.query('shop_id')
  const dateFilter = c.req.query('date')
  const search = c.req.query('search')
  const sortBy = c.req.query('sort_by') || 'created_at'
  const sortOrder = c.req.query('sort_order') || 'desc'
  const page = Math.max(1, parseInt(c.req.query('page') || '1'))
  const pageSize = Math.max(1, parseInt(c.req.query('page_size') || '30'))
  const offset = (page - 1) * pageSize
  const labelId = c.req.query('label_id')
  const db = c.env.DB

  const statsDate = dateFilter || new Date(Date.now() - 86400000).toISOString().slice(0, 10)

  const conditions: string[] = []
  const countParams: string[] = []

  if (shopId) {
    conditions.push('p.shop_id = ?')
    countParams.push(shopId)
  }
  if (dateFilter) {
    conditions.push('p.id IN (SELECT product_id FROM product_visitor_relations WHERE date = ?)')
    countParams.push(dateFilter)
  }
  if (search) {
    conditions.push('p.description LIKE ?')
    countParams.push(`%${search}%`)
  }
  if (labelId) {
    conditions.push('p.id IN (SELECT product_id FROM product_label_relations WHERE label_id = ?)')
    countParams.push(labelId)
  }

  const where = conditions.length ? ` WHERE ${conditions.join(' AND ')}` : ''

  const countResult = await db.prepare(`SELECT COUNT(*) as total FROM products p${where}`).bind(...countParams).first()
  const total = (countResult?.total as number) || 0

  // 排序字段映射
  const sortColumnMap: Record<string, string> = {
    created_at: 'p.created_at',
    visitors: 'yesterday_visitors',
    transactions: 'transaction_count',
  }
  const sortColumn = sortColumnMap[sortBy] || 'p.created_at'
  const orderClause = sortOrder === 'asc' ? 'ASC' : 'DESC'

  const dataParams = [statsDate, ...countParams]
  const query = `SELECT p.*, s.name as shop_name, COALESCE(ps.viewer_count, 0) as yesterday_visitors,
    COALESCE(SUM(t.quantity), 0) as transaction_count
    FROM products p
    JOIN shops s ON p.shop_id = s.id
    LEFT JOIN daily_product_stats ps ON ps.product_id = p.id AND ps.date = ?
    LEFT JOIN transactions t ON t.product_id = p.id
    ${where}
    GROUP BY p.id
    ORDER BY ${sortColumn} ${orderClause}
    LIMIT ? OFFSET ?`
  const result = await db.prepare(query).bind(...dataParams, pageSize, offset).all()

  return c.json({ items: result.results, total, page, page_size: pageSize })
})

products.post('/', async (c) => {
  const { shop_id, name, image_url, description, sku, price } = await c.req.json()
  const db = c.env.DB
  const finalPrice = await getPriceWithFallback(description || '', price, sku)
  // 检查是否已存在相同 shop_id + sku 的商品
  const existing = await db.prepare('SELECT id FROM products WHERE shop_id = ? AND sku = ?')
    .bind(shop_id, sku || '').first<{ id: string }>()
  if (existing) {
    // 已存在则更新并返回已有 ID
    await db.prepare('UPDATE products SET name = ?, image_url = ?, description = ?, price = ?, updated_at = datetime("now") WHERE id = ?')
      .bind(name, image_url || '', description || '', finalPrice, existing.id).run()
    return c.json({ id: existing.id, shop_id, name, image_url, description, sku, price: finalPrice })
  }
  const id = crypto.randomUUID()
  await db.prepare('INSERT INTO products (id, shop_id, name, image_url, description, sku, price) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .bind(id, shop_id, name, image_url || '', description || '', sku || '', finalPrice).run()
  return c.json({ id, shop_id, name, image_url, description, sku, price: finalPrice })
})

products.put('/:id', async (c) => {
  const { name, image_url, description, sku, price } = await c.req.json()
  const db = c.env.DB
  const finalPrice = await getPriceWithFallback(description || '', price, sku)
  await db.prepare('UPDATE products SET name = ?, image_url = ?, description = ?, sku = ?, price = ?, updated_at = datetime("now") WHERE id = ?')
    .bind(name, image_url || '', description || '', sku || '', finalPrice, c.req.param('id')).run()
  return c.json({ message: '更新成功' })
})

products.delete('/:id', async (c) => {
  const db = c.env.DB
  await db.prepare('DELETE FROM products WHERE id = ?').bind(c.req.param('id')).run()
  return c.json({ message: '删除成功' })
})

// --- Refresh products via third-party API ---
products.post('/refresh', async (c) => {
  const db = c.env.DB
  const { product_ids } = await c.req.json<{ product_ids: string[] }>()

  if (!product_ids?.length) {
    return c.json({ error: '请选择商品' }, 400)
  }

  // 每日刷新数不超过100
  const today = new Date().toISOString().slice(0, 10)
  const todayRefreshed = await db.prepare(
    `SELECT COUNT(*) as cnt FROM products WHERE refreshed_at >= ? AND refreshed_at < ?`
  ).bind(today, today + 'T23:59:59').first<{ cnt: number }>()
  if ((todayRefreshed?.cnt || 0) + product_ids.length > 100) {
    return c.json({ error: `每日刷新数量已达上限（今日已刷新 ${todayRefreshed?.cnt || 0} 个，上限 100）` }, 400)
  }

  // 查询商品的 image_url
  const placeholders = product_ids.map(() => '?').join(',')
  const productsData = await db.prepare(
    `SELECT id, image_url FROM products WHERE id IN (${placeholders})`
  ).bind(...product_ids).all()

  // 从 image_url 提取 id：倒数第二个路径段
  const extractId = (url: string): string | null => {
    if (!url) return null
    const parts = url.split('/')
    // parts: ['http:', '', 'domain', 'person', '{id}', '{num}.jpg']
    // 倒数第一个斜杠到倒数第三个斜杠中间 = 倒数第二个路径段
    return parts.length >= 2 ? parts[parts.length - 2] : null
  }

  const ids: string[] = []
  for (const p of productsData.results as { id: string; image_url: string }[]) {
    const extracted = extractId(p.image_url)
    if (extracted) ids.push(extracted)
  }

  if (ids.length === 0) {
    return c.json({ error: '未找到可刷新的商品（缺少图片URL）' }, 400)
  }

  // 调用第三方接口
  try {
    const resp = await fetch('https://yxcapp.cn/personProduct/V3/stickArrayPersonProduct.action', {
      method: 'POST',
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/json;charset=UTF-8',
        'Origin': 'https://pc.yxcapp.cn',
        'Referer': 'https://pc.yxcapp.cn/',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36',
        'Cookie': 'JSESSIONID=dbb7b807-a2f0-48f4-a92b-9b54736fdcc6',
      },
      body: JSON.stringify(ids),
    })

    if (!resp.ok) {
      return c.json({ error: `第三方接口返回错误: ${resp.status}` }, 502)
    }
  } catch (err: any) {
    return c.json({ error: `调用第三方接口失败: ${err.message}` }, 502)
  }

  // 更新 refreshed_at
  const now = new Date().toISOString()
  for (const p of productsData.results as { id: string }[]) {
    await db.prepare('UPDATE products SET refreshed_at = ? WHERE id = ?').bind(now, p.id).run()
  }

  return c.json({ success: true, count: ids.length, refreshed_at: now })
})

export default products
