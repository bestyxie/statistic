import { Hono } from 'hono'
import type { ExternalData, ExternalVisitor, ExternalCustomerVisitor, ExternalVisitorRecord } from '@statistic/shared'
import { extractPrice } from '../utils/price'

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
    const price = extractPrice(item.description || '')
    await db.prepare(
      `INSERT INTO products (id, shop_id, name, image_url, description, sku, price) VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(shop_id, sku) DO UPDATE SET image_url = COALESCE(?, image_url), description = COALESCE(?, description), price = COALESCE(?, price), updated_at = datetime("now")`
    ).bind(crypto.randomUUID(), shop_id, item.code, item.picUrl || '', item.description || '', item.code, price, item.picUrl || null, item.description || null, price || null).run()

    const product = await db.prepare('SELECT id FROM products WHERE shop_id = ? AND sku = ?').bind(shop_id, item.code).first()

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

// --- Single product daily stats ---
stats.get('/product/:id', async (c) => {
  const db = c.env.DB
  const productId = c.req.param('id')
  const start = c.req.query('start')
  const end = c.req.query('end')

  const product = await db.prepare('SELECT id, name, image_url, sku FROM products WHERE id = ?').bind(productId).first()
  if (!product) {
    return c.json({ error: '商品不存在' }, 404)
  }

  const conditions = ['date >= ?', 'date <= ?']
  const params: string[] = [
    start || new Date(Date.now() - 29 * 86400000).toISOString().slice(0, 10),
    end || new Date().toISOString().slice(0, 10),
  ]
  const where = conditions.join(' AND ')

  const stats = await db.prepare(
    `SELECT date, view_count, viewer_count FROM daily_product_stats WHERE product_id = ? AND ${where} ORDER BY date`
  ).bind(productId, ...params).all()

  return c.json({ product, stats: stats.results })
})

// --- Import/update shop daily stats ---
stats.post('/import-shop-stats', async (c) => {
  const { shop_id, date, visitor_count } = await c.req.json<{
    shop_id: string
    date: string
    visitor_count: number
  }>()

  if (!shop_id || !date) {
    return c.json({ error: '参数不完整' }, 400)
  }

  const db = c.env.DB

  await db.prepare(
    `INSERT INTO daily_shop_stats (id, shop_id, date, visitor_count) VALUES (?, ?, ?, ?)
     ON CONFLICT(shop_id, date) DO UPDATE SET visitor_count = ?`
  ).bind(crypto.randomUUID(), shop_id, date, visitor_count, visitor_count).run()

  return c.json({ message: '店铺统计已更新', visitor_count })
})

// --- Import visitors for a product ---
stats.post('/import-visitors', async (c) => {
  const { shop_id, product_sku, date, visitors } = await c.req.json<{
    shop_id: string
    product_sku: string
    date: string
    visitors: ExternalVisitor[]
  }>()

  if (!shop_id || !product_sku || !date || !visitors?.length) {
    return c.json({ error: '参数不完整' }, 400)
  }

  const db = c.env.DB

  // Find the product by shop_id and sku
  const product = await db
    .prepare('SELECT id FROM products WHERE shop_id = ? AND sku = ?')
    .bind(shop_id, product_sku)
    .first<{ id: string }>()

  if (!product) {
    return c.json({ error: `商品不存在: ${product_sku}` }, 404)
  }

  let imported = 0

  for (const v of visitors) {
    if (!v.id) continue

    // Upsert visitor
    await db.prepare(
      `INSERT INTO visitors (id, ext_visitor_id, nick_name, icon_url, city_name, description)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(ext_visitor_id) DO UPDATE SET
         nick_name = COALESCE(?, nick_name),
         icon_url = COALESCE(?, icon_url),
         city_name = COALESCE(?, city_name),
         description = COALESCE(?, description),
         updated_at = datetime('now')`
    )
      .bind(
        crypto.randomUUID(), v.id,
        v.nickName || '', v.iconUrl || '', v.cityName || '', v.description || '',
        v.nickName || null, v.iconUrl || null, v.cityName || null, v.description || null,
      )
      .run()

    // Get visitor internal id
    const visitor = await db
      .prepare('SELECT id FROM visitors WHERE ext_visitor_id = ?')
      .bind(v.id)
      .first<{ id: string }>()

    if (!visitor) continue

    // Insert relation with visit_count=1 (ignore if duplicate)
    await db.prepare(
      `INSERT OR IGNORE INTO product_visitor_relations (id, product_id, visitor_id, date, visit_count)
       VALUES (?, ?, ?, ?, 1)`
    )
      .bind(crypto.randomUUID(), product.id, visitor.id, date)
      .run()

    imported++
  }

  return c.json({ message: '访客数据导入成功', imported_visitors: imported })
})

