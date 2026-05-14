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
  const id = crypto.randomUUID()
  const db = c.env.DB
  const finalPrice = await getPriceWithFallback(description || '', price, sku)
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

export default products
