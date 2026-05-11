import { Hono } from 'hono'

type Env = { DB: D1Database }

const products = new Hono<{ Bindings: Env }>()

products.get('/', async (c) => {
  const shopId = c.req.query('shop_id')
  const db = c.env.DB
  let query = 'SELECT p.*, s.name as shop_name FROM products p JOIN shops s ON p.shop_id = s.id'
  const params: string[] = []
  if (shopId) {
    query += ' WHERE p.shop_id = ?'
    params.push(shopId)
  }
  query += ' ORDER BY p.created_at DESC'
  const stmt = params.length ? db.prepare(query).bind(...params) : db.prepare(query)
  const result = await stmt.all()
  return c.json(result.results)
})

products.post('/', async (c) => {
  const { shop_id, name, image_url, description, sku, price } = await c.req.json()
  const id = crypto.randomUUID()
  const db = c.env.DB
  await db.prepare('INSERT INTO products (id, shop_id, name, image_url, description, sku, price) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .bind(id, shop_id, name, image_url || '', description || '', sku || '', price || '').run()
  return c.json({ id, shop_id, name, image_url, description, sku, price })
})

products.put('/:id', async (c) => {
  const { name, image_url, description, sku, price } = await c.req.json()
  const db = c.env.DB
  await db.prepare('UPDATE products SET name = ?, image_url = ?, description = ?, sku = ?, price = ?, updated_at = datetime("now") WHERE id = ?')
    .bind(name, image_url || '', description || '', sku || '', price || '', c.req.param('id')).run()
  return c.json({ message: '更新成功' })
})

products.delete('/:id', async (c) => {
  const db = c.env.DB
  await db.prepare('DELETE FROM products WHERE id = ?').bind(c.req.param('id')).run()
  return c.json({ message: '删除成功' })
})

export default products