// --- Import single visitor's browsed products ---
stats.post('/import-by-visitor', async (c) => {
  const { shop_id, date, visitor, product_visits } = await c.req.json<{
    shop_id: string
    date: string
    visitor: {
      uid: string
      nick_name: string | null
      iconUrl: string | null
    }
    product_visits: {
      code: string
      description: string | null
      picUrl: string | null
      pid: string | null
      visit_count: number
    }[]
  }>()

  if (!shop_id || !date || !visitor?.uid || !product_visits?.length) {
    return c.json({ error: '参数不完整' }, 400)
  }

  const db = c.env.DB

  // Upsert visitor
  await db.prepare(
    `INSERT INTO visitors (id, ext_visitor_id, nick_name, icon_url)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(ext_visitor_id) DO UPDATE SET
       nick_name = COALESCE(?, nick_name),
       icon_url = COALESCE(?, icon_url),
       updated_at = datetime('now')`
  ).bind(
    crypto.randomUUID(), visitor.uid, visitor.nick_name || '', visitor.iconUrl || '',
    visitor.nick_name || null, visitor.iconUrl || null,
  ).run()

  const visitorRow = await db
    .prepare('SELECT id FROM visitors WHERE ext_visitor_id = ?')
    .bind(visitor.uid)
    .first<{ id: string }>()

  if (!visitorRow) {
    return c.json({ error: '访客创建失败' }, 500)
  }

  let imported = 0

  for (const pv of product_visits) {
    if (!pv.code) continue

    const price = extractPrice(pv.description || '')

    // Upsert product
    await db.prepare(
      `INSERT INTO products (id, shop_id, name, image_url, description, sku, price) VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(shop_id, sku) DO UPDATE SET image_url = COALESCE(?, image_url), description = COALESCE(?, description), price = COALESCE(?, price), updated_at = datetime("now")`
    ).bind(
      crypto.randomUUID(), shop_id, pv.code, pv.picUrl || '', pv.description || '', pv.code, price,
      pv.picUrl || null, pv.description || null, price || null,
    ).run()

    const product = await db
      .prepare('SELECT id FROM products WHERE shop_id = ? AND sku = ?')
      .bind(shop_id, pv.code)
      .first<{ id: string }>()

    if (!product) continue

    // Upsert relation with visit_count
    await db.prepare(
      `INSERT INTO product_visitor_relations (id, product_id, visitor_id, date, visit_count)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(product_id, visitor_id, date) DO UPDATE SET visit_count = ?`
    ).bind(
      crypto.randomUUID(), product.id, visitorRow.id, date, pv.visit_count, pv.visit_count,
    ).run()

    imported++
  }

  return c.json({ message: '访客商品数据导入成功', imported })
})

