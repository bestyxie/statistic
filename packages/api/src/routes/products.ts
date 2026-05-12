import { Hono } from 'hono'
import { getPriceWithFallback } from '../utils/price'

type Env = { DB: D1Database }

const products = new Hono<{ Bindings: Env }>()

products.get('/', async (c) => {
  const shopId = c.req.query('shop_id')
  const page = Math.max(1, parseInt(c.req.query('page') || '1'))
  const pageSize = Math.max(1, parseInt(c.req.query('page_size') || '30'))
  const offset = (page - 1) * pageSize
  const db = c.env.DB

  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)

  let where = ''
  const countParams: string[] = []
  const dataParams: string[] = [yesterday]
  if (shopId) {
    where = ' WHERE p.shop_id = ?'
    countParams.push(shopId)
    dataParams.push(shopId)
  }

  const countResult = await db.prepare(`SELECT COUNT(*) as total FROM products p${where}`).bind(...countParams).first()
  const total = (countResult?.total as number) || 0

  const query = `SELECT p.*, s.name as shop_name, COALESCE(ps.viewer_count, 0) as yesterday_visitors FROM products p JOIN shops s ON p.shop_id = s.id LEFT JOIN daily_product_stats ps ON ps.product_id = p.id AND ps.date = ?${where} ORDER BY p.created_at DESC LIMIT ? OFFSET ?`
  const result = await db.prepare(query).bind(...dataParams, pageSize, offset).all()

  return c.json({ items: result.results, total, page, page_size: pageSize })
})

products.post('/', async (c) => {
  const { shop_id, name, image_url, description, sku, price } = await c.req.json()
  const id = crypto.randomUUID()
  const db = c.env.DB
  const finalPrice = getPriceWithFallback(description || '', price)
  await db.prepare('INSERT INTO products (id, shop_id, name, image_url, description, sku, price) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .bind(id, shop_id, name, image_url || '', description || '', sku || '', finalPrice).run()
  return c.json({ id, shop_id, name, image_url, description, sku, price: finalPrice })
})

products.put('/:id', async (c) => {
  const { name, image_url, description, sku, price } = await c.req.json()
  const db = c.env.DB
  const finalPrice = getPriceWithFallback(description || '', price)
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
