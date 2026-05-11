import { Hono } from 'hono'
import type { ExternalData } from '@statistic/shared'

type Env = { DB: D1Database }

const stats = new Hono<{ Bindings: Env }>()

// --- Import plaintext JSON ---
stats.post('/import', async (c) => {
  const { data, shop_id, date } = await c.req.json<{
    data: ExternalData
    shop_id: string
    date: string
  }>()

  if (!shop_id || !date) {
    return c.json({ error: '请选择店铺和日期' }, 400)
  }

  if (!data?.success || !data?.data?.vroList?.length) {
    return c.json({ error: '数据格式异常：success 不为 true 或 vroList 为空' }, 400)
  }

  const parsed = data

  const db = c.env.DB

  const shop = await db.prepare('SELECT id FROM shops WHERE id = ?').bind(shop_id).first()
  if (!shop) {
    return c.json({ error: '店铺不存在' }, 400)
  }

  const totalVisitors = parsed.data.vroList.reduce((sum, item) => sum + (item.productVisitorNum || 0), 0)

  // Upsert shop stats
  await db.prepare(
    'INSERT INTO daily_shop_stats (id, shop_id, date, visitor_count) VALUES (?, ?, ?, ?) ON CONFLICT(shop_id, date) DO UPDATE SET visitor_count = ?'
  ).bind(crypto.randomUUID(), shop_id, date, totalVisitors, totalVisitors).run()

  // Upsert each product
  for (const item of parsed.data.vroList) {
    const productId = crypto.randomUUID()
    const product = await db.prepare(
      `INSERT INTO products (id, shop_id, name, image_url, description, sku, price) VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(shop_id, sku) DO UPDATE SET image_url = COALESCE(?, image_url), description = COALESCE(?, description), updated_at = datetime("now")
       RETURNING id`
    ).bind(productId, shop_id, item.code, item.picUrl || '', item.description || '', item.code, '', item.picUrl || null, item.description || null).first()

    await db.prepare(
      'INSERT INTO daily_product_stats (id, product_id, shop_id, date, view_count, viewer_count) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(product_id, date) DO UPDATE SET view_count = ?, viewer_count = ?'
    ).bind(crypto.randomUUID(), product!.id, shop_id, date, item.productVisitorNum || 0, item.productVisitorNum || 0, item.productVisitorNum || 0, item.productVisitorNum || 0).run()
  }

  return c.json({ message: '数据导入成功', imported_products: parsed.data.vroList.length, total_visitors: totalVisitors })
})

// --- Dashboard ---
stats.get('/dashboard', async (c) => {
  const db = c.env.DB
  const shopId = c.req.query('shop_id')

  const today = new Date().toISOString().slice(0, 10)
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)

  let shopFilter = ''
  const params: string[] = []
  if (shopId) {
    shopFilter = ' AND shop_id = ?'
    params.push(shopId)
  }

  const [todayStats, yesterdayStats] = await Promise.all([
    db.prepare(`SELECT COALESCE(SUM(visitor_count), 0) as total FROM daily_shop_stats WHERE date = ?${shopFilter}`).bind(today, ...params).first(),
    db.prepare(`SELECT COALESCE(SUM(visitor_count), 0) as total FROM daily_shop_stats WHERE date = ?${shopFilter}`).bind(yesterday, ...params).first(),
  ])

  const sevenDaysAgo = new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10)
  const trendParams = shopId ? [sevenDaysAgo, shopId] : [sevenDaysAgo]
  const trend = await db.prepare(
    `SELECT date, COALESCE(SUM(visitor_count), 0) as visitors FROM daily_shop_stats WHERE date >= ?${shopFilter} GROUP BY date ORDER BY date`
  ).bind(...trendParams).all()

  const topParams = shopId ? [sevenDaysAgo, shopId] : [sevenDaysAgo]
  const topProducts = await db.prepare(
    `SELECT p.name, p.image_url, SUM(ps.view_count) as total_views, SUM(ps.viewer_count) as total_viewers FROM daily_product_stats ps JOIN products p ON ps.product_id = p.id WHERE ps.date >= ?${shopId ? ' AND ps.shop_id = ?' : ''} GROUP BY ps.product_id ORDER BY total_views DESC LIMIT 10`
  ).bind(...topParams).all()

  return c.json({
    today: (todayStats?.total as number) || 0,
    yesterday: (yesterdayStats?.total as number) || 0,
    trend: trend.results,
    topProducts: topProducts.results,
  })
})

// --- Trend query ---
stats.get('/trend', async (c) => {
  const db = c.env.DB
  const shopId = c.req.query('shop_id')
  const start = c.req.query('start')
  const end = c.req.query('end')

  if (!start || !end) {
    return c.json({ error: '请提供 start 和 end 日期参数' }, 400)
  }

  const conditions = ['ds.date >= ?', 'ds.date <= ?']
  const params: string[] = [start, end]
  if (shopId) {
    conditions.push('ds.shop_id = ?')
    params.push(shopId)
  }
  const where = conditions.join(' AND ')

  const shopTrend = await db.prepare(
    `SELECT ds.date, ds.visitor_count, s.name as shop_name FROM daily_shop_stats ds JOIN shops s ON ds.shop_id = s.id WHERE ${where} ORDER BY ds.date`
  ).bind(...params).all()

  const productTrend = await db.prepare(
    `SELECT ps.date, ps.view_count, ps.viewer_count, p.name as product_name, p.image_url FROM daily_product_stats ps JOIN products p ON ps.product_id = p.id WHERE ps.date >= ? AND ps.date <= ?${shopId ? ' AND ps.shop_id = ?' : ''} ORDER BY ps.date`
  ).bind(start, end, ...(shopId ? [shopId] : [])).all()

  return c.json({ shopTrend: shopTrend.results, productTrend: productTrend.results })
})

// --- Top products ---
stats.get('/top-products', async (c) => {
  const db = c.env.DB
  const shopId = c.req.query('shop_id')
  const start = c.req.query('start')
  const end = c.req.query('end')
  const limit = parseInt(c.req.query('limit') || '10')

  const conditions = ['ps.date >= ?', 'ps.date <= ?']
  const params: string[] = [start || new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10), end || new Date().toISOString().slice(0, 10)]
  if (shopId) {
    conditions.push('ps.shop_id = ?')
    params.push(shopId)
  }
  const where = conditions.join(' AND ')

  const results = await db.prepare(
    `SELECT p.name, p.image_url, p.sku, p.price, SUM(ps.view_count) as total_views, SUM(ps.viewer_count) as total_viewers FROM daily_product_stats ps JOIN products p ON ps.product_id = p.id WHERE ${where} GROUP BY ps.product_id ORDER BY total_views DESC LIMIT ?`
  ).bind(...params, limit).all()

  return c.json(results.results)
})

export default stats