// --- Recalculate product daily stats from visitor relations ---
stats.post('/recalculate-product-stats', async (c) => {
  const { shop_id, product_sku, date } = await c.req.json<{
    shop_id: string
    product_sku: string
    date: string
  }>()

  if (!shop_id || !product_sku || !date) {
    return c.json({ error: '参数不完整' }, 400)
  }

  const db = c.env.DB

  const product = await db
    .prepare('SELECT id FROM products WHERE shop_id = ? AND sku = ?')
    .bind(shop_id, product_sku)
    .first<{ id: string }>()

  if (!product) {
    return c.json({ error: `商品不存在: ${product_sku}` }, 404)
  }

  // 从 product_visitor_relations 聚合统计
  const agg = await db.prepare(
    `SELECT COALESCE(SUM(visit_count), 0) as total_views, COUNT(*) as total_viewers
     FROM product_visitor_relations WHERE product_id = ? AND date = ?`
  ).bind(product.id, date).first<{ total_views: number; total_viewers: number }>()

  const view_count = agg?.total_views || 0
  const viewer_count = agg?.total_viewers || 0

  // Upsert daily_product_stats
  await db.prepare(
    `INSERT INTO daily_product_stats (id, product_id, shop_id, date, view_count, viewer_count)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(product_id, date) DO UPDATE SET view_count = ?, viewer_count = ?`
  ).bind(
    crypto.randomUUID(), product.id, shop_id, date, view_count, viewer_count,
    view_count, viewer_count,
  ).run()

  return c.json({ message: '统计已更新', product_sku, view_count, viewer_count })
})

// --- Get visitors for a product on a date ---
stats.get('/product/:id/visitors', async (c) => {
  const db = c.env.DB
  const productId = c.req.param('id')
  const date = c.req.query('date')

  const conditions = ['pvr.product_id = ?']
  const params: string[] = [productId]

  if (date) {
    conditions.push('pvr.date = ?')
    params.push(date)
  }

  const where = conditions.join(' AND ')

  const results = await db.prepare(
    `SELECT v.id, v.ext_visitor_id, v.nick_name, v.icon_url, v.city_name, v.description, pvr.date, pvr.visit_count
     FROM product_visitor_relations pvr
     JOIN visitors v ON pvr.visitor_id = v.id
     WHERE ${where}
     ORDER BY pvr.date DESC, v.nick_name`
  )
    .bind(...params)
    .all()

  return c.json(results.results)
})

// --- Get all visitors (paginated) ---
stats.get('/visitors', async (c) => {
  const db = c.env.DB
  const page = parseInt(c.req.query('page') || '1')
  const limit = parseInt(c.req.query('limit') || '30')
  const offset = (page - 1) * limit
  const search = c.req.query('search')

  let where = '1=1'
  const params: string[] = []

  if (search) {
    where += ' AND (nick_name LIKE ? OR description LIKE ? OR city_name LIKE ?)'
    params.push(`%${search}%`, `%${search}%`, `%${search}%`)
  }

  const total = await db.prepare(
    `SELECT COUNT(*) as count FROM visitors WHERE ${where}`
  ).bind(...params).first<{ count: number }>()

  const results = await db.prepare(
    `SELECT v.*, COUNT(pvr.id) as visit_count
     FROM visitors v
     LEFT JOIN product_visitor_relations pvr ON v.id = pvr.visitor_id
     WHERE ${where}
     GROUP BY v.id
     ORDER BY visit_count DESC, v.updated_at DESC
     LIMIT ? OFFSET ?`
  ).bind(...params, limit, offset).all()

  return c.json({
    visitors: results.results,
    total: total?.count || 0,
    page,
    limit,
  })
})

// --- Get products visited by a visitor ---
stats.get('/visitors/:id/products', async (c) => {
  const db = c.env.DB
  const visitorId = c.req.param('id')

  const results = await db.prepare(
    `SELECT p.id, p.name, p.image_url, p.sku, p.price, p.description, pvr.date, pvr.visit_count
     FROM product_visitor_relations pvr
     JOIN products p ON pvr.product_id = p.id
     WHERE pvr.visitor_id = ?
     ORDER BY pvr.date DESC, pvr.visit_count DESC`
  ).bind(visitorId).all()

  return c.json(results.results)
})

export default stats
